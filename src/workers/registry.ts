
import { ingest as ingestDiarioRepublica } from './diario-republica';
import { ingest as ingestFundoAmbiental } from './fundo-ambiental';
import { ingest as ingestCascais } from './cascais';
import { ingestMunicipalDiscovery } from './municipal-discovery';
import { ingestNationalSource } from './national-canonical';

export interface NormalizedIngestStats {
  found: number;
  new: number;
  updated: number;
  skipped: number;
  errors: number;
  duration: string;
}

export interface NormalizedIngestResult {
  source: string;
  success: boolean;
  stats: NormalizedIngestStats;
  errors?: unknown;
  error?: string;
}

export type DirectIngestSourceId =
  | 'fundo-ambiental'
  | 'recuperar-portugal'
  | 'portugal-2030'
  | 'balcao-dos-fundos'
  | 'portal-habitacao-ihru'
  | 'dgeg-apoios-energia'
  | 'diario-republica'
  | 'municipios-portugal'
  | 'cascais';

interface SourceDescriptor {
  id: DirectIngestSourceId;
  name: string;
  type: 'NATIONAL' | 'MUNICIPAL' | 'LEGAL_BACKSTOP';
  description: string;
}

type WorkerFn = () => Promise<unknown>;

const DIRECT_SOURCE_DESCRIPTORS: SourceDescriptor[] = [
  {
    id: 'fundo-ambiental',
    name: 'Fundo Ambiental',
    type: 'NATIONAL',
    description: 'Avisos e candidaturas do Fundo Ambiental.',
  },
  {
    id: 'recuperar-portugal',
    name: 'Recuperar Portugal (PRR)',
    type: 'NATIONAL',
    description: 'Candidaturas PRR e avisos associados.',
  },
  {
    id: 'portugal-2030',
    name: 'Portugal 2030',
    type: 'NATIONAL',
    description: 'Avisos e plano anual de avisos.',
  },
  {
    id: 'balcao-dos-fundos',
    name: 'Balcão dos Fundos',
    type: 'NATIONAL',
    description: 'Discovery de avisos e entradas para submissão.',
  },
  {
    id: 'portal-habitacao-ihru',
    name: 'Portal da Habitação / IHRU',
    type: 'NATIONAL',
    description: 'Programas habitacionais nacionais.',
  },
  {
    id: 'dgeg-apoios-energia',
    name: 'DGEG Apoios Energia',
    type: 'NATIONAL',
    description: 'Metaportal de apoios na energia.',
  },
  {
    id: 'diario-republica',
    name: 'Diário da República',
    type: 'LEGAL_BACKSTOP',
    description: 'Backstop legal para regulamentos e avisos.',
  },
  {
    id: 'municipios-portugal',
    name: 'Cobertura Municipal (308)',
    type: 'MUNICIPAL',
    description: 'Discovery municipal por índice oficial + secções alvo.',
  },
  {
    id: 'cascais',
    name: 'Cascais (Piloto)',
    type: 'MUNICIPAL',
    description: 'Programas do município de Cascais (piloto).',
  },
];

type SourceGroupId = 'core-nacional' | 'municipal' | 'all';

export type IngestSourceId = DirectIngestSourceId | SourceGroupId;

const NATIONAL_DIRECT_IDS: DirectIngestSourceId[] = [
  'fundo-ambiental',
  'recuperar-portugal',
  'portugal-2030',
  'balcao-dos-fundos',
  'portal-habitacao-ihru',
  'dgeg-apoios-energia',
  'diario-republica',
];

const MUNICIPAL_DIRECT_IDS: DirectIngestSourceId[] = ['municipios-portugal', 'cascais'];

const DIRECT_WORKERS: Record<DirectIngestSourceId, WorkerFn> = {
  'fundo-ambiental': ingestFundoAmbiental,
  'recuperar-portugal': () => ingestNationalSource('recuperar-portugal'),
  'portugal-2030': () => ingestNationalSource('portugal-2030'),
  'balcao-dos-fundos': () => ingestNationalSource('balcao-dos-fundos'),
  'portal-habitacao-ihru': () => ingestNationalSource('portal-habitacao-ihru'),
  'dgeg-apoios-energia': () => ingestNationalSource('dgeg-apoios-energia'),
  'diario-republica': ingestDiarioRepublica,
  'municipios-portugal': ingestMunicipalDiscovery,
  'cascais': ingestCascais,
};

const SOURCE_GROUPS: Record<SourceGroupId, DirectIngestSourceId[]> = {
  'core-nacional': NATIONAL_DIRECT_IDS,
  municipal: MUNICIPAL_DIRECT_IDS,
  all: [...NATIONAL_DIRECT_IDS, ...MUNICIPAL_DIRECT_IDS],
};

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizeStats(stats: unknown): NormalizedIngestStats {
  const raw = stats as Partial<Record<keyof NormalizedIngestStats, unknown>> | undefined;

  return {
    found: toNumber(raw?.found),
    new: toNumber(raw?.new),
    updated: toNumber(raw?.updated),
    skipped: toNumber(raw?.skipped),
    errors: toNumber(raw?.errors),
    duration:
      typeof raw?.duration === 'string'
        ? raw.duration
        : typeof raw?.duration === 'number'
          ? raw.duration.toFixed(2)
          : '0.00',
  };
}

function normalizeWorkerResult(source: string, output: unknown): NormalizedIngestResult {
  const raw = (output ?? {}) as {
    success?: boolean;
    stats?: unknown;
    errors?: unknown;
    error?: string;
  };

  return {
    source,
    success: raw.success ?? true,
    stats: normalizeStats(raw.stats),
    errors: raw.errors,
    ...(raw.error ? { error: raw.error } : {}),
  };
}

function isDirectSourceId(source: string): source is DirectIngestSourceId {
  return DIRECT_SOURCE_DESCRIPTORS.some((descriptor) => descriptor.id === source);
}

function isGroupSourceId(source: string): source is SourceGroupId {
  return source in SOURCE_GROUPS;
}

export function isValidIngestSource(source: string): source is IngestSourceId {
  return isDirectSourceId(source) || isGroupSourceId(source);
}

export function getAvailableSources(): Array<{
  id: IngestSourceId;
  name: string;
  type: string;
  description: string;
}> {
  const direct = DIRECT_SOURCE_DESCRIPTORS.map((descriptor) => ({
    id: descriptor.id as IngestSourceId,
    name: descriptor.name,
    type: descriptor.type,
    description: descriptor.description,
  }));

  const groups: Array<{ id: IngestSourceId; name: string; type: string; description: string }> = [
    {
      id: 'core-nacional',
      name: 'Core nacional',
      type: 'GROUP',
      description: 'Executa todos os workers nacionais e o backstop legal.',
    },
    {
      id: 'municipal',
      name: 'Cobertura municipal',
      type: 'GROUP',
      description: 'Executa workers municipais (308).',
    },
    {
      id: 'all',
      name: 'Todas as fontes',
      type: 'GROUP',
      description: 'Executa todos os workers disponíveis.',
    },
  ];

  return [...direct, ...groups];
}

export async function runIngestion(source: IngestSourceId): Promise<NormalizedIngestResult[]> {
  const targets: DirectIngestSourceId[] = isGroupSourceId(source)
    ? SOURCE_GROUPS[source]
    : [source as DirectIngestSourceId];

  const results: NormalizedIngestResult[] = [];

  for (const target of targets) {
    const run = DIRECT_WORKERS[target];
    if (!run) {
      results.push({
        source: target,
        success: false,
        stats: {
          found: 0,
          new: 0,
          updated: 0,
          skipped: 0,
          errors: 1,
          duration: '0.00',
        },
        error: `Worker não encontrado para source "${target}"`,
      });
      continue;
    }

    try {
      const output = await run();
      results.push(normalizeWorkerResult(target, output));
    } catch (error) {
      results.push({
        source: target,
        success: false,
        stats: {
          found: 0,
          new: 0,
          updated: 0,
          skipped: 0,
          errors: 1,
          duration: '0.00',
        },
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  return results;
}
