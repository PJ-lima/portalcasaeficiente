# ✅ Fase 3: Workers/Scrapers - IMPLEMENTADA

## 📝 Alterações Aplicadas

### 1. Sistema de Deduplicação
**Ficheiro:** `src/lib/worker-utils.ts`

**Features implementadas:**
- ✅ `calculateContentHash()` - Hash SHA-256 para deduplicação
- ✅ `normalizeText()` - Normalização de texto
- ✅ `parseDate()` - Parser de datas PT flexível
- ✅ `WorkerLogger` - Logs estruturados em JSON

```typescript
// Exemplo de uso
const hash = calculateContentHash({ title, url, description });
logger.info('Programa processado', { programId, hash });
```

---

### 2. Worker Fundo Ambiental (Atualizado)
**Ficheiro:** `src/workers/fundo-ambiental.ts`

**Melhorias implementadas:**
- ✅ Deduplicação por `contentHash` (evita duplicados mesmo com slugs diferentes)
- ✅ Logs estruturados (JSON) para análise
- ✅ Validação de programas existentes por slug OU contentHash
- ✅ Estatísticas detalhadas (found/new/skipped/errors)
- ✅ Retry handling e error tracking

**Como executar:**
```bash
# Via script direto
npx tsx src/workers/fundo-ambiental.ts

# Via API (requer admin)
curl -X POST http://localhost:3000/api/admin/ingest \
  -H "Content-Type: application/json" \
  -H "Cookie: TOKEN_ADMIN" \
  -d '{"source": "fundo-ambiental"}'
```

---

### 3. Worker Piloto Cascais
**Ficheiro:** `src/workers/cascais.ts`

**Features do piloto:**
- ✅ Mock data para testes (3 programas exemplo)
- ✅ Validação rigorosa de dados antes de inserir
- ✅ Geolocalização automática (concelho Cascais)
- ✅ Deduplicação por contentHash
- ✅ Type safety completo

**Programas mock incluídos:**
1. Cascais Eficiente 2024 - Solar Fotovoltaico
2. Programa Isolamento Térmico Cascais
3. Cascais Verde - Bomba de Calor

**Validações aplicadas:**
- Título mínimo 10 caracteres
- URL válida (http/https)
- Descrição mínima 20 caracteres
- Status válido (OPEN/CLOSED/PLANNED)

**Como executar:**
```bash
# Via script direto
npx tsx src/workers/cascais.ts

# Via API (requer admin)
curl -X POST http://localhost:3000/api/admin/ingest \
  -H "Content-Type: application/json" \
  -H "Cookie: TOKEN_ADMIN" \
  -d '{"source": "cascais"}'
```

---

### 4. Endpoint Admin de Ingestão
**Ficheiro:** `src/app/api/admin/ingest/route.ts`

**POST /api/admin/ingest**
- ✅ Requer autenticação
- ✅ Requer role ADMIN
- ✅ Suporta múltiplas sources
- ✅ Execução paralela ou individual
- ✅ Estatísticas agregadas

**Parâmetros:**
```json
{
  "source": "fundo-ambiental" | "cascais" | "all"
}
```

**Resposta:**
```json
{
  "success": true,
  "duration": "15.34s",
  "sources": ["cascais"],
  "totalStats": {
    "found": 3,
    "new": 3,
    "skipped": 0,
    "errors": 0
  },
  "results": [...]
}
```

**GET /api/admin/ingest**
- Informações sobre sources disponíveis
- Exemplos de uso

---

## 🧪 Guia de Testes

### Pré-requisitos
1. ✅ Base de dados com seed de geografia (Cascais)
2. ✅ Utilizador com role ADMIN
3. ✅ Servidor dev a correr

### Teste 1: Worker Cascais (Script Direto)

```bash
# Executar worker standalone
cd /home/padja/Documents/Personal/freelas/portalcasaeficiente
npx tsx src/workers/cascais.ts

# Output esperado (JSON estruturado):
{
  "timestamp": "2026-02-06T...",
  "level": "INFO",
  "context": "cascais-worker",
  "message": "Iniciando ingestão de programas de Cascais"
}
...
{
  "success": true,
  "concelho": "Cascais",
  "stats": {
    "found": 3,
    "new": 3,
    "skipped": 0,
    "errors": 0,
    "duration": "1.23s"
  }
}
```

**Verificar na DB:**
```bash
# Ver programas criados
curl http://localhost:3000/api/programs | jq '.programs[] | select(.entity == "Câmara Municipal de Cascais")'
```

### Teste 2: Endpoint Admin de Ingestão

**Teste A: GET - Info sobre sources**
```bash
curl http://localhost:3000/api/admin/ingest \
  -H "Cookie: TOKEN_ADMIN"

# Esperado: Lista de sources disponíveis e exemplos
```

**Teste B: POST - Ingerir Cascais**
```bash
curl -X POST http://localhost:3000/api/admin/ingest \
  -H "Content-Type: application/json" \
  -H "Cookie: TOKEN_ADMIN" \
  -d '{"source": "cascais"}' | jq

# Esperado: 
# {
#   "success": true,
#   "duration": "1.50s",
#   "totalStats": {
#     "found": 3,
#     "new": 3,  (ou 0 se já existirem)
#     "skipped": 0,
#     "errors": 0
#   }
# }
```

**Teste C: POST - Ingerir todas sources**
```bash
curl -X POST http://localhost:3000/api/admin/ingest \
  -H "Content-Type: application/json" \
  -H "Cookie: TOKEN_ADMIN" \
  -d '{"source": "all"}' | jq '.totalStats'

# Esperado: Stats combinadas de Cascais + Fundo Ambiental
```

**Teste D: Sem autenticação (deve falhar)**
```bash
curl -X POST http://localhost:3000/api/admin/ingest \
  -H "Content-Type: application/json" \
  -d '{"source": "cascais"}'

# Esperado: {"error":"Não autenticado"} (401)
```

**Teste E: User não-admin (deve falhar)**
```bash
curl -X POST http://localhost:3000/api/admin/ingest \
  -H "Content-Type: application/json" \
  -H "Cookie: TOKEN_USER_NORMAL" \
  -d '{"source": "cascais"}'

# Esperado: {"error":"Acesso negado - requer role ADMIN"} (403)
```

### Teste 3: Deduplicação

**Cenário: Executar ingestão 2x seguidas**
```bash
# Primeira execução
npx tsx src/workers/cascais.ts
# Output: "new": 3

# Segunda execução (imediata)
npx tsx src/workers/cascais.ts
# Output: "new": 0, "skipped": 3 (deduplicados por contentHash)
```

**Verificar logs:**
```bash
# Os logs devem mostrar:
{
  "level": "INFO",
  "message": "Programa já existe (deduplicado)",
  "data": {
    "title": "...",
    "contentHash": "abc12345"
  }
}
```

### Teste 4: Validação de Dados

**Modificar mock para teste de validação:**
```typescript
// Editar src/workers/cascais.ts temporariamente
{
  title: 'X',  // Muito curto
  url: 'invalid',  // URL inválida
  description: 'abc',  // Descrição muito curta
}
```

**Executar:**
```bash
npx tsx src/workers/cascais.ts

# Esperado: Erro de validação nos logs
{
  "level": "ERROR",
  "message": "Programa inválido",
  "data": {
    "errors": [
      "Título inválido ou muito curto",
      "URL inválida",
      "Descrição inválida ou muito curta"
    ]
  }
}
```

---

## 📊 Estrutura de Logs

### Formato JSON Estruturado
```json
{
  "timestamp": "2026-02-06T10:30:00.000Z",
  "level": "INFO|ERROR|WARN|SUCCESS",
  "context": "cascais-worker|fundo-ambiental",
  "message": "Descrição da operação",
  "data": {
    // Dados adicionais específicos
  }
}
```

### Níveis de Log
- **INFO**: Operações normais (início, progresso)
- **SUCCESS**: Operações concluídas com sucesso
- **WARN**: Avisos (mock data, dados missing)
- **ERROR**: Erros que não param o processo
- **FATAL**: Erros críticos (não implementado)

---

## 🔐 Segurança

### Controle de Acesso
- ✅ Endpoint `/api/admin/ingest` requer role ADMIN
- ✅ Validação de sessão em todas requests
- ✅ Sem exposição de detalhes internos para não-admins

### Deduplicação Multi-Nível
1. **Por slug** - Evita programas com mesmo nome
2. **Por contentHash** - Evita duplicados mesmo com nomes ligeiramente diferentes
3. **Unique constraint na DB** - Última camada de proteção

---

## 📁 Ficheiros Criados/Modificados

1. [src/lib/worker-utils.ts](src/lib/worker-utils.ts) - Utils e logger
2. [src/workers/fundo-ambiental.ts](src/workers/fundo-ambiental.ts) - Worker atualizado
3. [src/workers/cascais.ts](src/workers/cascais.ts) - Worker piloto
4. [src/app/api/admin/ingest/route.ts](src/app/api/admin/ingest/route.ts) - Endpoint admin

---

## 🎯 Próximos Passos

**Implementar scraping real:**
1. Identificar URLs oficiais de Cascais
2. Implementar seletores CSS reais
3. Adicionar retry logic para requests
4. Rate limiting para não sobrecarregar sites

**Expandir para mais concelhos:**
1. Lisboa
2. Oeiras  
3. Sintra
4. (outros da área metropolitana)

**Automatização:**
1. Cron job para executar workers
2. Notificações quando novos programas
3. Dashboard de monitorização

**Deploy (Fase 4):**
- Vercel + Supabase
- Variables de ambiente
- Testes E2E

   **Fase 3: Workers/Scrapers**
- Escolher 1 concelho piloto (Cascais)
- Configurar worker Fundo Ambiental
- Adicionar dedup por `contentHash`
- Logs estruturados

**Fase 4: Deploy Staging**
- Vercel + Supabase
- Variáveis de ambiente
- Testes E2E básicos

**Fase 2:** UserSavedProgram (guardar programas favoritos)

**Fase 3:** Workers/Scrapers (ingestão de dados)

**Fase 4:** Deploy Staging (Vercel + Supabase)

---

**Data:** 6 de Fevereiro de 2026  
**Status:** ✅ IMPLEMENTADO - Pronto para testes  
**Workers disponíveis:** Fundo Ambiental + Cascais (piloto)
