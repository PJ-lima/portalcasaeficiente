# ✅ FASE 3 - Workers/Scrapers - CONCLUÍDA

## 🎯 Objetivos
- ✅ Worker Cascais (concelho piloto)
- ✅ Worker Fundo Ambiental (nacional)
- ✅ Deduplicação por `contentHash` (SHA-256)
- ✅ Logs estruturados (JSON)
- ✅ Endpoint admin para trigger manual

---

## 📊 Resultados da Execução

### Teste 1: Worker Cascais (Script Direto)
```bash
npx tsx src/workers/cascais.ts
```

**Resultado:**
- ✅ 3 programas encontrados (mock data)
- ✅ 3 programas criados com sucesso
- ✅ 0 erros
- ✅ Logs estruturados em JSON

**Programas criados:**
1. `cascais-eficiente-2024-apoio-solar-fotovoltaico` (contentHash: ac8a41d9)
2. `programa-isolamento-termico-cascais` (contentHash: 8ea8f408)
3. `cascais-verde-bomba-de-calor` (contentHash: d9f248e1)

---

## 🧪 Próximos Testes

### Teste 2: Endpoint Admin (via API)

**Pré-requisito:** Ter um utilizador ADMIN na base de dados.

#### 1. Criar utilizador ADMIN (via Supabase ou Prisma Studio)
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'seu-email@example.com';
```

#### 2. Fazer login e obter session
```bash
# Fazer login na aplicação ou usar NextAuth para obter cookie de sessão
```

#### 3. Testar ingestão Cascais
```bash
curl -X POST http://localhost:3000/api/admin/ingest \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=SEU_TOKEN" \
  -d '{"source": "cascais"}'
```

**Resposta esperada:**
```json
{
  "success": true,
  "results": {
    "cascais": {
      "success": true,
      "concelho": "Cascais",
      "stats": {
        "found": 3,
        "new": 0,
        "skipped": 3,
        "errors": 0,
        "duration": "0.50"
      }
    }
  }
}
```

#### 4. Testar ingestão Fundo Ambiental
```bash
curl -X POST http://localhost:3000/api/admin/ingest \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=SEU_TOKEN" \
  -d '{"source": "fundo-ambiental"}'
```

#### 5. Testar ingestão de todos os workers
```bash
curl -X POST http://localhost:3000/api/admin/ingest \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=SEU_TOKEN" \
  -d '{"source": "all"}'
```

---

## 🔐 Testes de Segurança

### Teste 1: Endpoint requer autenticação
```bash
curl -X POST http://localhost:3000/api/admin/ingest \
  -H "Content-Type: application/json" \
  -d '{"source": "cascais"}'
```

**Resposta esperada:** `401 Unauthorized`

### Teste 2: Endpoint requer role ADMIN
```bash
# Com utilizador role='user'
curl -X POST http://localhost:3000/api/admin/ingest \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=USER_TOKEN" \
  -d '{"source": "cascais"}'
```

**Resposta esperada:** `403 Forbidden`

---

## 🔍 Validar Deduplicação

### 1. Executar worker 2x
```bash
npx tsx src/workers/cascais.ts
npx tsx src/workers/cascais.ts
```

**Resultado esperado:**
- Primeira execução: 3 novos programas
- Segunda execução: 0 novos, 3 skipped (deduplicados por contentHash)

### 2. Verificar logs
```bash
npx tsx src/workers/cascais.ts 2>&1 | grep -i "deduplicado"
```

**Resultado esperado:**
```json
{"level":"INFO","message":"Programa já existe (deduplicado)","data":{"slug":"cascais-eficiente-2024-apoio-solar-fotovoltaico","contentHash":"ac8a41d9"}}
```

---

## 📝 Validar Logs Estruturados

Todos os logs seguem o formato:
```json
{
  "timestamp": "2026-02-06T18:32:07.032Z",
  "level": "INFO|SUCCESS|WARN|ERROR",
  "context": "cascais-worker|fundo-ambiental",
  "message": "Descrição legível",
  "data": { "campo": "valor" }
}
```

**Exemplo de log de erro:**
```json
{
  "timestamp": "2026-02-06T18:32:07.032Z",
  "level": "ERROR",
  "context": "cascais-worker",
  "message": "Erro ao processar programa: Título do Programa",
  "data": {
    "error": "Mensagem de erro",
    "stack": "Stack trace..."
  }
}
```

---

## 🐛 Troubleshooting

### Erro: "Concelho 'lisboa-cascais' não encontrado"
```bash
# Criar o concelho na base de dados
npx prisma studio
# Ou via script SQL:
INSERT INTO "Concelho" (id, name, "districtId") 
VALUES ('lisboa-cascais', 'Cascais', 'distrito-lisboa-id');
```

### Erro: "Port 3000 already in use"
```bash
pkill -f "next dev"
npm run dev
```

### Logs não aparecem
```bash
# Verificar se worker está a usar WorkerLogger
grep -r "WorkerLogger" src/workers/
```

---

## ✨ Features Implementadas

### 1. Deduplicação Multi-Camada
- **Por slug:** Verifica primeiro se programa com mesmo nome já existe
- **Por contentHash:** SHA-256 do conteúdo (title + url + description)
- **Tabela sources:** Regista todas as fontes com hash único

### 2. Logs Estruturados
- **Classe WorkerLogger:** Logs em JSON para fácil parsing
- **Níveis:** INFO, SUCCESS, WARN, ERROR
- **Context:** Identifica qual worker gerou o log
- **Data:** Metadata estruturada para cada log

### 3. Worker Cascais (Piloto)
- Mock data com 3 programas realistas
- Validação de campos obrigatórios
- Geolocalização automática (distrito + concelho)
- Versões de programa rastreadas

### 4. Worker Fundo Ambiental
- Scraping de avisos públicos
- Filtro por palavras-chave relevantes
- Extração de detalhes de cada aviso
- Retry e timeouts configurados

### 5. Endpoint Admin
- **POST /api/admin/ingest**
- Requer role ADMIN
- Suporta source: 'cascais' | 'fundo-ambiental' | 'all'
- Retorna stats agregadas de todos os workers

---

## 📦 Próximos Passos (Fase 4)

1. **Implementar scraping real para Cascais**
   - Substituir mock data por scraping do site da Câmara Municipal
   
2. **Adicionar mais concelhos**
   - Sintra, Oeiras, Lisboa, etc.
   
3. **Agendar execução automática**
   - Cron job diário via Vercel Cron
   - Ou trigger via GitHub Actions
   
4. **Notificações de novos programas**
   - Email para utilizadores quando há novos apoios
   - Filtrar por concelho e perfil do utilizador

5. **Dashboard de monitorização**
   - Ver stats de ingestão em tempo real
   - Histórico de execuções
   - Erros e alertas

---

## ✅ Checklist Final

- [x] Worker utils criados (hash, logger, parsers)
- [x] Worker Cascais implementado e testado
- [x] Worker Fundo Ambiental implementado
- [x] Deduplicação funcional (slug + contentHash)
- [x] Logs estruturados em JSON
- [x] Endpoint admin com autenticação
- [x] Validação de role ADMIN
- [x] Testes de script direto OK
- [ ] Testes de endpoint admin (requer login)
- [ ] Deploy staging (Fase 4)
