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
const BLOCKED_URL_PATTERNS: ReadonlyArray<{ pattern: RegExp; reason: string; aidGuarded?: boolean }> = [
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
  // DGES (dges-bolsas, smoke 2026-08-11): páginas de acesso/admissão ao ensino
  // superior e estatísticas — não são bolsas nem apoios candidatáveis, mas
  // batem nas keywords amplas ("estudante", "ensino superior", "candidatura")
  // por estarem no mesmo menu de navegação da página de bolsas.
  { pattern: /dges\.gov\.pt\/pt\/pagina\/concursos-especiais/, reason: 'url: dges — índice de concursos especiais' },
  { pattern: /dges\.gov\.pt\/pt\/pagina\/concurso-especial-para-estudantes/, reason: 'url: dges — concurso de acesso, não é apoio' },
  { pattern: /dges\.gov\.pt\/pt\/pagina\/acesso-superior-candidatura/, reason: 'url: dges — candidatura ao acesso, não é apoio' },
  { pattern: /dges\.gov\.pt\/pt\/pagina\/regime-geral-ensino-superior/, reason: 'url: dges — estatísticas de acesso' },
  { pattern: /dges\.gov\.pt\/pt\/pagina\/prazos-de-candidatura/, reason: 'url: dges — página de prazos, não é apoio' },
  { pattern: /dges\.gov\.pt\/pt\/incluies\b/, reason: 'url: dges — balcão/índice IncluiES' },
  // IEFP (iefp-apoios, smoke 2026-08-11): página de inscrição para emprego é
  // o portal de acesso aos serviços (registo de desempregado), não um apoio
  // candidatável em si — mesmo padrão do "acesso-superior-candidatura" do DGES.
  { pattern: /iefp\.pt\/inscricao-para-emprego\b/, reason: 'url: iefp — inscrição de serviço, não é apoio' },
  // IEFP: avisos de concurso para financiamento de Centros Qualifica (RC1 —
  // decisão de âmbito 2026-08-10) são candidatáveis, mas o dinheiro vai para
  // a entidade (Centro Qualifica), não para o cidadão diretamente. O
  // beneficiary-gate não apanha porque o texto não usa os termos negativos
  // da lista (fala em "Centros Qualifica"/"ANQEP", não "empresa"/"entidades").
  { pattern: /iefp\.pt\/aviso-para-apresentacao-de-candidaturas.*centros-qualifica/, reason: 'url: iefp — financiamento a Centros Qualifica, não é apoio ao cidadão' },
  { pattern: /\/investidor\/servicos-de-apoio\//, reason: 'url: portal investidor — serviços genéricos' },
  // RC5 (revisão manual dos duvidosos, 2026-08-12): purgados à mão sem padrão
  // generalizável — bloqueio explícito para a próxima corrida não os recriar.
  { pattern: /mun-trofa\.pt\/1057\/via-azul/, reason: 'url: trofa — balcão viazul para empresários/investidores' },
  { pattern: /cm-mora\.pt\/wp-content\/uploads\/2020\/10\/aviso-procedimento-regulamentar\.pdf/, reason: 'url: mora — procedimento regulamentar, programa ainda não existe' },
  { pattern: /cm-pombal\.pt\/.*\/noticias\/noticia\/candidaturas-a-linha-pombal-apoia/, reason: 'url: pombal — notícia de prazo, não é a página do apoio' },
  { pattern: /cm-vilavicosa\.pt\/wp-content\/uploads\/2022\/10\/edital_66_2022\.pdf/, reason: 'url: vila viçosa — projeto de regulamento de benefícios fiscais, beneficiário incerto' },
  { pattern: /cm-crato\.pt\/candidaturas\b/, reason: 'url: crato — listagem de candidaturas' },
  { pattern: /cm-crato\.pt\/wp-content\/uploads\/.*femre_artigo/, reason: 'url: crato — artigo femre, não é apoio' },
  { pattern: /programas\.juventude\.gov\.pt\/florestas/, reason: 'url: plataforma externa sem detalhe do apoio' },
  { pattern: /valpacos\.pt\/.*norte-2020-concursos/, reason: 'url: valpaços — concursos norte2020, não é apoio ao cidadão' },
  { pattern: /municipio-portodemos\.pt\/pages\/980\b/, reason: 'url: porto de mós — listagem candidaturas a apoios' },
  { pattern: /\/municipio\/documentacao\b/, reason: 'url: listagem de documentação municipal' },
  // RC6 (URLs mortos, 2026-08-12): docs legados do IFRRU 2020 (opencms/http)
  // em 404 — programa encerrado para novas candidaturas, sem página substituta.
  { pattern: /portaldahabitacao\.pt\/.*\/ifrru\//, reason: 'url: ifrru 2020 — docs legados de programa encerrado' },
  { pattern: /cm-gaviao\.pt\/\?listas_ficheiros=projeto-de-regulamento-de-apoio-financeiro-aos-manuais-escolares/, reason: 'url: gavião — projeto de regulamento (draft), url morto' },
  // Página de eventos/registo de editais pode, raramente, ser o único registo
  // de um apoio real — só bloqueia quando o título não fala de apoio.
  { pattern: /\/eventos\//, reason: 'url: página de eventos', aidGuarded: true },
  { pattern: /\/editais\//i, reason: 'url: listagem/registo de editais', aidGuarded: true },
  // Página de notícia pode ser o único registo de um apoio real (bolsas de
  // São Roque do Pico) — só bloqueia quando o título não fala de apoio.
  { pattern: /\/noticia\/read\//, reason: 'url: página de notícia', aidGuarded: true },
  { pattern: /\/reunioes-de-camara|reuniao-de-camara|reuniao-ordinaria/, reason: 'url: reunião de câmara' },
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
  { pattern: /gabinete de apoio ao emigrante/, reason: 'titulo: gabinete de apoio ao emigrante' },
  { pattern: /apoio a integracao de i?migrantes/, reason: 'titulo: apoio a integracao de migrantes/imigrantes' },
  { pattern: /reuniao(?:es)? de camara/, reason: 'titulo: reuniao de camara' },
  { pattern: /lista (provisoria|definitiva|classificativa)/, reason: 'titulo: lista de candidatos' },
  { pattern: /procedimento concursal/, reason: 'titulo: procedimento concursal' },
  { pattern: /recrutamento de/, reason: 'titulo: recrutamento' },
  { pattern: /bolsa de emprego/, reason: 'titulo: bolsa de emprego (oferta, nao apoio)' },
  { pattern: /designacao d|nomeacao d/, reason: 'titulo: designacao/nomeacao de cargo' },
  { pattern: /apoio ao movimento associativo/, reason: 'titulo: apoio ao movimento associativo' },
  { pattern: /apoio as associacoes e coletividades/, reason: 'titulo: apoio as associacoes e coletividades' },
  { pattern: /apoio( financeiro)? as instituicoes particulares de solidariedade social/, reason: 'titulo: apoio as ipss' },
  { pattern: /venda de lotes de terreno|alienacao de lotes/, reason: 'titulo: venda/alienacao de lotes' },
  { pattern: /newsletter/, reason: 'titulo: newsletter' },
  { pattern: /livro de reclamacoes/, reason: 'titulo: livro de reclamacoes' },
  { pattern: /\[\+\] leia mais|\[\+\] noticias/, reason: 'titulo: bloco de listagem de noticias' },
  { pattern: /\[download de documento\]|\[visitar website\]/, reason: 'titulo: link de documento/website' },
  { pattern: /^</, reason: 'titulo: markup html' },
  { pattern: /_\d{4}.*\.pdf$/i, reason: 'titulo: nome de ficheiro pdf' },
  // RC5 (revisão manual dos duvidosos, 2026-08-12): anexos e formulários
  // apanhados como páginas de programa — a ficha/boletim/declaração é sempre
  // um anexo do apoio, nunca a página do apoio em si.
  // Ancorado ao início: anexos têm título curto ("Bolsas – Formulário de
  // Candidatura"); artigos de notícia colados no título usam a expressão a
  // meio do texto e não podem ser apanhados.
  {
    pattern:
      /^.{0,60}(ficha (de )?candidatura|boletim de candidatura|formulario de (candidatura|inscricao)|ficha de inscricao|ficha de criterios|declaracao de compromisso)/,
    reason: 'titulo: anexo/formulario de candidatura',
  },
  { pattern: /^ficha de projeto\b/, reason: 'titulo: ficha de projeto (registo, nao apoio)' },
  { pattern: /subsidios e apoios? (sociais )?pagos/, reason: 'titulo: lista de transparencia de subsidios pagos' },
  { pattern: /listas? das? candidaturas aprovadas/, reason: 'titulo: lista de resultados' },
  { pattern: /classificacao (provisoria|definitiva)/, reason: 'titulo: resultado de classificacao' },
  { pattern: /\bpepal\b/, reason: 'titulo: pepal (estagios nas autarquias, nao apoio ao cidadao)' },
  { pattern: /^area de reabilitacao urbana\b/, reason: 'titulo: aru (delimitacao urbanistica)' },
  // Editais/avisos/regulamentos "nus": só numeração e datas, sem tema no título
  // ("» Edital 15/2023", "Edital n.º 7 – 2020 27-01-2020", "» Regulamento").
  {
    pattern: /^\W*(edital|aviso|regulamento)(\s+interno)?\s*(n\.?\s*[ºo]?\s*)?\d*(\s*[/–-]\s*\d{2,4})*(\s+\d{2}-\d{2}-\d{4})?\s*$/,
    reason: 'titulo: edital/aviso so com numeracao',
  },
  { pattern: /^\d{4}\.\d{2}\.\d{2}\s*[–-]\s*(edital|aviso)\b[^a-z]*$/, reason: 'titulo: edital/aviso datado sem tema' },
  // RC6 (URLs mortos Gavião, 2026-08-12): propostas de alteração de regulamento
  // ou de tabela de taxas são fase procedimental — a página do apoio é o
  // regulamento final, nunca a proposta. Sem guarda AID: o título fala quase
  // sempre de "apoio" e continuaria a passar.
  { pattern: /proposta de alteracao (a|ao)\b/, reason: 'titulo: proposta de alteracao de regulamento/taxas (fase procedimental)' },
  { pattern: /^alteracoes a tabela de taxas/, reason: 'titulo: alteracao de tabela de taxas' },
  // RC7 (revisão dos procedimentais, 2026-08-12): "Proposta de N.ª Alteração
  // Ao Regulamento" sem tema nenhum no título — nem se sabe de que regulamento
  // é; inútil sempre. Só casa quando o título ACABA logo a seguir a
  // "regulamento" (+ data): com tema a seguir ("...ao Regulamento de Apoio à
  // Natalidade") não casa. Decisão da mesma revisão: procedimentais COM tema
  // ficam fora da blocklist — quando recentes são sinal legítimo de PLANNED.
  {
    pattern: /proposta de \d+\.?\s?a alteracao ao regulamento[\s\d/.–-]*$/,
    reason: 'titulo: proposta de alteracao sem tema no titulo',
  },
];

/// Regex de título guardadas por AID_EXCEPTION: só bloqueiam quando o título
/// NÃO contém termo de apoio (ver AID_EXCEPTION abaixo) — ex. "Consulta
/// Pública: Regulamento de Apoio ao Arrendamento Jovem" tem de passar.
const AID_GUARDED_TITLE_PATTERNS: ReadonlyArray<{ pattern: RegExp; reason: string }> = [
  { pattern: /^consulta publica/, reason: 'titulo: consulta publica' },
  { pattern: /^periodo de consulta publica/, reason: 'titulo: periodo de consulta publica' },
  { pattern: /^inicio do procedimento/, reason: 'titulo: inicio de procedimento' },
  { pattern: /^procedimento regulamentar/, reason: 'titulo: procedimento regulamentar' },
  { pattern: /^procedimento e participacao procedimental/, reason: 'titulo: procedimento e participacao procedimental' },
  { pattern: /^publicitacao de inicio de procedimento/, reason: 'titulo: publicitacao de inicio de procedimento' },
  { pattern: /^retificacao do regulamento/, reason: 'titulo: retificacao do regulamento' },
  { pattern: /noticia - /, reason: 'titulo: prefixo de noticia' },
  { pattern: /prorrogacao do prazo para apresentacao de candidaturas/, reason: 'titulo: prorrogacao de prazo (aviso, nao pagina do apoio)' },
  { pattern: /^\d{3,6}[a-zà-ÿ]/i, reason: 'titulo: id numerico colado a texto de navegacao' },
  {
    pattern: /^\d{1,2} de (janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro) de \d{4}\s/i,
    reason: 'titulo: prefixo de data de noticia',
  },
  { pattern: /^\d{1,2} (jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez) \d{4}\s*·/i, reason: 'titulo: prefixo de data (formato barreiro)' },
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
    'inscricao download',
  ].map((title) => normalizeText(title)),
);

/// Regulamentos/códigos administrativos (taxas, cemitério, posturas, orgânica)
/// não são apoios — EXCETO quando o próprio título diz que regulam um apoio
/// ("Regulamento de Apoio à Natalidade", "Regulamento para atribuição de
/// bolsas de estudo"): esses são a página oficial do apoio em muitos
/// municípios pequenos e têm de entrar.
const ADMIN_DOC_TITLE = /^(regulamento|codigo|tarifario|normas?|conduta|plano de gestao)\b/;
const AID_EXCEPTION =
  /apoio|bolsa|subsidio|incentivo|natalidade|habitac|arrendamento|comparticipacao|beneficio|cabaz|ocupacao municipal temporaria|cartao (social|jovem|senior|(do )?idoso|(do )?municipe)/;

export function checkResidual(input: ResidualCheckInput): ResidualCheckResult {
  const url = input.url ?? '';
  const title = normalizeText(input.title ?? '');
  for (const { pattern, reason, aidGuarded } of BLOCKED_URL_PATTERNS) {
    if (pattern.test(url) && !(aidGuarded && AID_EXCEPTION.test(title))) return { blocked: true, reason };
  }
  for (const { pattern, reason } of BLOCKED_TITLE_PATTERNS) {
    if (pattern.test(title)) return { blocked: true, reason };
  }

  if (title.length > 500 && !AID_EXCEPTION.test(title)) {
    return { blocked: true, reason: 'titulo: artigo de noticia colado no titulo' };
  }

  for (const { pattern, reason } of AID_GUARDED_TITLE_PATTERNS) {
    if (pattern.test(title) && !AID_EXCEPTION.test(title)) return { blocked: true, reason };
  }

  if (BLOCKED_EXACT_TITLES.has(title)) {
    return { blocked: true, reason: 'titulo: navegacao institucional' };
  }

  if (ADMIN_DOC_TITLE.test(title) && !AID_EXCEPTION.test(title)) {
    return { blocked: true, reason: 'titulo: documento administrativo sem apoio' };
  }

  return { blocked: false };
}
