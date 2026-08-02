# Sistema de Recomendações Personalizadas

## Visão Geral

Sistema que integra o dossiê do utilizador com o motor de elegibilidade (`src/lib/eligibility-engine.ts`) para fornecer recomendações personalizadas de programas de apoio.

## Componentes Implementados

### 1. Endpoint de Recomendações
**Ficheiro:** `/src/app/api/eligibility/recommendations/route.ts`

- **Rota:** `GET /api/eligibility/recommendations` (utilizador vem da sessão NextAuth)
- **Descrição:** Calcula a elegibilidade de programas disponíveis com base no perfil do utilizador
- **Funcionalidades:**
  - Busca o dossiê do utilizador (UserDossier)
  - Identifica o concelho do utilizador
  - Filtra programas NACIONAIS + MUNICIPAIS do concelho
  - Calcula score com o motor de elegibilidade real (`src/lib/eligibility-engine.ts`)
  - Ordena por relevância (ELIGIBLE > MAYBE > NOT_ELIGIBLE)
  - Retorna estatísticas agregadas

**Resposta da API:**
```json
{
  "user": {
    "concelho": "Cascais",
    "hasMainResidence": true
  },
  "recommendations": [
    {
      "program": {
        "id": "...",
        "slug": "...",
        "title": "Vale Eficiência",
        "entity": "Fundo Ambiental",
        "programType": "NATIONAL",
        "status": "OPEN",
        "summary": "...",
        "officialUrl": "..."
      },
      "evaluation": {
        "result": "ELIGIBLE",
        "score": 75,
        "summary": "Programa recomendado com base no seu perfil.",
        "evaluations": []
      }
    }
  ],
  "total": 1,
  "eligible": 1,
  "maybe": 0,
  "notEligible": 0
}
```

### 2. Componente de Recomendações
**Ficheiro:** `/src/components/eligibility/RecommendationsList.tsx`

Client Component que:
- Carrega recomendações do endpoint via fetch
- Mostra loading state durante cálculo
- Apresenta estatísticas agregadas (Total, Elegível, Talvez, Não elegível)
- Permite filtrar por status de elegibilidade
- Mostra badges visuais (✓ Elegível, ? Talvez, ✗ Não elegível)
- Exibe score percentual por programa
- Link para página oficial de cada programa

### 3. Página de Recomendações
**Ficheiro:** `/src/app/conta/recomendacoes/page.tsx`

- **Rota:** `/conta/recomendacoes`
- Server Component que renderiza o RecommendationsList
- Protegida por `src/middleware.ts`; a API resolve o utilizador pela sessão

## Fluxo de Utilização

1. **Utilizador preenche dossiê** → `/conta/dossier`
   - Localização (concelho)
   - Habitação (tipo, ano, certificado energético)
   - Perfil socioeconómico

2. **Sistema calcula elegibilidade** → API `/api/eligibility/recommendations`
   - Busca programas relevantes (nacionais + municipais do concelho)
   - Avalia compatibilidade com perfil do utilizador
   - Ordena por score de elegibilidade

3. **Utilizador vê recomendações** → `/conta/recomendacoes`
   - Lista ordenada por relevância
   - Filtros por status (Todos, Elegível, Talvez, Não elegível)
   - Detalhes de cada programa e score

## Próximos Passos

### Motor de Elegibilidade
- Feito: a rota usa `normalizeProgramRules` + `evaluateEligibility` de
  `src/lib/eligibility-engine.ts`, com os campos do dossiê do utilizador.
- Feito: autenticação por sessão NextAuth (já não há `userId` em query string).
- Feito: notificações de programa novo e de mudança de estado (`/conta/notificacoes`).
- Falta: povoar `ProgramVersion.rulesJson` com regras reais por programa. Sem
  regras publicadas a rota devolve deliberadamente `MAYBE` — dizer "és elegível"
  sem base seria criar uma expectativa que a entidade não confirmou.
- Falta: regime de propriedade no dossiê (o motor suporta `ownershipType`, o
  dossiê ainda não o guarda).

### Melhorias de UX
- Histórico: guardar avaliações anteriores
- Comparação: comparar múltiplos programas lado a lado

### Otimizações
- Cache de recomendações (Redis/Vercel KV)
- Revalidação incremental quando programa atualizado
- Background jobs para recálculo periódico

## Dependências

- Prisma ORM (UserDossier, Program, ProgramVersion, Concelho)
- Next.js App Router (Server/Client Components)
- TypeScript (tipagem forte)

## Teste

```bash
# A API exige sessão iniciada — testar pelo browser, autenticado
open http://localhost:3000/conta/recomendacoes
```

## Notas Técnicas

- O motor real (`src/lib/eligibility-engine.ts`) é partilhado com
  `/api/eligibility/check`. Operadores suportados: ==, !=, <, <=, >, >=, in,
  not_in, between.
- Programas sem `rulesJson` preenchido devolvem `MAYBE` com nota a remeter para
  a fonte oficial, em vez de um score inventado.
- Regras de quando notificar: `docs/versionamento.md`.
