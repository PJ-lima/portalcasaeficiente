/**
 * Extração retroativa de estado (RC3).
 *
 * Corre o extractStatus sobre todas as sources com programa e mostra o que
 * mudaria. Por omissão é dry-run: só imprime o relatório.
 *
 *   npx tsx scripts/extract-status.ts           # dry-run
 *   npx tsx scripts/extract-status.ts --apply   # grava estado + veredicto
 *
 * O --apply escreve por dois caminhos:
 * - `recordStatusChange` com `notify: false` (evento + Program.status; sem
 *   notificações — backfill de dezenas de programas não é notícia).
 * - veredicto em `raw_payload.statusExtraction`, como o RC2 fez com o
 *   `beneficiaryGate`.
 *
 * UNKNOWN proposto nunca sobrepõe estado conhecido (guard anti-downgrade —
 * protege p.ex. Cascais OPEN/PLANNED).
 */
import { ProgramStatus } from '@prisma/client';
import { prisma } from '../src/lib/prisma';
import { recordStatusChange } from '../src/lib/ingestion';
import { extractStatus, type StatusExtractionResult } from '../src/workers/status-extractor';

interface PayloadShape {
  title?: string;
  description?: string;
  deadline?: string;
  rawSections?: Record<string, string>;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const now = new Date();

  const sources = await prisma.source.findMany({
    where: { programId: { not: null } },
    select: {
      id: true,
      sourceUrl: true,
      programId: true,
      rawPayload: true,
      program: { select: { id: true, status: true, title: true } },
    },
  });

  const counts: Record<string, number> = {};
  const changes: Array<{
    title: string;
    url: string | null;
    from: ProgramStatus;
    to: ProgramStatus;
    result: StatusExtractionResult;
  }> = [];
  let unknownKept = 0;
  let appliedEvents = 0;
  let appliedPayloads = 0;

  for (const source of sources) {
    if (!source.program) continue;

    const payload =
      source.rawPayload && typeof source.rawPayload === 'object' && !Array.isArray(source.rawPayload)
        ? (source.rawPayload as PayloadShape & Record<string, unknown>)
        : ({} as PayloadShape & Record<string, unknown>);

    const result = extractStatus(
      {
        title: payload.title ?? source.program.title,
        description: payload.description,
        deadline: payload.deadline,
        rawSections: payload.rawSections,
      },
      now,
    );

    counts[`${result.status}/${result.sourceField}`] = (counts[`${result.status}/${result.sourceField}`] ?? 0) + 1;

    const current = source.program.status;
    const isDowngradeToUnknown = result.status === ProgramStatus.UNKNOWN && current !== ProgramStatus.UNKNOWN;
    if (isDowngradeToUnknown) unknownKept += 1;

    const wouldChange =
      result.status !== current && result.status !== ProgramStatus.UNKNOWN;

    if (wouldChange) {
      changes.push({
        title: payload.title ?? source.program.title,
        url: source.sourceUrl,
        from: current,
        to: result.status,
        result,
      });
    }

    if (apply) {
      if (wouldChange && source.program) {
        await recordStatusChange(source.program.id, result.status, {
          note: `extração automática: ${result.matched.join('; ').slice(0, 500)}`,
          sourceUrl: source.sourceUrl,
          detectedBy: 'script:extract-status',
          notify: false,
        });
        appliedEvents += 1;
      }
      if (result.sourceField !== 'none') {
        await prisma.source.update({
          where: { id: source.id },
          data: {
            rawPayload: {
              ...payload,
              statusExtraction: { ...result, classifiedAt: now.toISOString() },
            },
          },
        });
        appliedPayloads += 1;
      }
    }
  }

  console.log(`\nTotal sources com programa: ${sources.length}`);
  console.log('Veredictos (status/sourceField):');
  for (const [key, value] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${key.padEnd(32)} ${value}`);
  }

  console.log(`\nMudanças propostas (${changes.length}):`);
  for (const change of changes) {
    console.log(`  - ${change.title}`);
    console.log(`    ${change.url}`);
    console.log(`    ${change.from} -> ${change.to} [${change.result.sourceField}/${change.result.confidence}]`);
    console.log(`    evidência: ${change.result.matched.join('; ')}`);
  }

  console.log(`\nUNKNOWN proposto sobre estado conhecido (mantido): ${unknownKept}`);

  if (apply) {
    console.log(`\nAplicado: ${appliedEvents} mudanças de estado, ${appliedPayloads} veredictos no raw_payload.`);
  } else {
    console.log('\nDry-run. Usa --apply para gravar (recordStatusChange notify:false + raw_payload).');
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
