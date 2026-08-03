# Portal Casa Eficiente — Próximos Passos (Documento de Execução)

_Revisto a 2026-08-01 após a pesquisa de mercado de 2026-07-19 (`docs/research/2026-07-19-dores-portugueses.md`). A versão anterior deste documento está no histórico do git._

---

## 🧭 Decisão de posicionamento (nova regra de ouro)

**O estado do apoio é o produto.**

A pesquisa (22 fontes, verificação adversarial) mudou a tese do projeto em dois pontos:

1. **Falamos de dinheiro, não de energia.** Só 2% dos portugueses citam "energia" como preocupação. 43% citam custo de vida, 28-43% habitação. A copy lidera com "há dinheiro do Estado para a tua casa e nós dizemos-te se ainda há verba" — não com classes energéticas.
2. **Os programas morrem e o produto tem de sobreviver a isso.** O Vale Eficiência — programa-âncora do nicho — foi **cancelado em fev-2026**, com 28 mil candidaturas elegíveis sem apoio e <3% de execução. O E-Lar esgotou 30 M€ em 6 dias. O Bairros Mais Sustentáveis morreu por "ausência total de candidaturas". Nenhuma fonte oficial agrega isto. Fazê-lo com honestidade é o diferencial.

Consequência técnica: `OPEN | CLOSED | PLANNED | UNKNOWN` não chega. Precisamos de representar dotação esgotada, suspensão, cancelamento e pagamentos em atraso — com histórico, não update-in-place.

A regra antiga mantém-se por baixo desta: **pipeline mínimo confiável primeiro** (ingestão → dedup → persistência → observabilidade → deploy), só depois escala e polimento.

---

## ✅ Decisões fechadas

| Tema                          | Decisão                                                             |
| ----------------------------- | ------------------------------------------------------------------- |
| Versionado vs update-in-place | **Versionado** (aplica-se agora também ao estado do programa)       |
| Storage no Supabase           | **Sim** (PDFs/docs) — ainda por implementar                         |
| Staging separado              | **Sim** — feito, projeto Supabase próprio                           |
| Âmbito do produto             | **Nicho "casa" na UI, schema generalizável** (campo `domain`)        |
| Marca                         | **Radar de Apoios** + tagline "Apoios do Estado para a tua casa" (2026-08-03) |
| Prioridade atual              | **Estado do programa → copy → alertas → elegibilidade real**         |

---

## 📊 Estado real do código (verificado a 2026-08-01)

### Já feito

| Item | Onde |
| --- | --- |
| Segurança / middleware (Fase 1) | `docs/testes/FASE1_TESTES.md` |
| Favoritos: schema + API + UI (Fase 2) | `docs/testes/FASE2_TESTES.md` |
| Workers Cascais + Fundo Ambiental (Fase 3) | `docs/testes/FASE3_TESTES.md`, `FASE3_RESULTADOS.md` |
| Model `IngestionRun` + índices | `prisma/schema.prisma:242` |
| `IngestionLogger` | `src/lib/ingestion.ts` |
| Endpoint cron + cron diário | `src/app/api/cron/ingest/route.ts`, `vercel.json` |
| Recomendações autenticadas por sessão NextAuth | `src/app/api/eligibility/recommendations/route.ts` |
| Staging Vercel + Supabase separado | env vars por ambiente |
| Cobertura municipal (DGAL + secções + backstop DRE) | `municipal-discovery.ts`, `canonical-sources.ts`, `diario-republica.ts` |

### Gaps reais

| # | Gap | Evidência |
| --- | --- | --- |
| 1 | `IngestionLogger` só usado por `src/workers/cascais.ts` — os restantes workers não registam runs | `grep -rl IngestionLogger src/` |
| 2 | Recomendações usam score mock (50/75/60) apesar de `src/lib/eligibility-engine.ts` já ser usado a sério em `/api/eligibility/check` | `recommendations/route.ts:89` |
| 3 | Zero integração com Supabase Storage | `grep -r supabase src/` = 0 |
| 4 | Sem `ApplicationStatusSnapshot` nem worker de "situação das candidaturas" | schema + `src/workers/` |
| 5 | Sem página `/admin` (só existe a API) | `src/app/api/admin/ingest/route.ts` |
| 6 | Zero notificações (models, queue, preferências, sender) | `grep -ri notification src/` = 0 |
| 7 | Regras de versionamento nunca definidas | esta secção existia como "nota técnica" e nunca foi resolvida |

---

# 🎯 Roadmap revisto

## Fase A — Fundação: estado do programa

**Objetivo:** a base de dados passa a saber dizer a verdade sobre um apoio.

### A.1 Schema (`prisma/schema.prisma`)

- `ProgramStatus` ganha `EXHAUSTED` (dotação esgotada), `SUSPENDED`, `CANCELLED`, `PAYMENTS_DELAYED`. Os 4 valores atuais mantêm-se.
- Novo enum `ProgramDomain` (`ENERGY_EFFICIENCY`, `RENOVATION`, `HOUSING_ACCESS`, `TAX_BENEFIT`, `SOCIAL`, `OTHER`) — é o que permite ingerir E-Lar/IFRRU/Porta 65 sem rebrand. Default `ENERGY_EFFICIENCY`.
- Novo enum `SupportType` (`VOUCHER`, `REIMBURSEMENT`, `SUBSIDY`, `LOAN`, `TAX_BENEFIT`, `MIXED`) — os labels já existiam em `src/lib/utils.ts` sem campo na DB.
- `Program` ganha `budgetTotal`, `budgetCommitted` (permite mostrar "3% executado"), `statusNote`, `statusSourceUrl`, `lastVerifiedAt`.
- Novo model `ProgramStatusEvent` — histórico de estado (`programId`, `status`, `note`, `sourceUrl`, `detectedAt`, `detectedBy`).
- Novo model `ApplicationStatusSnapshot` (`source`, `url`, `capturedAt`, `programId?`, `tableHash`, `data`).

Migração por `prisma migrate dev` (o `db:push` está desativado por política). Backfill: 1 `ProgramStatusEvent` por programa a partir do `status` atual.

### A.2 Ingestão

- `recordStatusChange()` em `src/lib/ingestion.ts` — escreve `ProgramStatusEvent` só quando o estado muda. Dedup num sítio só.
- `IngestionLogger` estendido a `fundo-ambiental.ts`, `diario-republica.ts`, `municipal-discovery.ts`, `discovery-engine.ts`, `ingest.ts`.
- Novo `src/workers/fundo-ambiental-status.ts` — scrape das páginas "situação das candidaturas", dedup por `tableHash`:
  - `/plataforma-vales-de-eficiencia/beneficiarios-situacao-das-candidaturas.aspx`
  - `/plataforma-vales-de-eficiencia/situacao-das-candidaturas.aspx`
  - `/plataforma-vales-de-eficiencia/candidaturas-a-medidas-situacao-das-candidaturas.aspx`
- `docs/versionamento.md` — resolve finalmente a nota técnica: o que cria `ProgramVersion`, o que cria `ProgramStatusEvent`, o que notifica.

**Definition of Done**
- `npx tsx src/workers/fundo-ambiental.ts` cria 1 `IngestionRun` `completed/failed` com contadores coerentes e erros com contexto (url, step, message).
- Correr o worker de status duas vezes seguidas cria 1 snapshot, não 2.

## Fase B — Posicionamento e honestidade na UI

- Hero de `src/app/page.tsx` lidera com dinheiro; o painel-certificado passa a ilustração secundária.
- `ProgramStatusBadge` + `ProgramStatusTimeline`, alimentados por `ProgramStatusEvent`.
- `/apoios/[slug]` mostra bloco "estado real": badge, `statusNote`, barra dotação/comprometido, histórico, `lastVerifiedAt`, link à fonte.
- Filtros de estado e de domínio em `ProgramFilters.tsx`.
- `sobre` e `como-funciona` dizem explicitamente o que o portal **não** controla (se o Estado paga). É credibilidade, não disclaimer.

## Fase C — Alertas

Justificação: o E-Lar esgotou 30 M€ em 6 dias. Quem não é avisado no dia, perde.

1. `UserNotificationSettings` (canais, domínios, concelhos, tipos de obra, frequência)
2. `NotificationQueue` (`NEW_PROGRAM` | `STATUS_CHANGE` | `DEADLINE`; `pending|sent|failed`)
3. Produtor em `recordStatusChange` + criação de programa
4. Sender em `/api/cron/notify` (cron separado, `CRON_SECRET`), provider Resend — já configurado em `src/lib/email.ts`
5. `/conta/notificacoes`

## Fase D — Elegibilidade real, inventário e admin

- Matar o mock em `recommendations/route.ts` reutilizando `normalizeProgramRules` + engine, como `/api/eligibility/check` já faz.
- Alargar `canonical-sources.ts`: E-Lar, IFRRU/reabilitação, Porta 65, benefícios fiscais IMI/IVA. Sem inventário não há produto — o Vale Eficiência morreu e o substituto só chega em 2027.
- `/admin`: últimos `ingestion_runs`, success rate por source, top errors, último snapshot por URL.

## Fase E — SEO de dor ✅ (2026-08-03)

Alvos: "vale eficiência pagamentos atraso", "apoio janelas 2026", "apoios casa [concelho]".

Feito: `metadataBase` + canonicals via `buildMetadata()`, `robots.ts`, `sitemap.ts` (revalidate 1h), JSON-LD (`Organization`/`WebSite`/`BreadcrumbList`/`GovernmentService`/`CollectionPage`), rota `/apoios/concelho/[slug]` só para concelhos com apoio municipal, `noindex` em todas as rotas privadas, OG image, e remoção de 3 links 404 no footer.

Resultados e limitações em `docs/testes/FASEE_TESTES.md`. Só existe 1 página de concelho (Cascais) até o inventário da Fase D crescer.

---

## 🔭 Ainda em aberto (não agendado)

- **Supabase Storage** (bucket `documents`, upload só `authenticated`) — mantém-se válido, mas só faz falta quando anexarmos PDFs a programas.
- ~~**Generalização para "Radar de Apoios do Estado"**~~ — **decidido a 2026-08-03**: a marca passou a **Radar de Apoios**, com a tagline _"Apoios do Estado para a tua casa"_. O rebrand foi feito só ao nome e à metadata; a copy de posicionamento continua a falar de casa, que é o que o inventário atual sustenta. Ver secção abaixo.

---

## 🧩 Checklist "pronto para produzir"

- [x] Staging com Supabase separado
- [x] Migrations aplicadas via `migrate deploy`
- [x] Cron a correr
- [ ] Estado real do programa modelado e visível
- [ ] Workers sem falhas silenciosas (todos com `IngestionLogger`)
- [ ] Alertas a funcionar end-to-end
- [ ] Elegibilidade real (sem mock)
- [ ] Storage bucket + policies (quando for preciso)

---

## ⚠️ Regra operacional Vercel/Supabase

Existem dois projetos Supabase: **Casa Eficiente** (main) e **Staging Casa Eficiente** (staging).

No projeto Vercel `portalcasaeficiente-staging`, todas as env vars vão em **Environment = Production** — porque o branch `staging` gera Production Deployments nesse projeto. Misturar isto é a forma mais rápida de escrever em produção a pensar que se está em staging.

## 🏷️ Rebrand para Radar de Apoios (2026-08-03)

Feito: nome e metadata. `SITE_NAME`/`SITE_TAGLINE` em `src/lib/seo.ts` são a fonte única; os títulos das páginas passaram a ser curtos e o sufixo `| Radar de Apoios` é composto no `buildMetadata()`. Também mudaram Header, Footer, emails de recuperação de password, logs dos workers e o User-Agent dos crawlers (agora `RadarDeApoiosBot/1.0`, centralizado em `src/lib/user-agent.ts`).

**Não** mudou, de propósito:

- **Copy de posicionamento.** `/sobre` e `/como-funciona` continuam a falar de casa e eficiência energética, porque é o que o inventário sustenta hoje. Reposicionar antes da Fase D seria prometer apoios que ainda não temos.
- **Logos e favicon.** Os ficheiros em `assets/media/` têm "Portal Casa Eficiente" desenhado na imagem, e o `public/og-image.png` foi gerado a partir deles. Ficam até haver assets novos — é a incoerência visível que sobra.
- **Pasta, repositório e projeto Vercel.** Continuam `portalcasaeficiente`. Decisão à parte.
- **`prisma/seed.ts`** mantém `teste@casaeficiente.pt` — mudar o email criaria um utilizador duplicado nas bases já semeadas.

Domínio: por registar. `radardeapoios.pt` passa a ser o candidato natural.

## ⚠️ Regra operacional de indexação (SEO)

Consequência directa da regra acima: `NODE_ENV` e `VERCEL_ENV` valem `production` em staging **e** em produção, logo **nenhum dos dois pode decidir se o site é indexável**.

- `SITE_INDEXABLE` é o único discriminador. Só o valor exacto `"true"` permite indexar; ausente ou qualquer outra coisa bloqueia tudo (`Disallow: /` + sitemap vazio + `noindex` nas páginas).
- Pôr `SITE_INDEXABLE=true` **apenas** no projecto Vercel de produção real, e só quando o domínio estiver activo. Nunca no projecto de staging, nunca em Preview.
- `SITE_URL` é a URL base de canonicals, sitemap, OG e JSON-LD. Sem domínio registado, deixar vazia — cai para `VERCEL_PROJECT_PRODUCTION_URL`, depois `VERCEL_URL`, depois localhost.
- `robots.txt`, `sitemap.xml` e o `metadataBase` são resolvidos **no build**. Mudar qualquer uma destas variáveis exige **redeploy** — editar a env var na Vercel não chega.

Verificação obrigatória depois de qualquer deploy de staging:

```
curl -s https://portalcasaeficiente-staging.vercel.app/robots.txt   # tem de dar Disallow: /
```

Detalhe completo em `docs/testes/FASEE_TESTES.md`.
