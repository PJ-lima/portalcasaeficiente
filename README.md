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

Adicione notas do projecto aqui.
