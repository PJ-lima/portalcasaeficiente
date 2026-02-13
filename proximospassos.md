# Portal Casa Eficiente — Próximos Passos (Documento de Execução)

## 🧭 Regra de ouro do roadmap 

**Primeiro garantimos o “pipeline mínimo confiável”**:
**ingestão → dedup → persistência → observabilidade → deploy**
Só depois: escala (mais concelhos), automação, notificações, dashboard “bonito”.

---

## ✅ Decisões já fechadas

| Tema                          | Decisão                                             |
| ----------------------------- | --------------------------------------------------- |
| Versionado vs update-in-place | **Versionado agora**                                |
| Storage no Supabase           | **Sim** (PDFs/docs)                                 |
| Staging separado              | **Sim** (projeto Supabase separado)                 |
| Prioridade atual              | **Favoritos API → ingestion_runs → staging/deploy** |

---

## 📊 Estado atual das fases

| Fase                                         |      Status | Evidência/Notas    |
| -------------------------------------------- | ----------: | ------------------ |
| Fase 1 — Segurança                           | ✅ Concluída | `FASE1_TESTES.md`  |
| Fase 2 — Favoritos (schema + API + UI)       | ✅ Concluída | `FASE2_TESTES.md`  |
| Fase 3 — Workers (Cascais + Fundo Ambiental) | ✅ Concluída | `FASE3_TESTES.md`  |
| Fase 4 — Deploy Staging                      |  ⏳ Pendente | **Este documento** |
| Fase 5 — Notificações                        |  ⏳ Pendente | Futuro             |

---

# 🎯 Sprint atual: “Staging real” (o que falta para ficar operacional)

## 1) ✅ Confirmar o *pipeline mínimo* em ambiente controlado (localhost)

**Objetivo:** fechar o loop inteiro sem depender de deploy.

### 1.1 Testes de Favoritos (já tem endpoints, valida comportamento)

Endpoints:

* `POST /api/programs/[slug]/save`
* `DELETE /api/programs/[slug]/save`
* `GET /api/programs/saved`

**Checklist funcional**

* Guardar não duplica (idempotência por `userId+programId`).
* Remover não dá erro se já não existe (ou dá 404 consistente, mas estável).
* Listar só mostra items do user autenticado.

> Nota: se guardas `notes`, decide já se isso entra no modelo agora (senão, remove do payload para evitar dívida).

---

## 2) 🧱 Persistência de observabilidade: `IngestionRun` (a peça mais “MVP-profissional”)

**Objetivo:** cada execução dos workers fica registada com métricas + erros.

### 2.1 Prisma model 

Cria/garante:

* `ingestion_runs` com índices por `source` e `status`
* campos: contadores + `errors` em JSON + `durationMs`

### 2.2 Padrão de logger (1 API para todos os workers)

A tua `IngestionLogger` deve suportar:

* `startRun(source, runId?)`
* `logStep({step, url, status, durationMs, ...})` (opcional se tiveres events)
* `finishRun({status, counters, errors})`

**Definition of Done**

* `npx tsx src/workers/fundo-ambiental.ts` cria 1 registo `completed/failed`
* `itemsFound/Inserted/Updated/Skipped` batem certo (mesmo que “certo” seja aproximado, mas consistente)
* erros aparecem em `errors` com contexto (url, step, stack/message)

---

## 3) 📦 Supabase Storage para documentos (bucket + policies)

**Objetivo:** poderes anexar PDFs/Docs a programas (e mais tarde: “checklist do cidadão”).

### 3.1 Bucket

* Bucket: `documents`
* Estrutura sugerida:

  * `programs/<programId>/<filename>`
  * `runs/<runId>/<source>.json` (opcional para debug)

### 3.2 Policies (pragmáticas)

Escolha típica para MVP:

* **Upload:** apenas `authenticated`
* **Download:** público **só se** forem documentos públicos (muitos serão), caso contrário `authenticated`

**Definition of Done**

* upload funciona via script/admin
* links funcionam sem expor dados privados

---

# 🚀 Fase 4 — Deploy Staging (Vercel + Supabase separado)

## 4) Criar projeto Supabase “staging”

**Objetivo:** staging não pode destruir produção, nem o inverso.

**Checklist**

* Novo projeto: `Staging Casa Eficiente`
* Connection strings para `.env.staging` (ou env vars na Vercel)
* RLS/policies aplicadas (especialmente dados do user)

---

## 5) Vercel: env vars + cron + endpoints protegidos

**Objetivo:** ingestão automática + execução manual/admin.

### 5.1 Variáveis

* `DATABASE_URL` (pooler, se aplicável)
* `DIRECT_URL` (se precisar para migrations; se não tenho IPv6, confirma estratégia)
* `NEXTAUTH_SECRET` (novo por ambiente)
* `NEXTAUTH_URL` (url do staging)
* `CRON_SECRET` (para proteger endpoint cron)

### 5.2 Cron (simples e seguro)

* `vercel.json` com cron para endpoint dedicado (ex: `/api/cron/ingest`)
* endpoint exige `CRON_SECRET` via header/query (header é mais limpo)

**Definition of Done**

* cron dispara e cria `IngestionRun` em staging
* falhas deixam rasto útil (erro + contadores)

---

## 6) Migrations (o ponto que costuma morder 😬)

Em staging/prod, a regra saudável é:

* **Dev:** `prisma migrate dev`
* **Staging/Prod:** `prisma migrate deploy`

**Definition of Done**

* deploy aplica migrations sem “drift”
* schema no Supabase staging == schema esperado pelo Prisma

---

## 7) E2E mínimo (anti-regressões idiotas)

Fluxo:

1. login
2. listar apoios (`/apoios`)
3. abrir detalhe
4. guardar favorito
5. ver favoritos (`/conta/favoritos`)
6. (bónus) correr ingestão manual admin

---

# 🧠 Extra (mas muito valioso): “situação das candidaturas” (Fundo Ambiental)

Isto é ouro porque dá **estado real**, e os utilizadores adoram “tracking”.

Páginas exemplo:

* `/plataforma-vales-de-eficiencia/beneficiarios-situacao-das-candidaturas.aspx`
* `/plataforma-vales-de-eficiencia/situacao-das-candidaturas.aspx`
* `/plataforma-vales-de-eficiencia/candidaturas-a-medidas-situacao-das-candidaturas.aspx`

## 8) Tabela de “ponto de situação” (model + worker)

**Objetivo:** ingerir tabelas de estado (por medida/edital/fase).

### 8.1 Modelo sugerido (mínimo e versionável)

* `ApplicationStatusSnapshot`

  * `id`, `source`, `url`, `capturedAt`
  * `programId?` (se conseguir mapear; senão fica null)
  * `tableHash` (dedup do snapshot)
  * `data` (JSON com linhas/colunas normalizadas)

### 8.2 Worker

* `src/workers/fundo-ambiental-status.ts`
* extrai tabela (thead/tbody)
* normaliza (strings → números/datas quando possível)
* dedup por `tableHash`

**Definition of Done**

* snapshot diário cria 1 registo quando muda
* UI admin simples mostra última tabela por URL
* (futuro) relaciona com programa e dispara notificação “estado mudou”

---

# 🔔 Próximo depois de staging: Notificações + dashboard (ordem certa)

## 9) Notificações (queue + batch sender)

**Sequência limpa**

1. deteção do “novo/alterado” (com versionado, fica elegante)
2. `user_notification_settings`
3. `notification_queue` (`pending/sent/failed`)
4. sender (cron separado)
5. provider (Brevo/Resend)

---

## 10) Dashboard admin (MVP)

Página protegida com:

* últimos `ingestion_runs`
* success rate por source
* top errors agregados
* inserted/updated/skipped por fonte

---

# 🧩 Checklist final “pronto para produzir”

Quando isto tudo for verdade:

* [ ] Staging com Supabase separado
* [ ] Migrations aplicadas via `migrate deploy`
* [ ] Cron a correr e a criar `IngestionRun`
* [ ] Workers sem falhas silenciosas (erros guardados)
* [ ] Favoritos OK end-to-end
* [ ] Storage bucket + policies OK (se já precisares)


Depois:

Notificações (queue + preferências) ainda pendente (page.tsx (line 113)).
Dashboard admin pendente (há API em route.ts (line 1), mas não há página /admin; page.tsx (line 4) só redireciona).
Hardening está parcial: há logging básico de runs (ingestion.ts (line 11), schema.prisma (line 242)), mas faltam alertas e budgets.
A cobertura municipal que listaste (DGAL + secções tipo + backstop DRE) já está implementada em base (municipal-discovery.ts (line 560), canonical-sources.ts (line 141), diario-republica.ts (line 95)).

---

## Nota técnica que te poupa dor

Com **versionado**, define já estas duas regras (e cola-as no README, sem vergonha):

1. **O que cria nova versão?** (hash mudou? certos campos mudaram? datas mudaram?)
2. **O que conta como “novo” para notificações?** (nova versão sempre? só quando muda elegibilidade/prazos?)



Isto evita o clássico “notificações a mais” vs “notificações a menos” — o drama eterno do software.

Se mantiveres esta ordem (observabilidade → staging → automação), o resto do produto fica… inevitável.


Depois da pausa começar por:
Ambiente de staging montado no Vercel. Já está ligado ao supabase.
Ter em atenção que já temos dois projetos no supabase, Projeto Casa Eficiente (main), Staging Casa Eficiente (staging). 

0) Regra de ouro (para não misturares staging/prod) _ VERCEL

Neste projeto portalcasaeficiente-staging, mete tudo em Environment = Production (porque o branch staging está a gerar Production Deployments neste projeto).

