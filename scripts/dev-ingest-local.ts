import { ingestAll } from '../src/workers/ingest';
import type { IngestSourceId } from '../src/workers/registry';

async function main() {
  const source = (process.argv[2] as IngestSourceId | undefined) ?? 'all';
  const results = await ingestAll(source);
  const hasFailures = results.some((result) => !result.success);
  process.exit(hasFailures ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
