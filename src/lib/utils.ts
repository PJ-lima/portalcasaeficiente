import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Normaliza nome de concelho para comparação robusta
 * Remove acentos, converte para minúsculas, remove espaços extras
 */
export function normalizeConcelho(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function formatRelativeDaysFromNow(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) {
    return 'data indisponível';
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'hoje';
  if (diffDays === 1) return 'há 1 dia';
  return `há ${diffDays} dias`;
}

// Tradução de tipos de medida
export const measureTypeLabels: Record<string, string> = {
  WINDOWS: 'Janelas',
  INSULATION: 'Isolamento / Capoto',
  ROOF: 'Cobertura',
  HEAT_PUMP: 'Bomba de calor',
  SOLAR_PV: 'Solar fotovoltaico',
  SOLAR_THERMAL: 'Solar térmico',
  HVAC: 'Climatização',
  LIGHTING: 'Iluminação',
  APPLIANCES: 'Eletrodomésticos',
  WATER_HEATING: 'Aquecimento de água',
  ENERGY_AUDIT: 'Auditoria energética',
  OTHER: 'Outro',
};

// Tradução de tipos de entidade
export const entityTypeLabels: Record<string, string> = {
  NATIONAL: 'Nacional',
  MUNICIPAL: 'Municipal',
  REGIONAL: 'Regional',
  PRR: 'PRR',
  FUNDO_AMBIENTAL: 'Fundo Ambiental',
  EU: 'União Europeia',
  OTHER: 'Outro',
};

// Tradução de tipos de apoio
export const supportTypeLabels: Record<string, string> = {
  VOUCHER: 'Vale',
  REIMBURSEMENT: 'Reembolso',
  SUBSIDY: 'Subsídio',
  LOAN: 'Empréstimo bonificado',
  TAX_BENEFIT: 'Benefício fiscal',
  MIXED: 'Misto',
};

// Tradução de estados de programa
export const programStatusLabels: Record<string, string> = {
  OPEN: 'Aberto',
  CLOSED: 'Fechado',
  PLANNED: 'A anunciar',
  UNKNOWN: 'Sem data pública',
  EXHAUSTED: 'Dotação esgotada',
  SUSPENDED: 'Suspenso',
  CANCELLED: 'Cancelado',
  PAYMENTS_DELAYED: 'Pagamentos em atraso',
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',
};

/**
 * O que o estado significa em português de quem está à espera do dinheiro.
 * Existe porque "fechado" e "dotação esgotada" são a mesma coisa para o
 * regulamento e coisas muito diferentes para quem se candidatou.
 */
export const programStatusExplanations: Record<string, string> = {
  OPEN: 'Aceita candidaturas neste momento.',
  CLOSED: 'O prazo de candidaturas terminou.',
  PLANNED: 'Já foi anunciado, mas ainda não abriu candidaturas.',
  UNKNOWN: 'Não há informação pública fiável sobre o estado.',
  EXHAUSTED:
    'A verba já está toda comprometida. Ser considerado elegível não garante receber apoio.',
  SUSPENDED: 'Está temporariamente parado.',
  CANCELLED: 'Terminou antes do previsto, sem substituição imediata.',
  PAYMENTS_DELAYED: 'Foi atribuído, mas há pagamentos por regularizar.',
};

// Cores de estado
export const programStatusColors: Record<string, string> = {
  OPEN: 'bg-green-100 text-green-800',
  CLOSED: 'bg-red-100 text-red-800',
  PLANNED: 'bg-amber-100 text-amber-800',
  UNKNOWN: 'bg-slate-100 text-slate-700',
  EXHAUSTED: 'bg-orange-100 text-orange-800',
  SUSPENDED: 'bg-yellow-100 text-yellow-800',
  CANCELLED: 'bg-red-100 text-red-900',
  PAYMENTS_DELAYED: 'bg-orange-100 text-orange-900',
  DRAFT: 'bg-gray-100 text-gray-800',
  PUBLISHED: 'bg-blue-100 text-blue-800',
  ARCHIVED: 'bg-gray-100 text-gray-600',
};

/**
 * Estados em que o utilizador não deve contar com o dinheiro, mesmo que a
 * página oficial ainda esteja no ar. Usado para avisar antes de alguém
 * investir tempo numa candidatura.
 */
export const cautionaryProgramStatuses = [
  'EXHAUSTED',
  'SUSPENDED',
  'CANCELLED',
  'PAYMENTS_DELAYED',
] as const;

export function isCautionaryStatus(status: string): boolean {
  return (cautionaryProgramStatuses as readonly string[]).includes(status);
}

// Tradução de domínios de apoio
export const programDomainLabels: Record<string, string> = {
  ENERGY_EFFICIENCY: 'Eficiência energética',
  RENOVATION: 'Reabilitação',
  HOUSING_ACCESS: 'Acesso à habitação',
  TAX_BENEFIT: 'Benefício fiscal',
  SOCIAL: 'Apoio social',
  MOBILITY: 'Mobilidade',
  EDUCATION: 'Educação',
  EMPLOYMENT: 'Emprego',
  HEALTH: 'Saúde',
  FAMILY: 'Família',
  AGRICULTURE: 'Agricultura',
  OTHER: 'Outro',
};

// Tradução de resultados de elegibilidade
export const eligibilityLabels: Record<string, string> = {
  ELIGIBLE: 'Provavelmente elegível',
  MAYBE: 'Talvez elegível',
  NOT_ELIGIBLE: 'Não elegível',
};

export const eligibilityColors: Record<string, string> = {
  ELIGIBLE: 'text-green-600 bg-green-50',
  MAYBE: 'text-yellow-600 bg-yellow-50',
  NOT_ELIGIBLE: 'text-red-600 bg-red-50',
};

export const eligibilityIcons: Record<string, string> = {
  ELIGIBLE: '✅',
  MAYBE: '⚠️',
  NOT_ELIGIBLE: '❌',
};

// Tradução de tipos de documento
export const documentTypeLabels: Record<string, string> = {
  ID_CARD: 'Cartão de Cidadão',
  TAX_DECLARATION: 'Declaração IRS',
  PROPERTY_CERT: 'Caderneta predial',
  ENERGY_CERT: 'Certificado energético',
  QUOTE: 'Orçamento',
  INVOICE: 'Fatura',
  PROOF_RESIDENCE: 'Comprovativo de morada',
  PROOF_INCOME: 'Comprovativo de rendimentos',
  BANK_STATEMENT: 'Extrato bancário',
  CONTRACT: 'Contrato',
  PHOTO: 'Fotografia',
  OTHER: 'Outro',
};

// Tradução de tipos de propriedade
export const propertyTypeLabels: Record<string, string> = {
  APARTMENT: 'Apartamento',
  HOUSE: 'Moradia',
  VILLA: 'Vivenda',
  TOWNHOUSE: 'Moradia em banda',
  OTHER: 'Outro',
};

// Tradução de tipos de propriedade (posse)
export const ownershipTypeLabels: Record<string, string> = {
  OWNER: 'Proprietário',
  TENANT: 'Arrendatário',
  USUFRUCT: 'Usufrutuário',
  OTHER: 'Outro',
};

// Classes energéticas
export const energyClassLabels: Record<string, string> = {
  A_PLUS: 'A+',
  A: 'A',
  B: 'B',
  B_MINUS: 'B-',
  C: 'C',
  D: 'D',
  E: 'E',
  F: 'F',
  G: 'G',
};
