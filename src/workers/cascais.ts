/**
 * Worker Piloto - Cascais
 * 
 * Ingestão de programas do município de Cascais.
 * Atualmente usa MOCK DATA para validar o pipeline.
 */

import { prisma } from '../lib/prisma';
import { slugify } from '../lib/utils';
import { calculateContentHash, WorkerLogger } from '../lib/worker-utils';
import { IngestionLogger } from '../lib/ingestion';

const logger = new WorkerLogger('cascais-worker');

// Mock data para teste
const MOCK_PROGRAMS = [
  {
    title: 'Cascais Eficiente 2024 - Apoio Solar Fotovoltaico',
    description: 'Apoio financeiro para a instalação de painéis solares fotovoltaicos em residências permanentes no concelho de Cascais. Comparticipação até 50% a fundo perdido.',
    url: 'https://www.cascais.pt/projeto/cascais-solar',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
  },
  {
    title: 'Programa Isolamento Térmico Cascais',
    description: 'Subsidiação de obras de melhoria do isolamento térmico em janelas, paredes e coberturas. Destinado a edifícios anteriores a 2006.',
    url: 'https://www.cascais.pt/projeto/isolamento-termico',
    status: 'OPEN',
  },
  {
    title: 'Cascais Verde - Bomba de Calor',
    description: 'Incentivo à substituição de esquentadores e caldeiras a gás por bombas de calor eficientes para AQS.',
    url: 'https://www.cascais.pt/projeto/bomba-calor',
    status: 'PLANNED',
  }
];

async function ingest() {
  const ingestionLogger = new IngestionLogger('cascais');
  await ingestionLogger.start();
  
  logger.info('Iniciando ingestão de programas de Cascais');
  const startTime = Date.now();

  try {
    let newCount = 0;
    let skipCount = 0;
    const errors: string[] = [];

    // Cascais ID (hardcoded for pilot)
    // Em produção seria buscado via: await prisma.concelho.findFirst({ where: { name: 'Cascais' } })
    const concelhoId = 'lisboa-cascais'; 

    await ingestionLogger.updateStats({ itemsFound: MOCK_PROGRAMS.length });

    for (const data of MOCK_PROGRAMS) {
      try {
        // Validação básica
        if (!data.title || data.title.length < 5) throw new Error('Título inválido');
        if (!data.url || !data.url.startsWith('http')) throw new Error('URL inválida');

        const slug = slugify(data.title);
        const contentHash = calculateContentHash({
          title: data.title,
          url: data.url,
          description: data.description
        });

        // Verificar duplicados
        const existing = await prisma.program.findFirst({
          where: {
            OR: [
              { slug },
              { sources: { some: { contentHash } } }
            ]
          }
        });

        if (existing) {
          logger.info('Programa já existe (deduplicado)', { slug, contentHash: contentHash.substring(0, 8) });
          skipCount++;
          await ingestionLogger.updateStats({ itemsSkipped: skipCount });
          continue;
        }

        // Criar programa
        const program = await prisma.program.create({
          data: {
            slug,
            title: data.title,
            summary: data.description,
            entity: 'Câmara Municipal de Cascais',
            programType: 'MUNICIPAL',
            status: data.status === 'PLANNED' ? 'PLANNED' : 'OPEN',
            officialUrl: data.url,
            geographies: {
              create: {
                level: 'MUNICIPALITY',
                municipality: 'Cascais',
                // Em produção usaríamos o ID correto do concelho se tivéssemos a relação
              }
            },
            sources: {
              create: {
                sourceType: 'MUNICIPAL_SITE',
                sourceUrl: data.url,
                fetchedAt: new Date(),
                contentHash,
                rawPayload: JSON.parse(JSON.stringify(data)),
              }
            }
          }
        });

        // Criar versão
        await prisma.programVersion.create({
          data: {
            programId: program.id,
            versionDate: new Date(),
            rawText: JSON.stringify(data),
            rulesJson: {},
          }
        });

        logger.success('Programa criado', { title: data.title, id: program.id });
        newCount++;
        await ingestionLogger.updateStats({ itemsInserted: newCount });

      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error(`Erro ao processar ${data.title}`, error);
        errors.push(msg);
        await ingestionLogger.logError(`Erro em ${data.title}: ${msg}`);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    logger.success('Ingestão de Cascais concluída', {
      duration: `${duration}s`,
      new: newCount,
      skipped: skipCount,
      errors: errors.length
    });

    await ingestionLogger.complete('completed');

    return {
      success: true,
      stats: {
        found: MOCK_PROGRAMS.length,
        new: newCount,
        skipped: skipCount,
        errors: errors.length,
        duration
      }
    };

  } catch (error) {
    logger.error('Falha fatal no worker de Cascais', error);
    await ingestionLogger.logError(error instanceof Error ? error : String(error));
    await ingestionLogger.complete('failed');
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  ingest().catch(console.error);
}

export { ingest };
