# Sistema de Recomendações Personalizadas

## Visão Geral

Sistema que integra o dossiê do utilizador com um motor de elegibilidade simplificado para fornecer recomendações personalizadas de programas de apoio.

## Componentes Implementados

### 1. Endpoint de Recomendações
**Ficheiro:** `/src/app/api/eligibility/recommendations/route.ts`

- **Rota:** `GET /api/eligibility/recommendations?userId=xxx`
- **Descrição:** Calcula a elegibilidade de programas disponíveis com base no perfil do utilizador
- **Funcionalidades:**
  - Busca o dossiê do utilizador (UserDossier)
  - Identifica o concelho do utilizador
  - Filtra programas NACIONAIS + MUNICIPAIS do concelho
  - Calcula score de elegibilidade (mock simplificado)
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
- TODO: Integrar com NextAuth para obter userId da sessão

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

### Motor de Elegibilidade Real
- Implementar sistema de regras (`ProgramVersion.rulesJson`)
- Integrar com `/src/lib/eligibility-engine.ts` (já existe)
- Mapear campos do dossiê para regras de elegibilidade
- Suportar operadores: ==, !=, <, <=, >, >=, in, not_in, between

### Melhorias de UX
- Autenticação: obter userId da sessão NextAuth
- Notificações: alertar quando novo programa elegível
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
# 1. Testar API diretamente
curl "http://localhost:3000/api/eligibility/recommendations?userId=cmlb5xrt30008xib54akgfo9s"

# 2. Abrir página no browser
open http://localhost:3000/conta/recomendacoes
```

## Notas Técnicas

- Motor de elegibilidade atual é **mock simplificado**
- Score baseado apenas em tipo de programa (NATIONAL=75%, MUNICIPAL=60%)
- Não implementa regras de elegibilidade reais ainda
- Próxima iteração deve usar `ProgramVersion.rulesJson` e `eligibility-engine.ts`
