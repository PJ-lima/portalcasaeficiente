import { ProgramStatus } from '@prisma/client';
import { normalizeText } from '../lib/worker-utils';

/**
 * Extrator de estado — resolve o "quase tudo UNKNOWN" (RC3).
 *
 * O regex antigo (`inferStatus`) corria só sobre título+descrição, texto curto
 * que quase nunca fala do estado das candidaturas; o deep-crawler calculava um
 * estado full-page mas era descartado no merge — e full-page é ruidoso: uma
 * página-índice com "avisos abertos e fechados" dava OPEN por ordem de teste.
 *
 * Aqui há dois sinais calculados em separado e uma regra de conflito explícita:
 *
 * - Frases explícitas ("candidaturas abertas/encerradas", "dotação esgotada")
 *   só contam com PROXIMIDADE a "candidatur|submiss|concurso|aviso" — mata o
 *   ruído de navegação/rodapé. Se a mesma janela tem sinal de abertura E de
 *   fecho (página-índice), a camada é ambígua e não decide.
 * - Datas de prazo ("até 31 de dezembro de 2025", "31/12/2025"): fim no
 *   passado → CLOSED; fim no futuro → OPEN; início no futuro → PLANNED.
 *   O campo `deadline` fresco tem prioridade sobre secções herdadas do
 *   raw_payload (merge never-replace arrasta prazos de corridas antigas).
 * - Conflito frase vs data: sinal de FECHO ganha sempre — data-fim passada
 *   vence "abertas" stale (o caso comum), e "encerradas" explícito vence
 *   data futura (fecho antecipado / dotação esgotada acontece).
 *
 * Sem sinal → UNKNOWN honesto. Quem consome decide se UNKNOWN pode ou não
 * sobrepor um estado já conhecido (nunca deve — guard anti-downgrade).
 */

export interface StatusExtractionInput {
  title?: string;
  description?: string;
  deadline?: string;
  rawSections?: Record<string, string>;
}

export interface StatusExtractionResult {
  status: ProgramStatus;
  /// 'high' = frase explícita ou data inequívoca; 'low' = keyword fraca.
  confidence: 'high' | 'low' | 'none';
  /// Evidência textual que decidiu (frases e/ou datas encontradas).
  matched: string[];
  /// De onde veio o sinal decisivo.
  sourceField: 'sections' | 'deadline' | 'title+description' | 'none';
}

/// Secções que são navegação/rodapé — nunca falam do estado deste programa.
/// (Nos payloads reais, "Candidaturas" 54× é menu com "Registo Política de
/// Privacidade"; o sinal verdadeiro vive em secções como "INFORMAÇÃO".)
const NAV_SECTION_KEY =
  /contact|sobre nos|area reservada|servicos online|outras ligacoes|newsletter|instrumentos de gestao|na palma|angrosfera|camara municipal/;

/// Âncoras: o sinal de estado só conta perto de uma destas palavras.
const ANCHOR = /candidatur\w*|submiss\w*|concurso\w*|aviso\w*|inscri\w*|incentivo\w*|programa\b/g;

/// Âncoras fortes para SUSPENDED: "aviso de suspensão do trânsito" não é um
/// programa suspenso, e "suspensão da inscrição" é legalês de regulamento
/// (regra sobre o registo de uma entidade) — só candidaturas/submissões.
const SUSPENDED_ANCHOR = /candidatur|submiss/;

/// Janela de proximidade (chars) entre âncora e keyword de estado.
const PROXIMITY_WINDOW = 60;

/// "abertura" fica de fora — "abertura prevista" é PLANNED, não OPEN.
const OPENING = /\babert[oa]s?\b|em curso|a decorrer/;
const CLOSING = /\bencerrad\w*|fechad\w*|terminad\w*|expirad\w*\b/;
/// "previst\w*" solto é legalês de regulamento ("nos termos previstos") —
/// PLANNED exige formulação de abertura futura.
const PLANNED_RE = /\bbrevemente|em breve|proximamente|abertura prevista|previst\w* abrir|a abrir\b/;
const EXHAUSTED_RE = /\b(dotacao|verba|orcamento)[^.]{0,40}esgotad\w*|esgotad\w*[^.]{0,40}(dotacao|verba)\b/;
/// Particípio ("candidaturas suspensas") ou "suspensão das candidaturas".
/// O verbo ("a inscrição suspende-se pelo período...") é legalês de
/// regulamento, não estado do programa.
const SUSPENDED_RE = /\bsuspens[oa]s?\b|suspensao (de |da |das |do |dos )?(candidatur|submiss)\w*/;

const MONTHS: Record<string, number> = {
  janeiro: 0, fevereiro: 1, marco: 2, abril: 3, maio: 4, junho: 5,
  julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11,
};

interface FoundDate {
  date: Date;
  index: number;
  raw: string;
}

/// Todas as datas de um texto NORMALIZADO (minúsculas, sem acentos).
function extractDates(text: string): FoundDate[] {
  const found: FoundDate[] = [];
  const push = (date: Date, index: number, raw: string) => {
    if (!Number.isNaN(date.getTime())) found.push({ date, index, raw });
  };

  for (const match of text.matchAll(/(\d{1,2})\s+de\s+([a-z]+)(?:\s+de\s+(\d{4}))/g)) {
    const month = MONTHS[match[2]];
    if (month === undefined) continue;
    push(new Date(Number(match[3]), month, Number(match[1])), match.index ?? 0, match[0]);
  }
  for (const match of text.matchAll(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/g)) {
    push(new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1])), match.index ?? 0, match[0]);
  }
  for (const match of text.matchAll(/(\d{4})-(\d{2})-(\d{2})/g)) {
    push(new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])), match.index ?? 0, match[0]);
  }
  return found.sort((a, b) => a.index - b.index);
}

type PhraseSignal = { status: ProgramStatus; matched: string[] } | 'ambiguous' | null;

/// Frases de estado com proximidade a âncoras de candidatura.
function findPhraseSignal(normalized: string): PhraseSignal {
  if (normalized.length === 0) return null;

  // Esgotamento e suspensão têm o próprio contexto (dotação/verba) — não
  // precisam de âncora de candidatura e vencem tudo o resto.
  const exhausted = normalized.match(EXHAUSTED_RE);
  if (exhausted) return { status: ProgramStatus.EXHAUSTED, matched: [exhausted[0]] };

  const opening = new Set<string>();
  const closing = new Set<string>();
  const planned = new Set<string>();
  const suspended = new Set<string>();

  for (const anchor of normalized.matchAll(ANCHOR)) {
    const anchorIndex = anchor.index ?? 0;
    const start = Math.max(0, anchorIndex - PROXIMITY_WINDOW);
    const end = Math.min(normalized.length, anchorIndex + anchor[0].length + PROXIMITY_WINDOW);
    const window = normalized.slice(start, end);

    const open = window.match(OPENING);
    const close = window.match(CLOSING);
    const plan = window.match(PLANNED_RE);
    const susp = SUSPENDED_ANCHOR.test(anchor[0]) ? window.match(SUSPENDED_RE) : null;
    if (open) opening.add(`${anchor[0]}~${open[0]}`);
    if (close) closing.add(`${anchor[0]}~${close[0]}`);
    if (plan) planned.add(`${anchor[0]}~${plan[0]}`);
    if (susp) suspended.add(`${anchor[0]}~${susp[0]}`);
  }

  if (suspended.size > 0) {
    return { status: ProgramStatus.SUSPENDED, matched: [...suspended] };
  }

  const hasOpen = opening.size > 0 || planned.size > 0;
  const hasClose = closing.size > 0;

  // Abertura e fecho na mesma vizinhança = página-índice ("avisos abertos e
  // fechados") — a camada não decide, deixa as datas falarem.
  if (hasOpen && hasClose) return 'ambiguous';

  if (hasClose) return { status: ProgramStatus.CLOSED, matched: [...closing] };
  if (opening.size > 0) return { status: ProgramStatus.OPEN, matched: [...opening] };
  if (planned.size > 0) return { status: ProgramStatus.PLANNED, matched: [...planned] };
  return null;
}

type DateSignal = { status: ProgramStatus; matched: string[] } | null;

/// Data de publicação/alteração não é prazo — exclui a data que se segue.
const PUBLICATION_MARKER = /publicad\w*|publicacao|atualizad\w*|alterad\w*|criado em/;

/// Uma data só conta como prazo se tiver, na vizinhança, uma âncora de
/// candidatura ou um marcador de prazo/abertura.
const DATE_CONTEXT = /candidatur|submiss|inscri|concurso|\bate\b|termin\w*|\bfim\b|encerr\w*|prazo|limite|decorre|abertura|inicio|a partir/;

/// Estado a partir de datas de prazo num texto normalizado.
function findDateSignal(normalized: string, now: Date): DateSignal {
  if (normalized.length === 0) return null;

  const dates = extractDates(normalized).filter((found) => {
    const before = normalized.slice(Math.max(0, found.index - 50), found.index);
    if (PUBLICATION_MARKER.test(before)) return false;
    const context = normalized.slice(Math.max(0, found.index - 60), found.index + found.raw.length + 60);
    return DATE_CONTEXT.test(context);
  });
  if (dates.length === 0) return null;

  // Duas ou mais datas de prazo = intervalo (início/fim); os conectores
  // ("de X a Y", "entre X e Y") são demasiado frágeis para regex.
  const isRange = dates.length >= 2;
  const hasEndMarker = /\bate\b|termin\w*|\bfim\b|encerr\w*|prazo|limite/.test(normalized);

  const sorted = [...dates].sort((a, b) => a.date.getTime() - b.date.getTime());
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const evidence = dates.map((d) => d.raw);

  // "de X a Y": início futuro → PLANNED; fim passado → CLOSED; senão OPEN.
  if (isRange) {
    if (first.date.getTime() > now.getTime()) return { status: ProgramStatus.PLANNED, matched: evidence };
    if (last.date.getTime() < startOfDay(now).getTime()) return { status: ProgramStatus.CLOSED, matched: evidence };
    return { status: ProgramStatus.OPEN, matched: evidence };
  }

  if (!hasEndMarker) return null;

  // Data-fim: o prazo conta até ao fim do próprio dia.
  if (endOfDay(last.date).getTime() < now.getTime()) {
    return { status: ProgramStatus.CLOSED, matched: evidence };
  }
  return { status: ProgramStatus.OPEN, matched: evidence };
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

const CLOSING_STATUSES: ReadonlySet<ProgramStatus> = new Set([
  ProgramStatus.CLOSED,
  ProgramStatus.EXHAUSTED,
  ProgramStatus.SUSPENDED,
  ProgramStatus.CANCELLED,
]);

/// Regex fraco antigo (ex-`inferStatus` do discovery-engine) — último recurso,
/// só sobre título+descrição.
function findWeakSignal(normalized: string): { status: ProgramStatus; matched: string[] } | null {
  const open = normalized.match(/\b(aberto|abertas|abertura|em curso|submissoes abertas)\b/);
  if (open) return { status: ProgramStatus.OPEN, matched: [open[0]] };
  const closed = normalized.match(/\b(encerrado|encerradas|fechado|terminado|expirado)\b/);
  if (closed) return { status: ProgramStatus.CLOSED, matched: [closed[0]] };
  const planned = normalized.match(/\b(breve|previsto|prevista|futuro|a abrir)\b/);
  if (planned) return { status: ProgramStatus.PLANNED, matched: [planned[0]] };
  return null;
}

/// Todas as secções de conteúdo (fora navegação/rodapé). A proximidade a
/// âncoras é o guard anti-ruído — filtrar por título de secção "relevante"
/// deixava escapar o sinal real ("INFORMAÇÃO: ... encontra-se encerrado").
function contentSectionsText(rawSections: Record<string, string> | undefined): string {
  const parts: string[] = [];
  for (const [key, content] of Object.entries(rawSections ?? {})) {
    if (!NAV_SECTION_KEY.test(normalizeText(key))) {
      parts.push(`${key} ${content}`);
    }
  }
  return normalizeText(parts.join(' '));
}

/// Combina frase + data com a regra "fecho ganha sempre a abertura".
function resolve(
  phrase: PhraseSignal,
  date: DateSignal,
  sourceField: StatusExtractionResult['sourceField'],
): StatusExtractionResult | null {
  const phraseSignal = phrase === 'ambiguous' ? null : phrase;

  if (phraseSignal && date && phraseSignal.status !== date.status) {
    const closingSignal = [phraseSignal, date].find((s) => CLOSING_STATUSES.has(s.status));
    if (closingSignal) {
      return {
        status: closingSignal.status,
        confidence: 'high',
        matched: [...phraseSignal.matched, ...date.matched],
        sourceField,
      };
    }
  }

  // EXHAUSTED/SUSPENDED são mais específicos do que qualquer data.
  if (phraseSignal && CLOSING_STATUSES.has(phraseSignal.status)) {
    return { status: phraseSignal.status, confidence: 'high', matched: phraseSignal.matched, sourceField };
  }
  if (date) {
    return {
      status: date.status,
      confidence: 'high',
      matched: phraseSignal ? [...phraseSignal.matched, ...date.matched] : date.matched,
      sourceField,
    };
  }
  if (phraseSignal) {
    return { status: phraseSignal.status, confidence: 'high', matched: phraseSignal.matched, sourceField };
  }
  return null;
}

export function extractStatus(input: StatusExtractionInput, now: Date = new Date()): StatusExtractionResult {
  // 1) deadline fresco — campo estruturado da última corrida, a fonte mais fiável.
  const deadlineText = normalizeText(input.deadline ?? '');
  if (deadlineText.length > 0) {
    const result = resolve(findPhraseSignal(deadlineText), findDateSignal(deadlineText, now), 'deadline');
    if (result) return result;
  }

  // 2) secções de conteúdo do raw_payload (podem ser herdadas de corridas antigas).
  const sectionsText = contentSectionsText(input.rawSections);
  if (sectionsText.length > 0) {
    const result = resolve(findPhraseSignal(sectionsText), findDateSignal(sectionsText, now), 'sections');
    if (result) return result;
  }

  // 3) título+descrição: frases com proximidade, depois keywords fracas.
  const headText = normalizeText(`${input.title ?? ''} ${input.description ?? ''}`);
  if (headText.length > 0) {
    const result = resolve(findPhraseSignal(headText), findDateSignal(headText, now), 'title+description');
    if (result) return result;

    const weak = findWeakSignal(headText);
    if (weak) {
      return { status: weak.status, confidence: 'low', matched: weak.matched, sourceField: 'title+description' };
    }
  }

  return { status: ProgramStatus.UNKNOWN, confidence: 'none', matched: [], sourceField: 'none' };
}
