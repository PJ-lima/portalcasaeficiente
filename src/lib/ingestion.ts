import { prisma } from '@/lib/prisma';
import { queueStatusChangeNotifications } from '@/lib/notifications';
import type { ProgramStatus } from '@prisma/client';

export type IngestionStats = {
  itemsFound: number;
  itemsInserted: number;
  itemsUpdated: number;
  itemsSkipped: number;
};

/**
 * Erro com contexto suficiente para debug sem reabrir o worker:
 * onde falhou (step), em que URL, e a mensagem original.
 */
export type IngestionErrorEntry = {
  step?: string;
  url?: string;
  title?: string;
  message: string;
  stack?: string;
};

type ErrorContext = Pick<IngestionErrorEntry, 'step' | 'url' | 'title'>;

export class IngestionLogger {
  private runId: string | null = null;
  private source: string;
  private startTime: number;
  private stats: IngestionStats = {
    itemsFound: 0,
    itemsInserted: 0,
    itemsUpdated: 0,
    itemsSkipped: 0,
  };
  private errors: IngestionErrorEntry[] = [];

  constructor(source: string) {
    this.source = source;
    this.startTime = Date.now();
  }

  async start(): Promise<string> {
    try {
      const run = await prisma.ingestionRun.create({
        data: {
          source: this.source,
          status: 'running',
          startedAt: new Date(),
        },
      });
      this.runId = run.id;
      console.log(`[${this.source}] Ingestion run started: ${this.runId}`);
      return this.runId;
    } catch (error) {
      console.error(`[${this.source}] Failed to start ingestion run logging:`, error);
      // Fallback to random ID if DB fails, so worker can still run
      this.runId = `fallback-${Date.now()}`;
      return this.runId;
    }
  }

  async updateStats(newStats: Partial<IngestionStats>) {
    this.stats = { ...this.stats, ...newStats };
  }

  async logError(error: string | Error, context: ErrorContext = {}) {
    const entry: IngestionErrorEntry = {
      ...context,
      message: error instanceof Error ? error.message : String(error),
      ...(error instanceof Error && error.stack ? { stack: error.stack } : {}),
    };
    this.errors.push(entry);
    console.error(`[${this.source}] Error:`, entry.message, context);
  }

  async complete(status: 'completed' | 'failed' = 'completed') {
    if (!this.runId || this.runId.startsWith('fallback-')) return;

    const durationMs = Date.now() - this.startTime;

    try {
      await prisma.ingestionRun.update({
        where: { id: this.runId },
        data: {
          status,
          finishedAt: new Date(),
          durationMs,
          itemsFound: this.stats.itemsFound,
          itemsInserted: this.stats.itemsInserted,
          itemsUpdated: this.stats.itemsUpdated,
          itemsSkipped: this.stats.itemsSkipped,
          errors: this.errors.length > 0 ? this.errors : undefined,
        },
      });
      console.log(`[${this.source}] Ingestion run finished: ${status} in ${durationMs}ms`);
    } catch (error) {
      console.error(`[${this.source}] Failed to complete ingestion run logging:`, error);
    }
  }
}

/**
 * Resultado mínimo que um worker tem de devolver para ser registado.
 * Corresponde ao `WorkerRunResult` de src/workers/discovery-engine.ts.
 */
export type LoggableWorkerResult = {
  success?: boolean;
  stats?: {
    found?: number;
    new?: number;
    updated?: number;
    skipped?: number;
    errors?: number;
  };
  errors?: Array<{ title?: string; url?: string; error: string }>;
};

/**
 * Envolve a execução de um worker num `IngestionRun`.
 *
 * Existe para que nenhum worker falhe em silêncio: antes disto só o worker de
 * Cascais registava execuções, pelo que uma fonte podia estar partida durante
 * semanas sem deixar rasto. Aplica-se no ponto de entrada de cada worker, não
 * no registry, para que correr o ficheiro diretamente
 * (`npx tsx src/workers/fundo-ambiental.ts`) também fique registado.
 */
export async function withIngestionRun<T extends LoggableWorkerResult>(
  source: string,
  run: () => Promise<T>,
): Promise<T> {
  const logger = new IngestionLogger(source);
  await logger.start();

  try {
    const result = await run();

    await logger.updateStats({
      itemsFound: result.stats?.found ?? 0,
      itemsInserted: result.stats?.new ?? 0,
      itemsUpdated: result.stats?.updated ?? 0,
      itemsSkipped: result.stats?.skipped ?? 0,
    });

    for (const error of result.errors ?? []) {
      await logger.logError(error.error, {
        step: 'worker',
        url: error.url,
        title: error.title,
      });
    }

    const failed = result.success === false;
    await logger.complete(failed ? 'failed' : 'completed');

    return result;
  } catch (error) {
    await logger.logError(error instanceof Error ? error : String(error), {
      step: 'fatal',
    });
    await logger.complete('failed');
    throw error;
  }
}

export type StatusChangeInput = {
  note?: string | null;
  sourceUrl?: string | null;
  detectedBy?: string;
  /** Atualiza também `lastVerifiedAt` mesmo quando o estado não muda. */
  markVerified?: boolean;
};

export type StatusChangeResult = {
  changed: boolean;
  previousStatus: ProgramStatus | null;
  status: ProgramStatus;
};

/**
 * Regista uma mudança de estado de um programa.
 *
 * O estado do apoio é o produto: "dotação esgotada" ou "pagamentos em atraso"
 * é informação que nenhuma fonte oficial agrega. Guardamos histórico
 * (`ProgramStatusEvent`) em vez de update-in-place, para poder mostrar
 * "cancelado a 19-fev-2026" e para servir de gatilho às notificações.
 *
 * Só escreve evento quando o estado difere do último registado — o dedup vive
 * aqui e em mais lado nenhum.
 */
export async function recordStatusChange(
  programId: string,
  status: ProgramStatus,
  input: StatusChangeInput = {},
): Promise<StatusChangeResult> {
  const lastEvent = await prisma.programStatusEvent.findFirst({
    where: { programId },
    orderBy: { detectedAt: 'desc' },
    select: { status: true },
  });

  const previousStatus = lastEvent?.status ?? null;
  const changed = previousStatus !== status;

  if (!changed) {
    if (input.markVerified) {
      await prisma.program.update({
        where: { id: programId },
        data: { lastVerifiedAt: new Date() },
      });
    }
    return { changed: false, previousStatus, status };
  }

  const [, program] = await prisma.$transaction([
    prisma.programStatusEvent.create({
      data: {
        programId,
        status,
        note: input.note ?? null,
        sourceUrl: input.sourceUrl ?? null,
        detectedBy: input.detectedBy ?? 'worker',
      },
    }),
    prisma.program.update({
      where: { id: programId },
      data: {
        status,
        statusNote: input.note ?? null,
        statusSourceUrl: input.sourceUrl ?? null,
        lastVerifiedAt: new Date(),
      },
      select: {
        id: true,
        slug: true,
        title: true,
        domain: true,
        status: true,
        statusNote: true,
      },
    }),
  ]);

  // Falhar a enfileirar não pode desfazer a deteção: o histórico é o registo
  // de verdade, a notificação é consequência.
  try {
    await queueStatusChangeNotifications(program);
  } catch (error) {
    console.error(`[ingestion] Falha ao enfileirar notificações de ${programId}:`, error);
  }

  return { changed: true, previousStatus, status };
}
