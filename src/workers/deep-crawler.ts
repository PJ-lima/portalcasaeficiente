/**
 * Deep Crawler Engine
 * 
 * Módulo de crawling profundo para extração de informação estruturada
 * sobre programas de apoio à eficiência energética.
 * 
 * Features:
 * - Extração de secções específicas (Como se candidatar, Documentos, Beneficiários)
 * - Detecção de categorias de apoio (Janelas, Bombas Calor, Isolamento, Solar, etc.)
 * - Suporte bilingue PT/EN (output sempre em PT)
 * - Rate limiting configurável
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import type { AnyNode, Element as DomElement } from 'domhandler';
import { normalizeText, WorkerLogger } from '../lib/worker-utils';

// ============================================================================
// TYPES
// ============================================================================

export type SupportCategory = 
  | 'JANELAS'
  | 'BOMBAS_CALOR'
  | 'ISOLAMENTO'
  | 'SOLAR'
  | 'AQUECIMENTO_AGUAS'
  | 'COBERTURA'
  | 'OUTRO';

export interface SupportProgramDetails {
  // Identification
  title: string;
  url: string;
  category: SupportCategory;
  
  // Application info
  howToApply?: string;
  applicationUrl?: string;
  requiredDocuments?: string[];
  
  // Eligibility
  beneficiaries?: string;
  eligibilityCriteria?: string;
  
  // Values and deadlines
  supportAmount?: string;
  deadline?: string;
  status: 'OPEN' | 'CLOSED' | 'PLANNED' | 'UNKNOWN';
  
  // Metadata
  entity: string;
  legislation?: string;
  faq?: string;
  rawSections?: Record<string, string>;
}

// ============================================================================
// BILINGUAL KEYWORDS (PT + EN)
// ============================================================================

export const SUPPORT_CATEGORY_KEYWORDS: Record<SupportCategory, readonly string[]> = {
  JANELAS: [
    // PT
    'janelas eficientes', 'janela', 'caixilharia', 'vidro duplo',
    'vidro triplo', 'envidraçado', 'vãos envidraçados', 'caixilhos',
    // EN
    'efficient windows', 'window', 'glazing', 'double glazing',
    'triple glazing', 'window frames', 'fenestration',
  ],
  BOMBAS_CALOR: [
    // PT
    'bomba de calor', 'bombas de calor', 'aquecimento aerotérmico',
    'geotérmico', 'climatização eficiente', 'aerotermia',
    // EN
    'heat pump', 'heat pumps', 'aerothermal', 'geothermal',
    'air source heat pump', 'ground source heat pump',
  ],
  ISOLAMENTO: [
    // PT
    'isolamento térmico', 'capoto', 'etics', 'isolamento paredes',
    'isolamento fachadas', 'revestimento térmico', 'isolamento exterior',
    // EN
    'thermal insulation', 'wall insulation', 'facade insulation',
    'external insulation', 'cavity wall', 'insulation material',
  ],
  SOLAR: [
    // PT
    'solar fotovoltaico', 'painéis solares', 'fotovoltaico',
    'autoconsumo', 'energia solar', 'painel solar', 'módulos fotovoltaicos',
    // EN
    'solar photovoltaic', 'solar panels', 'photovoltaic', 'pv panels',
    'self-consumption', 'solar energy', 'solar power',
  ],
  AQUECIMENTO_AGUAS: [
    // PT
    'aquecimento de águas', 'águas quentes sanitárias', 'aqs',
    'solar térmico', 'termoacumulador', 'esquentador',
    // EN
    'water heating', 'domestic hot water', 'dhw', 'solar thermal',
    'water heater', 'hot water system',
  ],
  COBERTURA: [
    // PT
    'cobertura', 'telhado', 'isolamento cobertura', 'telhas',
    'impermeabilização', 'isolamento telhado', 'sótão',
    // EN
    'roof', 'roofing', 'roof insulation', 'attic insulation',
    'loft insulation', 'waterproofing',
  ],
  OUTRO: [],
};

// ============================================================================
// SECTION DETECTION PATTERNS (PT + EN)
// ============================================================================

const SECTION_PATTERNS = {
  howToApply: [
    // PT
    /como\s+se\s+candidatar/i,
    /candidatura/i,
    /como\s+candidatar/i,
    /submiss[aã]o/i,
    /como\s+submeter/i,
    /processo\s+de\s+candidatura/i,
    // EN
    /how\s+to\s+apply/i,
    /application\s+process/i,
    /apply\s+now/i,
    /submit\s+application/i,
  ],
  beneficiaries: [
    // PT
    /benefici[aá]rios/i,
    /quem\s+pode\s+candidatar/i,
    /destinat[aá]rios/i,
    /p[uú]blico[\s-]alvo/i,
    /entidades\s+eleg[ií]veis/i,
    // EN
    /beneficiaries/i,
    /who\s+can\s+apply/i,
    /eligible\s+applicants/i,
    /target\s+audience/i,
    /eligibility/i,
  ],
  documents: [
    // PT
    /documentos?\s+(necess[aá]rios?|exigidos?|obrigat[oó]rios?)/i,
    /documenta[çc][aã]o/i,
    /anexos?\s+obrigat[oó]rios/i,
    /formul[aá]rios/i,
    // EN
    /required\s+documents?/i,
    /documentation/i,
    /supporting\s+documents?/i,
    /attachments?/i,
  ],
  legislation: [
    // PT
    /legisla[çc][aã]o\s+aplic[aá]vel/i,
    /enquadramento\s+legal/i,
    /base\s+legal/i,
    /regulamento/i,
    // EN
    /applicable\s+legislation/i,
    /legal\s+framework/i,
    /regulations?/i,
  ],
  amount: [
    // PT
    /montante/i,
    /valor\s+do\s+apoio/i,
    /financiamento/i,
    /incentivo/i,
    /comparticipa[çc][aã]o/i,
    // EN
    /amount/i,
    /funding/i,
    /grant\s+value/i,
    /support\s+value/i,
    /incentive/i,
  ],
  deadline: [
    // PT
    /prazo/i,
    /data\s+limite/i,
    /encerramento/i,
    /candidaturas\s+abertas\s+at[eé]/i,
    // EN
    /deadline/i,
    /closing\s+date/i,
    /applications?\s+close/i,
    /until/i,
  ],
  whatIs: [
    // PT
    /o\s+que\s+[eé]/i,
    /descri[çc][aã]o/i,
    /sobre\s+o\s+programa/i,
    /apresenta[çc][aã]o/i,
    // EN
    /what\s+is/i,
    /about\s+the\s+program/i,
    /overview/i,
    /description/i,
  ],
  faq: [
    // PT
    /perguntas\s+frequentes/i,
    /faqs?/i,
    /d[uú]vidas/i,
    // EN
    /frequently\s+asked/i,
    /faq/i,
    /questions/i,
  ],
};

// ============================================================================
// BLOCKED PATTERNS (pages to skip)
// ============================================================================

const BLOCKED_TITLE_PATTERNS = [
  /^ignorar\s+links/i,
  /^skip\s+to/i,
  /^saltar\s+para/i,
  /canal\s+de\s+den[uú]ncias/i,
  /pol[ií]tica\s+de\s+privacidade/i,
  /privacy\s+policy/i,
  /cookie\s+policy/i,
  /termos\s+(e\s+)?condi[çc][oõ]es/i,
  /terms\s+(and\s+)?conditions/i,
  /contactos?$/i,
  /contact\s+us$/i,
  /^mapa\s+do\s+site$/i,
  /^sitemap$/i,
  /^rss$/i,
  /^login$/i,
  /^regist[ao]r?$/i,
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const USER_AGENT = 'Mozilla/5.0 (compatible; PortalCasaEficienteBot/1.0; +https://portalcasaeficiente.pt)';

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Checks if a title should be blocked (irrelevant page)
 */
export function shouldBlockTitle(title: string): boolean {
  const normalized = normalizeText(title);
  return BLOCKED_TITLE_PATTERNS.some(pattern => pattern.test(normalized));
}

/**
 * Detects the support category from text content
 */
export function detectSupportCategory(text: string): SupportCategory {
  const normalized = normalizeText(text);
  
  const scores: Record<SupportCategory, number> = {
    JANELAS: 0,
    BOMBAS_CALOR: 0,
    ISOLAMENTO: 0,
    SOLAR: 0,
    AQUECIMENTO_AGUAS: 0,
    COBERTURA: 0,
    OUTRO: 0,
  };
  
  for (const [category, keywords] of Object.entries(SUPPORT_CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalized.includes(normalizeText(keyword))) {
        scores[category as SupportCategory] += 1;
      }
    }
  }
  
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return 'OUTRO';
  
  const winner = Object.entries(scores).find(([, score]) => score === maxScore);
  return (winner?.[0] as SupportCategory) ?? 'OUTRO';
}

/**
 * Checks if text is relevant to energy efficiency supports
 */
export function isRelevantToEnergyEfficiency(text: string): boolean {
  const normalized = normalizeText(text);
  
  // Check all category keywords
  for (const keywords of Object.values(SUPPORT_CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalized.includes(normalizeText(keyword))) {
        return true;
      }
    }
  }
  
  // Also check generic energy efficiency terms (PT + EN)
  const genericTerms = [
    'eficiência energética', 'eficiencia energetica',
    'energy efficiency', 'energy saving', 'energia renovável',
    'renewable energy', 'reabilitação energética', 'energy retrofit',
    'descarbonização', 'decarbonization', 'carbon neutral',
  ];
  
  return genericTerms.some(term => normalized.includes(normalizeText(term)));
}

// ============================================================================
// SECTION EXTRACTION
// ============================================================================

interface ExtractedSection {
  title: string;
  content: string;
  type: keyof typeof SECTION_PATTERNS | 'unknown';
}

/**
 * Extracts text content from an element, cleaning up whitespace
 */
function extractText($: CheerioAPI, element: AnyNode): string {
  return $(element)
    .text()
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 5000); // Limit to avoid huge texts
}

/**
 * Finds sections by looking at headings and their following content
 */
function extractSectionsFromPage($: CheerioAPI): ExtractedSection[] {
  const sections: ExtractedSection[] = [];
  
  // Look for common section containers
  const sectionSelectors = [
    'section',
    '.section',
    '.content-section',
    '[class*="section"]',
    'article',
    '.tab-pane',
    '.accordion-item',
    '.card',
  ];
  
  // Also look for headings followed by content
  $('h1, h2, h3, h4, h5, h6, .title, [class*="title"], [class*="heading"]').each((_, heading) => {
    const $heading = $(heading);
    const title = $heading.text().replace(/\s+/g, ' ').trim();
    
    if (!title || title.length < 3) return;
    
    // Determine section type from title
    let sectionType: keyof typeof SECTION_PATTERNS | 'unknown' = 'unknown';
    for (const [type, patterns] of Object.entries(SECTION_PATTERNS)) {
      if (patterns.some(p => p.test(title))) {
        sectionType = type as keyof typeof SECTION_PATTERNS;
        break;
      }
    }
    
    // Get content following the heading
    let content = '';
    const $parent = $heading.parent();
    const $siblings = $heading.nextAll();
    
    if ($siblings.length > 0) {
      // Get text from siblings until next heading
      $siblings.each((_, sibling) => {
        const $sibling = $(sibling);
        if ($sibling.is('h1, h2, h3, h4, h5, h6')) return false;
        content += ' ' + extractText($, sibling);
        return true;
      });
    } else {
      // No siblings, try parent content minus heading
      content = $parent.clone().children('h1, h2, h3, h4, h5, h6').remove().end().text();
    }
    
    content = content.replace(/\s+/g, ' ').trim();
    
    if (content.length > 20) {
      sections.push({ title, content, type: sectionType });
    }
  });
  
  // Also check for tab-based navigation (common in government sites)
  $('.nav-tabs a, .tab-link, [role="tab"]').each((_, tab) => {
    const $tab = $(tab);
    const title = $tab.text().trim();
    const targetId = $tab.attr('href')?.replace('#', '') || $tab.attr('data-target')?.replace('#', '');
    
    if (targetId) {
      const $content = $(`#${targetId}`);
      if ($content.length) {
        let sectionType: keyof typeof SECTION_PATTERNS | 'unknown' = 'unknown';
        for (const [type, patterns] of Object.entries(SECTION_PATTERNS)) {
          if (patterns.some(p => p.test(title))) {
            sectionType = type as keyof typeof SECTION_PATTERNS;
            break;
          }
        }
        
        sections.push({
          title,
          content: extractText($, $content[0]),
          type: sectionType,
        });
      }
    }
  });
  
  return sections;
}

/**
 * Extracts list items from content (useful for document lists)
 */
function extractListItems($: CheerioAPI, container: AnyNode): string[] {
  const items: string[] = [];
  
  $(container).find('li, .list-item').each((_, li) => {
    const text = $(li).text().replace(/\s+/g, ' ').trim();
    if (text.length > 3 && text.length < 500) {
      items.push(text);
    }
  });
  
  return items;
}

/**
 * Finds application or candidature links
 */
function findApplicationLinks($: CheerioAPI): string[] {
  const links: string[] = [];
  
  const applicationPatterns = [
    // PT
    /candidatar/i,
    /submeter/i,
    /inscrever/i,
    /formul[aá]rio/i,
    /aceder.*plataforma/i,
    // EN
    /apply/i,
    /submit/i,
    /register/i,
    /application\s+form/i,
  ];
  
  $('a[href]').each((_, link) => {
    const $link = $(link);
    const text = $link.text().trim();
    const href = $link.attr('href') || '';
    
    if (applicationPatterns.some(p => p.test(text) || p.test(href))) {
      if (href.startsWith('http') || href.startsWith('/')) {
        links.push(href);
      }
    }
  });
  
  return [...new Set(links)];
}

// ============================================================================
// MAIN CRAWLER FUNCTION
// ============================================================================

export async function crawlPageForDetails(
  url: string,
  logger: WorkerLogger,
  options?: {
    timeout?: number;
    delayMs?: number;
  }
): Promise<Partial<SupportProgramDetails>> {
  const timeout = options?.timeout ?? 30000;
  
  logger.info('Deep crawling page', { url });
  
  try {
    const response = await axios.get<string>(url, {
      timeout,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml',
        'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8',
      },
      maxRedirects: 5,
    });
    
    const $ = cheerio.load(response.data);
    
    // Extract page title
    const pageTitle = $('h1').first().text().trim() || $('title').text().trim();
    
    // Extract all sections
    const sections = extractSectionsFromPage($);
    
    // Map sections to structured data
    const details: Partial<SupportProgramDetails> = {
      title: pageTitle,
      url,
      rawSections: {},
    };
    
    for (const section of sections) {
      // Store raw section
      if (section.title && section.content) {
        details.rawSections![section.title] = section.content;
      }
      
      // Map to structured fields
      switch (section.type) {
        case 'howToApply':
          details.howToApply = section.content;
          break;
        case 'beneficiaries':
          details.beneficiaries = section.content;
          break;
        case 'documents':
          // Try to extract as list
          const docSection = $('*').filter((_, el) => {
            const text = $(el).text();
            return SECTION_PATTERNS.documents.some(p => p.test(text));
          }).first();
          
          if (docSection.length) {
            details.requiredDocuments = extractListItems($, docSection[0]);
          }
          if (!details.requiredDocuments?.length) {
            // Fallback: split by common separators
            details.requiredDocuments = section.content
              .split(/[;•\-\n]/)
              .map(s => s.trim())
              .filter(s => s.length > 5 && s.length < 200);
          }
          break;
        case 'legislation':
          details.legislation = section.content;
          break;
        case 'amount':
          details.supportAmount = section.content;
          break;
        case 'deadline':
          details.deadline = section.content;
          break;
        case 'faq':
          details.faq = section.content;
          break;
      }
    }
    
    // Find application links
    const appLinks = findApplicationLinks($);
    if (appLinks.length > 0) {
      // Convert relative to absolute
      details.applicationUrl = appLinks[0].startsWith('http')
        ? appLinks[0]
        : new URL(appLinks[0], url).toString();
    }
    
    // Detect support category from all page content
    const fullText = $('main, .content, article, [role="main"]').first().text() || $('body').text();
    details.category = detectSupportCategory(pageTitle + ' ' + fullText);
    
    // Detect status from page content
    const normalizedContent = normalizeText(fullText);
    if (/\b(aberto|abertas?|em\s+curso|open|active)\b/.test(normalizedContent)) {
      details.status = 'OPEN';
    } else if (/\b(encerrad[oa]|fechad[oa]|terminad[oa]|closed|expired)\b/.test(normalizedContent)) {
      details.status = 'CLOSED';
    } else if (/\b(breve|previst[oa]|futur[oa]|a\s+abrir|coming\s+soon|planned)\b/.test(normalizedContent)) {
      details.status = 'PLANNED';
    } else {
      details.status = 'UNKNOWN';
    }
    
    logger.success('Page crawled successfully', {
      url,
      sectionsFound: sections.length,
      category: details.category,
      hasHowToApply: !!details.howToApply,
      hasDocuments: (details.requiredDocuments?.length ?? 0) > 0,
    });
    
    // Rate limiting delay
    if (options?.delayMs) {
      await delay(options.delayMs);
    }
    
    return details;
  } catch (error) {
    logger.error('Failed to crawl page', error);
    return {
      url,
      status: 'UNKNOWN',
    };
  }
}

/**
 * Crawls multiple pages and aggregates results
 */
export async function crawlMultiplePages(
  urls: string[],
  logger: WorkerLogger,
  options?: {
    timeout?: number;
    delayBetweenRequests?: number;
    maxPages?: number;
  }
): Promise<Partial<SupportProgramDetails>[]> {
  const maxPages = options?.maxPages ?? 50;
  const delayMs = options?.delayBetweenRequests ?? 1000;
  
  const results: Partial<SupportProgramDetails>[] = [];
  const urlsToProcess = urls.slice(0, maxPages);
  
  for (const url of urlsToProcess) {
    const details = await crawlPageForDetails(url, logger, {
      timeout: options?.timeout,
      delayMs,
    });
    
    if (details && !shouldBlockTitle(details.title || '')) {
      results.push(details);
    }
  }
  
  return results;
}

// ============================================================================
// EXPORTS FOR TESTING
// ============================================================================

export { SECTION_PATTERNS, BLOCKED_TITLE_PATTERNS };
