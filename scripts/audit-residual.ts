/**
 * Inventário do residual (ponto 2 RC3) — read-only.
 * Lista os programas por categoria de suspeita: páginas-índice, duplicados
 * por título normalizado, enrichment falhado (sem rawSections), org-aid
 * escapado (beneficiaryGate ORGANIZATION em programa existente).
 *
 *   npx tsx scripts/audit-residual.ts
 */
import { prisma } from '../src/lib/prisma';
import { normalizeText } from '../src/lib/worker-utils';

interface PayloadShape {
  title?: string;
  description?: string;
  rawSections?: Record<string, string>;
  beneficiaryGate?: { verdict?: string; matchedNegative?: string[] };
  statusExtraction?: { status?: string };
}

const INDEX_URL = /\/category\/|\/tag\/|\/page\/|[?&]page=/;
const INDEX_TITLE = /^avisos?\b|abertos e fechados|^ler mais|recuperar dados|^categoria|^arquivo|anuncios publicos/;

async function main() {
  const programs = await prisma.program.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      entity: true,
      officialUrl: true,
      sources: { select: { rawPayload: true }, take: 1 },
    },
    orderBy: { title: 'asc' },
  });

  const byNormTitle = new Map<string, typeof programs>();
  for (const program of programs) {
    const key = normalizeText(program.title);
    byNormTitle.set(key, [...(byNormTitle.get(key) ?? []), program]);
  }

  const indexPages: string[] = [];
  const noEnrichment: string[] = [];
  const orgEscaped: string[] = [];

  for (const program of programs) {
    const payload = (program.sources[0]?.rawPayload ?? {}) as PayloadShape;
    const normTitle = normalizeText(program.title);
    const line = `${program.title} [${program.status}]\n      ${program.officialUrl}`;

    if (INDEX_URL.test(program.officialUrl ?? '') || INDEX_TITLE.test(normTitle)) {
      indexPages.push(line);
    }
    if (!payload.rawSections || Object.keys(payload.rawSections).length === 0) {
      noEnrichment.push(line);
    }
    if (payload.beneficiaryGate?.verdict === 'ORGANIZATION') {
      orgEscaped.push(`${line}\n      matched: ${payload.beneficiaryGate.matchedNegative?.join(', ')}`);
    }
  }

  console.log(`Total programas: ${programs.length}\n`);

  console.log(`== Páginas-índice suspeitas (${indexPages.length}):`);
  for (const item of indexPages) console.log(`  - ${item}`);

  const dups = [...byNormTitle.entries()].filter(([, group]) => group.length > 1);
  console.log(`\n== Duplicados por título (${dups.length} grupos):`);
  for (const [key, group] of dups) {
    console.log(`  - "${key}" ×${group.length}`);
    for (const program of group) console.log(`      ${program.officialUrl} [${program.status}]`);
  }

  console.log(`\n== Sem rawSections / enrichment falhado (${noEnrichment.length}):`);
  for (const item of noEnrichment) console.log(`  - ${item}`);

  console.log(`\n== beneficiaryGate ORGANIZATION ainda no radar (${orgEscaped.length}):`);
  for (const item of orgEscaped) console.log(`  - ${item}`);

  // Resto: lista completa para revisão manual rápida.
  console.log('\n== Lista completa (título | entity | status):');
  for (const program of programs) {
    console.log(`  ${program.title} | ${program.entity} | ${program.status}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
