import { CANONICAL_SOURCES } from '../src/workers/canonical-sources';
import { isValidIngestSource } from '../src/workers/registry';

const CITIZEN_IDS = ['dges-bolsas', 'iefp-apoios', 'seg-social-apoios'] as const;

let failures = 0;
function check(label: string, ok: boolean) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
  if (!ok) failures += 1;
}

for (const id of CITIZEN_IDS) {
  const def = CANONICAL_SOURCES[id as keyof typeof CANONICAL_SOURCES];
  check(`${id}: definido em CANONICAL_SOURCES`, Boolean(def));
  if (!def) continue;
  check(`${id}: requireApplicationIntent true`, def.requireApplicationIntent === true);
  check(`${id}: seedUrls não vazio`, def.seedUrls.length > 0);
  check(`${id}: allowedHosts não vazio`, (def.allowedHosts ?? []).length > 0);
  check(
    `${id}: seeds dentro de allowedHosts`,
    def.seedUrls.every((u) => (def.allowedHosts ?? []).some((h) => new URL(u).hostname.endsWith(h))),
  );
  check(`${id}: registado no registry`, isValidIngestSource(id));
}

if (failures > 0) {
  console.error(`\n${failures} falhas`);
  process.exit(1);
}
console.log('\nOK');
