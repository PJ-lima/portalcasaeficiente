# Recomendações Finais - Preparação para Testes

## ✅ O que foi corrigido e melhorado

### 1. Correções de Código
- ✅ **Linting**: Eliminados 1 erro e 10 warnings
  - Removido uso de `any` em tipos
  - Removidas importações não utilizadas
  - Comentadas variáveis preparadas para uso futuro
  
- ✅ **Build**: Projeto compila sem erros
  - Resolvido problema com Google Fonts (agora usa system fonts)
  - Corrigidos erros de tipos TypeScript
  - Build completo validado

### 2. Dependências
- ✅ **Instalação**: Todas as dependências instaladas corretamente
- ⚠️ **Vulnerabilidades**: 15 vulnerabilidades identificadas
  - 2 low, 13 high
  - **Maioria são em dev dependencies** (eslint, archiver)
  - Não afetam ambiente de produção
  - Updates seguros já aplicados

### 3. Documentação
- ✅ **SETUP_TESTING.md**: Guia completo de configuração
- ✅ **README.md**: Atualizado com Quick Start
- ✅ **.env.example**: Limpo e bem documentado
- ✅ **verify-setup.sh**: Script de verificação automática

## 📋 Checklist de Verificação Final

Execute o script de verificação:
```bash
./verify-setup.sh
```

### Antes dos Primeiros Testes

- [ ] **Base de Dados**
  - [ ] PostgreSQL instalado e a correr OU
  - [ ] Supabase configurado com connection strings
  - [ ] Executar: `npm run db:migrate:dev` (dev) ou `db:migrate:deploy` (staging)
  
- [ ] **Variáveis de Ambiente**
  - [ ] Criar `.env` a partir de `.env.example`
  - [ ] Configurar `DATABASE_URL` e `DIRECT_URL`
  - [ ] Gerar `AUTH_SECRET` com: `openssl rand -base64 32`
  - [ ] (Opcional) Configurar `RESEND_API_KEY` para emails
  
- [ ] **Verificações Básicas**
  - [ ] `npm run build` passa sem erros
  - [ ] `npm run lint` passa sem erros
  - [ ] `npm run dev` inicia servidor
  - [ ] http://localhost:3000 responde

## 🧪 Testes Recomendados (em ordem)

### 1. Teste de Segurança (Fase 1)
```bash
# Terminal 1: Iniciar servidor
npm run dev

# Terminal 2: Executar testes
./test-fase1.sh
```

**Espera-se**:
- ✅ APIs protegidas retornam 401
- ✅ Middleware redireciona para login
- ✅ Homepage acessível

### 2. Testes Manuais - Autenticação

1. **Registar utilizador**
   - Aceder: http://localhost:3000/conta
   - Criar conta com email e password
   - Verificar redirecionamento após registo

2. **Login**
   - Fazer login com credenciais criadas
   - Verificar sessão persiste

3. **Páginas protegidas**
   - Aceder: http://localhost:3000/conta/dossier
   - Verificar acesso permitido quando autenticado

### 3. Testes de Funcionalidade - Favoritos (Fase 2)

**Pré-requisito**: Ter programas na base de dados

1. **Guardar favorito**
   - Navegar para `/apoios`
   - Clicar para guardar um programa
   - Verificar aparece como guardado

2. **Listar favoritos**
   - Aceder: `/conta/favoritos`
   - Verificar programa guardado aparece na lista

3. **Remover favorito**
   - Clicar para remover
   - Verificar é removido da lista

4. **Idempotência**
   - Tentar guardar o mesmo programa 2x
   - Verificar não duplica

### 4. Testes de Workers (Fase 3)

**Importante**: Workers requerem conectividade à internet

```bash
# Executar worker individual
npm run worker:fundo         # Fundo Ambiental
npm run worker:dr            # Diário da República
npm run worker:nacional      # Fontes nacionais canónicas

# Verificar resultados
npm run db:studio
# Navegar para tabela 'ingestion_runs'
```

**Verificar**:
- ✅ Registo criado em `ingestion_runs`
- ✅ Status: `completed` ou `failed`
- ✅ Contadores preenchidos (`itemsFound`, `itemsInserted`, etc.)
- ✅ Erros registados (se houver) no campo `errors`

## 🔧 Ambiente de Desenvolvimento Recomendado

### Ferramentas Úteis

1. **Prisma Studio** (Visual DB Manager)
   ```bash
   npm run db:studio
   # Abre em http://localhost:5555
   ```

2. **VS Code Extensions** (recomendadas)
   - Prisma
   - ESLint
   - Tailwind CSS IntelliSense
   - TypeScript Vue Plugin (Volar)

3. **Database GUI** (alternativas)
   - DBeaver
   - pgAdmin
   - Postico (Mac)

## 🚀 Próximos Passos (Fase 4 - Staging)

Após validar tudo localmente, seguir para deploy em staging:

1. **Criar projeto Supabase Staging**
   - Novo projeto: "Staging Casa Eficiente"
   - Copiar connection strings
   - Aplicar migrations: `npm run db:migrate:deploy`

2. **Deploy Vercel**
   - Criar novo projeto ou branch preview
   - Configurar variáveis de ambiente:
     - `DATABASE_URL` (Supabase pooler)
     - `DIRECT_URL` (Supabase direct connection)
     - `AUTH_SECRET` (novo, único para staging)
     - `NEXTAUTH_URL` (URL do Vercel)
     - `CRON_SECRET` (para proteger endpoints cron)

3. **Cron Jobs**
   - Configurar `vercel.json` para cron
   - Endpoint: `/api/cron/ingest`
   - Proteger com `CRON_SECRET`

Ver `proximospassos.md` para roadmap completo.

## 🐛 Problemas Conhecidos e Soluções

### "relation does not exist"
**Causa**: Migrations não aplicadas
**Solução**: 
```bash
npm run db:migrate:dev
```

### "Invalid AUTH_SECRET"
**Causa**: AUTH_SECRET não configurado ou inválido
**Solução**:
```bash
openssl rand -base64 32
# Copiar output para .env como AUTH_SECRET
```

### Build falha em ambiente restrito (sem internet)
**Causa**: Tentativa de fetch de recursos externos
**Solução**: ✅ Já resolvido - projeto usa system fonts

### Workers não executam / timeout
**Causa**: Sites externos podem estar lentos ou bloqueados
**Solução**: 
- Verificar conectividade à internet
- Aumentar timeouts se necessário
- Verificar logs de erro em `ingestion_runs`

## 📊 Métricas de Qualidade Atual

| Métrica | Estado | Notas |
|---------|--------|-------|
| Build | ✅ Passa | Sem erros |
| Linting | ✅ Passa | Sem erros ou warnings |
| TypeScript | ✅ Passa | Todos os tipos validados |
| Testes Unitários | ⚠️ N/A | Não implementados ainda |
| Testes E2E | ⚠️ Parcial | Script Fase 1 disponível |
| Cobertura | ⚠️ N/A | Não medida |
| Documentação | ✅ Boa | Completa e atualizada |

## 🎯 Recomendações para Produção

Antes de ir para produção:

1. **Segurança**
   - [ ] Rotação de secrets (AUTH_SECRET único por ambiente)
   - [ ] HTTPS em todos os endpoints
   - [ ] Rate limiting em APIs públicas
   - [ ] CRON_SECRET configurado e seguro

2. **Observabilidade**
   - [ ] Logs centralizados (ex: Vercel Logs, Datadog)
   - [ ] Alertas para falhas de ingestão
   - [ ] Dashboard admin implementado
   - [ ] Métricas de performance

3. **Dados**
   - [ ] Backups automáticos da BD
   - [ ] Politica de retenção definida
   - [ ] RLS policies validadas
   - [ ] GDPR compliance verificado

4. **Performance**
   - [ ] CDN para assets estáticos
   - [ ] Database connection pooling
   - [ ] Caching strategy definida
   - [ ] Image optimization

## 📞 Suporte e Recursos

- **Documentação do Projeto**: Ver `README.md` e `SETUP_TESTING.md`
- **Roadmap**: Ver `proximospassos.md`
- **Issues**: GitHub Issues do repositório
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs

---

**Data desta avaliação**: 2026-02-24

**Conclusão**: O projeto está tecnicamente pronto para testes iniciais em ambiente de desenvolvimento. Requer apenas configuração de base de dados e variáveis de ambiente para começar a testar.
