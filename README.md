# portalcasaeficiente

Estrutura inicial do projecto preparada para desenvolvimento.

Tree alvo (exemplo):

```
portalcasaeficiente/
├─ README.md
├─ package.json
├─ pnpm-lock.yaml
├─ next.config.js
├─ tsconfig.json
├─ tailwind.config.ts
├─ postcss.config.js
├─ .env.example
├─ .gitignore
├─ prisma/
├─ public/
├─ media/
├─ src/
└─ scripts/
```

Instruções rápidas:

- Instalar dependências: `pnpm install` (ou `npm install`)
- Correr em dev: `pnpm dev`
- Base de dados em dev: `npm run db:migrate:dev`
- Aplicar migrations em ambiente alvo: `npm run db:migrate:deploy`

Ingestão (workers):

- Todas as fontes: `npm run worker:ingest`
- Core nacional: `npm run worker:nacional`
- Cobertura municipal: `npm run worker:municipios`
- Source específica: `npx tsx src/workers/ingest.ts <source-id>`

Validação de ambiente:

- Dev: `npm run env:check`
- Staging: `npm run env:check:staging`
- Produção: `npm run env:check:prod`

## Staging (Vercel + Supabase)

Objetivo: ter um ambiente separado de produção para validar ingestão, autenticação e cron.

### 1) Criar Supabase de staging (separado)

- Criar um novo projeto Supabase dedicado a staging.
- Obter duas URLs PostgreSQL:
  - `DATABASE_URL`: usar a URL pooler (porta `6543`, `pgbouncer=true`).
  - `DIRECT_URL`: usar a URL direta (porta `5432`) para migrações.

### 2) Configurar variáveis no Vercel (environment Preview ou Staging)

Obrigatórias:

- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET`
- `NEXTAUTH_URL` (ex: `https://<teu-staging>.vercel.app`)
- `CRON_SECRET`

Recomendadas:

- `RESEND_API_KEY`
- `EMAIL_FROM`
- `PASSWORD_RESET_TOKEN_TTL_MINUTES`

Opcional tuning ingestão:

- `MUNICIPAL_DISCOVERY_LIMIT`
- `MUNICIPAL_REQUEST_DELAY_MS`
- `MUNICIPAL_SCAN_PATH_LIMIT`

### 3) Migrar base de dados de staging

- Executar migrations apontando para a DB de staging:
  - `npm run db:migrate:deploy`

### 4) Validar o ambiente

- Validar variáveis:
  - `npm run env:check:staging`
- Trigger manual de ingestão admin ou cron endpoint:
  - `GET /api/cron/ingest?source=all` com header `Authorization: Bearer <CRON_SECRET>`

Adicione notas do projecto aqui.
