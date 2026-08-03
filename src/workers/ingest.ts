import { getAvailableSources, runIngestion, type IngestSourceId } from './registry';

export async function ingestAll(source: IngestSourceId = 'all') {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 RADAR DE APOIOS - Ingestão Automática');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  const startTime = Date.now();
  const results = await runIngestion(source);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 RESUMO DA INGESTÃO');
  console.log('═══════════════════════════════════════════════════════════\n');

  for (const result of results) {
    const status = result.success ? '✅' : '❌';
    const duration = result.stats.duration;
    console.log(`${status} ${result.source}: ${duration}s`);
    console.log(
      `   └─ found=${result.stats.found} new=${result.stats.new} updated=${result.stats.updated} skipped=${result.stats.skipped} errors=${result.stats.errors}`,
    );
    if (result.error) {
      console.log(`      Erro: ${result.error}`);
    }
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n✅ Sucesso: ${successful} | ❌ Falhas: ${failed}`);
  console.log(`⏱️  Duração total: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
  console.log('═══════════════════════════════════════════════════════════\n');

  return results;
}

/**
 * Agenda a próxima execução (para uso com cron)
 */
function getNextRunTime(): Date {
  // Simplificação: próxima execução amanhã às 6h
  const next = new Date();
  next.setDate(next.getDate() + 1);
  next.setHours(6, 0, 0, 0);
  
  return next;
}

export async function checkSourcesHealth(): Promise<void> {
  console.log('\n📋 Fontes de ingestão configuradas\n');
  for (const source of getAvailableSources()) {
    console.log(`- ${source.id} [${source.type}] ${source.name}`);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const args = process.argv.slice(2);
  const requestedSource = args[0] as IngestSourceId | undefined;
  
  if (args.includes('--status')) {
    checkSourcesHealth()
      .then(() => process.exit(0))
      .catch(error => {
        console.error(error);
        process.exit(1);
      });
  } else {
    ingestAll(requestedSource ?? 'all')
      .then(results => {
        const hasFailures = results.some(r => !r.success);
        console.log(`Próxima execução: ${getNextRunTime().toLocaleString('pt-PT')}`);
        process.exit(hasFailures ? 1 : 0);
      })
      .catch(error => {
        console.error('Erro fatal:', error);
        process.exit(1);
      });
  }
}
