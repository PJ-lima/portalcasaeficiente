import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';

const POSTAL_CODE_REGEX = /^\d{4}-\d{3}$/;
const DEFAULT_POSTAL_CACHE_TTL_DAYS = 30;
const DEFAULT_GEO_API_TIMEOUT_MS = 4500;

const postalPrefixToConcelho: Record<string, string> = {
  // Grande Lisboa
  '1000': 'Lisboa',
  '1050': 'Lisboa',
  '1200': 'Lisboa',
  '1400': 'Lisboa',
  '1495': 'Oeiras',
  '2700': 'Amadora',
  '2710': 'Sintra',
  '2740': 'Oeiras',
  '2750': 'Cascais',
  '2765': 'Cascais',
  '2770': 'Oeiras',
  '2780': 'Oeiras',
  '2800': 'Almada',

  // Grande Porto
  '4000': 'Porto',
  '4100': 'Porto',
  '4200': 'Porto',
  '4300': 'Porto',
  '4400': 'Vila Nova de Gaia',
  '4450': 'Matosinhos',

  // Outros centros urbanos (fallback)
  '3000': 'Coimbra',
  '3500': 'Viseu',
  '3800': 'Aveiro',
  '4700': 'Braga',
  '8000': 'Faro',
  '9000': 'Funchal',
};

type ConcelhoSuggestion = {
  id: string;
  name: string;
  distrito: string;
  label: string;
};

type ResolveProviderStatus = 'cache-hit' | 'geoapi' | 'prefix-fallback' | 'cache-stale';

type PostalCodeCacheRecord = {
  id: string;
  postalCode: string;
  distrito: string | null;
  concelho: string | null;
  localidade: string | null;
  source: string;
  raw: unknown;
  fetchedAt: Date;
  expiresAt: Date;
  hitCount: number;
  lastHitAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type PostalCodeCacheRow = {
  id: string;
  postalCode: string;
  distrito: string | null;
  concelho: string | null;
  localidade: string | null;
  source: string;
  raw: unknown;
  fetchedAt: Date | string;
  expiresAt: Date | string;
  hitCount: number;
  lastHitAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type ResolvePostalCodeResult =
  | {
      status: 'ok';
      cache: PostalCodeCacheRecord;
      providerStatus: ResolveProviderStatus;
      fromCache: boolean;
      stale: boolean;
    }
  | { status: 'not_found' }
  | { status: 'unavailable' };

function toPositiveNumberOrDefault(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function mapPostalCodeCacheRow(row: PostalCodeCacheRow): PostalCodeCacheRecord {
  return {
    ...row,
    fetchedAt: new Date(row.fetchedAt),
    expiresAt: new Date(row.expiresAt),
    lastHitAt: row.lastHitAt ? new Date(row.lastHitAt) : null,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

async function getPostalCodeCache(postalCode: string): Promise<PostalCodeCacheRecord | null> {
  const rows = await prisma.$queryRaw<PostalCodeCacheRow[]>`
    SELECT
      "id",
      "postal_code" AS "postalCode",
      "distrito",
      "concelho",
      "localidade",
      "source",
      "raw",
      "fetched_at" AS "fetchedAt",
      "expires_at" AS "expiresAt",
      "hit_count" AS "hitCount",
      "last_hit_at" AS "lastHitAt",
      "created_at" AS "createdAt",
      "updated_at" AS "updatedAt"
    FROM "postal_code_cache"
    WHERE "postal_code" = ${postalCode}
    LIMIT 1
  `;

  if (rows.length === 0) return null;
  return mapPostalCodeCacheRow(rows[0]);
}

async function touchCacheHit(postalCode: string, now: Date) {
  await prisma.$executeRaw`
    UPDATE "postal_code_cache"
    SET
      "hit_count" = "hit_count" + 1,
      "last_hit_at" = ${now},
      "updated_at" = ${now}
    WHERE "postal_code" = ${postalCode}
  `;
}

async function upsertPostalCache(params: {
  postalCode: string;
  now: Date;
  concelho: string | null;
  distrito: string | null;
  localidade: string | null;
  source: string;
  raw: unknown;
}) {
  const ttlDays = toPositiveNumberOrDefault(
    process.env.POSTAL_CACHE_TTL_DAYS,
    DEFAULT_POSTAL_CACHE_TTL_DAYS
  );
  const expiresAt = addDays(params.now, ttlDays);
  const rawJson = JSON.stringify(params.raw ?? null);
  const newId = randomUUID();

  const rows = await prisma.$queryRaw<PostalCodeCacheRow[]>`
    INSERT INTO "postal_code_cache" (
      "id",
      "postal_code",
      "distrito",
      "concelho",
      "localidade",
      "source",
      "raw",
      "fetched_at",
      "expires_at",
      "hit_count",
      "last_hit_at",
      "created_at",
      "updated_at"
    ) VALUES (
      ${newId},
      ${params.postalCode},
      ${params.distrito},
      ${params.concelho},
      ${params.localidade},
      ${params.source},
      ${rawJson}::jsonb,
      ${params.now},
      ${expiresAt},
      1,
      ${params.now},
      ${params.now},
      ${params.now}
    )
    ON CONFLICT ("postal_code")
    DO UPDATE SET
      "distrito" = EXCLUDED."distrito",
      "concelho" = EXCLUDED."concelho",
      "localidade" = EXCLUDED."localidade",
      "source" = EXCLUDED."source",
      "raw" = EXCLUDED."raw",
      "fetched_at" = EXCLUDED."fetched_at",
      "expires_at" = EXCLUDED."expires_at",
      "hit_count" = "postal_code_cache"."hit_count" + 1,
      "last_hit_at" = EXCLUDED."last_hit_at",
      "updated_at" = EXCLUDED."updated_at"
    RETURNING
      "id",
      "postal_code" AS "postalCode",
      "distrito",
      "concelho",
      "localidade",
      "source",
      "raw",
      "fetched_at" AS "fetchedAt",
      "expires_at" AS "expiresAt",
      "hit_count" AS "hitCount",
      "last_hit_at" AS "lastHitAt",
      "created_at" AS "createdAt",
      "updated_at" AS "updatedAt"
  `;

  return mapPostalCodeCacheRow(rows[0]);
}

async function fetchPostalFromGeoApi(postalCode: string) {
  const timeoutMs = toPositiveNumberOrDefault(
    process.env.POSTAL_VALIDATION_TIMEOUT_MS,
    DEFAULT_GEO_API_TIMEOUT_MS
  );

  const url = `https://json.geoapi.pt/codigo_postal/${encodeURIComponent(postalCode)}`;
  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    cache: 'no-store',
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (response.status === 404) {
    return { status: 'not_found' as const };
  }

  if (!response.ok) {
    return { status: 'unavailable' as const };
  }

  const data = await response.json();
  return {
    status: 'ok' as const,
    data,
    concelho: (data?.Concelho ?? data?.concelho ?? null) as string | null,
    distrito: (data?.Distrito ?? data?.distrito ?? null) as string | null,
    localidade: (data?.Localidade ?? data?.localidade ?? null) as string | null,
  };
}

export function isValidPostalCodeFormat(postalCode: string) {
  return POSTAL_CODE_REGEX.test(postalCode);
}

export function normalizeConcelhoName(name: string) {
  return normalizeText(name);
}

export async function findConcelhoSuggestionByName(name?: string | null): Promise<ConcelhoSuggestion | null> {
  if (!name) return null;

  const concelho = await prisma.concelho.findFirst({
    where: {
      OR: [
        { name: { equals: name, mode: 'insensitive' } },
        { name: { contains: name, mode: 'insensitive' } },
      ],
    },
    include: { distrito: true },
  });

  if (!concelho) return null;

  return {
    id: concelho.id,
    name: concelho.name,
    distrito: concelho.distrito.name,
    label: `${concelho.name} (${concelho.distrito.name})`,
  };
}

export async function resolvePostalCode(postalCode: string): Promise<ResolvePostalCodeResult> {
  if (!isValidPostalCodeFormat(postalCode)) {
    throw new Error('Formato inválido de código postal');
  }

  const now = new Date();
  const cached = await getPostalCodeCache(postalCode);

  if (cached && cached.expiresAt > now) {
    await touchCacheHit(postalCode, now);
    const refreshed = await getPostalCodeCache(postalCode);
    if (!refreshed) return { status: 'unavailable' };

    return {
      status: 'ok',
      cache: refreshed,
      providerStatus: 'cache-hit',
      fromCache: true,
      stale: false,
    };
  }

  try {
    const geoApi = await fetchPostalFromGeoApi(postalCode);

    if (geoApi.status === 'not_found') {
      return { status: 'not_found' };
    }

    if (geoApi.status === 'ok' && geoApi.concelho) {
      const upserted = await upsertPostalCache({
        postalCode,
        now,
        concelho: geoApi.concelho,
        distrito: geoApi.distrito,
        localidade: geoApi.localidade,
        source: 'geoapi',
        raw: geoApi.data,
      });

      return {
        status: 'ok',
        cache: upserted,
        providerStatus: 'geoapi',
        fromCache: false,
        stale: false,
      };
    }
  } catch {
    // Continua para fallback por prefixo ou cache stale.
  }

  const fallbackConcelhoName = postalPrefixToConcelho[postalCode.slice(0, 4)];
  if (fallbackConcelhoName) {
    const fallbackConcelho = await findConcelhoSuggestionByName(fallbackConcelhoName);
    if (fallbackConcelho) {
      const rawPayload = {
        fallback: true,
        reason: 'geoapi_unavailable',
        concelho: fallbackConcelho.name,
        distrito: fallbackConcelho.distrito,
      };

      const upserted = await upsertPostalCache({
        postalCode,
        now,
        concelho: fallbackConcelho.name,
        distrito: fallbackConcelho.distrito,
        localidade: fallbackConcelho.name,
        source: 'prefix-fallback',
        raw: rawPayload,
      });

      return {
        status: 'ok',
        cache: upserted,
        providerStatus: 'prefix-fallback',
        fromCache: false,
        stale: false,
      };
    }
  }

  if (cached?.concelho) {
    await touchCacheHit(postalCode, now);
    const staleCache = await getPostalCodeCache(postalCode);
    if (!staleCache) return { status: 'unavailable' };

    return {
      status: 'ok',
      cache: staleCache,
      providerStatus: 'cache-stale',
      fromCache: true,
      stale: true,
    };
  }

  return { status: 'unavailable' };
}

export function concelhoNamesMatch(a: string, b: string) {
  return normalizeConcelhoName(a) === normalizeConcelhoName(b);
}
