import axios from 'axios';
import { GeoLevel, ProgramStatus, type ProgramType } from '@prisma/client';
import * as cheerio from 'cheerio';
import { prisma } from '../lib/prisma';
import { slugify } from '../lib/utils';
import type { CanonicalSourceDefinition } from './canonical-sources';
import { calculateContentHash, normalizeText, WorkerLogger } from '../lib/worker-utils';
import { 
  crawlPageForDetails, 
  shouldBlockTitle, 
  isRelevantToEnergyEfficiency,
  type SupportProgramDetails,
  type SupportCategory 
} from './deep-crawler';

const USER_AGENT =
  'Mozilla/5.0 (compatible; PortalCasaEficienteBot/1.0; +https://portalcasaeficiente.pt)';

const MAX_PROGRAMS_PER_SOURCE = 250;

const LINK_CONTAINER_SELECTOR =
  'article, li, tr, section, .card, .entry, .result, .list-item, .news-item';

const APPLICATION_INTENT_KEYWORDS = [
  // PT
  'candidatura',
  'candidaturas',
  'candidatar',
  'aviso',
  'avisos',
  'concurso',
  'concursos',
  'beneficiario',
  'beneficiarios',
  'submissao',
  'submissões',
  'submeter',
  'inscricao',
  'inscrição',
  'regulamento',
  'formulario',
  'formulário',
  // EN
  'application',
  'apply',
  'submission',
  'submit',
  'registration',
  'register',
  'funding',
  'grant',
  'eligibility',
] as const;

const BLOCKED_DISCOVERY_MARKERS = [
  // PT
  'skip to content',
  'saltar para o conteudo principal',
  'saltar para o conteúdo principal',
  'politica de privacidade',
  'política de privacidade',
  'aviso de privacidade',
  'cookies',
  'mapa do site',
  'termos e condicoes',
  'termos e condições',
  'contactos',
  'contacte-nos',
  'canal de denuncias',
  'canal de denúncias',
  'rss',
  'login',
  'registar',
  'área reservada',
  'ver detalhes',
  'ver se sou elegivel',
  'guardar',
  // EN
  'privacy policy',
  'cookie policy',
  'terms and conditions',
  'contact us',
  'sitemap',
  'sign in',
  'sign up',
  'register',
  'view details',
  'save',
] as const;

export interface DiscoveredProgramCandidate {
  title: string;
  url: string;
  description?: string;
  municipalityName?: string;
  districtName?: string;
  metadata?: Record<string, unknown>;
  
  // Deep crawl enrichment fields
  category?: SupportCategory;
  howToApply?: string;
  applicationUrl?: string;
  requiredDocuments?: string[];
  beneficiaries?: string;
  eligibilityCriteria?: string;
  supportAmount?: string;
  deadline?: string;
  legislation?: string;
  faq?: string;
  entity?: string;
  rawSections?: Record<string, string>;
}

export interface WorkerRunStats {
  found: number;
  new: number;
  updated: number;
  skipped: number;
  errors: number;
  duration: string;
}

export interface WorkerRunResult {
  success: boolean;
  stats: WorkerRunStats;
  errors: Array<{ title?: string; url?: string; error: string }>;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeSpaces(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function toAbsoluteUrl(href: string, baseUrl: string): string | null {
  try {
    const absolute = new URL(href, baseUrl).toString();
    return /^https?:\/\//i.test(absolute) ? absolute : null;
  } catch {
    return null;
  }
}

function inferStatus(text: string): ProgramStatus {
  const normalized = normalizeText(text);

  if (/\b(aberto|abertas|abertura|em curso|submissoes abertas|submissões abertas)\b/.test(normalized)) {
    return ProgramStatus.OPEN;
  }

  if (/\b(encerrado|encerradas|fechado|terminado|expirado)\b/.test(normalized)) {
    return ProgramStatus.CLOSED;
  }

  if (/\b(breve|previsto|prevista|futuro|a abrir)\b/.test(normalized)) {
    return ProgramStatus.PLANNED;
  }

  return ProgramStatus.UNKNOWN;
}

function normalizeHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, '');
}

function matchesAllowedHost(url: string, allowedHosts?: readonly string[]): boolean {
  if (!allowedHosts || allowedHosts.length === 0) return true;

  try {
    const host = normalizeHost(new URL(url).hostname);
    const normalizedAllowlist = allowedHosts.map(normalizeHost);
    return normalizedAllowlist.some((allowedHost) => host === allowedHost || host.endsWith(`.${allowedHost}`));
  } catch {
    return false;
  }
}

function hasApplicationIntent(text: string): boolean {
  return APPLICATION_INTENT_KEYWORDS.some((keyword) => text.includes(normalizeText(keyword)));
}

function hasBlockedMarker(text: string): boolean {
  return BLOCKED_DISCOVERY_MARKERS.some((marker) => text.includes(normalizeText(marker)));
}

/**
 * Enriches a discovered candidate with detailed information from deep crawling
 */
export async function enrichCandidateWithDeepCrawl(
  candidate: DiscoveredProgramCandidate,
  logger: WorkerLogger,
  options?: {
    timeout?: number;
    delayMs?: number;
  }
): Promise<DiscoveredProgramCandidate> {
  try {
    const details = await crawlPageForDetails(candidate.url, logger, options);
    
    return {
      ...candidate,
      // Merge deep crawl results
      category: details.category ?? candidate.category,
      howToApply: details.howToApply,
      applicationUrl: details.applicationUrl,
      requiredDocuments: details.requiredDocuments,
      beneficiaries: details.beneficiaries,
      eligibilityCriteria: details.eligibilityCriteria,
      supportAmount: details.supportAmount,
      deadline: details.deadline,
      legislation: details.legislation,
      faq: details.faq,
      entity: details.entity ?? candidate.entity,
      rawSections: details.rawSections,
      // Update description if we got better content
      description: candidate.description || 
        (details.rawSections?.['O que é'] ?? details.rawSections?.['What is'] ?? candidate.description),
    };
  } catch (error) {
    logger.warn('Failed to enrich candidate with deep crawl', {
      title: candidate.title,
      url: candidate.url,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return candidate;
  }
}

function buildSlugBase(sourceId: string, title: string, municipalityName?: string): string {
  const parts = [sourceId, municipalityName, title].filter(Boolean).join(' ');
  return slugify(parts).slice(0, 120) || `programa-${Date.now()}`;
}

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let index = 2;

  while (true) {
    const existing = await prisma.program.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing) return slug;
    slug = `${baseSlug}-${index++}`;
  }
}

async function ensureGeography(params: {
  programId: string;
  level: GeoLevel;
  municipality?: string;
  district?: string;
}): Promise<void> {
  const existing = await prisma.programGeography.findFirst({
    where: {
      programId: params.programId,
      level: params.level,
      municipality: params.municipality ?? null,
      district: params.district ?? null,
      parish: null,
    },
    select: { id: true },
  });

  if (existing) return;

  await prisma.programGeography.create({
    data: {
      programId: params.programId,
      level: params.level,
      municipality: params.municipality ?? null,
      district: params.district ?? null,
      parish: null,
    },
  });
}

async function fetchHtmlWithRetry(
  url: string,
  logger: WorkerLogger,
  attempts = 3,
  baseDelayMs = 900,
): Promise<string | null> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await axios.get<string>(url, {
        timeout: 30000,
        maxRedirects: 5,
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml',
        },
      });

      if (typeof response.data === 'string') {
        return response.data;
      }

      return JSON.stringify(response.data);
    } catch (error) {
      logger.warn('Falha ao obter página, a tentar novamente', {
        url,
        attempt,
        attempts,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });

      if (attempt < attempts) {
        await delay(baseDelayMs * attempt);
      }
    }
  }

  logger.error('Não foi possível obter a página após retries', { url });
  return null;
}

function extractCandidatesFromHtml(
  html: string,
  baseUrl: string,
  keywords: readonly string[],
  context?: { municipalityName?: string; districtName?: string },
  options?: { allowedHosts?: readonly string[]; requireApplicationIntent?: boolean },
): DiscoveredProgramCandidate[] {
  const $ = cheerio.load(html);
  const normalizedKeywords = keywords.map((keyword) => normalizeText(keyword));
  const dedupMap = new Map<string, DiscoveredProgramCandidate>();

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (!href) return;
    if (href.startsWith('#')) return;

    const absoluteUrl = toAbsoluteUrl(href, baseUrl);
    if (!absoluteUrl) return;
    if (!matchesAllowedHost(absoluteUrl, options?.allowedHosts)) return;

    const title = normalizeSpaces($(element).text());
    if (!title || title.length < 12) return;

    const container = $(element).closest(LINK_CONTAINER_SELECTOR);
    const contextText = normalizeSpaces(container.text());
    const descriptionCandidate =
      contextText && contextText !== title ? contextText.slice(0, 900) : undefined;

    const searchableText = normalizeText(
      `${title} ${descriptionCandidate ?? ''} ${absoluteUrl}`,
    );
    if (hasBlockedMarker(searchableText)) return;

    const isRelevant =
      normalizedKeywords.length === 0 ||
      normalizedKeywords.some((keyword) => searchableText.includes(keyword));

    if (!isRelevant) return;
    if (options?.requireApplicationIntent && !hasApplicationIntent(searchableText)) return;

    const dedupKey = `${absoluteUrl}::${normalizeText(title)}`;
    if (dedupMap.has(dedupKey)) return;

    dedupMap.set(dedupKey, {
      title,
      url: absoluteUrl,
      description: descriptionCandidate,
      municipalityName: context?.municipalityName,
      districtName: context?.districtName,
    });
  });

  return Array.from(dedupMap.values());
}

export async function discoverProgramsFromUrl(params: {
  url: string;
  keywords: readonly string[];
  logger: WorkerLogger;
  municipalityName?: string;
  districtName?: string;
  allowedHosts?: readonly string[];
  requireApplicationIntent?: boolean;
}): Promise<DiscoveredProgramCandidate[]> {
  const html = await fetchHtmlWithRetry(params.url, params.logger);
  if (!html) return [];

  return extractCandidatesFromHtml(html, params.url, params.keywords, {
    municipalityName: params.municipalityName,
    districtName: params.districtName,
  }, {
    allowedHosts: params.allowedHosts,
    requireApplicationIntent: params.requireApplicationIntent,
  });
}

async function persistCandidate(params: {
  source: CanonicalSourceDefinition;
  candidate: DiscoveredProgramCandidate;
  logger: WorkerLogger;
  overrideProgramType?: ProgramType;
  overrideEntity?: string;
}): Promise<'new' | 'updated' | 'skipped'> {
  const { source, candidate, logger, overrideEntity, overrideProgramType } = params;
  const programType = overrideProgramType ?? source.programType;
  const entity = overrideEntity ?? source.entity;
  const normalizedPayload = normalizeText(
    `${candidate.title} ${candidate.description ?? ''} ${candidate.url} ${source.id} ${
      candidate.municipalityName ?? ''
    }`,
  );
  const contentHash = calculateContentHash(normalizedPayload);
  const status = inferStatus(`${candidate.title} ${candidate.description ?? ''}`);
  const now = new Date();

  const existingByUrl = await prisma.source.findFirst({
    where: { sourceUrl: candidate.url },
    select: {
      id: true,
      programId: true,
      contentHash: true,
    },
  });

  if (existingByUrl?.contentHash === contentHash) {
    return 'skipped';
  }

  const payload = {
    sourceId: source.id,
    sourceName: source.name,
    title: candidate.title,
    url: candidate.url,
    description: candidate.description,
    municipalityName: candidate.municipalityName,
    districtName: candidate.districtName,
    // Deep crawler fields
    category: candidate.category,
    howToApply: candidate.howToApply,
    applicationUrl: candidate.applicationUrl,
    requiredDocuments: candidate.requiredDocuments,
    beneficiaries: candidate.beneficiaries,
    eligibilityCriteria: candidate.eligibilityCriteria,
    supportAmount: candidate.supportAmount,
    deadline: candidate.deadline,
    legislation: candidate.legislation,
    faq: candidate.faq,
    rawSections: candidate.rawSections,
    ...(candidate.metadata ?? {}),
  };

  if (existingByUrl?.programId) {
    await prisma.program.update({
      where: { id: existingByUrl.programId },
      data: {
        title: candidate.title,
        summary: candidate.description?.slice(0, 3000) ?? null,
        entity,
        status,
        officialUrl: candidate.url,
        programType,
      },
    });

    await prisma.source.update({
      where: { id: existingByUrl.id },
      data: {
        sourceType: source.sourceType,
        sourceUrl: candidate.url,
        fetchedAt: now,
        contentHash,
        rawPayload: payload,
      },
    });

    await prisma.programVersion.create({
      data: {
        programId: existingByUrl.programId,
        versionDate: now,
        rawText: JSON.stringify(payload),
        rulesJson: {
          source: source.id,
          programType,
        },
      },
    });

    if (programType === 'MUNICIPAL') {
      await ensureGeography({
        programId: existingByUrl.programId,
        level: GeoLevel.MUNICIPALITY,
        municipality: candidate.municipalityName,
        district: candidate.districtName,
      });
    }

    return 'updated';
  }

  const existingByHash = await prisma.source.findFirst({
    where: { contentHash },
    select: { id: true },
  });

  if (existingByHash) {
    return 'skipped';
  }

  const baseSlug = buildSlugBase(source.id, candidate.title, candidate.municipalityName);
  const uniqueSlug = await ensureUniqueSlug(baseSlug);

  const created = await prisma.program.create({
    data: {
      slug: uniqueSlug,
      title: candidate.title,
      summary: candidate.description?.slice(0, 3000) ?? null,
      entity,
      programType,
      status,
      officialUrl: candidate.url,
      geographies: {
        create:
          programType === 'MUNICIPAL'
            ? {
                level: GeoLevel.MUNICIPALITY,
                municipality: candidate.municipalityName ?? null,
                district: candidate.districtName ?? null,
              }
            : {
                level: GeoLevel.NATIONAL,
              },
      },
      sources: {
        create: {
          sourceType: source.sourceType,
          sourceUrl: candidate.url,
          fetchedAt: now,
          contentHash,
          rawPayload: payload,
        },
      },
    },
    select: { id: true },
  });

  await prisma.programVersion.create({
    data: {
      programId: created.id,
      versionDate: now,
      rawText: JSON.stringify(payload),
      rulesJson: {
        source: source.id,
        programType,
      },
    },
  });

  logger.success('Programa descoberto e criado', {
    source: source.id,
    title: candidate.title,
    programId: created.id,
  });

  return 'new';
}

export async function runCanonicalSourceWorker(
  source: CanonicalSourceDefinition,
  options?: {
    seedUrls?: readonly string[];
    keywords?: readonly string[];
    loggerContext?: string;
    rateLimitMs?: number;
    overrideProgramType?: ProgramType;
    overrideEntity?: string;
    allowedHosts?: readonly string[];
    requireApplicationIntent?: boolean;
  },
): Promise<WorkerRunResult> {
  const logger = new WorkerLogger(options?.loggerContext ?? source.id);
  const startedAt = Date.now();
  const errors: Array<{ title?: string; url?: string; error: string }> = [];
  const urls = [...(options?.seedUrls ?? source.seedUrls)];
  const keywords = options?.keywords ?? source.keywords;
  const allowedHosts = options?.allowedHosts ?? source.allowedHosts;
  const requireApplicationIntent =
    options?.requireApplicationIntent ?? source.requireApplicationIntent ?? true;
  const stats: WorkerRunStats = {
    found: 0,
    new: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    duration: '0.00',
  };

  logger.info('A iniciar worker canónico', {
    source: source.id,
    urls,
  });

  const candidatesByUrl = new Map<string, DiscoveredProgramCandidate>();

  for (const url of urls) {
    const discovered = await discoverProgramsFromUrl({
      url,
      keywords,
      logger,
      allowedHosts,
      requireApplicationIntent,
    });

    for (const candidate of discovered) {
      if (!candidatesByUrl.has(candidate.url)) {
        candidatesByUrl.set(candidate.url, candidate);
      }
    }

    await delay(options?.rateLimitMs ?? 800);
  }

  const candidates = Array.from(candidatesByUrl.values()).slice(0, MAX_PROGRAMS_PER_SOURCE);
  stats.found = candidates.length;

  for (const candidate of candidates) {
    try {
      const outcome = await persistCandidate({
        source,
        candidate,
        logger,
        overrideProgramType: options?.overrideProgramType,
        overrideEntity: options?.overrideEntity,
      });

      if (outcome === 'new') stats.new += 1;
      if (outcome === 'updated') stats.updated += 1;
      if (outcome === 'skipped') stats.skipped += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      errors.push({ title: candidate.title, url: candidate.url, error: message });
      logger.error('Erro ao persistir candidato', {
        title: candidate.title,
        url: candidate.url,
        error: message,
      });
    }

    await delay(180);
  }

  stats.errors = errors.length;
  stats.duration = ((Date.now() - startedAt) / 1000).toFixed(2);

  logger.info('Worker canónico concluído', {
    source: source.id,
    stats,
  });

  return {
    success: true,
    stats,
    errors,
  };
}

export async function persistDiscoveredProgram(params: {
  source: CanonicalSourceDefinition;
  candidate: DiscoveredProgramCandidate;
  logger: WorkerLogger;
  overrideProgramType?: ProgramType;
  overrideEntity?: string;
}): Promise<'new' | 'updated' | 'skipped'> {
  return persistCandidate(params);
}
