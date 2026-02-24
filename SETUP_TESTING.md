# Guia de Configuração para Testes - Portal Casa Eficiente

Este documento descreve todos os passos necessários para preparar o projeto para testes iniciais.

## ✅ Estado Atual do Projeto

- **Build**: ✅ Compila sem erros
- **Linting**: ✅ Sem erros ou warnings
- **TypeScript**: ✅ Todas as verificações passam
- **Dependências**: ✅ Instaladas (algumas vulnerabilidades menores em dev dependencies)
- **Migrations**: ✅ Existentes e prontas para aplicar
- **Fases Completas**: Fase 1 (Segurança), Fase 2 (Favoritos), Fase 3 (Workers)

## 📋 Pré-requisitos

- Node.js 20.x ou superior
- PostgreSQL 14.x ou superior (ou acesso a Supabase)
- npm ou pnpm

## 🚀 Configuração Inicial

### 1. Instalar Dependências

```bash
npm install
# ou
pnpm install
```

### 2. Configurar Variáveis de Ambiente

Copie o ficheiro `.env.example` para `.env` e ajuste as configurações:

```bash
cp .env.example .env
```

**Variáveis essenciais para testes:**

```env
# Base de dados (desenvolvimento local ou Supabase)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"

# Autenticação (gere com: openssl rand -base64 32)
AUTH_SECRET="seu-secret-aqui"
NEXTAUTH_URL="http://localhost:3000"

# Opcional para testes de workers
DR_SEARCH_URL="https://dre.pt/web/guest/pesquisa"
FUNDO_AMBIENTAL_URL="https://www.fundoambiental.pt/avisos"
```

### 3. Preparar Base de Dados

**Opção A: Ambiente de Desenvolvimento Local**

```bash
# Aplicar todas as migrations
npm run db:migrate:dev

# (Opcional) Popular com dados geográficos
npm run db:seed
```

**Opção B: Staging/Produção (Supabase)**

```bash
# Aplicar migrations em ambiente staging
npm run db:migrate:deploy

# Verificar status das migrations
npm run db:migrate:status
```

### 4. Verificar Build

```bash
# Verificar que o projeto compila
npm run build
```

### 5. Iniciar em Modo de Desenvolvimento

```bash
npm run dev
```

O projeto estará disponível em: http://localhost:3000

## 🧪 Testes Disponíveis

### Teste de Segurança (Fase 1)

Execute o script de testes automatizado:

```bash
# Com o servidor em execução (npm run dev noutra janela)
./test-fase1.sh
```

Este teste verifica:
- ✅ APIs protegidas retornam 401 sem autenticação
- ✅ Middleware redireciona para login
- ✅ Servidor está funcional

### Testes Manuais Recomendados

1. **Autenticação**
   - [ ] Registar novo utilizador
   - [ ] Fazer login
   - [ ] Recuperação de password
   - [ ] Logout

2. **Favoritos (Fase 2)**
   - [ ] Guardar programa como favorito
   - [ ] Listar programas guardados
   - [ ] Remover favorito
   - [ ] Verificar idempotência (guardar 2x não duplica)

3. **Navegação**
   - [ ] Página inicial carrega
   - [ ] Listagem de apoios (`/apoios`)
   - [ ] Detalhe de programa (`/apoios/[slug]`)
   - [ ] Páginas protegidas redirecionam (`/conta/dossier`)

## 🔧 Workers de Ingestão

Para testar a ingestão de dados:

```bash
# Executar todos os workers
npm run worker:ingest

# Workers específicos
npm run worker:nacional      # Programas nacionais canónicos
npm run worker:fundo        # Fundo Ambiental
npm run worker:dr           # Diário da República
npm run worker:municipios   # Discovery municipal (308 municípios)
```

**Nota**: Os workers criam registos em `IngestionRun` para observabilidade.

## 🗄️ Ferramentas de Desenvolvimento

### Prisma Studio (Interface para BD)

```bash
npm run db:studio
```

Abre interface visual da base de dados em: http://localhost:5555

### Verificar Schema da Base de Dados

```bash
npm run db:migrate:status
```

## 📊 Observabilidade

O projeto inclui logging de ingestão:

- Cada execução de worker cria um registo em `ingestion_runs`
- Métricas disponíveis: `itemsFound`, `itemsInserted`, `itemsUpdated`, `itemsSkipped`
- Erros são guardados no campo `errors` (JSON)
- Duração da execução em `durationMs`

Consultar logs via Prisma Studio ou diretamente na tabela `ingestion_runs`.

## 🔒 Segurança

### Vulnerabilidades Conhecidas

Executar `npm audit` mostra 15 vulnerabilidades (2 low, 13 high):
- Maioria são em **dev dependencies** (eslint, archiver)
- Não afetam produção
- Updates automáticos aplicados onde possível sem breaking changes

### RLS Policies

O projeto inclui Row Level Security (RLS) para Supabase:
- Políticas aplicadas via migrations
- Usuários só acedem aos seus próprios dados (dossiers, favoritos)

## 📝 Estrutura de Testes por Fase

### ✅ Fase 1 - Segurança
- Script: `test-fase1.sh`
- Documentação: Ver `proximospassos.md`

### ✅ Fase 2 - Favoritos
- Endpoints testados:
  - `POST /api/programs/[slug]/save`
  - `DELETE /api/programs/[slug]/save`
  - `GET /api/programs/saved`

### ✅ Fase 3 - Workers
- Workers implementados e funcionais
- Logs de execução em `ingestion_runs`

### ⏳ Fase 4 - Deploy Staging (Próxima)
- Ver `proximospassos.md` para detalhes

## 🐛 Troubleshooting

### Erro: "relation does not exist"
```bash
# Re-aplicar migrations
npm run db:migrate:deploy
```

### Erro: Auth não funciona
```bash
# Verificar AUTH_SECRET está configurado
# Gerar novo: openssl rand -base64 32
```

### Build falha com erro de Google Fonts
- ✅ **Resolvido**: Projeto usa system fonts (sem dependência de CDN externo)

### Workers não executam
- Verificar `DATABASE_URL` está configurado
- Verificar conectividade à base de dados
- Ver logs no terminal

## 📚 Documentação Adicional

- **Roadmap**: `proximospassos.md`
- **Seed Geográfico**: `prisma/README_SEED_GEO.md`
- **README Principal**: `README.md`

## ✅ Checklist Final para Testes

Antes de considerar o projeto pronto para testes:

- [ ] Dependências instaladas (`npm install`)
- [ ] `.env` configurado com variáveis essenciais
- [ ] Base de dados criada
- [ ] Migrations aplicadas (`npm run db:migrate:dev` ou `deploy`)
- [ ] Build passa sem erros (`npm run build`)
- [ ] Servidor inicia (`npm run dev`)
- [ ] Homepage acessível (http://localhost:3000)
- [ ] Script de teste Fase 1 executado (`./test-fase1.sh`)
- [ ] Login/registo funcional
- [ ] API endpoints respondem corretamente

## 🎯 Próximos Passos

Após validar o ambiente local:

1. **Staging no Vercel**: Deploy em ambiente separado
2. **Supabase Staging**: Projeto dedicado para testes
3. **Cron Jobs**: Configurar ingestão automática
4. **Notificações**: Implementar queue + email sender
5. **Dashboard Admin**: Interface de observabilidade

Ver `proximospassos.md` para detalhes completos.
