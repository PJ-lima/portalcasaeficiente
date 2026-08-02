import { prisma } from '@/lib/prisma';
import {
  NotificationStatus,
  NotificationType,
  ProgramStatus,
  type Prisma,
  type ProgramDomain,
} from '@prisma/client';

/**
 * Produtor de notificações.
 *
 * As regras de "o que merece interromper alguém" estão escritas em
 * docs/versionamento.md. O resumo: uma verba pode esgotar em dias (o E-Lar
 * esgotou 30 M€ em 6), por isso a abertura de um apoio é a notificação mais
 * valiosa que existe — e a mudança para dotação esgotada ou pagamentos em
 * atraso é a que evita que alguém perca tempo com uma candidatura sem verba.
 */

/** Estados que interessam a quem já guardou o apoio nos favoritos. */
const NOTIFIABLE_STATUS_CHANGES: ProgramStatus[] = [
  ProgramStatus.OPEN,
  ProgramStatus.EXHAUSTED,
  ProgramStatus.SUSPENDED,
  ProgramStatus.CANCELLED,
  ProgramStatus.PAYMENTS_DELAYED,
];

export function isNotifiableStatus(status: ProgramStatus): boolean {
  return NOTIFIABLE_STATUS_CHANGES.includes(status);
}

type ProgramSummary = {
  id: string;
  slug: string;
  title: string;
  domain: ProgramDomain;
  status: ProgramStatus;
  statusNote?: string | null;
};

async function enqueue(
  userIds: string[],
  program: ProgramSummary,
  type: NotificationType,
  payload: Prisma.InputJsonValue,
): Promise<number> {
  if (userIds.length === 0) return 0;

  // Uma linha já resolvida (enviada ou falhada em definitivo) continuaria a
  // ocupar o unique(userId, programId, type) e a bloquear todos os avisos
  // seguintes: cada pessoa receberia um único aviso por apoio, para sempre — e
  // a mudança que interessa (aberto -> dotação esgotada) chega sempre depois da
  // primeira. Libertar o slot é o que torna o histórico de estado notificável.
  await prisma.notificationQueue.deleteMany({
    where: {
      userId: { in: userIds },
      programId: program.id,
      type,
      status: { not: NotificationStatus.pending },
    },
  });

  // skipDuplicates + unique(userId, programId, type) garante que reprocessar
  // a mesma deteção não gera segundo email enquanto o aviso está pendente.
  const result = await prisma.notificationQueue.createMany({
    data: userIds.map((userId) => ({
      userId,
      programId: program.id,
      type,
      payload,
    })),
    skipDuplicates: true,
  });

  return result.count;
}

/**
 * Enfileira avisos de mudança de estado para quem guardou o apoio nos
 * favoritos. Só para favoritos: notificar toda a gente sobre todos os
 * programas é a forma mais rápida de ser marcado como spam.
 */
export async function queueStatusChangeNotifications(
  program: ProgramSummary,
): Promise<number> {
  if (!isNotifiableStatus(program.status)) return 0;

  const watchers = await prisma.userSavedProgram.findMany({
    where: {
      programId: program.id,
      user: {
        notificationSettings: {
          emailEnabled: true,
          savedProgramUpdates: true,
        },
      },
    },
    select: { userId: true },
  });

  return enqueue(
    watchers.map((watcher) => watcher.userId),
    program,
    NotificationType.STATUS_CHANGE,
    {
      slug: program.slug,
      title: program.title,
      status: program.status,
      note: program.statusNote ?? null,
    },
  );
}

/**
 * Enfileira avisos de apoio novo para quem tem o domínio nas preferências.
 * `domains` vazio significa "todos" — é o default de quem nunca configurou.
 */
export async function queueNewProgramNotifications(
  program: ProgramSummary,
  municipalities: string[] = [],
): Promise<number> {
  const candidates = await prisma.userNotificationSettings.findMany({
    where: {
      emailEnabled: true,
      OR: [{ domains: { isEmpty: true } }, { domains: { has: program.domain } }],
    },
    select: { userId: true, concelhoIds: true },
  });

  if (candidates.length === 0) return 0;

  // Programa nacional interessa a toda a gente; municipal só a quem vigia
  // aquele concelho (ou a quem não escolheu nenhum).
  let eligible = candidates;

  if (municipalities.length > 0) {
    const concelhos = await prisma.concelho.findMany({
      where: { name: { in: municipalities } },
      select: { id: true },
    });
    const concelhoIds = new Set(concelhos.map((concelho) => concelho.id));

    eligible = candidates.filter(
      (candidate) =>
        candidate.concelhoIds.length === 0 ||
        candidate.concelhoIds.some((id) => concelhoIds.has(id)),
    );
  }

  return enqueue(
    eligible.map((candidate) => candidate.userId),
    program,
    NotificationType.NEW_PROGRAM,
    {
      slug: program.slug,
      title: program.title,
      status: program.status,
    },
  );
}
