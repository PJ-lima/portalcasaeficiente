import { ingestNationalSource } from './national-canonical';
import type { WorkerRunResult } from './discovery-engine';

/**
 * Worker Fundo Ambiental alinhado com o pipeline canónico.
 *
 * Garante:
 * - retry + backoff + rate limit;
 * - métricas completas (found/new/updated/skipped/errors);
 * - deduplicação por sourceUrl + contentHash.
 */
export async function ingest(): Promise<WorkerRunResult> {
  return ingestNationalSource('fundo-ambiental');
}

if (require.main === module) {
  ingest()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
      process.exitCode = 0;
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
