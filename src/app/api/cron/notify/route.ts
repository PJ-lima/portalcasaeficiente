import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNotificationEmail } from '@/lib/email';
import { programStatusExplanations, programStatusLabels } from '@/lib/utils';
import { getSiteUrl } from '@/lib/site-url';
import { NotificationStatus, NotificationType } from '@prisma/client';

/**
 * GET /api/cron/notify
 *
 * Envia a fila de notificações. Cron separado do de ingestão de propósito:
 * uma falha do provider de email não pode fazer perder a deteção que já foi
 * gravada no histórico.
 *
 * Protegido por CRON_SECRET, como /api/cron/ingest.
 */

const BATCH_SIZE = 50;
const MAX_ATTEMPTS = 3;

function siteUrl(): string {
  // NEXTAUTH_URL primeiro porque os links do email têm de bater certo com o
  // domínio onde a sessão é válida; o fallback é a mesma cadeia do SEO, em vez
  // de um domínio hardcoded que ainda nem está registado.
  return process.env.NEXTAUTH_URL?.replace(/\/$/, '') ?? getSiteUrl();
}

type NotificationPayload = {
  slug?: string;
  title?: string;
  status?: string;
  note?: string | null;
};

function buildEmail(type: NotificationType, payload: NotificationPayload) {
  const title = payload.title ?? 'Apoio';
  const url = payload.slug
    ? `${siteUrl()}/apoios/${payload.slug}`
    : `${siteUrl()}/apoios`;
  const statusLabel = payload.status
    ? (programStatusLabels[payload.status] ?? payload.status)
    : null;

  if (type === NotificationType.NEW_PROGRAM) {
    return {
      subject: `Novo apoio disponível: ${title}`,
      heading: 'Há um apoio novo para a tua casa',
      body: `${title} foi publicado e corresponde ao que escolheste seguir. Verbas destes programas podem esgotar em dias, por isso vale a pena ver cedo.`,
      ctaLabel: 'Ver o apoio',
      ctaUrl: url,
    };
  }

  if (type === NotificationType.DEADLINE) {
    return {
      subject: `O prazo de ${title} está a terminar`,
      heading: 'O prazo está a acabar',
      body: `${title} tem o prazo de candidatura a terminar. Confirma as datas na fonte oficial antes de avançar.`,
      ctaLabel: 'Ver o apoio',
      ctaUrl: url,
    };
  }

  const explanation =
    payload.note ??
    (payload.status ? programStatusExplanations[payload.status] : null) ??
    'O estado deste apoio mudou.';

  return {
    subject: `${title}: ${statusLabel ?? 'estado alterado'}`,
    heading: 'Mudou o estado de um apoio que guardaste',
    body: `${title} passou a "${statusLabel ?? 'estado desconhecido'}". ${explanation}`,
    ctaLabel: 'Ver o estado atual',
    ctaUrl: url,
  };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pending = await prisma.notificationQueue.findMany({
    where: {
      status: NotificationStatus.pending,
      attempts: { lt: MAX_ATTEMPTS },
    },
    orderBy: { createdAt: 'asc' },
    take: BATCH_SIZE,
    include: {
      user: { select: { email: true } },
    },
  });

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const notification of pending) {
    const email = notification.user.email;

    if (!email) {
      await prisma.notificationQueue.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.failed,
          lastError: 'Utilizador sem email',
        },
      });
      skipped++;
      continue;
    }

    const payload = (notification.payload ?? {}) as NotificationPayload;

    try {
      await sendNotificationEmail({
        to: email,
        ...buildEmail(notification.type, payload),
        footnote:
          'Podes desligar estes avisos em qualquer altura nas definições da tua conta.',
      });

      await prisma.notificationQueue.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.sent,
          sentAt: new Date(),
          attempts: { increment: 1 },
        },
      });
      sent++;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const attempts = notification.attempts + 1;

      await prisma.notificationQueue.update({
        where: { id: notification.id },
        data: {
          // Só marca como falhada quando esgota as tentativas — assim uma
          // indisponibilidade momentânea do provider não perde o aviso.
          status:
            attempts >= MAX_ATTEMPTS
              ? NotificationStatus.failed
              : NotificationStatus.pending,
          attempts,
          lastError: message,
        },
      });
      failed++;
    }
  }

  return NextResponse.json({
    success: true,
    processed: pending.length,
    sent,
    failed,
    skipped,
  });
}
