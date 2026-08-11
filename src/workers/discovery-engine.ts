import axios from 'axios';
import { GeoLevel, Prisma, ProgramStatus, type ProgramType } from '@prisma/client';
import * as cheerio from 'cheerio';
import { prisma } from '../lib/prisma';
import { slugify } from '../lib/utils';
import type { CanonicalSourceDefinition } from './canonical-sources';
import { calculateContentHash, normalizeText, WorkerLogger } from '../lib/worker-utils';
import { recordStatusChange, withIngestionRun } from '../lib/ingestion';
import { queueNewProgramNotifications } from '../lib/notifications';
import { CRAWLER_USER_AGENT } from '../lib/user-agent';
import {
  crawlPageForDetails,
  shouldBlockTitle,
  isRelevantToEnergyEfficiency,
  type SupportProgramDetails,
  type SupportCategory
} from './deep-crawler';
import { classifyBeneficiary } from './beneficiary-gate';
import { checkResidual } from './residual-blocklist';
import { extractStatus } from './status-extractor';

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
          'User-Agent': CRAWLER_USER_AGENT,
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
  /// Persiste mesmo com contentHash igual. Necessário quando o candidato
  /// foi enriquecido pelo deep crawl: o hash cobre título+descrição+url,
  /// não os campos enriquecidos — sem isto o enriquecimento perdia-se.
  forceUpdate?: boolean;
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
  const now = new Date();
  // Extração de estado (RC3): frases explícitas com proximidade + datas de
  // prazo sobre deadline/rawSections — não só título+descrição, que quase
  // nunca falam do estado das candidaturas.
  const statusExtraction = extractStatus(
    {
      title: candidate.title,
      description: candidate.description,
      deadline: candidate.deadline,
      rawSections: candidate.rawSections,
    },
    now,
  );
  const status = statusExtraction.status;

  const existingByUrl = await prisma.source.findFirst({
    where: { sourceUrl: candidate.url },
    select: {
      id: true,
      programId: true,
      contentHash: true,
      rawPayload: true,
    },
  });

  if (!params.forceUpdate && existingByUrl?.contentHash === contentHash) {
    return 'skipped';
  }

  // Blocklist do residual (RC3): listagens por categoria, formulários,
  // editais de trânsito e afins nunca são programas — bloqueia SEMPRE,
  // criação E update. O mesmo URL pode chegar duas vezes na mesma corrida
  // com âncoras diferentes ("Regulamento X" e depois "Ler mais: Regulamento
  // X") — se o update passasse, o título lixo sobrescrevia o limpo.
  const residual = checkResidual({ title: candidate.title, url: candidate.url });
  if (residual.blocked) {
    logger.info('Candidato excluído pela blocklist de residual', {
      title: candidate.title,
      url: candidate.url,
      reason: residual.reason,
    });
    return 'skipped';
  }

  // Gate de beneficiário (RC2): programas cujo texto diz que o dinheiro vai
  // para empresas/autarquias/entidades não entram no radar. Só bloqueia a
  // CRIAÇÃO — um programa já existente continua a ser atualizado (o veredicto
  // fica no payload e a limpeza retroativa é um passo separado e revisável).
  // Sem texto enriquecido o veredicto é UNKNOWN e o candidato persiste: será
  // reclassificado quando o deep crawl o apanhar.
  const beneficiaryGate = classifyBeneficiary(candidate);
  if (beneficiaryGate.verdict === 'ORGANIZATION' && !existingByUrl?.programId) {
    logger.info('Candidato excluído pelo gate de beneficiário', {
      title: candidate.title,
      url: candidate.url,
      scope: beneficiaryGate.scope,
      matched: beneficiaryGate.matchedNegative,
    });
    return 'skipped';
  }

  const freshPayload = {
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
    beneficiaryGate:
      beneficiaryGate.scope === 'none'
        ? undefined
        : { ...beneficiaryGate, classifiedAt: now.toISOString() },
    statusExtraction:
      statusExtraction.sourceField === 'none'
        ? undefined
        : { ...statusExtraction, classifiedAt: now.toISOString() },
    ...(candidate.metadata ?? {}),
  };

  // Merge sobre o payload existente, nunca replace: um update disparado por
  // mudança de título/descrição chega aqui com um candidato NÃO enriquecido
  // (campos deep-crawl undefined) — um replace apagaria silenciosamente o
  // enriquecimento captado em corridas anteriores. Chaves undefined saem
  // antes do merge para não sobrepor valores existentes.
  const definedEntries = Object.fromEntries(
    Object.entries(freshPayload).filter(([, value]) => value !== undefined),
  );
  const previousPayload =
    existingByUrl?.rawPayload &&
    typeof existingByUrl.rawPayload === 'object' &&
    !Array.isArray(existingByUrl.rawPayload)
      ? (existingByUrl.rawPayload as Record<string, unknown>)
      : {};
  const payload = { ...previousPayload, ...definedEntries } as Prisma.InputJsonObject;

  if (existingByUrl?.programId) {
    await prisma.program.update({
      where: { id: existingByUrl.programId },
      data: {
        title: candidate.title,
        summary: candidate.description?.slice(0, 3000) ?? null,
        entity,
        officialUrl: candidate.url,
        programType,
      },
    });

    // Estado via recordStatusChange (um só caminho de escrita: dedup +
    // ProgramStatusEvent + notificações). UNKNOWN nunca sobrepõe um estado
    // já conhecido — sem sinal não é sinal de mudança.
    if (status !== ProgramStatus.UNKNOWN) {
      await recordStatusChange(existingByUrl.programId, status, {
        sourceUrl: candidate.url,
        detectedBy: `worker:${source.id}`,
        markVerified: true,
      });
    }

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

  // Dedup na criação (RC3): o Fundo Ambiental repete o mesmo tema como aviso
  // anual ("Resíduos e Economia Circular" 2019/2020/2022/...) — um programa
  // por título+entidade chega; o mais antigo não acrescenta nada ao radar.
  const existingByTitle = await prisma.program.findFirst({
    where: {
      title: { equals: candidate.title, mode: 'insensitive' },
      entity: entity ?? undefined,
    },
    select: { id: true },
  });
  if (existingByTitle) {
    logger.info('Candidato ignorado: programa com mesmo título e entidade já existe', {
      title: candidate.title,
      url: candidate.url,
    });
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
      domain: source.domain,
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
    select: { id: true, slug: true, title: true, domain: true, status: true },
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

  // Estado inicial no histórico, para a timeline não começar vazia.
  await prisma.programStatusEvent.create({
    data: {
      programId: created.id,
      status,
      sourceUrl: candidate.url,
      detectedBy: `worker:${source.id}`,
    },
  });

  // Um apoio novo só vale se chegar a quem o pode usar antes de a verba acabar.
  try {
    await queueNewProgramNotifications(
      created,
      candidate.municipalityName ? [candidate.municipalityName] : [],
    );
  } catch (error) {
    logger.error('Falha ao enfileirar notificações do programa novo', error);
  }

  logger.success('Programa descoberto e criado', {
    source: source.id,
    title: candidate.title,
    programId: created.id,
  });

  return 'new';
}

type CanonicalWorkerOptions = {
  seedUrls?: readonly string[];
  keywords?: readonly string[];
  loggerContext?: string;
  rateLimitMs?: number;
  overrideProgramType?: ProgramType;
  overrideEntity?: string;
  allowedHosts?: readonly string[];
  requireApplicationIntent?: boolean;
};

/**
 * Executa o worker canónico e regista a execução num `IngestionRun`.
 * Sem isto uma fonte podia estar partida durante semanas sem deixar rasto.
 */
export async function runCanonicalSourceWorker(
  source: CanonicalSourceDefinition,
  options?: CanonicalWorkerOptions,
): Promise<WorkerRunResult> {
  return withIngestionRun(source.id, () => runCanonicalSourceWorkerInner(source, options));
}

async function runCanonicalSourceWorkerInner(
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

  // Deep crawl com cap por corrida, retomável: cada corrida enriquece até
  // ENRICH_LIMIT candidatos ainda sem rawSections; as corridas seguintes
  // apanham os restantes. Sem o cap, 250 páginas x N fontes estoiravam o
  // timeout do cron. Antes disto o enrichment só corria no caminho
  // municipal — as fontes nacionais persistiam título+URL e mais nada.
  const parsedLimit = Number(process.env.NATIONAL_ENRICH_LIMIT);
  const enrichLimit = Number.isFinite(parsedLimit) ? parsedLimit : 25;
  // Só os URLs, não os blobs: o operador jsonb `?` testa a presença de
  // rawSections sem puxar o texto das secções para memória.
  const knownSources =
    candidates.length > 0
      ? await prisma.$queryRaw<Array<{ source_url: string; enriched: boolean }>>`
          SELECT source_url, raw_payload ? 'rawSections' AS enriched FROM sources
          WHERE source_url IN (${Prisma.join(candidates.map((candidate) => candidate.url))})
        `
      : [];
  const existingUrls = new Set<string>(knownSources.map((row) => row.source_url));
  const alreadyEnriched = new Set<string>(
    knownSources.filter((row) => row.enriched).map((row) => row.source_url),
  );
  let enrichAttempts = 0;
  let enrichedThisRun = 0;
  let deferredNew = 0;

  for (const candidate of candidates) {
    let candidateToPersist = candidate;
    let forceUpdate = false;

    if (!alreadyEnriched.has(candidate.url) && enrichAttempts < enrichLimit) {
      enrichAttempts += 1;
      const enriched = await enrichCandidateWithDeepCrawl(candidate, logger, {
        delayMs: options?.rateLimitMs ?? 800,
      });
      // forceUpdate só quando o crawl produziu secções: em falha o
      // enrichCandidateWithDeepCrawl devolve o candidato original e um
      // force-persist aqui geraria updates (e ProgramVersions) a cada
      // corrida sem dados novos. URLs que falham voltam a ser tentados
      // na corrida seguinte — falhas permanentes consomem budget, mas o
      // cap é por corrida e o log denuncia-as.
      if (enriched.rawSections && Object.keys(enriched.rawSections).length > 0) {
        candidateToPersist = enriched;
        enrichedThisRun += 1;
        forceUpdate = true;
      }
    }

    // Candidato NOVO só persiste depois de enriquecido: sem texto o gate de
    // beneficiário não consegue decidir e o programa entrava como UNKNOWN —
    // era assim que o ruído (avisos para empresas/autarquias) voltava a
    // entrar depois de purgado. Fica para a corrida seguinte, que o apanha
    // dentro do cap de enrichment. Fontes já persistidas atualizam como antes.
    const isEnrichedNow =
      alreadyEnriched.has(candidate.url) ||
      (candidateToPersist.rawSections &&
        Object.keys(candidateToPersist.rawSections).length > 0);
    if (!existingUrls.has(candidate.url) && !isEnrichedNow) {
      deferredNew += 1;
      stats.skipped += 1;
      continue;
    }

    try {
      const outcome = await persistCandidate({
        source,
        candidate: candidateToPersist,
        logger,
        overrideProgramType: options?.overrideProgramType,
        overrideEntity: options?.overrideEntity,
        forceUpdate,
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
    enrichAttempts,
    enrichedThisRun,
    enrichFailures: enrichAttempts - enrichedThisRun,
    deferredNew,
    pendingEnrichment: Math.max(
      0,
      candidates.length - alreadyEnriched.size - enrichedThisRun,
    ),
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
