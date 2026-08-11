/**
 * Testes do extrator de estado (RC3).
 *   npx tsx scripts/test-status-extractor.ts
 *
 * A data de referência é fixa (2026-08-11) para os veredictos por data não
 * apodrecerem com o calendário.
 */
import assert from 'node:assert/strict';
import { extractStatus, type StatusExtractionInput } from '../src/workers/status-extractor';

const NOW = new Date(2026, 7, 11); // 11 ago 2026

let failures = 0;

function check(name: string, input: StatusExtractionInput, expected: string) {
  const result = extractStatus(input, NOW);
  try {
    assert.equal(result.status, expected);
    console.log(`  ok   ${name} [${result.sourceField}/${result.confidence}]`);
  } catch {
    failures += 1;
    console.error(
      `  FAIL ${name}: esperado ${expected}, obtido ${result.status} ` +
        `(matched: ${result.matched.join(', ') || '—'}) [${result.sourceField}]`,
    );
  }
}

// Frase explícita de abertura com âncora.
check(
  'candidaturas abertas explícitas',
  { rawSections: { 'Prazo de candidatura': 'As candidaturas encontram-se abertas.' } },
  'OPEN',
);

// Frase explícita de fecho.
check(
  'candidaturas encerradas explícitas',
  { rawSections: { 'Estado': 'O período de candidaturas encontra-se encerrado.' } },
  'CLOSED',
);

// Prazo futuro no campo deadline.
check(
  'prazo futuro em extenso',
  { deadline: 'As candidaturas decorrem até 31 de dezembro de 2026.' },
  'OPEN',
);

// Prazo passado no campo deadline.
check(
  'prazo passado em extenso',
  { deadline: 'Candidaturas até 31 de março de 2026.' },
  'CLOSED',
);

// Formato DD/MM/YYYY passado.
check('prazo passado numérico', { deadline: 'Prazo: 15/01/2026' }, 'CLOSED');

// Formato DD/MM/YYYY futuro.
check('prazo futuro numérico', { deadline: 'Prazo limite: 30/11/2026' }, 'OPEN');

// Intervalo com início futuro → PLANNED.
check(
  'intervalo com início futuro',
  { deadline: 'Candidaturas de 1 de outubro de 2026 a 15 de dezembro de 2026.' },
  'PLANNED',
);

// Intervalo a decorrer → OPEN.
check(
  'intervalo a decorrer',
  { deadline: 'Candidaturas de 1 de junho de 2026 a 30 de setembro de 2026.' },
  'OPEN',
);

// Intervalo já terminado → CLOSED.
check(
  'intervalo terminado',
  { deadline: 'Decorreu de 01/01/2026 a 30/06/2026.' },
  'CLOSED',
);

// Página-índice: abertura e fecho na mesma vizinhança → camada de frases
// ambígua, sem datas → UNKNOWN (não OPEN por ordem de teste).
check(
  'página-índice avisos abertos e fechados',
  {
    title: 'Avisos Abertos e Fechados',
    rawSections: { 'Candidaturas': 'Consulte aqui os avisos de candidatura abertos e fechados.' },
  },
  'UNKNOWN',
);

// REGRA DE CONFLITO: "abertas" stale + data-fim passada → data vence → CLOSED.
check(
  'abertas stale com prazo passado',
  {
    rawSections: {
      'Prazo': 'Candidaturas abertas. As candidaturas decorrem ate 31 de janeiro de 2026.',
    },
  },
  'CLOSED',
);

// REGRA DE CONFLITO: "encerradas" explícito + data futura → fecho antecipado → CLOSED.
check(
  'encerradas com data futura',
  {
    rawSections: {
      'Estado das candidaturas': 'Candidaturas encerradas por esgotamento. Prazo original: até 31/12/2026.',
    },
  },
  'CLOSED',
);

// Dotação esgotada → EXHAUSTED, mesmo sem âncora de candidatura.
check(
  'dotação esgotada',
  { rawSections: { 'Estado': 'A dotação orçamental encontra-se esgotada.' } },
  'EXHAUSTED',
);

// Suspensão perto de âncora.
check(
  'candidaturas suspensas',
  { rawSections: { 'Estado do aviso': 'As candidaturas estão suspensas até nova ordem.' } },
  'SUSPENDED',
);

// Keyword fraca só em título+descrição (último recurso).
check(
  'keyword fraca no título',
  { title: 'Programa X — candidaturas abertas' },
  'OPEN',
);

// Ruído fora de proximidade não decide: "abertas" longe de âncora, em secção
// não relevante, não conta.
check(
  'sem sinal utilizável',
  {
    title: 'Apoio à habitação',
    description: 'Medida de apoio do Estado.',
    rawSections: { 'Navegação': 'Portas abertas ao público na loja do cidadão.' },
  },
  'UNKNOWN',
);

// Sem texto nenhum.
check('sem texto', {}, 'UNKNOWN');

// === Casos reais do dry-run staging 2026-08-11 ===

// Fundo Ambiental: nav "Candidaturas: Registo Política de Privacidade" não
// decide; sinal real vive na secção INFORMAÇÃO.
check(
  'FA: encerrado em secção INFORMAÇÃO, nav ignorada',
  {
    title: 'Incentivo Veículos de Baixas Emissões 2017',
    rawSections: {
      'Contactos': 'Rua de "O Século", n.º 63 – 3.º 1200-433 Lisboa geral@fundoambiental.pt',
      'Sobre Nós': 'Fundo Ambiental Missão e Entidade Gestora Atribuição de Apoios',
      'Candidaturas': 'Registo Politica de Privacidade',
      'INFORMAÇÃO': 'O incentivo relativo a 2017 encontra-se encerrado. Foram recebidas 1266 candidaturas.',
    },
  },
  'CLOSED',
);

// "AVISO – SUSPENSÃO DO TRÂNSITO" não é candidatura suspensa.
check(
  'aviso de suspensão do trânsito não é SUSPENDED',
  {
    title: 'AVISO N.º 148/2026 – CONDICIONAMENTO/SUSPENSÃO DO TRÂNSITO',
    description: 'Suspensão do trânsito na Rua Direita no dia 15 de agosto de 2026.',
  },
  'UNKNOWN',
);

// Legalês "nos termos previstos" perto de "candidatura" não é PLANNED.
check(
  'legalês previsto não é PLANNED',
  {
    rawSections: {
      'Artigo 5.º': 'As candidaturas são apresentadas nos termos previstos no presente regulamento.',
    },
  },
  'UNKNOWN',
);

// "Abertura prevista" genuína continua a ser PLANNED.
check(
  'abertura prevista é PLANNED',
  { rawSections: { 'Estado': 'Candidaturas com abertura prevista para o último trimestre.' } },
  'PLANNED',
);

// Legalês "a inscrição suspende-se" (Regulamento 24/2019 Angra) não é SUSPENDED.
check(
  'legalês suspende-se não é SUSPENDED',
  {
    rawSections: {
      'Artigo 7.º': 'No caso da atualização resultar no incumprimento dos requisitos, a inscrição suspende-se pelo período de tempo que durar esse incumprimento.',
    },
  },
  'UNKNOWN',
);

// Forma nominal do mesmo legalês: "suspensão da inscrição" também não decide.
check(
  'legalês suspensão da inscrição não é SUSPENDED',
  {
    rawSections: {
      'Artigo 8.º': 'A suspensão da inscrição impede a entidade de apresentar pedidos de apoio durante esse período.',
    },
  },
  'UNKNOWN',
);

// "Suspensão das candidaturas" genuína continua SUSPENDED.
check(
  'suspensão das candidaturas é SUSPENDED',
  { rawSections: { 'Aviso': 'Informa-se a suspensão das candidaturas ao programa.' } },
  'SUSPENDED',
);

// Data de publicação não é prazo.
check(
  'data de publicação não decide',
  {
    rawSections: {
      'INFORMAÇÃO': 'Data de publicação: 28/07/2017. Informam-se os interessados que está disponível o relatório.',
    },
  },
  'UNKNOWN',
);

if (failures > 0) {
  console.error(`\n${failures} teste(s) falhado(s).`);
  process.exit(1);
}
console.log('\nTodos os testes passaram.');
