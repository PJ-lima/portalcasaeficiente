/**
 * Purga programas cujo beneficiário é uma organização (RC2).
 *
 * Um programa é purgado quando TODAS as suas sources classificam como
 * ORGANIZATION no gate de beneficiário — basta uma source INDIVIDUAL ou
 * UNKNOWN para o programa ficar.
 *
 *   npx tsx scripts/purge-organization-programs.ts             # dry-run
 *   npx tsx scripts/purge-organization-programs.ts --confirm   # apaga
 *
 * O delete de Program cascata para sources, program_versions,
 * program_status_events, program_geographies e user_saved_programs.
 * notification_queue.program_id não tem FK — limpamos à mão as pendentes.
 */
import { prisma } from '../src/lib/prisma';
import { classifyBeneficiary } from '../src/workers/beneficiary-gate';

interface PayloadShape {
  title?: string;
  description?: string;
  beneficiaries?: string;
  eligibilityCriteria?: string;
  rawSections?: Record<string, string>;
}

async function main() {
  const confirm = process.argv.includes('--confirm');

  const sources = await prisma.source.findMany({
    select: { id: true, sourceUrl: true, programId: true, rawPayload: true },
  });

  const verdictsByProgram = new Map<string, { organization: number; other: number; titles: string[] }>();

  for (const source of sources) {
    if (!source.programId) continue;
    const payload =
      source.rawPayload && typeof source.rawPayload === 'object' && !Array.isArray(source.rawPayload)
        ? (source.rawPayload as PayloadShape)
        : ({} as PayloadShape);

    const result = classifyBeneficiary({
      title: payload.title,
      description: payload.description,
      beneficiaries: payload.beneficiaries,
      eligibilityCriteria: payload.eligibilityCriteria,
      rawSections: payload.rawSections,
    });

    const entry = verdictsByProgram.get(source.programId) ?? { organization: 0, other: 0, titles: [] };
    if (result.verdict === 'ORGANIZATION') {
      entry.organization += 1;
      entry.titles.push(payload.title ?? source.sourceUrl ?? source.id);
    } else {
      entry.other += 1;
    }
    verdictsByProgram.set(source.programId, entry);
  }

  const purgeIds = Array.from(verdictsByProgram.entries())
    .filter(([, entry]) => entry.organization > 0 && entry.other === 0)
    .map(([programId]) => programId);

  const totalPrograms = await prisma.program.count();

  console.log(`Programas na base: ${totalPrograms}`);
  console.log(`Programas a purgar (todas as sources ORGANIZATION): ${purgeIds.length}`);
  for (const id of purgeIds) {
    console.log(`  - ${verdictsByProgram.get(id)!.titles[0]}`);
  }

  if (!confirm) {
    console.log('\nDry-run. Usa --confirm para apagar.');
    return;
  }

  const pendingNotifications = await prisma.notificationQueue.deleteMany({
    where: { programId: { in: purgeIds } },
  });
  const snapshots = await prisma.applicationStatusSnapshot.updateMany({
    where: { programId: { in: purgeIds } },
    data: { programId: null },
  });
  const deleted = await prisma.program.deleteMany({ where: { id: { in: purgeIds } } });

  const remaining = await prisma.program.count();
  console.log(`\nApagados ${deleted.count} programas (cascade em sources/versions/events/geographies/saved).`);
  console.log(`Notificações removidas: ${pendingNotifications.count}; snapshots desligados: ${snapshots.count}.`);
  console.log(`Programas restantes: ${remaining}.`);
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
