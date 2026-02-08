import { CANONICAL_SOURCES, NATIONAL_SOURCE_IDS } from './canonical-sources';
import { runCanonicalSourceWorker, type WorkerRunResult } from './discovery-engine';

export type NationalCanonicalSourceId = (typeof NATIONAL_SOURCE_IDS)[number];

export async function ingestNationalSource(
  sourceId: NationalCanonicalSourceId,
): Promise<WorkerRunResult> {
  const source = CANONICAL_SOURCES[sourceId];
  return runCanonicalSourceWorker(source, {
    loggerContext: `worker:${sourceId}`,
  });
}

export async function ingestAllNationalSources(): Promise<{
  success: boolean;
  results: Array<{ source: NationalCanonicalSourceId; result: WorkerRunResult }>;
  totalStats: {
    found: number;
    new: number;
    updated: number;
    skipped: number;
    errors: number;
  };
}> {
  const results: Array<{ source: NationalCanonicalSourceId; result: WorkerRunResult }> = [];

  const totalStats = {
    found: 0,
    new: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  for (const sourceId of NATIONAL_SOURCE_IDS) {
    const result = await ingestNationalSource(sourceId);
    results.push({ source: sourceId, result });

    totalStats.found += result.stats.found;
    totalStats.new += result.stats.new;
    totalStats.updated += result.stats.updated;
    totalStats.skipped += result.stats.skipped;
    totalStats.errors += result.stats.errors;
  }

  return {
    success: true,
    results,
    totalStats,
  };
}

// CLI helper:
// npx tsx src/workers/national-canonical.ts [source-id|all]
if (require.main === module) {
  const requested = process.argv[2] as NationalCanonicalSourceId | 'all' | undefined;

  const run = async () => {
    if (!requested || requested === 'all') {
      const output = await ingestAllNationalSources();
      console.log(JSON.stringify(output, null, 2));
      return;
    }

    if (!NATIONAL_SOURCE_IDS.includes(requested as NationalCanonicalSourceId)) {
      console.error(
        `Source inválida: "${requested}". Usa uma de: ${NATIONAL_SOURCE_IDS.join(', ')} ou all.`,
      );
      process.exitCode = 1;
      return;
    }

    const output = await ingestNationalSource(requested as NationalCanonicalSourceId);
    console.log(JSON.stringify(output, null, 2));
  };

  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

