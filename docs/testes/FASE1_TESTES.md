# ✅ Fase 1: Segurança - IMPLEMENTADA

## 📝 Alterações Aplicadas

### 1. Middleware - Proteção de Rotas
**Ficheiro:** `src/middleware.ts`

Rotas protegidas adicionadas:
- ✅ `/conta/dossier` - Requer autenticação
- ✅ `/conta/recomendacoes` - Requer autenticação

### 2. API Dossiê - Segurança
**Ficheiro:** `src/app/api/dossier/route.ts`

**Antes (INSEGURO):**
```typescript
// GET /api/dossier?userId=xxx
const userId = searchParams.get('userId');
```

**Depois (SEGURO):**
```typescript
// GET /api/dossier
const session = await auth();
const dossier = await prisma.userDossier.findUnique({
  where: { userId: session.user.id }
});
```

**Mudanças:**
- ❌ Removido: `userId` do query parameter
- ✅ Adicionado: Validação de sessão em GET e POST
- ✅ Adicionado: Validação de `concelhoId` antes de salvar
- ✅ Usa sempre `session.user.id`

### 3. API Recommendations - Segurança
**Ficheiro:** `src/app/api/eligibility/recommendations/route.ts`

**Antes (INSEGURO):**
```typescript
// GET /api/eligibility/recommendations?userId=xxx
const userId = searchParams.get('userId');
```

**Depois (SEGURO):**
```typescript
// GET /api/eligibility/recommendations
const session = await auth();
const userDossier = await prisma.userDossier.findUnique({
  where: { userId: session.user.id }
});
```

**Mudanças:**
- ❌ Removido: `userId` do query parameter
- ✅ Adicionado: Validação de sessão
- ✅ Usa sempre `session.user.id`

### 4. Utils - Normalização de Concelhos
**Ficheiro:** `src/lib/utils.ts`

Nova função adicionada:
```typescript
export function normalizeConcelho(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
```

**Propósito:** Comparação robusta de nomes de concelhos (ignora acentos, case, espaços extras).

---

## 🧪 Guia de Testes

### Pré-requisitos
1. Base de dados a correr com seed de geografia executado
2. Servidor dev a correr: `npm run dev`
3. NextAuth configurado

### Teste 1: Proteção de Rotas (Middleware)

**Teste A: Acesso sem autenticação (deve redirecionar)**
```bash
# Tentar aceder a /conta/dossier sem login
curl -I http://localhost:3000/conta/dossier
# Esperado: 307 redirect para /conta?callbackUrl=/conta/dossier
```

**Teste B: Acesso com autenticação (deve permitir)**
```bash
# 1. Fazer login e obter cookie de sessão
# 2. Aceder com cookie válido
# Esperado: 200 OK
```

### Teste 2: API Dossiê Segura

**Teste A: GET sem autenticação (deve falhar)**
```bash
curl http://localhost:3000/api/dossier
# Esperado: {"error":"Não autenticado"} (401)
```

**Teste B: POST com concelho inválido (deve falhar)**
```bash
# Com sessão válida, mas concelhoId errado
curl -X POST http://localhost:3000/api/dossier \
  -H "Content-Type: application/json" \
  -d '{
    "concelhoId": "concelho-inventado-123",
    "address": "Rua Teste",
    "postalCode": "2750-000"
  }'
# Esperado: {"error":"Concelho inválido"} (400)
```

**Teste C: POST com dados válidos (deve funcionar)**
```bash
# Com sessão válida e concelhoId correto
curl -X POST http://localhost:3000/api/dossier \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=SEU_TOKEN_AQUI" \
  -d '{
    "address": "Rua do Teste, 123",
    "postalCode": "2750-000",
    "concelhoId": "lisboa-cascais",
    "isMainResidence": true,
    "buildingYear": 1990,
    "propertyType": "apartamento",
    "householdSize": 3,
    "annualIncome": 25000,
    "hasSocialTariff": false,
    "energyCertificate": "D"
  }'
# Esperado: {"success":true,"dossier":{...}}
```

### Teste 3: API Recommendations Segura

**Teste A: GET sem autenticação (deve falhar)**
```bash
curl http://localhost:3000/api/eligibility/recommendations
# Esperado: {"error":"Não autenticado"} (401)
```

**Teste B: GET sem dossiê criado (deve falhar)**
```bash
# Com sessão válida mas sem ter criado dossiê
# Esperado: {"error":"Utilizador não tem dossiê criado"} (404)
```

**Teste C: GET com dossiê (deve funcionar)**
```bash
# Com sessão válida e dossiê criado
curl http://localhost:3000/api/eligibility/recommendations \
  -H "Cookie: next-auth.session-token=SEU_TOKEN_AQUI"
# Esperado: {"user":{...},"recommendations":[...],"total":N}
```

### Teste 4: Normalização de Concelhos

**Teste na consola Node:**
```typescript
import { normalizeConcelho } from './src/lib/utils';

console.log(normalizeConcelho('Póvoa de Varzim')); 
// "povoa de varzim"

console.log(normalizeConcelho('  Braga  '));
// "braga"

console.log(normalizeConcelho('Câmara de Lobos'));
// "camara de lobos"
```

---

## ✅ Checklist de Verificação

Antes de considerar a Fase 1 completa, verificar:

- [ ] Middleware bloqueia `/conta/dossier` sem sessão
- [ ] Middleware bloqueia `/conta/recomendacoes` sem sessão
- [ ] `/api/dossier` GET retorna 401 sem sessão
- [ ] `/api/dossier` POST retorna 401 sem sessão
- [ ] `/api/dossier` POST valida concelhoId
- [ ] `/api/dossier` ignora qualquer `userId` enviado no body
- [ ] `/api/eligibility/recommendations` retorna 401 sem sessão
- [ ] Não é possível aceder ao dossiê de outro utilizador
- [ ] `normalizeConcelho()` está exportada e funciona

---

## 🔒 Vulnerabilidades Corrigidas

### Antes (CRÍTICO)
```bash
# Qualquer pessoa podia aceder ao dossiê de qualquer utilizador
curl "http://localhost:3000/api/dossier?userId=outro-user-123"
# ❌ Acesso não autorizado
```

### Depois (SEGURO)
```bash
# Só o utilizador autenticado pode aceder ao seu dossiê
curl "http://localhost:3000/api/dossier"
# ✅ Requer autenticação, usa session.user.id
```

---

## 📊 Próximos Passos

Após validar estes testes, avançar para:

**Fase 2:** UserSavedProgram (guardar programas favoritos)

**Fase 3:** Workers/Scrapers (ingestão de dados)

**Fase 4:** Deploy Staging (Vercel + Supabase)

---

## 🛠️ Como Testar com NextAuth

### Opção 1: Via Browser (Recomendado)
1. Abrir `http://localhost:3000/conta`
2. Fazer login/registar
3. Ir para `/conta/dossier` e preencher
4. Ir para `/conta/recomendacoes` e verificar

### Opção 2: Via cURL com Cookie
1. Fazer login e copiar cookie da sessão (dev tools)
2. Usar nos comandos cURL:
```bash
curl -H "Cookie: next-auth.session-token=TOKEN" \
  http://localhost:3000/api/dossier
```

### Opção 3: Via Postman/Insomnia
1. Configurar autenticação NextAuth
2. Testar endpoints com sessão válida

---

**Data:** 6 de Fevereiro de 2026  
**Status:** ✅ IMPLEMENTADO - Pronto para testes
