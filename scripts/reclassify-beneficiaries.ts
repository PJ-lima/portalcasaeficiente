/**
 * Reclassificação retroativa pelo gate de beneficiário (RC2).
 *
 * Corre o classifyBeneficiary sobre todas as sources já persistidas e mostra
 * o que o gate teria decidido. Por omissão é dry-run: só imprime o relatório.
 *
 *   npx tsx scripts/reclassify-beneficiaries.ts           # dry-run
 *   npx tsx scripts/reclassify-beneficiaries.ts --apply   # grava veredicto no raw_payload
 *
 * O --apply é deliberadamente não-destrutivo: escreve `beneficiaryGate` no
 * raw_payload de cada source classificada e mais nada. Apagar/esconder os
 * programas ORGANIZATION é uma decisão separada, tomada sobre este relatório.
 */
import { prisma } from '../src/lib/prisma';
import { classifyBeneficiary, type BeneficiaryGateResult } from '../src/workers/beneficiary-gate';

interface PayloadShape {
  title?: string;
  description?: string;
  beneficiaries?: string;
  eligibilityCriteria?: string;
  rawSections?: Record<string, string>;
}

async function main() {
  const apply = process.argv.includes('--apply');

  const sources = await prisma.source.findMany({
    select: { id: true, sourceUrl: true, programId: true, rawPayload: true },
  });

  const counts: Record<string, number> = {};
  const organizations: Array<{ url: string | null; title: string; result: BeneficiaryGateResult }> = [];
  let applied = 0;

  for (const source of sources) {
    const payload =
      source.rawPayload && typeof source.rawPayload === 'object' && !Array.isArray(source.rawPayload)
        ? (source.rawPayload as PayloadShape & Record<string, unknown>)
        : ({} as PayloadShape & Record<string, unknown>);

    const result = classifyBeneficiary({
      title: payload.title,
      description: payload.description,
      beneficiaries: payload.beneficiaries,
      eligibilityCriteria: payload.eligibilityCriteria,
      rawSections: payload.rawSections,
    });

    const key = `${result.verdict}/${result.scope}`;
    counts[key] = (counts[key] ?? 0) + 1;

    if (result.verdict === 'ORGANIZATION') {
      organizations.push({
        url: source.sourceUrl,
        title: payload.title ?? '(sem título)',
        result,
      });
    }

    if (apply && result.scope !== 'none') {
      await prisma.source.update({
        where: { id: source.id },
        data: {
          rawPayload: {
            ...payload,
            beneficiaryGate: { ...result, classifiedAt: new Date().toISOString() },
          },
        },
      });
      applied += 1;
    }
  }

  console.log(`\nTotal sources: ${sources.length}`);
  console.log('Veredictos (verdict/scope):');
  for (const [key, value] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${key.padEnd(22)} ${value}`);
  }

  console.log(`\nORGANIZATION (${organizations.length}) — candidatos a sair do radar:`);
  for (const item of organizations) {
    console.log(`  - ${item.title}`);
    console.log(`    ${item.url}`);
    console.log(`    matched: ${item.result.matchedNegative.join(', ')} [${item.result.scope}]`);
  }

  if (apply) {
    console.log(`\nVeredicto gravado em raw_payload de ${applied} sources.`);
  } else {
    console.log('\nDry-run. Usa --apply para gravar o veredicto no raw_payload (não apaga nada).');
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
