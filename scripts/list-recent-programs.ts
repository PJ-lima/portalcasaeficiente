/**
 * Lista programas criados na última hora (title | entity | url) — para rever
 * o resultado de um run de discovery acabado de fazer.
 *
 *   npx tsx scripts/list-recent-programs.ts [horas]
 */
import { prisma } from '../src/lib/prisma';

async function main() {
  const hours = Number(process.argv[2]) || 1;
  const since = new Date(Date.now() - hours * 3600_000);

  const programs = await prisma.program.findMany({
    where: { createdAt: { gte: since } },
    select: { title: true, entity: true, officialUrl: true, status: true },
    orderBy: [{ entity: 'asc' }, { title: 'asc' }],
  });

  console.log(`Criados desde ${since.toISOString()}: ${programs.length}\n`);
  for (const program of programs) {
    console.log(`- ${program.title} [${program.status}] | ${program.entity}`);
    console.log(`  ${program.officialUrl}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
