/**
 * Marca como failed os ingestion_runs pendurados em `running`.
 * Um worker morto a meio (kill, crash de rede) nunca chama complete() —
 * a linha fica `running` para sempre e suja o dashboard de runs.
 *
 *   npx tsx scripts/clear-stale-runs.ts
 */
import { prisma } from '../src/lib/prisma';

async function main() {
  const stale = await prisma.ingestionRun.findMany({
    where: { status: 'running' },
    select: { id: true, source: true, startedAt: true },
  });

  for (const run of stale) {
    console.log(`stale: ${run.source} (${run.id}) desde ${run.startedAt.toISOString()}`);
  }

  const result = await prisma.ingestionRun.updateMany({
    where: { status: 'running' },
    data: { status: 'failed', finishedAt: new Date() },
  });
  console.log(`Marcados failed: ${result.count}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
