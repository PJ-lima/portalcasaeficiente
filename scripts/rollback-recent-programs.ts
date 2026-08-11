/**
 * Apaga programas criados depois de um instante — rollback de um run de
 * discovery que correu com regras ainda por afinar.
 *
 *   npx tsx scripts/rollback-recent-programs.ts <ISO>             # dry-run
 *   npx tsx scripts/rollback-recent-programs.ts <ISO> --confirm   # apaga
 *
 * Mesma mecânica de delete do purge-residual (cascade + limpeza de
 * notificações pendentes e snapshots).
 */
import { prisma } from '../src/lib/prisma';

async function main() {
  const sinceArg = process.argv[2];
  const confirm = process.argv.includes('--confirm');
  const since = new Date(sinceArg ?? '');
  if (Number.isNaN(since.getTime())) {
    console.error('Uso: npx tsx scripts/rollback-recent-programs.ts <ISO-8601> [--confirm]');
    process.exitCode = 1;
    return;
  }

  const programs = await prisma.program.findMany({
    where: { createdAt: { gte: since } },
    select: { id: true, title: true, entity: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Criados desde ${since.toISOString()}: ${programs.length}`);
  for (const program of programs) {
    console.log(`  - ${program.title} | ${program.entity} | ${program.createdAt.toISOString()}`);
  }

  if (!confirm) {
    console.log('\nDry-run. Usa --confirm para apagar.');
    return;
  }

  const ids = programs.map((program) => program.id);
  await prisma.notificationQueue.deleteMany({ where: { programId: { in: ids } } });
  await prisma.applicationStatusSnapshot.updateMany({
    where: { programId: { in: ids } },
    data: { programId: null },
  });
  const deleted = await prisma.program.deleteMany({ where: { id: { in: ids } } });
  const remaining = await prisma.program.count();
  console.log(`\nApagados ${deleted.count}. Programas restantes: ${remaining}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
