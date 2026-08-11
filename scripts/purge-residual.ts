/**
 * Purga do residual (RC3) — três frentes num só passo revisável:
 *
 * 1. Blocklist: páginas-índice/serviço e editais de trânsito
 *    (`checkResidual`, a mesma regra que agora bloqueia a criação).
 * 2. Dedup: mesmo título normalizado + entidade → fica o aviso do ano mais
 *    recente (ano extraído do URL; empate resolve por createdAt).
 * 3. Gate por título: programas cujo título classifica ORGANIZATION com as
 *    keywords fortes (ex.: "Investimento Empresarial Produtivo",
 *    "TeSP – Entidades Públicas") — org-aid que entrou sem enrichment.
 *
 *   npx tsx scripts/purge-residual.ts             # dry-run
 *   npx tsx scripts/purge-residual.ts --confirm   # apaga
 *
 * O delete de Program cascata para sources, program_versions,
 * program_status_events, program_geographies e user_saved_programs.
 * notification_queue.program_id não tem FK — limpamos à mão as pendentes.
 */
import { prisma } from '../src/lib/prisma';
import { normalizeText } from '../src/lib/worker-utils';
import { checkResidual } from '../src/workers/residual-blocklist';
import { classifyBeneficiary } from '../src/workers/beneficiary-gate';

/// Org-aid confirmado à mão (2026-08-11) cujo título não tem keyword do gate:
/// avisos P2030 para empresas/operadores que entraram sem enrichment.
const ORG_AID_URLS = [
  'https://portugal2030.pt/aviso-2024/inovacao-2030/',
  'https://portugal2030.pt/aviso-2024/desenvolver-sistemas-redes-e-formas-de-armazenamento-energeticos-inteligentes-fora-da-rte-e/',
] as const;

function yearFromUrl(url: string | null): number {
  const matches = url?.match(/20\d{2}/g);
  return matches ? Math.max(...matches.map(Number)) : 0;
}

async function main() {
  const confirm = process.argv.includes('--confirm');

  const programs = await prisma.program.findMany({
    select: { id: true, title: true, entity: true, officialUrl: true, createdAt: true },
    orderBy: { title: 'asc' },
  });

  const purge = new Map<string, { title: string; url: string | null; reason: string }>();
  const mark = (program: (typeof programs)[number], reason: string) => {
    if (!purge.has(program.id)) {
      purge.set(program.id, { title: program.title, url: program.officialUrl, reason });
    }
  };

  // 1. Blocklist.
  for (const program of programs) {
    const residual = checkResidual({ title: program.title, url: program.officialUrl ?? undefined });
    if (residual.blocked) mark(program, `blocklist: ${residual.reason}`);
  }

  // 2. Dedup título+entidade — fica o de ano mais recente.
  const groups = new Map<string, typeof programs>();
  for (const program of programs) {
    if (purge.has(program.id)) continue;
    const key = `${normalizeText(program.title)}|${normalizeText(program.entity ?? '')}`;
    groups.set(key, [...(groups.get(key) ?? []), program]);
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const [keep, ...rest] = [...group].sort(
      (a, b) =>
        yearFromUrl(b.officialUrl) - yearFromUrl(a.officialUrl) ||
        b.createdAt.getTime() - a.createdAt.getTime(),
    );
    for (const program of rest) {
      mark(program, `duplicado de ${keep.officialUrl} (fica o mais recente)`);
    }
  }

  // 3. Gate por título (keywords fortes apanham org-aid sem enrichment)
  //    + lista explícita para os que nem no título se denunciam.
  for (const program of programs) {
    if (purge.has(program.id)) continue;
    const verdict = classifyBeneficiary({ title: program.title });
    if (verdict.verdict === 'ORGANIZATION') {
      mark(program, `gate por título: ${verdict.matchedNegative.join(', ')}`);
    } else if (ORG_AID_URLS.includes(program.officialUrl as (typeof ORG_AID_URLS)[number])) {
      mark(program, 'org-aid confirmado à mão (lista no script)');
    }
  }

  console.log(`Programas na base: ${programs.length}`);
  console.log(`A purgar: ${purge.size}\n`);
  for (const [, item] of purge) {
    console.log(`  - ${item.title}`);
    console.log(`    ${item.url}`);
    console.log(`    ${item.reason}`);
  }

  if (!confirm) {
    console.log('\nDry-run. Usa --confirm para apagar.');
    return;
  }

  const purgeIds = [...purge.keys()];
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
