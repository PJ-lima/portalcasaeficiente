/**
 * Testes do gate de beneficiário com casos reais da base de staging.
 *   npx tsx scripts/test-beneficiary-gate.ts
 */
import assert from 'node:assert/strict';
import { classifyBeneficiary } from '../src/workers/beneficiary-gate';

let failures = 0;

function check(
  name: string,
  input: Parameters<typeof classifyBeneficiary>[0],
  expected: 'INDIVIDUAL' | 'ORGANIZATION' | 'UNKNOWN',
) {
  const result = classifyBeneficiary(input);
  try {
    assert.equal(result.verdict, expected);
    console.log(`  ok   ${name} [${result.scope}]`);
  } catch {
    failures += 1;
    console.error(
      `  FAIL ${name}: esperado ${expected}, obtido ${result.verdict} ` +
        `(+${result.matchedPositive.join(',') || '—'} / -${result.matchedNegative.join(',') || '—'}) [${result.scope}]`,
    );
  }
}

// Fundo Ambiental PAES 2023 — texto real de staging.
check(
  'pessoas singulares proprietárias residentes',
  {
    beneficiaries:
      'São elegíveis as pessoas singulares proprietárias que residam permanentemente na habitação. ' +
      'São elegíveis pessoas singulares que comprovem a qualidade de titular de qualquer direito que ' +
      'lhe confira a faculdade de realizar as intervenções nos imóveis',
  },
  'INDIVIDUAL',
);

// Aviso Portugal 2030 típico — apoio a empresas.
check(
  'aviso Portugal 2030 para empresas',
  {
    title: 'Aviso para apresentação de candidaturas — Inovação Produtiva',
    beneficiaries: 'Empresas de qualquer natureza e sob qualquer forma jurídica.',
  },
  'ORGANIZATION',
);

// Aberto a singulares E coletivas — o cidadão pode candidatar, logo entra.
check(
  'aberto a pessoas singulares e coletivas',
  { beneficiaries: 'Podem candidatar-se pessoas singulares e pessoas coletivas.' },
  'INDIVIDUAL',
);

// Fundo Ambiental 2017 — beneficiário é a administração pública (texto no título).
check(
  'mobilidade elétrica na administração pública',
  { title: 'Apoio à mobilidade elétrica na Administração Pública' },
  'ORGANIZATION',
);

check(
  'entidades gestoras de sistemas municipais',
  { title: 'Apoio às entidades gestoras de sistemas municipais' },
  'ORGANIZATION',
);

// Sem texto nenhum — não há como decidir; persiste até ser enriquecido.
check('sem texto', {}, 'UNKNOWN');

// Título+descrição genéricos sem sinal — UNKNOWN, não exclui.
check(
  'texto sem sinal de beneficiário',
  { title: 'Programa de Apoio Extraordinário 2026', description: 'Candidaturas abertas até dezembro.' },
  'UNKNOWN',
);

// Nav/rodapé municipal com "empresas"/"municípios" não pode excluir sozinho
// (termos fracos só decidem em secções targeted).
check(
  'ruído de navegação municipal não exclui',
  {
    title: 'Apoio à renda jovem',
    rawSections: {
      'Outras ligações': 'Empresas Municípios Freguesias Área reservada Contactos',
      'Serviços online': 'Login Registar Newsletter',
    },
  },
  'UNKNOWN',
);

// Mas a mesma página com secção de beneficiários clara decide INDIVIDUAL.
check(
  'secção BENEFICIÁRIOS decide sobre o ruído',
  {
    title: 'Apoio à renda jovem',
    rawSections: {
      'Outras ligações': 'Empresas Municípios Freguesias Área reservada Contactos',
      'BENEFICIÁRIOS': 'Jovens até aos 35 anos com contrato de arrendamento.',
    },
  },
  'INDIVIDUAL',
);

// Agregado familiar em texto corrido (sem secção targeted) — forte, decide.
check(
  'agregado familiar em texto corrido',
  {
    title: 'Tarifa social de energia',
    description: 'Desconto aplicado ao agregado familiar com carência económica.',
  },
  'INDIVIDUAL',
);

// PME em texto corrido — forte, decide.
check(
  'PME em texto corrido',
  { title: 'Linha de crédito', description: 'Financiamento para PME do setor do turismo.' },
  'ORGANIZATION',
);

// Aviso Portugal 2030 real: secção "Quem se pode candidatar?" só diz o tipo
// de promotor — linguagem de fundos para entidades, nunca cidadão.
check(
  'P2030 tipo de promotor',
  {
    title: 'Habitação Social e Acessível (IT)',
    rawSections: { 'Quem se pode candidatar?': 'Tipo de promotor Pública' },
  },
  'ORGANIZATION',
);

// Condomínios candidatam diretamente — dentro do âmbito.
check(
  'condomínios',
  { beneficiaries: 'Podem candidatar-se condomínios de edifícios multifamiliares.' },
  'INDIVIDUAL',
);

// Título org-aid P2030 decide sem texto enriquecido (camada title).
check(
  'título empresarial decide ORGANIZATION',
  { title: 'SICE – Investimento Empresarial Produtivo (Sector da Defesa).' },
  'ORGANIZATION',
);
check(
  'título entidades públicas decide ORGANIZATION',
  { title: 'Cursos TeSP – Entidades Públicas – Ciclo 2026/2027' },
  'ORGANIZATION',
);
check(
  'título associativismo decide ORGANIZATION',
  { title: 'Programa de Apoio ao Associativismo Desportivo do Faial (PADEF)' },
  'ORGANIZATION',
);

// "empresariais" no rodapé/nav (rawSections) NÃO pode matar apoio de cidadão
// do mesmo site (caso real: Corvo, natalidade excluída pelo menu).
check(
  'rodapé com apoios empresariais não exclui natalidade',
  {
    title: 'Apoio à natalidade e infância',
    rawSections: {
      'Menu': 'Apoios a projectos empresariais Bolsa de estudo Apoio municipal',
    },
  },
  'UNKNOWN',
);

// E com secção de beneficiários clara, decide INDIVIDUAL apesar do rodapé.
check(
  'secção beneficiários vence rodapé empresarial',
  {
    title: 'Apoio à natalidade e infância',
    beneficiaries: 'Famílias residentes no concelho com filhos até aos 3 anos.',
    rawSections: {
      'Menu': 'Apoios a projectos empresariais Bolsa de estudo',
    },
  },
  'INDIVIDUAL',
);

if (failures > 0) {
  console.error(`\n${failures} teste(s) falhado(s).`);
  process.exit(1);
}
console.log('\nTodos os testes passaram.');
