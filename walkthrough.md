✅ Walkthrough: Produção Portal Casa Eficiente

Este documento detalha as alterações realizadas para preparar o projeto para produção e guia os passos de validação manual.

🚀 Alterações Realizadas
1. Persistência de Logs (IngestionRun)
Novo Model: Adicionado IngestionRun ao schema do Prisma.
Logger Centralizado: Criada classe 
IngestionLogger
 em 
src/lib/ingestion.ts
.
Workers Atualizados:
src/workers/fundo-ambiental.ts
: Integração completa com logs.
src/workers/cascais.ts
: Worker piloto (mock) com logs.
Benefício: Histórico completo de execuções, erros e métricas na base de dados.
2. Infraestrutura de Deploy
Vercel Cron: Configurado 
vercel.json
 para execução diária às 06:00.
Endpoint Cron: Criado /api/cron/ingest seguro (requer CRON_SECRET).
Admin API: Validado /api/admin/ingest para execução manual.
🧪 Verificação Automática (Já Executada)
Worker Cascais
bash
npx tsx src/workers/cascais.ts
Resultado: ✅ Sucesso. 3 programas processados/deduplicados. Logs persistidos.

Worker Fundo Ambiental
bash
npx tsx src/workers/fundo-ambiental.ts
Resultado: ✅ Sucesso. Execução completada e logada na BD.

🛠️ Validação Manual Necessária
1. Configurar Storage (Supabase)
Ação Necessária no Dashboard Supabase

Aceder ao projeto Supabase.
Ir a Storage > New Bucket.
Nome: documents.
Configurar como Public ou adicionar policies RLS adequadas.
2. Testar Fluxo de Utilizador
Ação Recomendada em localhost

Aceder a http://localhost:3000/conta.
Registar novo utilizador (isto valida a conexão Auth + BD).
Ir a Apoios e abrir um programa.
Clicar em Guardar Favorito ❤️.
Verificar em Conta > Favoritos.
3. Deploy Staging
Ação na Vercel

Criar novo projeto Vercel (conectado ao git).
Adicionar Variáveis de Ambiente:
DATABASE_URL / DIRECT_URL: Connection strings do Supabase.
NEXTAUTH_SECRET: Gerar novo (openssl rand -base64 32).
NEXTAUTH_URL: URL do deploy Vercel.
CRON_SECRET: Gerar string segura (para proteger endpoint cron).
📊 Comandos Úteis
Verificar Logs de Ingestão:

bash
npx prisma studio
# Abrir tabela 'IngestionRun'
Executar Ingestão Manualmente:

bash
# Requer cookie de sessão ADMIN
curl -X POST http://localhost:3000/api/admin/ingest \
  -H "Content-Type: application/json" \
  -d '{"source": "all"}'