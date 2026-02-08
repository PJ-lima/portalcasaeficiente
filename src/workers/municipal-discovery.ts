import axios from 'axios';
import { ProgramType } from '@prisma/client';
import * as cheerio from 'cheerio';
import { prisma } from '../lib/prisma';
import { normalizeText, WorkerLogger } from '../lib/worker-utils';
import {
  CANONICAL_SOURCES,
  MUNICIPAL_DISCOVERY_PATHS,
  type CanonicalSourceDefinition,
} from './canonical-sources';
import {
  discoverProgramsFromUrl,
  persistDiscoveredProgram,
  enrichCandidateWithDeepCrawl,
  type DiscoveredProgramCandidate,
  type WorkerRunResult,
  type WorkerRunStats,
} from './discovery-engine';

const logger = new WorkerLogger('worker:municipal-discovery');
const source = CANONICAL_SOURCES['portal-autarquico-dgal'];

const DEFAULT_MUNICIPAL_LIMIT = 308;
const DEFAULT_REQUEST_DELAY_MS = 500;
const DEFAULT_PATH_LIMIT = MUNICIPAL_DISCOVERY_PATHS.length;
const MUNICIPAL_WEBSITES_DATASET_URL =
  process.env.MUNICIPAL_WEBSITES_DATASET_URL ||
  'https://dados.gov.pt/pt/datasets/r/03c535e3-3c1b-47b7-8d6f-7abc9f5ef75a';
const MUNICIPAL_WEBSITES_RESOURCE_URLS = (
  process.env.MUNICIPAL_WEBSITES_RESOURCE_URLS ||
  [
    MUNICIPAL_WEBSITES_DATASET_URL,
    'https://dados.gov.pt/s/resources/municipios-portugueses-websites-e-historico-de-versoes-no-arquivo-pt/20251029-144102/listagem-dos-municipios-portugueses-websites-e-historico-de-versoes-no-arquivo-pt-revisao-2025.csv',
  ].join(',')
)
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);
const MUNICIPAL_WEBSITES_UDATA_DATASET_URL =
  process.env.MUNICIPAL_WEBSITES_UDATA_DATASET_URL ||
  'https://dados.gov.pt/api/1/datasets/municipios-portugueses-websites-e-historico-de-versoes-no-arquivo-pt/';

interface MunicipalitySite {
  concelhoId: string;
  name: string;
  district: string;
  website: string;
}

type ConcelhoLookup = {
  id: string;
  name: string;
  district: string;
};

type ParsedMunicipalitySites = {
  sites: Map<string, MunicipalitySite>;
  headerRowIndex: number;
  headerRow: string[];
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeMunicipalityLabel(label: string): string {
  return normalizeText(label)
    .replace(/\bcamara municipal (de|da|do)\s+/g, '')
    .replace(/\bmunicipio (de|da|do)\s+/g, '')
    .replace(/\bc\.m\.\s+/g, '')
    .trim();
}

function toAbsoluteUrl(href: string, baseUrl: string): string | null {
  try {
    const absolute = new URL(href, baseUrl).toString();
    return /^https?:\/\//i.test(absolute) ? absolute : null;
  } catch {
    return null;
  }
}

function shouldPreferUrl(nextUrl: string, currentUrl?: string): boolean {
  if (!currentUrl) return true;

  const nextHost = new URL(nextUrl).hostname;
  const currentHost = new URL(currentUrl).hostname;
  const portalHint = 'portalautarquico';

  if (!nextHost.includes(portalHint) && currentHost.includes(portalHint)) return true;
  if (nextHost.length < currentHost.length) return true;

  return false;
}

function normalizeOfficialSeedUrl(url: string): string {
  return url.replace(
    '://www.portalautarquico.dgal.gov.pt',
    '://portalautarquico.dgal.gov.pt',
  );
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseCsvTable(csv: string): string[][] {
  const normalized = csv.replace(/^\uFEFF/, '');
  const lines = normalized
    .split(/\r\n|\n|\r/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) return [];

  const delimiterCandidates: string[] = [';', '\t', ','];
  const sample = lines.slice(0, 5);
  const delimiter = delimiterCandidates
    .map((candidate) => ({
      candidate,
      score: sample.reduce(
        (acc, line) => acc + Math.max(0, line.split(candidate).length - 1),
        0,
      ),
    }))
    .sort((a, b) => b.score - a.score)[0]?.candidate ?? ';';

  return lines.map((line) => parseCsvLine(line, delimiter));
}

function normalizeWebsiteCandidate(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const prefixed =
    /^https?:\/\//i.test(trimmed) || /^ftp:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed.replace(/^\/+/, '')}`;

  try {
    const url = new URL(prefixed);
    if (!/^https?:$/i.test(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function isMunicipalityHeaderCell(cell: string): boolean {
  return (
    cell.includes('municipio') ||
    cell.includes('município') ||
    cell.includes('concelho') ||
    cell.includes('autarquia')
  );
}

function isWebsiteHeaderCell(cell: string): boolean {
  return (
    cell.includes('website') ||
    cell.includes('site') ||
    cell.includes('url') ||
    cell.includes('endereco') ||
    cell.includes('endereço') ||
    cell.includes('internet') ||
    cell.includes('sítio web') ||
    cell.includes('sitio web')
  );
}

function resolveHeaderRow(rows: string[][]): {
  headerRowIndex: number;
  municipalityIndex: number;
  websiteIndex: number;
} | null {
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex].map((cell) => normalizeText(cell));
    const municipalityIndex = row.findIndex((cell) => isMunicipalityHeaderCell(cell));
    const websiteIndex = row.findIndex((cell) => isWebsiteHeaderCell(cell));

    if (municipalityIndex >= 0 && websiteIndex >= 0) {
      return { headerRowIndex: rowIndex, municipalityIndex, websiteIndex };
    }
  }

  return null;
}

function parseMunicipalitySitesFromRows(
  rows: string[][],
  byName: Map<string, ConcelhoLookup>,
): ParsedMunicipalitySites | null {
  if (rows.length < 2) return null;

  const headerInfo = resolveHeaderRow(rows);
  if (!headerInfo) return null;

  const headerRow = rows[headerInfo.headerRowIndex] ?? [];
  const discovered = new Map<string, MunicipalitySite>();

  for (const row of rows.slice(headerInfo.headerRowIndex + 1)) {
    const municipalityLabel = row[headerInfo.municipalityIndex] ?? '';
    const websiteRaw = row[headerInfo.websiteIndex] ?? '';
    const normalizedLabel = normalizeMunicipalityLabel(municipalityLabel);
    if (!normalizedLabel) continue;

    const concelho = byName.get(normalizedLabel);
    if (!concelho) continue;

    const website = normalizeWebsiteCandidate(websiteRaw);
    if (!website) continue;

    const existing = discovered.get(concelho.id);
    if (!shouldPreferUrl(website, existing?.website)) continue;

    discovered.set(concelho.id, {
      concelhoId: concelho.id,
      name: concelho.name,
      district: concelho.district,
      website,
    });
  }

  return {
    sites: discovered,
    headerRowIndex: headerInfo.headerRowIndex,
    headerRow,
  };
}

async function fetchCsvLikeResource(url: string): Promise<string | null> {
  try {
    const response = await axios.get<string>(url, {
      timeout: 45000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; PortalCasaEficienteBot/1.0; +https://portalcasaeficiente.pt)',
        Accept: 'text/csv,text/plain,text/tab-separated-values;q=0.9,*/*;q=0.8',
      },
      responseType: 'text',
    });
    return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
  } catch {
    return null;
  }
}

function isLikelyCsvResource(resourceUrl: string, format?: string): boolean {
  const normalizedUrl = resourceUrl.toLowerCase();
  const normalizedFormat = normalizeText(format ?? '');

  if (normalizedUrl.endsWith('.csv') || normalizedUrl.endsWith('.tsv') || normalizedUrl.includes('/r/')) {
    return true;
  }

  return (
    normalizedFormat.includes('csv') ||
    normalizedFormat.includes('tsv') ||
    normalizedFormat.includes('text')
  );
}

function extractUdataResourceUrls(payload: unknown): string[] {
  const urls: string[] = [];

  const visit = (value: unknown): void => {
    if (!value || typeof value !== 'object') return;

    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }

    const record = value as Record<string, unknown>;
    for (const [key, nested] of Object.entries(record)) {
      if (typeof nested === 'string' && /^https?:\/\//i.test(nested)) {
        const normalizedKey = normalizeText(key);
        if (
          normalizedKey.includes('url') ||
          normalizedKey.includes('download') ||
          normalizedKey.includes('latest') ||
          normalizedKey.includes('resource')
        ) {
          urls.push(nested);
        }
      }
      visit(nested);
    }
  };

  visit(payload);
  return Array.from(new Set(urls));
}

async function fetchMunicipalitySitesFromUdataCatalogue(
  byName: Map<string, ConcelhoLookup>,
): Promise<Map<string, MunicipalitySite>> {
  try {
    const response = await axios.get(MUNICIPAL_WEBSITES_UDATA_DATASET_URL, {
      timeout: 45000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; PortalCasaEficienteBot/1.0; +https://portalcasaeficiente.pt)',
        Accept: 'application/json',
      },
    });

    const resourceUrls = extractUdataResourceUrls(response.data).filter((url) =>
      isLikelyCsvResource(url),
    );

    for (const resourceUrl of resourceUrls) {
      const csv = await fetchCsvLikeResource(resourceUrl);
      if (!csv) continue;

      const parsed = parseMunicipalitySitesFromRows(parseCsvTable(csv), byName);
      if (!parsed || parsed.sites.size === 0) continue;

      logger.info('Fallback municipal via catálogo UData carregado', {
        datasetUrl: MUNICIPAL_WEBSITES_UDATA_DATASET_URL,
        resourceUrl,
        headerRowIndex: parsed.headerRowIndex,
        header: parsed.headerRow,
        sitesDescobertos: parsed.sites.size,
      });

      return parsed.sites;
    }
  } catch (error) {
    logger.warn('Falhou fallback municipal via catálogo UData', {
      url: MUNICIPAL_WEBSITES_UDATA_DATASET_URL,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }

  return new Map();
}

async function fetchMunicipalitySitesFromOpenData(
  byName: Map<string, ConcelhoLookup>,
): Promise<Map<string, MunicipalitySite>> {
  for (const datasetUrl of MUNICIPAL_WEBSITES_RESOURCE_URLS) {
    const csv = await fetchCsvLikeResource(datasetUrl);
    if (!csv) continue;

    const rows = parseCsvTable(csv);
    const parsed = parseMunicipalitySitesFromRows(rows, byName);

    if (!parsed) {
      logger.warn('Dataset de websites municipais sem colunas esperadas', {
        url: datasetUrl,
        rows: rows.length,
        header: rows[0] ?? [],
      });
      continue;
    }

    logger.info('Fallback municipal por dados.gov carregado', {
      url: datasetUrl,
      headerRowIndex: parsed.headerRowIndex,
      header: parsed.headerRow,
      sitesDescobertos: parsed.sites.size,
    });

    if (parsed.sites.size > 0) {
      return parsed.sites;
    }
  }

  return new Map();
}

async function fetchMunicipalitySitesFromOfficialIndex(
  seed: CanonicalSourceDefinition,
): Promise<Map<string, MunicipalitySite>> {
  const concelhos = await prisma.concelho.findMany({
    include: {
      distrito: {
        select: { name: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  const byName = new Map<string, ConcelhoLookup>();
  for (const concelho of concelhos) {
    byName.set(normalizeText(concelho.name), {
      id: concelho.id,
      name: concelho.name,
      district: concelho.distrito.name,
    });
  }

  const siteMap = new Map<string, MunicipalitySite>();
  const seedUrls = Array.from(new Set(seed.seedUrls.map(normalizeOfficialSeedUrl)));

  for (const seedUrl of seedUrls) {
    try {
      const response = await axios.get<string>(seedUrl, {
        timeout: 30000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; PortalCasaEficienteBot/1.0; +https://portalcasaeficiente.pt)',
          Accept: 'text/html,application/xhtml+xml,application/xml',
        },
      });

      const $ = cheerio.load(response.data);

      $('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        if (!href) return;

        const absoluteUrl = toAbsoluteUrl(href, seedUrl);
        if (!absoluteUrl) return;

        const rawLabelCandidates = [
          $(element).text(),
          $(element).attr('title'),
          $(element).attr('aria-label'),
          $(element).attr('data-original-title'),
        ];
        const normalizedLabel = rawLabelCandidates
          .map((label) => normalizeMunicipalityLabel(label ?? ''))
          .find((label) => Boolean(label));

        if (!normalizedLabel) return;

        const concelho = byName.get(normalizedLabel);
        if (!concelho) return;

        const existing = siteMap.get(concelho.id);
        if (!shouldPreferUrl(absoluteUrl, existing?.website)) return;

        siteMap.set(concelho.id, {
          concelhoId: concelho.id,
          name: concelho.name,
          district: concelho.district,
          website: absoluteUrl,
        });
      });
    } catch (error) {
      logger.warn('Falhou leitura do índice oficial DGAL', {
        url: seedUrl,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  try {
    const fallbackSites = await fetchMunicipalitySitesFromOpenData(byName);
    const catalogueFallbackSites =
      fallbackSites.size > 0
        ? new Map<string, MunicipalitySite>()
        : await fetchMunicipalitySitesFromUdataCatalogue(byName);

    const mergedFallback = new Map<string, MunicipalitySite>([
      ...fallbackSites.entries(),
      ...catalogueFallbackSites.entries(),
    ]);

    for (const [concelhoId, fallbackSite] of mergedFallback.entries()) {
      const existing = siteMap.get(concelhoId);
      if (!shouldPreferUrl(fallbackSite.website, existing?.website)) continue;
      siteMap.set(concelhoId, fallbackSite);
    }
  } catch (error) {
    logger.warn('Falhou fallback de websites municipais via dados.gov', {
      url: MUNICIPAL_WEBSITES_DATASET_URL,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }

  logger.info('Índice municipal carregado', {
    totalConcelhos: concelhos.length,
    sitesDescobertos: siteMap.size,
  });

  return siteMap;
}

function buildMunicipalUrls(baseWebsite: string, pathLimit: number): string[] {
  const urls = new Set<string>();

  urls.add(baseWebsite);

  for (const path of MUNICIPAL_DISCOVERY_PATHS.slice(0, pathLimit)) {
    try {
      urls.add(new URL(path, baseWebsite).toString());
    } catch {
      // ignora URLs inválidas
    }
  }

  return Array.from(urls);
}

async function scanMunicipalityPrograms(params: {
  site: MunicipalitySite;
  pathLimit: number;
}): Promise<DiscoveredProgramCandidate[]> {
  const candidatesByUrl = new Map<string, DiscoveredProgramCandidate>();
  const urlsToScan = buildMunicipalUrls(params.site.website, params.pathLimit);

  for (const url of urlsToScan) {
    const discovered = await discoverProgramsFromUrl({
      url,
      keywords: source.keywords,
      logger,
      municipalityName: params.site.name,
      districtName: params.site.district,
      requireApplicationIntent: true,
    });

    for (const candidate of discovered) {
      const key = `${candidate.url}::${normalizeText(candidate.title)}`;
      if (!candidatesByUrl.has(key)) {
        candidatesByUrl.set(key, candidate);
      }
    }
  }

  return Array.from(candidatesByUrl.values());
}

export async function ingestMunicipalDiscovery(): Promise<
  WorkerRunResult & {
    municipalitiesCovered: number;
    municipalitiesDiscovered: number;
  }
> {
  const startedAt = Date.now();
  const municipalLimit = parsePositiveInt(
    process.env.MUNICIPAL_DISCOVERY_LIMIT,
    DEFAULT_MUNICIPAL_LIMIT,
  );
  const requestDelayMs = parsePositiveInt(
    process.env.MUNICIPAL_REQUEST_DELAY_MS,
    DEFAULT_REQUEST_DELAY_MS,
  );
  const pathLimit = parsePositiveInt(process.env.MUNICIPAL_SCAN_PATH_LIMIT, DEFAULT_PATH_LIMIT);

  const stats: WorkerRunStats = {
    found: 0,
    new: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    duration: '0.00',
  };

  const errors: Array<{ title?: string; url?: string; error: string }> = [];
  const sites = await fetchMunicipalitySitesFromOfficialIndex(source);
  const selectedSites = Array.from(sites.values()).slice(0, municipalLimit);

  logger.info('Início da descoberta municipal', {
    municipalLimit,
    pathLimit,
    requestDelayMs,
    sitesSelecionados: selectedSites.length,
  });

  for (const site of selectedSites) {
    try {
      const discovered = await scanMunicipalityPrograms({
        site,
        pathLimit,
      });

      stats.found += discovered.length;

      for (const candidate of discovered) {
        try {
          // Deep crawl enrichment
          const enriched = await enrichCandidateWithDeepCrawl(
            candidate,
            logger,
            { delayMs: requestDelayMs }
          );

          const outcome = await persistDiscoveredProgram({
            source,
            candidate: {
              ...enriched,
              municipalityName: site.name,
              districtName: site.district,
            },
            logger,
            overrideProgramType: ProgramType.MUNICIPAL,
            overrideEntity: `Câmara Municipal de ${site.name}`,
          });

          if (outcome === 'new') stats.new += 1;
          if (outcome === 'updated') stats.updated += 1;
          if (outcome === 'skipped') stats.skipped += 1;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Erro desconhecido';
          errors.push({ title: candidate.title, url: candidate.url, error: message });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      errors.push({ title: site.name, url: site.website, error: message });
      logger.error('Falha na varredura municipal', {
        municipality: site.name,
        website: site.website,
        error: message,
      });
    }

    await delay(requestDelayMs);
  }

  stats.errors = errors.length;
  stats.duration = ((Date.now() - startedAt) / 1000).toFixed(2);

  logger.info('Descoberta municipal concluída', {
    stats,
    municipalitiesCovered: selectedSites.length,
    municipalitiesDiscovered: sites.size,
  });

  return {
    success: true,
    stats,
    errors,
    municipalitiesCovered: selectedSites.length,
    municipalitiesDiscovered: sites.size,
  };
}

if (require.main === module) {
  ingestMunicipalDiscovery()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
      process.exitCode = 0;
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
