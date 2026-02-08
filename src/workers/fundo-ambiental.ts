/**
 * Worker de Ingestão - Fundo Ambiental
 * 
 * Faz scraping do site do Fundo Ambiental para encontrar novos avisos
 * relacionados com eficiência energética.
 * 
 * Features:
 * - Deep crawling para extração de informação detalhada
 * - Deteção de categorias de apoio (Janelas, Bombas Calor, Isolamento, Solar, etc.)
 * - Suporte bilingue PT/EN
 * - Deduplicação por contentHash
 * - Logs estruturados
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { prisma } from '../lib/prisma';
import { slugify } from '../lib/utils';
import { calculateContentHash, WorkerLogger } from '../lib/worker-utils';
import { 
  crawlPageForDetails, 
  shouldBlockTitle,
  isRelevantToEnergyEfficiency,
  detectSupportCategory,
  type SupportProgramDetails,
  type SupportCategory,
} from './deep-crawler';

const logger = new WorkerLogger('fundo-ambiental');

interface ScrapedProgram {
  title: string;
  url: string;
  date?: string;
  description?: string;
  status?: string;
  // Deep crawl fields
  category?: SupportCategory;
  howToApply?: string;
  applicationUrl?: string;
  requiredDocuments?: string[];
  beneficiaries?: string;
  supportAmount?: string;
  deadline?: string;
  legislation?: string;
  rawSections?: Record<string, string>;
}

const FUNDO_AMBIENTAL_URL = process.env.FUNDO_AMBIENTAL_URL || 'https://www.fundoambiental.pt/avisos';

// Deep crawl delay between requests (ms)
const DEEP_CRAWL_DELAY = 1500;

/**
 * Verifica se o texto contém palavras-chave relevantes (usa função do deep-crawler)
 */
function isRelevant(text: string): boolean {
  return isRelevantToEnergyEfficiency(text);
}

/**
 * Extrai programas da página de avisos
 */
async function scrapeAvisos(): Promise<ScrapedProgram[]> {
  logger.info('Iniciando scraping', { url: FUNDO_AMBIENTAL_URL });
  
  try {
    const response = await axios.get(FUNDO_AMBIENTAL_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PortalCasaEficiente/1.0; +https://portalcasaeficiente.pt)',
      },
      timeout: 30000,
    });

    const $ = cheerio.load(response.data);
    const programs: ScrapedProgram[] = [];

    // Seletores genéricos para páginas de avisos
    $('article, .aviso-item, .card, [class*="aviso"]').each((_, element) => {
      const $el = $(element);
      
      const title = $el.find('h2, h3, .title, .aviso-title, a').first().text().trim();
      const link = $el.find('a').first().attr('href');
      const date = $el.find('.date, .data, time, [class*="date"]').first().text().trim();
      const description = $el.find('p, .description, .resumo').first().text().trim();
      
      if (title && link && isRelevant(title + ' ' + description)) {
        const fullUrl = link.startsWith('http') 
          ? link 
          : new URL(link, FUNDO_AMBIENTAL_URL).toString();
        
        programs.push({
          title,
          url: fullUrl,
          date,
          description,
        });
      }
    });

    logger.success('Scraping concluído', { programsFound: programs.length });
    return programs;
  } catch (error) {
    logger.error('Erro ao fazer scraping', error);
    throw error;
  }
}

/**
 * Extrai detalhes de um aviso individual usando deep crawl
 */
async function scrapeAvisoDetails(url: string): Promise<Partial<ScrapedProgram>> {
  logger.info('Deep crawling aviso', { url });
  
  try {
    const details = await crawlPageForDetails(url, logger, {
      timeout: 30000,
      delayMs: DEEP_CRAWL_DELAY,
    });
    
    return {
      description: details.howToApply || details.beneficiaries,
      status: details.status,
      category: details.category,
      howToApply: details.howToApply,
      applicationUrl: details.applicationUrl,
      requiredDocuments: details.requiredDocuments,
      beneficiaries: details.beneficiaries,
      supportAmount: details.supportAmount,
      deadline: details.deadline,
      legislation: details.legislation,
      rawSections: details.rawSections,
    };
  } catch (error) {
    logger.error('Erro ao extrair detalhes via deep crawl', error);
    return {};
  }
}

/**
 * Processa e guarda um programa na base de dados com deduplicação
 */
async function processProgram(scraped: ScrapedProgram): Promise<{ isNew: boolean; programId?: string }> {
  const slug = slugify(scraped.title);
  const contentHash = calculateContentHash({
    title: scraped.title,
    url: scraped.url,
    description: scraped.description,
  });
  
  try {
    // Verificar duplicados
    const existing = await prisma.program.findFirst({
      where: {
        OR: [
          { slug },
          {
            sources: {
              some: { contentHash },
            },
          },
        ],
      },
    });

    if (existing) {
      logger.info('Programa já existe (deduplicado)', { 
        title: scraped.title,
        slug,
        contentHash: contentHash.substring(0, 8),
      });
      return { isNew: false, programId: existing.id };
    }

    // Criar novo programa
    const program = await prisma.program.create({
      data: {
        slug,
        title: scraped.title,
        summary: scraped.description,
        entity: 'Fundo Ambiental',
        programType: 'NATIONAL',
        status: 'UNKNOWN',
        officialUrl: scraped.url,
        geographies: {
          create: {
            level: 'NATIONAL',
          },
        },
        sources: {
          create: {
            sourceType: 'FA',
            sourceUrl: scraped.url,
            fetchedAt: new Date(),
            contentHash,
            rawPayload: JSON.parse(JSON.stringify(scraped)),
          },
        },
      },
    });

    // Criar versão inicial
    await prisma.programVersion.create({
      data: {
        programId: program.id,
        versionDate: new Date(),
        rawText: JSON.stringify(scraped),
        rulesJson: {},
      },
    });

    logger.success('Novo programa criado', { 
      title: scraped.title,
      programId: program.id,
      contentHash: contentHash.substring(0, 8),
    });
    
    return { isNew: true, programId: program.id };
  } catch (error) {
    logger.error(`Erro ao processar programa: ${scraped.title}`, error);
    return { isNew: false };
  }
}

import { IngestionLogger } from '../lib/ingestion';

/**
 * Função principal de ingestão
 */
async function ingest() {
  const ingestionLogger = new IngestionLogger('fundo-ambiental');
  await ingestionLogger.start();
  
  logger.info('Iniciando ingestão do Fundo Ambiental');
  const startTime = Date.now();
  
  try {
    const programs = await scrapeAvisos();
    
    let newCount = 0;
    let skipCount = 0;
    const errors: Array<{ title: string; error: string }> = [];

    // Update initial stats
    await ingestionLogger.updateStats({ itemsFound: programs.length });

    for (const program of programs) {
      try {
        const details = await scrapeAvisoDetails(program.url);
        const enrichedProgram = { ...program, ...details };
        
        const result = await processProgram(enrichedProgram);
        if (result.isNew) {
          newCount++;
          await ingestionLogger.updateStats({ 
            itemsInserted: newCount,
            itemsSkipped: skipCount 
          });
        } else {
          skipCount++;
          await ingestionLogger.updateStats({ 
            itemsInserted: newCount,
            itemsSkipped: skipCount 
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
        errors.push({ title: program.title, error: errorMsg });
        logger.error(`Erro ao processar: ${program.title}`, error);
        await ingestionLogger.logError(`Erro em ${program.title}: ${errorMsg}`);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    logger.success('Ingestão concluída', {
      duration: `${duration}s`,
      programsFound: programs.length,
      newPrograms: newCount,
      skipped: skipCount,
      errors: errors.length,
    });
    
    if (errors.length > 0) {
      logger.warn('Alguns programas falharam', { errors });
    }

    await ingestionLogger.complete('completed');

    return {
      success: true,
      stats: {
        found: programs.length,
        new: newCount,
        skipped: skipCount,
        errors: errors.length,
        duration,
      },
      errors,
    };
  } catch (error) {
    logger.error('Ingestão falhou', error);
    await ingestionLogger.logError(error instanceof Error ? error : String(error));
    await ingestionLogger.complete('failed');
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  ingest()
    .then((result) => {
      console.log('\n📊 Resultado:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erro:', error);
      process.exit(1);
    });
}

export { ingest, scrapeAvisos, processProgram };
