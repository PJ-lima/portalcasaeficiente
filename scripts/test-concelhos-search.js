#!/usr/bin/env node

/**
 * Script de teste para verificar o endpoint de pesquisa de concelhos
 * 
 * Uso: node scripts/test-concelhos-search.js [termo_pesquisa]
 * Exemplo: node scripts/test-concelhos-search.js cas
 */

const searchTerm = process.argv[2] || 'cas';

console.log(`🔍 Testando pesquisa de concelhos com termo: "${searchTerm}"\n`);

fetch(`http://localhost:3000/api/concelhos/search?q=${searchTerm}`)
  .then(res => res.json())
  .then(data => {
    if (!data.success) {
      console.error('❌ Erro na resposta:', data.error);
      process.exit(1);
    }

    console.log(`✅ Encontrados ${data.data.length} concelhos:\n`);
    
    data.data.slice(0, 10).forEach((concelho, i) => {
      console.log(`  ${i + 1}. ${concelho.name} (${concelho.distrito})`);
    });

    if (data.data.length > 10) {
      console.log(`\n  ... e mais ${data.data.length - 10} resultados`);
    }

    console.log('\n✅ Teste concluído com sucesso!');
  })
  .catch(err => {
    console.error('❌ Erro ao conectar ao servidor:', err.message);
    console.log('\n💡 Certifica-te que o servidor está a correr: npm run dev');
    process.exit(1);
  });
