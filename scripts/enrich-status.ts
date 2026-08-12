/**
 * Enrichment de estado a partir da página oficial (RC5).
 *
 * O extract-status.ts só vê o rawPayload guardado; 310 dos programas UNKNOWN
 * têm officialUrl em PDF (regulamentos/avisos nunca extraídos para texto) e
 * outros têm payload thin. Este script vai à fonte: faz fetch do officialUrl
 * (PDF → pdftotext, HTML → texto sem tags), corre o extractStatus sobre o
 * texto real e grava pelo mesmo caminho do extract-status.
 *
 *   npx tsx scripts/enrich-status.ts                # dry-run, todos os UNKNOWN
 *   npx tsx scripts/enrich-status.ts --limit 30     # amostra
 *   npx tsx scripts/enrich-status.ts --apply        # grava estado + veredicto
 *
 * Guards:
 * - Só olha a programas UNKNOWN — nunca mexe em estado conhecido.
 * - UNKNOWN proposto não escreve nada (não há downgrade possível).
 * - recordStatusChange com notify: false — backfill não é notícia.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ProgramStatus } from '@prisma/client';
import { prisma } from '../src/lib/prisma';
import { recordStatusChange } from '../src/lib/ingestion';
import { CRAWLER_USER_AGENT } from '../src/lib/user-agent';
import { normalizeText } from '../src/lib/worker-utils';
import { extractStatus } from '../src/workers/status-extractor';

const FETCH_TIMEOUT_MS = 20_000;
const DELAY_MS = 500;
const MAX_PDF_BYTES = 15 * 1024 * 1024;
const MAX_TEXT_CHARS = 20_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function htmlToText(html: string): string {
  // Navegação fora: menus municipais têm "Procedimentos Concursais a decorrer",
  // "Avisos abertos" etc. — sinais falsos de OPEN em qualquer página do site.
  let scoped = html.replace(
    /<(nav|header|footer|aside)[\s>][\s\S]*?<\/\1>|<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/gi,
    ' ',
  );
  const main = scoped.match(/<(main|article)[\s>][\s\S]*?<\/\1>/i);
  if (main && main[0].length > 500) scoped = main[0];
  return scoped
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/// Regulamentos/atos administrativos citam datas de aprovação/publicação por
/// todo o texto — data sem frase de estado não é prazo nesses documentos.
const REGULATION_TITLE = /regulamento|normativo|codigo|aprovacao|alteracao|consulta publica|procedimento|publicad|publicacao/;
const PHRASE_EVIDENCE = /~|encerrad|esgotad|terminad|suspens|expirad/;

function pdfToText(buffer: Buffer, tmpDir: string): string {
  const pdfPath = join(tmpDir, 'page.pdf');
  writeFileSync(pdfPath, buffer);
  return execFileSync('pdftotext', ['-q', pdfPath, '-'], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
}

async function fetchText(url: string, tmpDir: string): Promise<{ text: string; kind: 'pdf' | 'html' }> {
  const response = await fetch(url, {
    headers: { 'User-Agent': CRAWLER_USER_AGENT },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    redirect: 'follow',
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const contentType = response.headers.get('content-type') ?? '';
  const buffer = Buffer.from(await response.arrayBuffer());
  const isPdf =
    contentType.includes('pdf') || buffer.subarray(0, 5).toString('latin1') === '%PDF-';
  if (isPdf) {
    if (buffer.length > MAX_PDF_BYTES) throw new Error(`pdf demasiado grande (${buffer.length} bytes)`);
    return { text: pdfToText(buffer, tmpDir), kind: 'pdf' };
  }
  return { text: htmlToText(buffer.toString('utf8')), kind: 'html' };
}

async function main() {
  const apply = process.argv.includes('--apply');
  const limitIndex = process.argv.indexOf('--limit');
  const limit = limitIndex >= 0 ? Number(process.argv[limitIndex + 1]) : Infinity;
  // --exclude <ficheiro>: um URL por linha — vetos da revisão manual do
  // dry-run (boilerplate "o concurso é aberto pelo prazo de trinta dias" etc.
  // que nenhum filtro genérico distingue de sinal real).
  const excludeIndex = process.argv.indexOf('--exclude');
  const excluded = new Set(
    excludeIndex >= 0
      ? (await import('node:fs')).readFileSync(process.argv[excludeIndex + 1], 'utf8')
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
      : [],
  );
  const now = new Date();
  const tmpDir = mkdtempSync(join(tmpdir(), 'enrich-status-'));

  const programs = await prisma.program.findMany({
    where: { status: ProgramStatus.UNKNOWN },
    select: {
      id: true,
      title: true,
      status: true,
      officialUrl: true,
      sources: { select: { id: true, sourceUrl: true, rawPayload: true }, take: 1 },
    },
    orderBy: { createdAt: 'asc' },
  });

  const counts: Record<string, number> = {};
  const failures: Array<{ title: string; url: string; error: string }> = [];
  const changes: Array<{ title: string; url: string; to: ProgramStatus; evidence: string }> = [];
  let appliedEvents = 0;
  let processed = 0;

  for (const program of programs) {
    if (processed >= limit) break;
    const url = program.officialUrl ?? program.sources[0]?.sourceUrl;
    if (!url) continue;
    if (excluded.has(url)) {
      counts['excluded'] = (counts['excluded'] ?? 0) + 1;
      continue;
    }
    processed += 1;

    let text: string;
    let kind: 'pdf' | 'html';
    try {
      ({ text, kind } = await fetchText(url, tmpDir));
    } catch (error) {
      failures.push({ title: program.title, url, error: String(error).slice(0, 120) });
      counts['fetch-failed'] = (counts['fetch-failed'] ?? 0) + 1;
      await sleep(DELAY_MS);
      continue;
    }

    const result = extractStatus(
      { title: program.title, description: text.slice(0, MAX_TEXT_CHARS) },
      now,
    );
    counts[`${result.status}/${kind}/${result.confidence}`] =
      (counts[`${result.status}/${kind}/${result.confidence}`] ?? 0) + 1;

    // Página inteira é texto ruidoso: o findWeakSignal (confidence 'low')
    // dispara em boilerplate legal ("apoio previsto na alínea", "em aberto")
    // de qualquer regulamento — só sinais com âncora ou data contam aqui.
    const dateOnly = !result.matched.some((m) => PHRASE_EVIDENCE.test(m));
    const regulationDateOnly = dateOnly && REGULATION_TITLE.test(normalizeText(program.title));
    if (regulationDateOnly) {
      counts['skipped-regulation-date'] = (counts['skipped-regulation-date'] ?? 0) + 1;
    }
    if (result.status !== ProgramStatus.UNKNOWN && result.confidence !== 'low' && !regulationDateOnly) {
      const evidence = result.matched.join('; ').slice(0, 300);
      changes.push({ title: program.title, url, to: result.status, evidence });
      if (apply) {
        await recordStatusChange(program.id, result.status, {
          note: `extração da página oficial (${kind}): ${evidence.slice(0, 500)}`,
          sourceUrl: url,
          detectedBy: 'script:enrich-status',
          notify: false,
        });
        appliedEvents += 1;
        const source = program.sources[0];
        if (source) {
          const payload =
            source.rawPayload && typeof source.rawPayload === 'object' && !Array.isArray(source.rawPayload)
              ? (source.rawPayload as Record<string, unknown>)
              : {};
          await prisma.source.update({
            where: { id: source.id },
            data: {
              rawPayload: {
                ...payload,
                statusExtraction: { ...result, classifiedAt: now.toISOString(), enrichedFrom: kind },
              },
            },
          });
        }
      }
    }

    if (processed % 25 === 0) console.log(`… ${processed}/${Math.min(limit, programs.length)}`);
    await sleep(DELAY_MS);
  }

  rmSync(tmpDir, { recursive: true, force: true });

  console.log(`\nProgramas UNKNOWN processados: ${processed}/${programs.length}`);
  console.log('Veredictos (status/tipo-de-página):');
  for (const [key, value] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${key.padEnd(24)} ${value}`);
  }

  console.log(`\nMudanças ${apply ? 'aplicadas' : 'propostas'} (${changes.length}):`);
  for (const change of changes) {
    console.log(`  - ${change.title}`);
    console.log(`    ${change.url}`);
    console.log(`    UNKNOWN -> ${change.to}`);
    console.log(`    evidência: ${change.evidence}`);
  }

  console.log(`\nFalhas de fetch (${failures.length}):`);
  for (const failure of failures) {
    console.log(`  - ${failure.title} | ${failure.url} | ${failure.error}`);
  }

  if (apply) {
    console.log(`\nAplicado: ${appliedEvents} mudanças de estado (notify: false).`);
  } else {
    console.log('\nDry-run. Usa --apply para gravar.');
  }
}

main()
  .then(() => {
    process.exitCode = 0;
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
