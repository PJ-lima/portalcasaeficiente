🚀 Plano de Produção - Portal Casa Eficiente

✅ Decisões do Utilizador
Decisão	Resposta
Versionado vs Update-in-place	Versionado agora
Storage Supabase	Sim - usar para PDFs/docs
Staging separado	Sim - projeto Supabase separado
Prioridade	Favoritos API → ingestion_runs
📊 Estado Atual das Fases
Fase	Status	Documentação
Fase 1 - Segurança	✅ Concluída	
FASE1_TESTES.md
Fase 2 - Favoritos (schema)	✅ Concluída	
FASE2_TESTES.md
Fase 3 - Workers	✅ Concluída	
FASE3_TESTES.md
Fase 4 - Deploy Staging	⏳ Pendente	Este documento
Fase 5 - Notificações	⏳ Pendente	Futuro
🎯 Tarefas Restantes para Produção
Sprint Atual (Fundação)
✅ 1. Completar API Favoritos
Já implementado em 
FASE2_TESTES.md
:

✅ POST /api/programs/[slug]/save - Guardar
✅ DELETE /api/programs/[slug]/save - Remover
✅ GET /api/programs/saved - Listar
Validar:

bash
# Guardar programa
curl -X POST http://localhost:3000/api/programs/SLUG/save \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=TOKEN" \
  -d '{"notes": "Teste"}'
📝 2. Adicionar IngestionRun (PENDENTE)
[MODIFY] 
prisma/schema.prisma
Adicionar model para persistir logs de ingestão:

prisma
model IngestionRun {
  id            String   @id @default(cuid()) @map("id")
  source        String   @map("source")
  status        String   @map("status") // running, completed, failed
  startedAt     DateTime @default(now()) @map("started_at")
  finishedAt    DateTime? @map("finished_at")
  itemsFound    Int      @default(0) @map("items_found")
  itemsInserted Int      @default(0) @map("items_inserted")
  itemsUpdated  Int      @default(0) @map("items_updated")
  itemsSkipped  Int      @default(0) @map("items_skipped")
  errors        Json?    @map("errors")
  durationMs    Int?     @map("duration_ms")
  @@index([source])
  @@index([status])
  @@map("ingestion_runs")
}
Aplicar migração:

bash
npx prisma db push
# ou
npx prisma migrate dev --name add_ingestion_runs
📝 3. Supabase Storage para Documentos
Configuração no Dashboard Supabase:

Ir a Storage → Create bucket → documents
Políticas RLS:
Upload: Apenas utilizadores autenticados
Download: Público ou autenticado (decidir)
Uso típico:

typescript
const { data, error } = await supabase.storage
  .from('documents')
  .upload(`programs/${programId}/${filename}`, file);
Sprint Staging (Deploy)
📝 4. Criar Projeto Supabase Staging
Aceder a supabase.com
Criar novo projeto: casa-eficiente-staging
Copiar connection strings para .env.staging
📝 5. Vercel Configuration
[NEW] vercel.json
json
{
  "crons": [
    {
      "path": "/api/admin/ingest?source=all",
      "schedule": "0 6 * * *"
    }
  ]
}
Variáveis de ambiente Vercel:

DATABASE_URL=postgresql://...staging
DIRECT_URL=postgresql://...staging
NEXTAUTH_SECRET=<gerar-novo>
NEXTAUTH_URL=https://staging.casaeficiente.pt
📝 6. Primeiro User + Validar Auth
bash
# 1. Iniciar servidor
npm run dev
# 2. Registar user em http://localhost:3000/conta
# 3. Verificar na DB
npx prisma studio
# Ver tabela 'users' → deve existir o novo user
🧪 Verificação Final
Comandos de Teste (dos ficheiros FASE)
bash
# Executar worker Cascais
npx tsx src/workers/cascais.ts
# Executar worker Fundo Ambiental
npx tsx src/workers/fundo-ambiental.ts
# Testar endpoint admin (requer ADMIN role)
curl -X POST http://localhost:3000/api/admin/ingest \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=TOKEN" \
  -d '{"source": "all"}'
Checklist E2E
 Login funciona
 Listar apoios funciona (/apoios)
 Detalhe de apoio funciona
 Guardar favorito funciona
 Ver favoritos funciona (
/conta/favoritos
)
 Worker executa sem erros
 ingestion_runs persiste logs
📝 Próximas Implementações (após produção)
Notificações - Queue + email (Brevo/Resend)
Dashboard Admin - Ver ingestion_runs, erros, stats
Mais concelhos - Oeiras, Sintra, Lisboa

Comment
Ctrl+Alt+M