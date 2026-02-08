import { prisma } from '@/lib/prisma';
import { IngestionRun } from '@prisma/client';

export type IngestionStats = {
  itemsFound: number;
  itemsInserted: number;
  itemsUpdated: number;
  itemsSkipped: number;
};

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
  private errors: string[] = [];

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

  async logError(error: string | Error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.errors.push(errorMessage);
    console.error(`[${this.source}] Error:`, errorMessage);
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
