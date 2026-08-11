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
  { pattern: /\/avisos-legais\//, reason: 'url: avisos legais do site' },
  { pattern: /\/documentos-transparencia\//, reason: 'url: transparência institucional' },
  { pattern: /\/concursos-rh\/|\/procedimentos-concursais\//, reason: 'url: recrutamento' },
  { pattern: /\/reclamacoes-sugestoes\//, reason: 'url: reclamações/sugestões' },
  { pattern: /\/noticias\/?$/, reason: 'url: arquivo de notícias' },
  // Só a RAIZ das listagens de formulários — um requerimento concreto
  // (/requerimentos-para-pedidos-de-apoio/apoio-a-natalidade/) é apoio real.
  { pattern: /\/formularios\/?$/, reason: 'url: índice de formulários' },
  { pattern: /\/requerimentos-para-pedidos-de-apoio\/?$/, reason: 'url: índice de requerimentos' },
];

/// Títulos (normalizados) de páginas de serviço/índice ou de conteúdo
/// municipal que não é apoio (editais de serviço/trânsito, órgãos, RH).
const BLOCKED_TITLE_PATTERNS: ReadonlyArray<{ pattern: RegExp; reason: string }> = [
  { pattern: /^ler mais\b/, reason: 'titulo: prefixo de scraping falhado' },
  { pattern: /avisos abertos e fechados/, reason: 'titulo: pagina-indice de avisos' },
  { pattern: /^avisos e anuncios/, reason: 'titulo: pagina-indice de avisos' },
  { pattern: /recuperar dados de acesso/, reason: 'titulo: recuperacao de acesso' },
  { pattern: /^publicacoes e notificacoes/, reason: 'titulo: pagina-indice' },
  { pattern: /condicionamento.*transito|suspensao do transito/, reason: 'titulo: edital de transito' },
  {
    pattern:
      /ocupacao da via|sentido unico|estacionamento.*proibid|abastecimento de agua a populacao|canil municipal|instalacoes sanitarias/,
    reason: 'titulo: edital de servico municipal',
  },
  { pattern: /^arquivo de noticias/, reason: 'titulo: arquivo de noticias' },
  { pattern: /procedimentos concursais|carreira e categoria de assistente/, reason: 'titulo: recrutamento' },
  { pattern: /^atendimento ao publico\b/, reason: 'titulo: servico de atendimento' },
];

/// Páginas de navegação institucional — bloqueio por título EXATO (curto),
/// para não apanhar títulos reais que contenham as mesmas palavras.
const BLOCKED_EXACT_TITLES = new Set(
  [
    'camara municipal',
    'assembleia municipal',
    'conselho de ilha',
    'explorar municipio',
    'municipio',
    'areas de atuacao',
    'documentos & transparencia',
    'outros documentos',
    'informacao financeira',
    'recursos humanos e concursos',
    'reclamacoes / sugestoes',
    'reclamacoes/sugestoes',
    'formulario para contacto e sugestoes',
    'notificacoes',
    'regulamentos',
    'regulamentos e taxas',
    'protecao de dados',
    'servicos online',
    'contactos',
  ].map((title) => normalizeText(title)),
);

/// Regulamentos/códigos administrativos (taxas, cemitério, posturas, orgânica)
/// não são apoios — EXCETO quando o próprio título diz que regulam um apoio
/// ("Regulamento de Apoio à Natalidade", "Regulamento para atribuição de
/// bolsas de estudo"): esses são a página oficial do apoio em muitos
/// municípios pequenos e têm de entrar.
const ADMIN_DOC_TITLE = /^(regulamento|codigo|tarifario|normas?|conduta|plano de gestao)\b/;
const AID_EXCEPTION =
  /apoio|bolsa|subsidio|incentivo|natalidade|habitacao|arrendamento|comparticipacao|beneficio/;

export function checkResidual(input: ResidualCheckInput): ResidualCheckResult {
  const url = input.url ?? '';
  for (const { pattern, reason } of BLOCKED_URL_PATTERNS) {
    if (pattern.test(url)) return { blocked: true, reason };
  }

  const title = normalizeText(input.title ?? '');
  for (const { pattern, reason } of BLOCKED_TITLE_PATTERNS) {
    if (pattern.test(title)) return { blocked: true, reason };
  }

  if (BLOCKED_EXACT_TITLES.has(title)) {
    return { blocked: true, reason: 'titulo: navegacao institucional' };
  }

  if (ADMIN_DOC_TITLE.test(title) && !AID_EXCEPTION.test(title)) {
    return { blocked: true, reason: 'titulo: documento administrativo sem apoio' };
  }

  return { blocked: false };
}
