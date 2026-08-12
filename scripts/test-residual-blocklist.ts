/**
 * Testes da blocklist de residual, com casos reais do smoke test municipal
 * de 2026-08-11 (10 municípios, 67 criados, ~50 lixo).
 *   npx tsx scripts/test-residual-blocklist.ts
 */
import assert from 'node:assert/strict';
import { checkResidual, type ResidualCheckInput } from '../src/workers/residual-blocklist';

let failures = 0;

function check(name: string, input: ResidualCheckInput, expectedBlocked: boolean) {
  const result = checkResidual(input);
  try {
    assert.equal(result.blocked, expectedBlocked);
    console.log(`  ok   ${name}${result.reason ? ` [${result.reason}]` : ''}`);
  } catch {
    failures += 1;
    console.error(
      `  FAIL ${name}: esperado blocked=${expectedBlocked}, obtido ${result.blocked} (${result.reason ?? '—'})`,
    );
  }
}

// === Deve bloquear (lixo real do smoke) ===
check('ler mais prefixo', { title: 'Ler mais: Regulamento de Apoio a Atividades de Interesse Municipal' }, true);
check('categoria angra', { title: 'Cultura, património e turismo', url: 'https://angradoheroismo.pt/category/cultura-patrimonio-e-ciencia/' }, true);
check('edital ocupação da via', { title: 'Aviso nº 08/2026 – Ocupação da via 29/06/2026' }, true);
check('edital sentido único', { title: 'AVISO: Rua Padre Adolfo Ferreira (Bandeiras) Passa a Ter Sentido Único de Circulsaber mais' }, true);
check('aviso canil', { title: 'AVISO: Canil Municipal da Madalena Sobrelotadosaber mais' }, true);
check('aviso abastecimento água', { title: 'AVISO: Condicionamento no Abastecimento de Água à População da Madalena e Criaçãsaber mais' }, true);
check('nav explorar município', { title: 'Explorar Município', url: 'https://cm-corvo.pt/municipio/' }, true);
check('nav documentos transparência', { title: 'Documentos & Transparência', url: 'https://cm-corvo.pt/municipio/documentos-transparencia/' }, true);
check('editais assembleia (url transparência)', { title: 'Assembleia Municipal', url: 'https://cm-corvo.pt/municipio/documentos-transparencia/editais/assembleia/' }, true);
check('concursos RH', { title: 'Recursos Humanos e Concursos', url: 'https://cm-corvo.pt/municipio/concursos-rh/' }, true);
check('procedimentos concursais (título longo)', { title: 'Concurso Procedimentos Concursais - Publicação da Lista de Candidatos Admitidos à Prova de Conhecimentos Informa-se que já se encontra disponível...' }, true);
check('proteção de dados', { title: 'Proteção de Dados', url: 'https://www.cm-pontadelgada.pt/avisos-legais/politica-de-privacidade-e-seguranca' }, true);
check('regulamento taxas', { title: 'Regulamento das taxas Municipais 15/06/2023' }, true);
check('regulamento cemitério', { title: 'Regulamento do cemitério Municipal do Corvo 15/06/2023' }, true);
check('código de conduta', { title: 'Código de Conduta M.Corvo 15/06/2023' }, true);
check('regulamento estrutura orgânica', { title: 'Regulamento da Estrutura Orgânica – 26 de Setembro 2024 07/04/2025' }, true);
check('tarifário água', { title: 'Tarifário do Serviço de Abastecimento de Água do Município do Corvo 15/06/2023' }, true);
check('arquivo notícias', { title: 'Arquivo de Notícias Ver todas as notícias Aceda ao arquivo completo...', url: 'https://cm-corvo.pt/noticias/' }, true);
check('índice de formulários', { title: 'Formulários, Requerimentos e Pedidos de apoio', url: 'https://cm-corvo.pt/servicos/formularios/' }, true);
check('índice de requerimentos', { title: 'Requerimentos para pedidos de apoio', url: 'https://cm-corvo.pt/servicos/formularios/requerimentos-para-pedidos-de-apoio/' }, true);
check('reclamações', { title: 'Reclamações / Sugestões', url: 'https://cm-corvo.pt/servicos/apoio-municipe/reclamacoes-sugestoes/' }, true);
check('atendimento vereadores', { title: 'Atendimento ao público com os Vereadores da Câmara Municipal da Horta' }, true);
check('conduta assédio', { title: 'Conduta do Município do Corvo – Prevenção e Combate ao Assédio no Trabalho 05/05/2025' }, true);
check('plano gestão riscos corrupção', { title: 'Plano de Gestão de Riscos de Corrupção' }, true);
check('dges concursos especiais', { title: 'Concursos Especiais', url: 'https://www.dges.gov.pt/pt/pagina/concursos-especiais?plid=593' }, true);
check('dges acesso maiores 23 anos', { title: 'Acesso para maiores de 23 anos', url: 'https://www.dges.gov.pt/pt/pagina/concurso-especial-para-estudantes-aprovados-nas-provas-especialmente-adequadas-destinadas?plid=593' }, true);
check('dges estudantes internacionais', { title: 'Estudantes Internacionais', url: 'https://www.dges.gov.pt/pt/pagina/concurso-especial-para-estudantes-internacionais?plid=593' }, true);
check('dges acesso superior público', { title: 'Acesso Superior - Candidatura ao Ensino Superior Público', url: 'https://www.dges.gov.pt/pt/pagina/acesso-superior-candidatura-ao-ensino-superior-publico?plid=593' }, true);
check('dges acesso superior privado', { title: 'Acesso Superior - Candidatura ao Ensino Superior Privado', url: 'https://www.dges.gov.pt/pt/pagina/acesso-superior-candidatura-ao-ensino-superior-privado?plid=593' }, true);
check('dges estatísticas acesso', { title: 'Estatísticas do Acesso ao Ensino Superior Público - 1997 a 2025', url: 'https://www.dges.gov.pt/pt/pagina/regime-geral-ensino-superior-publico-concurso-nacional-de-acesso?plid=593' }, true);
check('dges prazos de candidatura', { title: 'Prazos de Candidatura', url: 'https://www.dges.gov.pt/pt/pagina/prazos-de-candidatura?plid=373' }, true);
check('dges balcão incluies', { title: 'Balcão IncluiES', url: 'https://www.dges.gov.pt/pt/incluies?plid=1752' }, true);
check('iefp inscrição para emprego', { title: 'Inscrição para Emprego', url: 'https://www.iefp.pt/inscricao-para-emprego' }, true);
check('iefp aviso centros qualifica (financiamento institucional)', { title: 'Aviso para Apresentação de Candidaturas ao Apoio Concedido pelo IEFP, I.P., aos CENTROS QUALIFICA da Área Metropolitana de Lisboa', url: 'https://www.iefp.pt/aviso-para-apresentacao-de-candidaturas-ao-apoio-concedido-pelo-iefp-aos-centros-qualifica-da-area-metropolitana-de-lisboa' }, true);

// === Padrões novos (RC4) — bloquear ===
check('prefixo noticia com hifen', { title: 'Notícia - Procedimento Concursal Comum para contratação de trabalhadores' }, true);
check('prorrogacao de prazo sem termo de apoio', { title: 'Prorrogação do prazo para apresentação de candidaturas ao procedimento' }, true);
check('gabinete apoio emigrante', { title: 'Gabinete de Apoio ao Emigrante' }, true);
check('apoio integracao migrantes', { title: 'Apoio à Integração de Migrantes' }, true);
check('reuniao de camara', { title: 'Reunião de Câmara – Ata nº 12/2026' }, true);
check('lista provisoria candidatos', { title: 'Lista Provisória de Candidatos Admitidos ao Procedimento' }, true);
check('procedimento concursal singular', { title: 'Procedimento Concursal para Assistente Técnico' }, true);
check('recrutamento de tecnico', { title: 'Recrutamento de Técnico Superior' }, true);
check('designacao de presidente', { title: 'Designação do Novo Presidente da Junta de Freguesia' }, true);
check('id numerico colado a nav', { title: '8451Câmara Municipal' }, true);
check('prefixo de data por extenso', { title: '12 de março de 2026 Assembleia Municipal reunida em sessão ordinária' }, true);
check('prefixo de data formato barreiro', { title: '5 mar 2026 · Notícia sobre trânsito condicionado' }, true);
check('titulo e nome de ficheiro pdf', { title: 'Regulamento_2026_Versao_Final.pdf' }, true);
check('titulo com mais de 500 caracteres', { title: 'Notícia: '.repeat(80) }, true);
check('url reuniao de camara', { title: 'Ata', url: 'https://cm-x.pt/reunioes-de-camara/2026' }, true);
check('url investidor servicos de apoio', { title: 'Serviços', url: 'https://portal.pt/investidor/servicos-de-apoio/financiamento' }, true);
check('consulta publica sem termo de apoio (guard)', { title: 'Consulta Pública do Regulamento de Trânsito' }, true);

// === NÃO pode bloquear (negativos, incluindo guard AID_EXCEPTION) ===
check('regulamento de apoio a natalidade (nao bloquear)', { title: 'Regulamento de Apoio à Natalidade' }, false);
check('consulta publica com termo de apoio (guard nao bloqueia)', { title: 'Consulta pública: Regulamento de Apoio ao Arrendamento Jovem' }, false);
check('noticia de bolsas com termo de apoio (guard nao bloqueia)', { title: 'Notícia - Abertas candidaturas à Bolsa de Estudo Municipal para alunos do Ensino Superior' }, false);
check('prorrogacao de prazo de bolsas (guard nao bloqueia)', { title: 'EDITAL | Prorrogação do prazo para apresentação de candidaturas a bolsas de estudo' }, false);
check('id numerico colado com termo de apoio (guard nao bloqueia)', { title: '5874Regulamento de Habitação Social do Município de Pedrógão Grande' }, false);
check('consulta publica habitacoes plural (guard nao bloqueia)', { title: 'Consulta Pública da Proposta de Regulamento Municipal de Atribuição e Gestão das Habitações em Regime de Renda Apoiada' }, false);
check('consulta publica cabaz bebe (guard nao bloqueia)', { title: 'Consulta Pública do Projeto de Regulamento de Atribuição do Cabaz Bebé Feliz' }, false);
check('titulo longo com termo de apoio (guard nao bloqueia)', { title: 'Candidaturas às Bolsas de Estudo Universitárias abrem a 20 de julho. '.repeat(10) }, false);
check('titulo com markup html', { title: '<img loading="lazy" width="531" src="https://cm-x.pt/apoio-social.jpg">' }, true);
check('url noticia com bolsa no titulo (guard nao bloqueia)', { title: 'Notícia - Abertas candidaturas à Bolsa de Estudo Municipal', url: 'http://cm-saoroquedopico.pt/noticia/read/1501/abertas' }, false);
check('url noticia sem termo de apoio', { title: 'Notícia - Festival de Verão anima vila', url: 'http://cm-saoroquedopico.pt/noticia/read/1502/festival' }, true);
check('prefixo data com omt (guard nao bloqueia)', { title: '04 de Maio de 2026 Município abre candidaturas para Programa de Ocupação Municipal Temporária de Jovens' }, false);
check('candidaturas bolsas de estudo (nao bloquear)', { title: 'Candidaturas Bolsas de Estudo 2026/2027' }, false);

// === NÃO pode bloquear (apoios genuínos do mesmo smoke) ===
check('bolsa de estudo', { title: 'Bolsa de estudo', url: 'https://cm-corvo.pt/servicos/formularios/requerimentos-para-pedidos-de-apoio/bolsa-de-estudo/' }, false);
check('apoio natalidade (requerimento concreto)', { title: 'Apoio à natalidade e infância', url: 'https://cm-corvo.pt/servicos/formularios/requerimentos-para-pedidos-de-apoio/apoio-a-natalidade/' }, false);
check('regulamento de apoio à natalidade', { title: 'Regulamento de Apoio à Natalidade e Infância 03/07/2026' }, false);
check('regulamento bolsas de estudo', { title: 'Regulamento para atribuição de bolsas de estudo, incluindo passagens aéreas, a alunos dos ensinos superior, profissional e politécnico 03/03/2026' }, false);
check('regulamento habitação degradada', { title: 'Regulamento Municipal para concessão de apoios aos munícipes em matéria de habitação degradada e energias alternativas 15/06/2023' }, false);
check('concurso habitações arrendamento acessível', { title: 'A Câmara Municipal da Horta informa que será aberto no próximo dia 05 de junho o Concurso por Sorteio destinado à atribuição de 9 habitações...' }, false);
check('minibus gratuito', { title: 'Está em vigor desde o dia 19 de maio o Regulamento Municipal Gratuitidade do Transporte Rodoviário de Passageiros através de MiniBus...' }, false);
check('apoio aquisição habitação nordeste', { title: 'Alteração do Projeto de Regulamento Municipal para Apoio na Aquisição de ...Publicação: 5 Junho, 2026' }, false);
check('candidatura a apoios horta', { title: 'Candidatura a Apoios', url: 'http://www.cmhorta.pt/index.php/cultura/candidatura-a-apoios' }, false);
check('apoio atividade desportiva', { title: 'Apoio à atividade desportiva', url: 'https://cm-corvo.pt/servicos/formularios/requerimentos-para-pedidos-de-apoio/apoio-a-atividade-desportiva/' }, false);
check('dges candidatura online bolsas', { title: 'Candidatura Online - Bolsas de Estudo', url: 'https://www.dges.gov.pt/wwwBeOn/?plid=373' }, false);
check('iefp aviso candidaturas medida emprego (não centros qualifica)', { title: 'Aviso para Apresentação de Candidaturas à Medida Estímulo Emprego', url: 'https://www.iefp.pt/aviso-para-apresentacao-de-candidaturas-a-medida-estimulo-emprego' }, false);

if (failures > 0) {
  console.error(`\n${failures} teste(s) falhado(s).`);
  process.exit(1);
}
console.log('\nTodos os testes passaram.');
