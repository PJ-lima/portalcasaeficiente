# Versionamento e deteção de mudança

Este documento resolve a pergunta que ficou em aberto desde o início do projeto: **o que conta como mudança?** Sem uma resposta escrita, o resultado é sempre um dos dois extremos — notificações a mais (o utilizador desliga) ou a menos (o utilizador perde o prazo).

Três mecanismos distintos, com gatilhos distintos.

## 1. `ProgramVersion` — mudou o conteúdo do apoio

Cria-se uma versão nova quando muda algo que altera **a decisão de candidatar-se**:

- `rulesJson` (condições de elegibilidade)
- montantes ou percentagens de comparticipação
- prazos de candidatura
- tipologia de obras/equipamentos abrangidos
- entidade responsável

**Não** cria versão:

- reformulação de texto sem mudança de sentido
- correção de erros ortográficos
- mudanças de layout ou de navegação na página oficial
- alteração da ordem das secções

Regra prática: se o resumo da mudança couber em "mudaram o texto", não é versão. Se couber em "mudaram as regras", é.

## 2. `ProgramStatusEvent` — mudou o estado do apoio

Cria-se um evento quando muda:

- `status` (`OPEN`, `CLOSED`, `PLANNED`, `UNKNOWN`, `EXHAUSTED`, `SUSPENDED`, `CANCELLED`, `PAYMENTS_DELAYED`)
- `budgetCommitted` de forma material (≥5 p.p. de execução, ou passagem a 100%)
- `statusNote` quando a explicação muda de substância

O dedup vive num sítio só: `recordStatusChange()` em `src/lib/ingestion.ts`. Compara com o último evento do programa e só escreve se diferir. Nenhum worker deve escrever `ProgramStatusEvent` diretamente.

Quando o estado **não** muda mas a fonte foi verificada, passa-se `markVerified: true` para atualizar `lastVerifiedAt` sem poluir o histórico. É o que sustenta a promessa da landing de mostrar a data da última verificação.

### Estados e o que significam para o cidadão

| Estado | Significado |
| --- | --- |
| `OPEN` | Aceita candidaturas agora |
| `PLANNED` | Anunciado, ainda não abriu |
| `CLOSED` | Fechou por prazo |
| `EXHAUSTED` | Ainda aceita ou aceitou candidaturas, mas a dotação está comprometida — ser elegível não garante apoio |
| `SUSPENDED` | Parado temporariamente |
| `CANCELLED` | Terminado antes do previsto, sem substituição imediata |
| `PAYMENTS_DELAYED` | Atribuído mas com pagamentos por regularizar |
| `UNKNOWN` | Sem informação pública fiável |

`EXHAUSTED` e `PAYMENTS_DELAYED` existem por causa do Vale Eficiência: em fev-2026 foi cancelado com mais de 28 mil candidaturas elegíveis sem apoio e menos de 3% de execução. Um portal que mostrasse só "fechado" estaria tecnicamente certo e materialmente a enganar quem esperava dinheiro.

## 3. Notificação — o que merece interromper alguém

Notifica-se:

- programa novo que corresponda às preferências do utilizador (domínio, concelho, tipo de obra)
- transição para `OPEN` — o caso crítico: o E-Lar esgotou 30 M€ em 6 dias
- transição para `EXHAUSTED`, `SUSPENDED`, `CANCELLED` ou `PAYMENTS_DELAYED` **de um programa que o utilizador guardou nos favoritos**
- nova `ProgramVersion` que mude elegibilidade ou prazos, também só para favoritos
- prazo de candidatura a terminar (7 e 2 dias antes) para favoritos

Não se notifica:

- versão nova que só mude texto
- mudanças em programas que o utilizador não guardou e que não correspondem às preferências
- reverificações sem mudança (`markVerified`)

## Precedência

Se a mesma execução detetar mudança de estado **e** versão nova, gera-se um evento e uma versão, mas **uma só notificação** — a do estado, que é o que o utilizador precisa de saber primeiro.
