/**
 * Worker de Ingestão - Diário da República
 *
 * Backstop legal:
 * - pesquisa por múltiplos termos no DRE;
 * - descobre candidatos com o pipeline canónico;
 * - persiste com deduplicação por hash/url.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { ProgramType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { normalizeText, WorkerLogger } from '../lib/worker-utils';
import { CANONICAL_SOURCES } from './canonical-sources';
import {
  discoverProgramsFromUrl,
  persistDiscoveredProgram,
  type DiscoveredProgramCandidate,
  type WorkerRunResult,
  type WorkerRunStats,
} from './discovery-engine';

const logger = new WorkerLogger('worker:diario-republica');
const source = CANONICAL_SOURCES['diario-republica'];

const SEARCH_TERMS = [
  'eficiência energética habitação',
  'pobreza energética',
  'regulamento municipal eficiência',
  'fundo eficiência energética',
  'isolamento térmico habitação',
  'reabilitação urbana energia',
] as const;

const SEARCH_URL_PATTERNS = [
  'https://dre.pt/web/guest/pesquisa/-/search?q={q}&perPage=50&sort=whenSearchable',
  'https://dre.pt/web/guest/pesquisa/-/search?q={q}&fqs={q}&filterAction=TRUE&perPage=100&sort=whenSearchable&sortOrder=DESC',
  'https://dre.pt/pesquisa/-/search?q={q}&perPage=50&sort=whenSearchable',
  'https://dre.pt/pesquisa/-/search?query={q}&fqs={q}&filterAction=TRUE&perPage=100&sort=whenSearchable&sortOrder=DESC',
  'https://diariodarepublica.pt/pesquisa/-/search?q={q}&perPage=50&sort=whenSearchable',
] as const;

const EXTRA_KEYWORDS = [
  ...source.keywords,
  ...SEARCH_TERMS,
  'decreto-lei',
  'portaria',
  'regulamento',
  'aviso',
  'deliberação',
  'despacho',
] as const;

const NORMALIZED_KEYWORDS = Array.from(new Set(EXTRA_KEYWORDS.map((keyword) => normalizeText(keyword))));
const ACTION_KEYWORDS = [
  'candidatura',
  'candidaturas',
  'candidatar',
  'apoio',
  'apoios',
  'incentivo',
  'incentivos',
  'programa',
  'programas',
  'aviso',
  'avisos',
  'concurso',
  'beneficiario',
  'beneficiarios',
  'submissao',
  'submeter',
  'formulario',
] as const;

const TOPIC_KEYWORDS = [
  'eficiencia',
  'energetica',
  'habitacao',
  'reabilitacao',
  'isolamento',
  'vale eficiencia',
  'fundo ambiental',
  'energia',
] as const;
const BLOCKED_TITLE_MARKERS = [
  'mapa do site',
  'politica de privacidade',
  'acessibilidade',
  'cookies',
  'contactos',
  'rss',
] as const;

const MUNICIPAL_PATTERNS = [
  /\bcamara municipal (?:de|da|do)\s+([a-z0-9\s\-]{3,80})/i,
  /\bmunicipio (?:de|da|do)\s+([a-z0-9\s\-]{3,80})/i,
  /\bassembleia municipal (?:de|da|do)\s+([a-z0-9\s\-]{3,80})/i,
] as const;

const MAX_CANDIDATES = 250;
const REQUEST_DELAY_MS = 900;
const MAX_DETAIL_LINKS_PER_QUERY = 40;

const DRE_DETAIL_URL_PATTERNS = [
  /https?:\/\/(?:www\.)?(?:dre|diariodarepublica)\.pt\/[^\s"'<>)]*\/search\/\d+\/details\/(?:normal|maximized)[^\s"'<>)]*/gi,
  /\/[^\s"'<>)]*\/search\/\d+\/details\/(?:normal|maximized)[^\s"'<>)]*/gi,
] as const;

const DRE_API_ENDPOINTS = [
  'https://data.dre.pt/api/v1/act/search',
  'https://dre.pt/api/v1/act/search',
] as const;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildSearchUrls(terms: readonly string[]): string[] {
  const urls = new Set<string>();

  for (const term of terms) {
    const encoded = encodeURIComponent(term);
    for (const pattern of SEARCH_URL_PATTERNS) {
      urls.add(pattern.replace('{q}', encoded));
    }
  }

  return Array.from(urls);
}

function isOfficialDreHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host === 'dre.pt' ||
      host.endsWith('.dre.pt') ||
      host === 'diariodarepublica.pt' ||
      host.endsWith('.diariodarepublica.pt')
    );
  } catch {
    return false;
  }
}

function isLikelyDocumentCandidate(candidate: DiscoveredProgramCandidate): boolean {
  if (!isOfficialDreHost(candidate.url)) return false;

  const normalizedTitle = normalizeText(candidate.title);
  if (!normalizedTitle || normalizedTitle.length < 12) return false;
  if (BLOCKED_TITLE_MARKERS.some((marker) => normalizedTitle.includes(marker))) return false;

  const searchableText = normalizeText(
    `${candidate.title} ${candidate.description ?? ''} ${candidate.url}`,
  );
  const path = (() => {
    try {
      return new URL(candidate.url).pathname.toLowerCase();
    } catch {
      return '';
    }
  })();
  const isDetailLink = /\/search\/\d+\/details\//.test(path) || /\.pdf$/i.test(path);
  const hasApplicationIntent = ACTION_KEYWORDS.some((keyword) => searchableText.includes(normalizeText(keyword)));
  const hasTopic = TOPIC_KEYWORDS.some((keyword) => searchableText.includes(normalizeText(keyword)));

  if (!hasApplicationIntent) return false;
  return hasTopic || isDetailLink || NORMALIZED_KEYWORDS.some((keyword) => searchableText.includes(keyword));
}

function cleanMunicipalityLabel(raw: string): string {
  return normalizeText(raw)
    .replace(/\b(concelho|distrito|freguesia)\b.*$/g, '')
    .replace(/[.,;:()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveMunicipalityFromText(
  text: string,
  knownMunicipalities: Map<string, string>,
): string | null {
  const normalized = normalizeText(text);

  for (const pattern of MUNICIPAL_PATTERNS) {
    const match = normalized.match(pattern);
    if (!match?.[1]) continue;

    const cleaned = cleanMunicipalityLabel(match[1]);
    if (!cleaned) continue;

    const exact = knownMunicipalities.get(cleaned);
    if (exact) return exact;

    for (const [normalizedName, officialName] of knownMunicipalities.entries()) {
      if (cleaned.startsWith(`${normalizedName} `) || normalizedName.startsWith(`${cleaned} `)) {
        return officialName;
      }
    }
  }

  return null;
}

async function loadKnownMunicipalities(): Promise<Map<string, string>> {
  const concelhos = await prisma.concelho.findMany({
    select: { name: true },
    orderBy: { name: 'asc' },
  });

  const map = new Map<string, string>();
  for (const concelho of concelhos) {
    map.set(normalizeText(concelho.name), concelho.name);
  }
  return map;
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const response = await axios.get<string>(url, {
      timeout: 30000,
      maxRedirects: 5,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; PortalCasaEficienteBot/1.0; +https://portalcasaeficiente.pt)',
        Accept: 'text/html,application/xhtml+xml,application/xml,text/plain;q=0.9,*/*;q=0.8',
      },
    });

    return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
  } catch (error) {
    logger.warn('Falha ao obter HTML DRE', {
      url,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
    return null;
  }
}

function extractDreDetailUrlsFromHtml(html: string, baseUrl: string): string[] {
  const urls = new Set<string>();

  for (const pattern of DRE_DETAIL_URL_PATTERNS) {
    const matches = html.match(pattern) ?? [];
    for (const match of matches) {
      try {
        const absoluteUrl = new URL(match, baseUrl).toString();
        if (isOfficialDreHost(absoluteUrl)) {
          urls.add(absoluteUrl);
        }
      } catch {
        // ignora
      }
    }
  }

  return Array.from(urls);
}

async function fetchDreDetailCandidate(url: string): Promise<DiscoveredProgramCandidate | null> {
  const html = await fetchHtml(url);
  if (!html) return null;

  const $ = cheerio.load(html);
  const title =
    $('h1').first().text().trim() ||
    $('h2').first().text().trim() ||
    $('meta[property="og:title"]').attr('content')?.trim() ||
    $('title').first().text().trim();

  if (!title || title.length < 8) return null;

  const description =
    $('meta[name="description"]').attr('content')?.trim() ||
    $('main p').first().text().trim() ||
    $('article p').first().text().trim() ||
    undefined;

  return {
    title,
    url,
    description,
  };
}

function getNestedStringValues(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => getNestedStringValues(item));
  }
  return Object.values(value).flatMap((item) => getNestedStringValues(item));
}

function findStringByHint(record: Record<string, unknown>, hints: readonly string[]): string | undefined {
  const normalizedHints = hints.map((hint) => normalizeText(hint));
  const entries = Object.entries(record);

  for (const [key, value] of entries) {
    if (typeof value !== 'string') continue;
    const normalizedKey = normalizeText(key);
    if (normalizedHints.some((hint) => normalizedKey.includes(hint))) {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }

  for (const value of Object.values(record)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    const nested = findStringByHint(value as Record<string, unknown>, hints);
    if (nested) return nested;
  }

  return undefined;
}

function normalizePotentialUrl(value?: string): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const absolute = new URL(trimmed, 'https://dre.pt').toString();
    return isOfficialDreHost(absolute) ? absolute : null;
  } catch {
    return null;
  }
}

function extractApiItems(payload: unknown): Record<string, unknown>[] {
  if (!payload) return [];
  if (Array.isArray(payload)) {
    return payload.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object');
  }
  if (typeof payload !== 'object') return [];

  const root = payload as Record<string, unknown>;
  const arrayKeys = ['items', 'results', 'content', 'data', 'docs', 'list'];

  for (const key of arrayKeys) {
    const candidate = root[key];
    if (Array.isArray(candidate)) {
      return candidate.filter(
        (item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object',
      );
    }
  }

  const discoveredArrays: Record<string, unknown>[][] = [];
  const visit = (value: unknown): void => {
    if (!value || typeof value !== 'object') return;

    if (Array.isArray(value)) {
      const objectItems = value.filter(
        (item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object',
      );
      if (objectItems.length > 0) {
        discoveredArrays.push(objectItems);
      }
      return;
    }

    for (const nested of Object.values(value)) {
      visit(nested);
    }
  };

  visit(root);
  discoveredArrays.sort((a, b) => b.length - a.length);
  if (discoveredArrays.length > 0) {
    return discoveredArrays[0];
  }

  return [];
}

function parseJsonFromString(raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  }

  // Algumas respostas vêm com texto extra antes/depois do JSON
  const firstBrace = trimmed.indexOf('{');
  const firstBracket = trimmed.indexOf('[');
  const firstIndex =
    firstBrace === -1
      ? firstBracket
      : firstBracket === -1
        ? firstBrace
        : Math.min(firstBrace, firstBracket);

  const lastBrace = trimmed.lastIndexOf('}');
  const lastBracket = trimmed.lastIndexOf(']');
  const lastIndex = Math.max(lastBrace, lastBracket);

  if (firstIndex >= 0 && lastIndex > firstIndex) {
    const slice = trimmed.slice(firstIndex, lastIndex + 1);
    try {
      return JSON.parse(slice);
    } catch {
      return null;
    }
  }

  return null;
}

function apiItemToCandidate(item: Record<string, unknown>): DiscoveredProgramCandidate | null {
  const title =
    findStringByHint(item, ['title', 'titulo', 'epigrafe', 'epigraph']) ||
    getNestedStringValues(item).find((value) => value.length > 16);
  const urlRaw =
    findStringByHint(item, ['url', 'link', 'href', 'pdf', 'portal']) ||
    getNestedStringValues(item).find((value) => /^https?:\/\//i.test(value));
  const fallbackId =
    findStringByHint(item, ['id', 'actid', 'documentid', 'diplomaid']) ||
    getNestedStringValues(item).find((value) => /^\d{6,}$/.test(value));
  const url =
    normalizePotentialUrl(urlRaw) ||
    normalizePotentialUrl(
      fallbackId ? `https://dre.pt/web/guest/pesquisa/-/search/${fallbackId}/details/maximized` : '',
    );

  if (!title || !url) return null;

  const description =
    findStringByHint(item, ['summary', 'resumo', 'description', 'descricao', 'descrição']) ||
    undefined;

  return { title, url, description, metadata: item };
}

type DreApiSearchOutcome = {
  candidates: DiscoveredProgramCandidate[];
  endpointsQueried: number;
  endpointsReturnedHtml: number;
  endpointsWithItems: number;
};

async function searchDreViaOfficialApi(term: string): Promise<DreApiSearchOutcome> {
  const candidatesByKey = new Map<string, DiscoveredProgramCandidate>();
  const debugApi = process.env.DRE_DEBUG_API === '1';
  let endpointsQueried = 0;
  let endpointsReturnedHtml = 0;
  let endpointsWithItems = 0;

  for (const endpoint of DRE_API_ENDPOINTS) {
    try {
      endpointsQueried += 1;
      const response = await axios.get(endpoint, {
        timeout: 30000,
        params: {
          query: term,
          itemsPerPage: 50,
          page: 1,
          sort: 'publicationDate,desc',
        },
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; PortalCasaEficienteBot/1.0; +https://portalcasaeficiente.pt)',
          Accept: 'application/json',
        },
      });

      const contentType =
        typeof response.headers?.['content-type'] === 'string'
          ? response.headers['content-type']
          : 'unknown';
      if (contentType.toLowerCase().includes('text/html')) {
        endpointsReturnedHtml += 1;
      }

      const rawPreview =
        typeof response.data === 'string'
          ? response.data.slice(0, 220).replace(/\s+/g, ' ').trim()
          : '';

      const parsedPayload =
        typeof response.data === 'string' ? parseJsonFromString(response.data) : response.data;

      const items = extractApiItems(parsedPayload);
      if (items.length > 0) {
        endpointsWithItems += 1;
      }
      if (debugApi) {
        logger.info('Debug API DRE', {
          endpoint,
          term,
          responseType: Array.isArray(response.data) ? 'array' : typeof response.data,
          contentType,
          rawPreview,
          itemsFound: items.length,
          sampleKeys: items[0] ? Object.keys(items[0]).slice(0, 20) : [],
        });
      }
      for (const item of items) {
        const candidate = apiItemToCandidate(item);
        if (!candidate) continue;
        if (!isLikelyDocumentCandidate(candidate)) continue;

        const key = `${candidate.url}::${normalizeText(candidate.title)}`;
        if (!candidatesByKey.has(key)) {
          candidatesByKey.set(key, candidate);
        }
      }

      // Se a API respondeu HTML/texto, tenta extrair links de detalhe diretamente do conteúdo.
      if (typeof response.data === 'string' && items.length === 0) {
        const detailUrls = extractDreDetailUrlsFromHtml(response.data, endpoint).slice(
          0,
          MAX_DETAIL_LINKS_PER_QUERY,
        );

        for (const detailUrl of detailUrls) {
          const detailCandidate = await fetchDreDetailCandidate(detailUrl);
          if (!detailCandidate) continue;
          if (!isLikelyDocumentCandidate(detailCandidate)) continue;

          const key = `${detailCandidate.url}::${normalizeText(detailCandidate.title)}`;
          if (!candidatesByKey.has(key)) {
            candidatesByKey.set(key, detailCandidate);
          }
        }
      }
    } catch (error) {
      logger.warn('Falha ao consultar API oficial DRE', {
        endpoint,
        term,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  return {
    candidates: Array.from(candidatesByKey.values()),
    endpointsQueried,
    endpointsReturnedHtml,
    endpointsWithItems,
  };
}

async function searchDRE(term: string): Promise<{
  candidates: DiscoveredProgramCandidate[];
  apiProbe: Omit<DreApiSearchOutcome, 'candidates'>;
}> {
  logger.info('Pesquisa DRE iniciada', { term });
  const seedUrls = buildSearchUrls([term]);
  const dedup = new Map<string, DiscoveredProgramCandidate>();

  const apiOutcome = await searchDreViaOfficialApi(term);
  for (const candidate of apiOutcome.candidates) {
    const key = `${candidate.url}::${normalizeText(candidate.title)}`;
    if (!dedup.has(key)) {
      dedup.set(key, candidate);
    }
  }

  for (const url of seedUrls) {
    const discovered = await discoverProgramsFromUrl({
      url,
      keywords: EXTRA_KEYWORDS,
      logger,
      allowedHosts: source.allowedHosts,
      requireApplicationIntent: false,
    });

    for (const candidate of discovered) {
      if (!isLikelyDocumentCandidate(candidate)) continue;
      const key = `${candidate.url}::${normalizeText(candidate.title)}`;
      if (!dedup.has(key)) {
        dedup.set(key, candidate);
      }
    }

    const searchHtml = await fetchHtml(url);
    if (searchHtml) {
      const detailUrls = extractDreDetailUrlsFromHtml(searchHtml, url).slice(0, MAX_DETAIL_LINKS_PER_QUERY);
      for (const detailUrl of detailUrls) {
        const detailCandidate = await fetchDreDetailCandidate(detailUrl);
        if (!detailCandidate) continue;
        if (!isLikelyDocumentCandidate(detailCandidate)) continue;

        const key = `${detailCandidate.url}::${normalizeText(detailCandidate.title)}`;
        if (!dedup.has(key)) {
          dedup.set(key, detailCandidate);
        }
      }
    }

    await delay(REQUEST_DELAY_MS);
  }

  const output = Array.from(dedup.values());
  logger.info('Pesquisa DRE concluída', {
    term,
    urls: seedUrls.length,
    found: output.length,
    apiProbe: {
      endpointsQueried: apiOutcome.endpointsQueried,
      endpointsReturnedHtml: apiOutcome.endpointsReturnedHtml,
      endpointsWithItems: apiOutcome.endpointsWithItems,
    },
  });
  return {
    candidates: output,
    apiProbe: {
      endpointsQueried: apiOutcome.endpointsQueried,
      endpointsReturnedHtml: apiOutcome.endpointsReturnedHtml,
      endpointsWithItems: apiOutcome.endpointsWithItems,
    },
  };
}

async function processDocument(
  candidate: DiscoveredProgramCandidate,
  knownMunicipalities: Map<string, string>,
): Promise<'new' | 'updated' | 'skipped'> {
  const municipalityName = resolveMunicipalityFromText(
    `${candidate.title} ${candidate.description ?? ''}`,
    knownMunicipalities,
  );

  const normalizedCandidate = municipalityName
    ? { ...candidate, municipalityName }
    : candidate;

  return persistDiscoveredProgram({
    source,
    candidate: normalizedCandidate,
    logger,
    overrideProgramType: municipalityName ? ProgramType.MUNICIPAL : ProgramType.NATIONAL,
    overrideEntity: municipalityName ? `Câmara Municipal de ${municipalityName}` : source.entity,
  });
}

async function ingest(): Promise<WorkerRunResult> {
  const startedAt = Date.now();
  const stats: WorkerRunStats = {
    found: 0,
    new: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    duration: '0.00',
  };
  const errors: Array<{ title?: string; url?: string; error: string }> = [];
  const knownMunicipalities = await loadKnownMunicipalities();
  let totalApiEndpointsQueried = 0;
  let totalApiEndpointsReturnedHtml = 0;
  let totalApiEndpointsWithItems = 0;

  logger.info('Iniciando ingestão Diário da República', {
    searchTerms: SEARCH_TERMS.length,
  });

  const dedup = new Map<string, DiscoveredProgramCandidate>();

  for (const term of SEARCH_TERMS) {
    try {
      const { candidates: discovered, apiProbe } = await searchDRE(term);
      totalApiEndpointsQueried += apiProbe.endpointsQueried;
      totalApiEndpointsReturnedHtml += apiProbe.endpointsReturnedHtml;
      totalApiEndpointsWithItems += apiProbe.endpointsWithItems;

      for (const candidate of discovered) {
        const key = `${candidate.url}::${normalizeText(candidate.title)}`;
        if (!dedup.has(key)) {
          dedup.set(key, candidate);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      errors.push({
        title: term,
        error: message,
      });
      logger.warn('Falha numa pesquisa DRE', { term, error: message });
    }
  }

  const candidates = Array.from(dedup.values()).slice(0, MAX_CANDIDATES);
  stats.found = candidates.length;

  for (const candidate of candidates) {
    try {
      const outcome = await processDocument(candidate, knownMunicipalities);
      if (outcome === 'new') stats.new += 1;
      if (outcome === 'updated') stats.updated += 1;
      if (outcome === 'skipped') stats.skipped += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      errors.push({
        title: candidate.title,
        url: candidate.url,
        error: message,
      });
      logger.error('Erro ao persistir candidato DRE', {
        title: candidate.title,
        url: candidate.url,
        error: message,
      });
    }
    await delay(120);
  }

  stats.errors = errors.length;
  stats.duration = ((Date.now() - startedAt) / 1000).toFixed(2);

  if (
    stats.found === 0 &&
    totalApiEndpointsQueried > 0 &&
    totalApiEndpointsReturnedHtml === totalApiEndpointsQueried &&
    totalApiEndpointsWithItems === 0
  ) {
    errors.push({
      title: 'DRE API',
      error:
        'Endpoints de API DRE devolveram HTML em vez de JSON. Possível proteção anti-bot/bloqueio de acesso programático.',
    });
    stats.errors = errors.length;
    logger.warn('DRE sem resultados devido a resposta HTML nos endpoints de API', {
      endpointsQueried: totalApiEndpointsQueried,
      endpointsReturnedHtml: totalApiEndpointsReturnedHtml,
    });
  }

  logger.info('Ingestão Diário da República concluída', { stats });

  return {
    success: true,
    stats,
    errors,
  };
}

if (require.main === module) {
  ingest()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
      process.exitCode = 0;
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { ingest, searchDRE, processDocument };
