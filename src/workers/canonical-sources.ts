import { ProgramType, SourceType } from '@prisma/client';

export type CanonicalSourceId =
  | 'fundo-ambiental'
  | 'recuperar-portugal'
  | 'portugal-2030'
  | 'balcao-dos-fundos'
  | 'portal-habitacao-ihru'
  | 'dgeg-apoios-energia'
  | 'adene-casa-mais'
  | 'portal-autarquico-dgal'
  | 'diario-republica';

export type SourceCoverage =
  | 'NATIONAL'
  | 'EU_FUNDS'
  | 'HOUSING'
  | 'ENERGY_META'
  | 'MUNICIPAL_INDEX'
  | 'LEGAL_BACKSTOP';

export interface CanonicalSourceDefinition {
  id: CanonicalSourceId;
  name: string;
  entity: string;
  description: string;
  coverage: SourceCoverage;
  sourceType: SourceType;
  programType: ProgramType;
  seedUrls: readonly string[];
  keywords: readonly string[];
  allowedHosts?: readonly string[];
  requireApplicationIntent?: boolean;
  discoveryPathHints?: readonly string[];
}

const CORE_KEYWORDS = [
  // PT
  'apoio',
  'apoios',
  'candidatura',
  'candidaturas',
  'aviso',
  'avisos',
  'edificio',
  'edifícios',
  'habitacao',
  'habitação',
  'reabilitacao',
  'reabilitação',
  'eficiencia energetica',
  'eficiência energética',
  // EN
  'support',
  'grant',
  'funding',
  'application',
  'building',
  'buildings',
  'housing',
  'rehabilitation',
  'energy efficiency',
] as const;

// Keywords focadas nas 6 categorias de apoio (PT + EN)
const JANELAS_KEYWORDS = [
  'janelas eficientes', 'janela', 'caixilharia', 'vidro duplo',
  'vidro triplo', 'envidraçado', 'vãos envidraçados', 'caixilhos',
  'efficient windows', 'window', 'glazing', 'double glazing',
  'triple glazing', 'window frames', 'fenestration',
] as const;

const BOMBAS_CALOR_KEYWORDS = [
  'bomba de calor', 'bombas de calor', 'aquecimento aerotérmico',
  'geotérmico', 'climatização eficiente', 'aerotermia',
  'heat pump', 'heat pumps', 'aerothermal', 'geothermal',
  'air source heat pump', 'ground source heat pump',
] as const;

const ISOLAMENTO_KEYWORDS = [
  'isolamento térmico', 'capoto', 'etics', 'isolamento paredes',
  'isolamento fachadas', 'revestimento térmico', 'isolamento exterior',
  'thermal insulation', 'wall insulation', 'facade insulation',
  'external insulation', 'cavity wall', 'insulation material',
] as const;

const SOLAR_KEYWORDS = [
  'solar fotovoltaico', 'painéis solares', 'fotovoltaico',
  'autoconsumo', 'energia solar', 'painel solar', 'módulos fotovoltaicos',
  'solar photovoltaic', 'solar panels', 'photovoltaic', 'pv panels',
  'self-consumption', 'solar energy', 'solar power',
] as const;

const AQUECIMENTO_AGUAS_KEYWORDS = [
  'aquecimento de águas', 'águas quentes sanitárias', 'aqs',
  'solar térmico', 'termoacumulador', 'esquentador',
  'water heating', 'domestic hot water', 'dhw', 'solar thermal',
  'water heater', 'hot water system',
] as const;

const COBERTURA_KEYWORDS = [
  'cobertura', 'telhado', 'isolamento cobertura', 'telhas',
  'impermeabilização', 'isolamento telhado', 'sótão',
  'roof', 'roofing', 'roof insulation', 'attic insulation',
  'loft insulation', 'waterproofing',
] as const;

// Todas as keywords de eficiência energética combinadas
const ENERGY_KEYWORDS = [
  ...CORE_KEYWORDS,
  ...JANELAS_KEYWORDS,
  ...BOMBAS_CALOR_KEYWORDS,
  ...ISOLAMENTO_KEYWORDS,
  ...SOLAR_KEYWORDS,
  ...AQUECIMENTO_AGUAS_KEYWORDS,
  ...COBERTURA_KEYWORDS,
  // Keywords genéricas adicionais
  'isolamento',
  'janelas',
  'bomba de calor',
  'painel solar',
  'fotovoltaico',
  'vale eficiencia',
  'vale eficiência',
  'renewable energy',
  'energia renovável',
] as const;

// Export category keywords for use in deep-crawler
export const SUPPORT_CATEGORY_KEYWORDS = {
  JANELAS: JANELAS_KEYWORDS,
  BOMBAS_CALOR: BOMBAS_CALOR_KEYWORDS,
  ISOLAMENTO: ISOLAMENTO_KEYWORDS,
  SOLAR: SOLAR_KEYWORDS,
  AQUECIMENTO_AGUAS: AQUECIMENTO_AGUAS_KEYWORDS,
  COBERTURA: COBERTURA_KEYWORDS,
} as const;

export type SupportCategory = keyof typeof SUPPORT_CATEGORY_KEYWORDS | 'OUTRO';

export const MUNICIPAL_DISCOVERY_PATHS = [
  '/habitacao',
  '/reabilitacao-urbana',
  '/acao-social',
  '/ambiente',
  '/energia',
  '/urbanismo',
  '/regulamentos',
  '/avisos',
  '/editais',
  '/candidaturas',
] as const;

export const CANONICAL_SOURCES: Record<CanonicalSourceId, CanonicalSourceDefinition> = {
  'fundo-ambiental': {
    id: 'fundo-ambiental',
    name: 'Fundo Ambiental',
    entity: 'Fundo Ambiental',
    description: 'Avisos e candidaturas nacionais de eficiência energética.',
    coverage: 'NATIONAL',
    sourceType: 'FA',
    programType: ProgramType.NATIONAL,
    seedUrls: [
      'https://www.fundoambiental.pt/avisos',
      'https://www.fundoambiental.pt/candidaturas.aspx',
    ],
    keywords: ENERGY_KEYWORDS,
    allowedHosts: ['fundoambiental.pt'],
    requireApplicationIntent: true,
  },
  'recuperar-portugal': {
    id: 'recuperar-portugal',
    name: 'Recuperar Portugal (PRR)',
    entity: 'Recuperar Portugal',
    description: 'Candidaturas PRR e avisos por componente.',
    coverage: 'NATIONAL',
    sourceType: 'OTHER',
    programType: ProgramType.NATIONAL,
    seedUrls: [
      'https://recuperarportugal.gov.pt/candidaturas/',
      'https://recuperarportugal.gov.pt/candidaturas-prr/',
    ],
    keywords: ENERGY_KEYWORDS,
    allowedHosts: ['recuperarportugal.gov.pt'],
    requireApplicationIntent: true,
  },
  'portugal-2030': {
    id: 'portugal-2030',
    name: 'Portugal 2030',
    entity: 'Portugal 2030',
    description: 'Avisos e plano anual de avisos dos fundos europeus.',
    coverage: 'EU_FUNDS',
    sourceType: 'OTHER',
    programType: ProgramType.NATIONAL,
    seedUrls: [
      'https://portugal2030.pt/avisos/',
      'https://portugal2030.pt/plano-anual-de-avisos/',
    ],
    keywords: ENERGY_KEYWORDS,
    allowedHosts: ['portugal2030.pt'],
    requireApplicationIntent: true,
  },
  'balcao-dos-fundos': {
    id: 'balcao-dos-fundos',
    name: 'Balcão dos Fundos',
    entity: 'Balcão dos Fundos',
    description: 'Plataforma de submissão e acompanhamento de candidaturas.',
    coverage: 'EU_FUNDS',
    sourceType: 'OTHER',
    programType: ProgramType.NATIONAL,
    seedUrls: [
      'https://balcaofundosue.pt/avisos',
      'https://balcaofundosue.pt/concursos',
    ],
    keywords: CORE_KEYWORDS,
    allowedHosts: ['balcaofundosue.pt'],
    requireApplicationIntent: true,
  },
  'portal-habitacao-ihru': {
    id: 'portal-habitacao-ihru',
    name: 'Portal da Habitação / IHRU',
    entity: 'IHRU',
    description: 'Programas habitacionais como 1.º Direito e Arrendamento Acessível.',
    coverage: 'HOUSING',
    sourceType: 'OTHER',
    programType: ProgramType.NATIONAL,
    seedUrls: [
      'https://www.portaldahabitacao.pt/programas-e-medidas',
      'https://www.portaldahabitacao.pt/candidaturas',
    ],
    keywords: CORE_KEYWORDS,
    allowedHosts: ['portaldahabitacao.pt', 'ihru.pt'],
    requireApplicationIntent: true,
  },
  'dgeg-apoios-energia': {
    id: 'dgeg-apoios-energia',
    name: 'DGEG Apoios Energia',
    entity: 'DGEG',
    description: 'Metaportal de apoios oficiais na área da energia.',
    coverage: 'ENERGY_META',
    sourceType: 'OTHER',
    programType: ProgramType.NATIONAL,
    seedUrls: [
      'https://www.dgeg.gov.pt/pt/areas-setoriais/energia/apoios-na-area-da-energia/',
      'https://www.dgeg.gov.pt/pt/areas-setoriais/energia/apoios-na-area-da-energia/avisos/',
    ],
    keywords: ENERGY_KEYWORDS,
    allowedHosts: ['dgeg.gov.pt'],
    requireApplicationIntent: true,
  },
  'adene-casa-mais': {
    id: 'adene-casa-mais',
    name: 'ADENE / casA+',
    entity: 'ADENE',
    description: 'Discovery e normalização de incentivos e soluções de eficiência.',
    coverage: 'ENERGY_META',
    sourceType: 'OTHER',
    programType: ProgramType.NATIONAL,
    seedUrls: [
      'https://www.adene.pt/',
      'https://casa-mais.pt/',
    ],
    keywords: ENERGY_KEYWORDS,
    allowedHosts: ['adene.pt', 'casa-mais.pt'],
    requireApplicationIntent: true,
  },
  'portal-autarquico-dgal': {
    id: 'portal-autarquico-dgal',
    name: 'Portal Autárquico (DGAL)',
    entity: 'DGAL',
    description: 'Índice oficial dos 308 municípios para discovery municipal.',
    coverage: 'MUNICIPAL_INDEX',
    sourceType: 'MUNICIPAL_SITE',
    programType: ProgramType.MUNICIPAL,
    seedUrls: [
      'https://portalautarquico.dgal.gov.pt/pt-PT/municipios/',
      'https://portalautarquico.dgal.gov.pt/',
    ],
    keywords: CORE_KEYWORDS,
    allowedHosts: ['portalautarquico.dgal.gov.pt', 'dgal.gov.pt'],
    requireApplicationIntent: true,
    discoveryPathHints: MUNICIPAL_DISCOVERY_PATHS,
  },
  'diario-republica': {
    id: 'diario-republica',
    name: 'Diário da República',
    entity: 'Diário da República',
    description: 'Backstop legal para regulamentos e avisos oficiais.',
    coverage: 'LEGAL_BACKSTOP',
    sourceType: 'DR',
    programType: ProgramType.NATIONAL,
    seedUrls: [
      'https://dre.pt/web/guest/pesquisa',
      'https://dre.pt/',
    ],
    keywords: CORE_KEYWORDS,
    allowedHosts: ['dre.pt', 'diariodarepublica.pt', 'files.diariodarepublica.pt'],
    requireApplicationIntent: true,
  },
};

export const NATIONAL_SOURCE_IDS: CanonicalSourceId[] = [
  'fundo-ambiental',
  'recuperar-portugal',
  'portugal-2030',
  'balcao-dos-fundos',
  'portal-habitacao-ihru',
  'dgeg-apoios-energia',
  'adene-casa-mais',
];
