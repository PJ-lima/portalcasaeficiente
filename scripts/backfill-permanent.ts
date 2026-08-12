/**
 * Backfill do estado PERMANENT (decisão 2026-08-12): programas UNKNOWN cujo
 * título é um regulamento em vigor não têm prazo de candidatura — o apoio é
 * contínuo. O enrich-status já tentou extrair estado da página oficial destes
 * registos e ficou UNKNOWN; o que resta são regulamentos sem frase de estado.
 *
 *   npx tsx scripts/backfill-permanent.ts             # dry-run
 *   npx tsx scripts/backfill-permanent.ts --confirm   # grava (notify: false)
 */
import { ProgramStatus } from '@prisma/client';
import { prisma } from '../src/lib/prisma';
import { recordStatusChange } from '../src/lib/ingestion';
import { normalizeText } from '../src/lib/worker-utils';

async function main() {
  const confirm = process.argv.includes('--confirm');

  const programs = await prisma.program.findMany({
    where: { status: ProgramStatus.UNKNOWN },
    select: { id: true, title: true, entity: true, officialUrl: true },
    orderBy: [{ entity: 'asc' }, { title: 'asc' }],
  });

  // Fase procedimental (proposta/projeto/consulta/início de procedimento) não
  // é regulamento em vigor — dizer "pode candidatar-se" a um rascunho seria
  // falso. Esses ficam UNKNOWN. "Alteração ao Regulamento" e "Edital –
  // Regulamento X" (publicação do final) contam como em vigor.
  const PROCEDURAL =
    /proposta|projec?to d[aeo]|consulta publica|discussao publica|inicio d[eo] procedimento|publicitacao de inicio|nota justificativa/;

  const candidates = programs.filter((program) => normalizeText(program.title).includes('regulamento'));
  const targets = candidates.filter((program) => !PROCEDURAL.test(normalizeText(program.title)));
  const skipped = candidates.length - targets.length;

  console.log(`UNKNOWN na base: ${programs.length}`);
  console.log(`Regulamentos: ${candidates.length} (${skipped} procedimentais ficam UNKNOWN)`);
  console.log(`A marcar PERMANENT: ${targets.length}\n`);
  for (const program of targets) {
    console.log(`  - ${program.entity ?? '—'} | ${program.title}`);
  }

  if (!confirm) {
    console.log('\nDry-run. Usa --confirm para gravar.');
    return;
  }

  let applied = 0;
  for (const program of targets) {
    await recordStatusChange(program.id, ProgramStatus.PERMANENT, {
      note: 'regulamento em vigor sem prazo de candidatura (backfill 2026-08-12)',
      sourceUrl: program.officialUrl ?? undefined,
      detectedBy: 'script:backfill-permanent',
      notify: false,
    });
    applied += 1;
    if (applied % 50 === 0) console.log(`… ${applied}/${targets.length}`);
  }

  console.log(`\nAplicado: ${applied} mudanças UNKNOWN -> PERMANENT (notify: false).`);
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
