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

// === RC5 (revisão manual dos duvidosos, 2026-08-12) — bloquear ===
check('ficha de candidatura (anexo)', { title: 'Ficha de Candidatura', url: 'https://www.cm-pontedesor.pt/wp-content/uploads/ficha-de-candidatura-15.pdf' }, true);
check('ficha candidatura sem "de" (gondomar)', { title: '2021.05.13 – Ficha Candidatura Ensino Público' }, true);
check('boletim de candidatura', { title: 'Boletim de candidatura – Ensino Público' }, true);
check('formulário de candidatura', { title: 'formulário de candidatura' }, true);
check('formulário de inscrição', { title: 'Formulário de Inscrição' }, true);
check('ficha de critérios', { title: '» Ficha de Critérios' }, true);
check('declaração de compromisso', { title: '»» Declaração de Compromisso de Honra' }, true);
check('inscrição download (sousel)', { title: 'Inscrição download' }, true);
check('ficha de projeto (monchique)', { title: 'Ficha de Projeto: Medida SM1 Candidatura 12467 2706' }, true);
check('transparência subsídios pagos (vila viçosa)', { title: 'Edital N.º 52/2020 – Subsídios e apoio pagos até 30 de junho 2020 21-07-2020' }, true);
check('transparência subsídios sociais pagos', { title: 'Edital n.º 6/2017 – subsídios e apoios sociais pagos até 31 de dezembro de 2016 20-01-2017' }, true);
check('lista de candidaturas aprovadas', { title: 'Aviso – Projeto de listas das candidaturas aprovadas' }, true);
check('classificação provisória habitação', { title: 'Edital – Classificação Provisória de uma Habitação Tipologia T1 em Montargil' }, true);
check('pepal', { title: 'Aviso – PEPAL 6ª Edição – 2ª Fase' }, true);
check('aru', { title: 'Área de Reabilitação Urbana', url: 'https://angradoheroismo.pt/area-de-reabilitacao-urbana-aru-de-angra-do-heroismo/' }, true);
check('edital nu com número', { title: '» Edital 15/2023' }, true);
check('aviso nu com número', { title: '»» Aviso 28/2024' }, true);
check('edital nu n.º colado', { title: 'Edital n.º49/2026' }, true);
check('edital nu com data dupla', { title: 'Edital N.º 7 – 2020 27-01-2020' }, true);
check('regulamento nu', { title: '» Regulamento' }, true);
check('edital datado sem tema (gondomar)', { title: '2024.07.15 – Edital' }, true);
check('apoio financeiro às ipss (crato)', { title: 'Projeto de Regulamento Municipal para Atribuição de Apoio Financeiro às Instituições Particulares de Solidariedade Social, destinado à Gratuidade da Frequência do Ensino Pré-Escolar' }, true);
check('url eventos sem apoio no título', { title: 'Bora Lá Treinar+', url: 'https://cm-crato.pt/eventos/bora-la-treinar/' }, true);
check('url editais sem apoio no título', { title: 'Edital número quarenta e nove', url: 'http://www.cm-ferreiradozezere.pt/mfz-municipio/camara-municipal/editais/4768-edital-n-o49-2026' }, true);
check('url viazul (empresários)', { title: 'ViAzul Simplifica', url: 'https://mun-trofa.pt/1057/via-azul' }, true);
check('url procedimento regulamentar mora', { title: 'Procedimento regulamentar para a elaboração e aprovação do regulamento do programa de recuperação de habitações degradadas 02-01-2020', url: 'https://www.cm-mora.pt/wp-content/uploads/2020/10/aviso-procedimento-regulamentar.pdf' }, true);
check('url notícia de prazo pombal', { title: 'Candidate-se à linha de apoio: prazo alargado até 30 de julho!', url: 'https://www.cm-pombal.pt/municipio/comunicacao/noticias/noticia/candidaturas-a-linha-pombal-apoia-2-0-alargadas-ate-30-de-julho-candidate-se' }, true);
check('url plataforma juventude florestas', { title: 'https://programas.juventude.gov.pt/florestas', url: 'https://programas.juventude.gov.pt/florestas' }, true);
check('url norte2020 valpaços', { title: 'GPI - Concursos para Candidaturas', url: 'http://www.valpacos.pt/eu-sou-municipe/apoio-ao-cidadao/norte-2020-concursos-para-apresentacao-de-candidaturas' }, true);
check('url documentação valongo', { title: 'Regulamento Municipal de Concessão de Apoios Desportivos', url: 'http://www.cm-valongo.pt/municipio/documentacao?folders_list_60_folder_id=1077' }, true);

// === RC5 — NÃO pode bloquear (guards e apoios genuínos) ===
check('edital com tema de apoio (não é nu)', { title: 'Edital 12/2026 – Apoio à Natalidade' }, false);
check('aviso com tema (não é nu)', { title: 'Aviso 3/2026 – Candidaturas ao Cartão Sénior' }, false);
check('url eventos com apoio no título (guard)', { title: 'Entrega de apoios às famílias', url: 'https://cm-x.pt/eventos/entrega-apoios/' }, false);
check('url editais com bolsa no título (guard)', { title: 'Edital – Bolsas de Estudo 2026', url: 'https://cm-x.pt/editais/bolsas-2026' }, false);
check('dinâmica jovem crato (mantido na revisão)', { title: 'Dinâmica Jovem 2026', url: 'https://cm-crato.pt/dinamica-jovem-2026/' }, false);
check('candidatura habitação (título de apoio, não anexo)', { title: 'Candidatura à Habitação Pública Municipal' }, false);
check('natalidade e ipss no mesmo regulamento (apoio ao cidadão)', { title: 'Regulamento de apoio à natalidade e às instituições particulares de solidariedade social 06-01-2021' }, false);
check('artigo colado com "formulário de candidatura" a meio', { title: 'Candidaturas às Bolsas de Estudo Universitárias abrem a 20 de julho15 julho, 2026O Município informa que as candidaturas decorrem pela plataforma SIGA. Após a receção das credenciais, os candidatos deverão aceder à plataforma, preencher o formulário de candidatura e submeter o pedido.' }, false);

if (failures > 0) {
  console.error(`\n${failures} teste(s) falhado(s).`);
  process.exit(1);
}
console.log('\nTodos os testes passaram.');
