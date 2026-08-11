import { normalizeText } from '../lib/worker-utils';

/**
 * Blocklist do residual (RC3): páginas que os workers arrastam como se fossem
 * programas mas são infraestrutura de site — listagens por categoria,
 * formulários de acesso, avisos de trânsito municipais, prefixos de scraping
 * falhado ("Ler mais: ..."). O gate de beneficiário não as apanha porque o
 * problema não é quem recebe o dinheiro: é que não há dinheiro nenhum.
 *
 * Usada em dois sítios com a mesma regra:
 * - `persistCandidate`: bloqueia a CRIAÇÃO de candidatos novos.
 * - `scripts/purge-residual.ts`: limpeza retroativa do que já entrou.
 */

export interface ResidualCheckInput {
  title?: string;
  url?: string;
}

export interface ResidualCheckResult {
  blocked: boolean;
  reason?: string;
}

/// URLs de listagem/serviço — nunca são a página de um apoio concreto.
const BLOCKED_URL_PATTERNS: ReadonlyArray<{ pattern: RegExp; reason: string }> = [
  { pattern: /\/category\//, reason: 'url: listagem por categoria' },
  { pattern: /\/tag\//, reason: 'url: listagem por tag' },
  { pattern: /\/page\/\d+/, reason: 'url: paginação' },
  { pattern: /[?&]page=\d+/, reason: 'url: paginação' },
  { pattern: /formularios\.aspx/, reason: 'url: página de formulários' },
  { pattern: /recuperar-dados-de-acesso/, reason: 'url: recuperação de acesso' },
];

/// Títulos (normalizados) de páginas de serviço/índice ou de conteúdo
/// municipal que não é apoio (editais de trânsito).
const BLOCKED_TITLE_PATTERNS: ReadonlyArray<{ pattern: RegExp; reason: string }> = [
  { pattern: /^ler mais\b/, reason: 'titulo: prefixo de scraping falhado' },
  { pattern: /avisos abertos e fechados/, reason: 'titulo: pagina-indice de avisos' },
  { pattern: /^avisos e anuncios/, reason: 'titulo: pagina-indice de avisos' },
  { pattern: /recuperar dados de acesso/, reason: 'titulo: recuperacao de acesso' },
  { pattern: /^publicacoes e notificacoes/, reason: 'titulo: pagina-indice' },
  { pattern: /condicionamento.*transito|suspensao do transito/, reason: 'titulo: edital de transito' },
];

export function checkResidual(input: ResidualCheckInput): ResidualCheckResult {
  const url = input.url ?? '';
  for (const { pattern, reason } of BLOCKED_URL_PATTERNS) {
    if (pattern.test(url)) return { blocked: true, reason };
  }

  const title = normalizeText(input.title ?? '');
  for (const { pattern, reason } of BLOCKED_TITLE_PATTERNS) {
    if (pattern.test(title)) return { blocked: true, reason };
  }

  return { blocked: false };
}
