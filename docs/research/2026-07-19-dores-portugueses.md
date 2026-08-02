# Pesquisa completa: dores dos portugueses (2024-2026) e recomendações

_Documento consolidado gerado a 2026-07-19. Contém: resumo, ranking, evidência citada, dossiê de fricção nos apoios, avaliação do Portal Casa Eficiente, sinal social e recomendações de software._

_Este é o documento que fundamenta o refactor descrito em `proximospassos.md`. Não editar sem nota de revisão — é a base de evidência das decisões de produto._

---

# Pesquisa: As maiores dores e queixas dos portugueses (2024-2026)

Pesquisa de mercado realizada em 2026-07-19 para responder à pergunta: **faz sentido continuar com o Portal Casa Eficiente?**

Metodologia: pesquisa web profunda multi-agente (5 ângulos de pesquisa em paralelo, 22 fontes lidas, 105 afirmações extraídas, 25 verificadas adversarialmente com 3 votos independentes cada — 24 confirmadas, 1 refutada), complementada com uma varredura de sinal social (Reddit, Facebook, via pesquisa web).

## Conteúdo original da pesquisa

| Secção | O que contém |
|---|---|
| Ranking | Ranking das maiores queixas/dores dos portugueses (top 10 + extensão até 20) |
| Relatório de evidência | Relatório completo com evidência citada, fontes e limitações |
| Dossiê de fricção | Fricção nos apoios públicos à eficiência energética (Vale Eficiência, E-Lar, IHRU) — o teste direto à tese do projeto |
| Avaliação do projeto | Fit do Portal Casa Eficiente contra o ranking + veredicto e recomendações |
| Sinal social | Sinais qualitativos de Reddit/Facebook (recolhidos via pesquisa web) |

## Resumo em três frases

1. As dores dos portugueses concentram-se em **custo de vida, habitação e saúde/SNS** — Portugal é o país da UE que mais concentra as preocupações nestes três temas, e dois deles (custo de vida e habitação) são o terreno direto do projeto.
2. A fricção no acesso a apoios públicos está **documentada e a crescer**: o IHRU foi a 4.ª marca mais reclamada de Portugal em 2025 (Portal da Queixa) por "atrasos e dificuldades no acesso aos apoios à habitação", e o Vale Eficiência foi cancelado em fevereiro de 2026 com mais de 28 mil candidaturas elegíveis sem apoio e menos de 3% de execução.
3. **Veredicto: o projeto ataca dores reais e intensas — vale a pena continuar**, mas o posicionamento deve ser "poupar dinheiro e desbloquear apoios" (não "energia", que só 2% dos portugueses citam como preocupação), e o produto tem de ser resiliente à instabilidade dos programas (o principal programa-alvo foi cancelado; novos programas — E-Lar, Plano Social para o Clima 2027 — vão surgindo).

---

# Ranking das maiores queixas e dores dos portugueses (2024-2026)

Duas dimensões: **dores estruturais de vida** (inquéritos: Eurobarómetro, OSP/Católica, Pordata/FFMS) e **queixas de consumo** (Portal da Queixa, DECO). A relação com o Portal Casa Eficiente está marcada em cada linha.

## Top 10 — dores estruturais

| # | Dor | Intensidade (evidência) | Relação com o projeto |
|---|---|---|---|
| 1 | **Custo de vida / inflação** | 43% (Eurobarómetro 102, out-2024; vs 33% UE27); 34% no outono 2025 | **Direta** — a fatura energética é componente do custo de vida; nota: "fornecimento de energia" isolado só recebe 2% |
| 2 | **Habitação** (preços, acesso, rendas) | 28-43% consoante o inquérito; 65,3% "muito preocupados" com preços (OSP jul-2025); 36,4% dos agregados gastam >30% do rendimento com a casa; pior área de avaliação do governo (2,45/10) | **Direta** — eficiência reduz o custo de habitar e reabilita o parque |
| 3 | **Saúde / SNS** | 36-37% (1.º lugar no outono 2025); 50,4% temem não obter assistência | Nenhuma direta (ténue: conforto térmico → saúde) |
| 4 | **Burocracia / serviços do Estado** | Queixas a serviços públicos +93% em 2025; IMT marca mais reclamada de 2024; IHRU 4.ª de 2025; AIMA no top | **Direta** — agregação + verificação de elegibilidade ataca exatamente esta fricção |
| 5 | Situação económica | 13% (EB 102) | Indireta |
| 6 | Desemprego | 12% (EB 102) | Nenhuma |
| 7 | Impostos | 11% (EB 102; quase o dobro da média UE de 6%) | Indireta (benefícios fiscais à eficiência) |
| 8 | Imigração | 10% (EB 102) | Nenhuma |
| 9 | Pensões | 9% (EB 102) | Nenhuma |
| 10 | Insegurança quanto ao futuro | dimensão de bem-estar mais vulnerável no OSP 2025 (28,6% insatisfeitos) | Indireta (previsibilidade financeira) |

## Extensão 11-20 — dores específicas e queixas de consumo

| # | Dor / setor | Evidência | Relação |
|---|---|---|---|
| 11 | **Pobreza energética / frio em casa** | 20,8% da população incapaz de aquecer a casa (2023, pior da UE, ~2,2 milhões de pessoas; 15,7% em 2024 — Eurostat via Público/Renascença) | **Direta — é o núcleo do projeto** |
| 12 | **Fricção nos apoios públicos à habitação/eficiência** | Vale Eficiência cancelado (fev-2026) com 28 mil elegíveis sem vale e <3% de execução; IHRU +93% de reclamações (Porta 65); E-Lar com só 32% dos vouchers usados | **Direta — é a tese do projeto** |
| 13 | Correio / transporte / logística | Setor n.º 1 do Portal da Queixa (13% em 2024; 13,59% em 2025) | Nenhuma |
| 14 | Telecomunicações / TV | 7,9% no Portal da Queixa (+34% em 2025 com a entrada da Digi); setor n.º 1 na DECO | Nenhuma |
| 15 | Energia e água (consumo: faturação, preços) | 4.º setor mais reclamado na DECO (6.258 reclamações de energia em 2024, sobretudo faturação excessiva) | Indireta-forte (mesma dor de fundo: fatura de energia) |
| 16 | Banca / pagamentos | 5,9% no Portal da Queixa | Nenhuma |
| 17 | Informática / tecnologia / e-commerce | 6,2% no Portal da Queixa | Nenhuma |
| 18 | Salários baixos / emigração jovem | ~850 mil jovens (30% dos 15-39) já viveram fora; casas +124% desde 2015 vs salários dos mais baixos da Europa Ocidental (proxy de imprensa; não isolado nos inquéritos — surge embutido em custo de vida) | Indireta |
| 19 | Transportes | +4 p.p. acima da média UE na preocupação regional (Flash EB 539) | Nenhuma |
| 20 | Volume geral de insatisfação de consumo | Recordes consecutivos no Portal da Queixa: 224.256 reclamações em 2024 (+10,7%), 238.698 em 2025 (+6,44%) | Contexto |

## Leitura rápida

- O trio custo de vida + habitação + saúde é estável em todas as vagas de inquérito; a **ordem** entre eles oscila (custo de vida 1.º em 2024, saúde 1.º no outono 2025).
- Portugal destaca-se da média europeia precisamente nos temas **domésticos/materiais** (habitação +23 p.p., custo de vida +9, saúde +5, transportes +4) — o terreno do projeto.
- As dores com relação **direta** ao Portal Casa Eficiente são as n.º 1, 2, 4, 11 e 12 — três delas no top 4.

---

# Relatório de evidência — dores dos portugueses 2024-2026

Cada afirmação abaixo sobreviveu a verificação adversarial (3 verificadores independentes por claim; era eliminada com 2/3 refutações). Confiança indicada por claim.

## 1. Custo de vida / inflação — dor n.º 1 (confiança: alta)

- 43% dos portugueses citam o aumento dos preços/custo de vida como um dos problemas mais importantes do país (Eurobarómetro Standard 102, out-nov 2024) vs 33% na média UE27.
- Ainda 34% no Eurobarómetro do outono 2025 (2.º lugar, atrás da saúde).
- "Fornecimento de energia" isolado recolhe apenas **2%** — a dor energética expressa-se via custo de vida, não via "energia" em abstrato.

Fontes: [Representação da CE em Portugal (EB 102)](https://portugal.representation.ec.europa.eu/news/portugueses-confiam-na-ue-e-consideram-custo-de-vida-o-principal-problema-do-pais-2024-12-20_pt) · [Pordata/FFMS (PDF)](https://ffms.pt/sites/default/files/2025-04/PR%20Elei%C3%A7%C3%B5es%20Legislativas_2025_Pordata_FINAL.pdf) · [CE outono 2025](https://portugal.representation.ec.europa.eu/news/eurobarometro-portugal-no-topo-da-confianca-europeia-enquanto-cidadaos-da-ue-apelam-uma-uniao-mais-2025-12-15_pt)

## 2. Habitação — dor n.º 2, a mais intensa (confiança: alta)

- 28% no EB 102 (5.º valor mais alto da UE); 32% no outono 2025; 43% e 1.º lugar no Flash EB 539 sobre problemas da região (+23 p.p. vs UE27).
- OSP/Católica (jul 2025, n=1.134): 65,3% "muito preocupados" com preços da habitação; 51,1% com o acesso; 36,4% dos agregados gastam >30% do rendimento com a casa (+3,6 p.p. num ano).
- Habitação é a área pior avaliada do desempenho do governo: aumento de preços 2,45/10 (abaixo da corrupção), oferta urbana 2,93, habitação pública 3,11.

Fontes: [OSP Católica-Lisbon jul-2025](https://www.clsbe.lisboa.ucp.pt/pt-pt/osp-julho-2-25-atualidades) · [Observatório das Desigualdades (Flash EB 539)](https://www.observatorio-das-desigualdades.com/2024/05/15/eurobarometro-revela-que-portugueses-estao-mais-preocupados-com-custo-de-vida-habitacao-e-transportes-do-que-o-resto-da-europa/) · Pordata/FFMS (acima)

## 3. Saúde/SNS — dor n.º 3, 1.ª no outono 2025 (confiança: alta)

- 36% no EB 102; 37% e 1.º lugar no outono 2025.
- 53,4% concordam totalmente que o estado do SNS diminui a qualidade dos cuidados; 50,4% temem não obter assistência.

## 4. Portugal concentra as dores nos temas domésticos (confiança: alta)

- Pordata/FFMS: "Portugal destaca-se por ser o país que mais concentra a preocupação dos seus habitantes nestes três problemas" (custo de vida + saúde + habitação).
- Acima da média europeia em quatro domínios simultaneamente: habitação +23 p.p., custo de vida +9, saúde +5, transportes +4.

## 5. Segundo escalão estrutural (EB 102, confiança: alta)

Situação económica 13% · desemprego 12% · impostos 11% (UE27: 6%) · imigração 10% · pensões 9%.

## 6. Recordes de reclamações de consumo (confiança: alta)

- Portal da Queixa: 224.256 reclamações em 2024 (+10,7%, média 614/dia); 238.698 em 2025 (+6,44%) — máximos históricos consecutivos.
- Cautela: parte do crescimento reflete adoção da plataforma e maior literacia de reclamação, não necessariamente mais insatisfação.

Fontes: [Barómetro 2024](https://portaldaqueixa.com/news/portal-da-queixa-regista-novo-recorde-reclamacoes-2024) · [Barómetro 2025](https://portaldaqueixa.com/news/barometro-anual-do-consumo-2025-portugueses-registaram-novo-recorde-de-reclamacoes-em-2025)

## 7. Setores mais reclamados (confiança: alta; componente DECO datada de 2023)

- Portal da Queixa 2024: Correio/Transporte/Logística 13% · Serviços e Administração Pública 9,7% · Comunicações/TV 7,9% · Informática 6,2% · Banca 5,9%. Em 2025 a logística mantém a liderança (13,59%); telecomunicações +34% (entrada da Digi); serviços públicos +93%.
- DECO: telecomunicações lidera; energia/água é o 4.º setor (6.258 reclamações de energia em 2024, sobretudo faturação excessiva).

## 8. Entidades públicas no topo das marcas mais reclamadas (confiança: alta) — o sinal mais validante para o projeto

- 2024: o IMT foi a marca mais reclamada do país (n.º 1 em 10 dos 12 meses).
- 2025: o **IHRU tornou-se a 4.ª marca mais reclamada de Portugal**, explicitamente por "atrasos e dificuldades no acesso aos apoios à habitação"; AIMA também no top. Entre entidades públicas: IHRU 20,06%, IMT 13,68%, AIMA 12,12%.
- Reclamações ao IHRU cresceram 93%, dominadas pelo Porta 65 (Jornal Económico).
- Nota de rigor: as queixas ao IHRU visam apoios habitacionais gerais (Porta 65, arrendamento acessível) — domínio **adjacente** aos apoios de eficiência energética. O padrão de fricção é o mesmo; o instrumento é diferente.

## 9. Insegurança quanto ao futuro (confiança: média)

- Dimensão de bem-estar mais vulnerável no OSP 2025: 28,6% insatisfeitos ou muito insatisfeitos.
- A perceção de custo de vida disparou entre vagas (rendimento mensal "suficiente" <1.000 EUR caiu de 63,2% para 22,7%) — ler como perceção/efeito de painel, não custo real.

## 10. Pobreza energética (evidência de fontes lidas na pesquisa)

- 20,8% da população incapaz de manter a casa adequadamente aquecida em 2023 — Portugal empatado com Espanha no pior lugar da UE, ~2,2 milhões de pessoas; 15,7% em 2024 (Eurostat).
- ELPPE 2023-2050 (DGEG): meta de reduzir para 10% em 2030 (vs 17,5% em 2020) — contraste entre metas ambiciosas e execução falhada dos programas.

Fontes: [Público/Eurostat](https://www.publico.pt/2025/02/10/azul/noticia/47-milhoes-europeus-passam-frio-casa-2121822) · [Renascença](https://rr.pt/noticia/pais/2024/12/24/pobreza-energetica-portugal-e-o-pais-da-europa-com-mais-queixas/407219/) · [DGEG/ELPPE](https://www.dgeg.gov.pt/pt/areas-transversais/politicas-de-protecao-ao-consumidor-de-energia/pobreza-energetica/)

## Afirmação refutada na verificação

- "As preocupações da UE dominadas por guerra na Ucrânia (26%), imigração (20%), situação internacional (19%)" — números europeus específicos não confirmados (voto 1-2). A versão baseada só nos dados portugueses mantém-se válida.

## Limitações

1. Portal da Queixa é plataforma privada (Consumers Trust), volume auto-reportado — não é estatística oficial.
2. OSP/Católica usa painel online não probabilístico (n=1.134, 20-69 anos).
3. Ranking setorial detalhado da DECO data de 2023; sem balanço DECO 2024-2025 verificado.
4. Flash EB 539 pergunta sobre a REGIÃO do inquirido — os 43% de habitação não são comparáveis aos 28% do EB Standard.
5. A ordem do trio custo de vida/saúde/habitação oscila entre vagas; o trio é estável, a ordem não.
6. Sem evidência direta de Reddit/Facebook/Instagram nos claims verificados (Reddit bloqueado ao crawler) — ver secção de sinal social.
7. Salários baixos não aparecem isolados nos inquéritos — surgem embutidos em custo de vida/situação económica.

## Estatísticas da pesquisa

5 ângulos · 22 fontes lidas · 105 claims extraídos · 25 verificados (3 votos cada) · 24 confirmados · 1 refutado · 104 agentes.

---

# Dossiê: fricção nos apoios públicos à eficiência energética

Teste direto à tese do Portal Casa Eficiente: existe dor documentada no acesso aos apoios? **Sim — e é grave.** Mas o mesmo dossiê revela o principal risco do projeto: a instabilidade dos próprios programas.

## Vale Eficiência — colapso documentado (2024-2026)

Cronologia com base em Público, ECO e DECO Proteste:

1. **Execução residual**: até outubro de 2025 tinham sido pagos pouco mais de 3 milhões de euros, ~850 candidaturas executadas — **menos de 3% do total** — numa fase com dotação de 104 milhões de euros para ~80 mil vales de 1.300 EUR + IVA.
2. **Labirinto burocrático**: "o programa transformou-se num labirinto burocrático que deixou milhares de cidadãos à espera dos reembolsos durante meses" (Público). Os facilitadores técnicos atribuem parte dos atrasos à plataforma eletrónica de candidaturas, "que contém inúmeras falhas operacionais".
3. **Cancelamento (fev-2026)**: o Fundo Ambiental determinou "o encerramento imediato da atribuição de novos vales". Dois anos após a abertura da fase, **mais de 28 mil candidaturas submetidas e consideradas elegíveis ficaram sem qualquer vale** — "a dotação encontra-se integralmente comprometida" e "o estatuto de elegível não garante a atribuição".
4. **Reconhecimento oficial da causa**: a ministra do Ambiente e Energia admitiu que a arquitetura era demasiado complexa para a escala da procura: "É impensável fazer programas que envolvem 60 mil, 100 mil candidaturas, se os programas não forem muito simples." Comprometeu-se a regularizar os pagamentos em atraso durante 2026.
5. **Hiato de apoio**: o substituto para famílias vulneráveis (Plano Social para o Clima 2026-2032) só deverá atribuir apoios a partir de 2027 e ainda está em negociação com a Comissão Europeia.

Fontes: [Público fev-2026 (cancelamento)](https://www.publico.pt/2026/02/19/azul/noticia/programa-vale-eficiencia-cancela-atribuicao-novos-apoios-familias-2165382) · [Público abr-2026 (pagamentos em atraso)](https://www.publico.pt/2026/04/25/azul/noticia/governo-comprometese-concluir-pagamentos-atraso-vale-eficiencia-2026-2172443) · [DECO Proteste](https://www.deco.proteste.pt/casa-energia/aquecimento/noticias/governo-acaba-com-vale-eficiencia-sem-atribuir-apoios-anuncia-novo-programa-2027) · [ECO](https://eco.sapo.pt/2026/02/19/programa-vale-eficiencia-cancela-atribuicao-de-novos-apoios/)

## E-Lar — sucesso relativo, mas com fricção na execução

- Mais de 80 mil famílias apoiadas na aquisição de equipamentos eficientes/eletrificação — apontado pela ministra como "modelo de maior eficácia".
- Porém: até 27-fev-2026, dos 55.319 vouchers emitidos na 2.ª fase, só **17.721 (~32%) tinham sido efetivamente utilizados** — fricção entre atribuição e execução.
- DECO Proteste critica o desenho: sem isolamento térmico estrutural, o E-Lar "pode perpetuar a vulnerabilidade energética" e subir a fatura até 360 EUR/ano.

## Outros sinais de instabilidade dos programas

- **Bairros Mais Sustentáveis** (PRR, combate à pobreza energética): terminado prematuramente em nov-2025 por "ausência total de candidaturas" — falha de divulgação/descoberta, precisamente o problema que um agregador resolve.
- **Apoio a painéis solares**: anunciado, mas pode ser adiado — verbas do Fundo Ambiental redirecionadas para respostas de emergência.
- **IHRU**: 4.ª marca mais reclamada de Portugal em 2025, queixas +93%, por atrasos no acesso a apoios à habitação (Porta 65) — o mesmo padrão de fricção no domínio adjacente.

## Leitura para o projeto

**A favor (validação da dor):**
- A fricção é real, massiva, mediática e oficialmente reconhecida: plataformas que falham, candidaturas elegíveis sem resposta, regras confusas, programas mal divulgados.
- "Ausência total de candidaturas" num programa e 28 mil candidatos pendurados noutro = o problema é de **navegação, descoberta e acompanhamento** — o core do Portal Casa Eficiente.
- 20,8% da população em pobreza energética garante procura estrutural de longo prazo; o Fundo Social para o Clima (2026-2032) garante que virão novos programas.

**Contra (riscos):**
- O programa-âncora do nicho (Vale Eficiência) **já não existe**; o substituto só chega em 2027. Curto prazo com menos "inventário" de apoios de eficiência para agregar.
- Um agregador não resolve a dor a jusante (o Estado não pagar/atribuir) — pode gerar tráfego e expectativas para apoios que depois falham; a proposta de valor tem de gerir isso (estado real do programa, alertas de dotação esgotada, alternativas).
- Dependência de decisões políticas: programas cancelados, reprogramados ou esvaziados sem aviso — o portal precisa de ingestão contínua e de comunicar o estado com honestidade (o que, bem feito, é em si um diferencial).

---

# Avaliação: o Portal Casa Eficiente responde às dores dos portugueses?

## Fit contra o ranking

| Dor (posição no ranking) | Fit | Como o projeto responde |
|---|---|---|
| Custo de vida (n.º 1) | **Direto** | Reduzir a fatura energética da casa é redução de custo de vida — mas o utilizador pensa "poupar dinheiro", não "energia" (só 2% citam energia como preocupação) |
| Habitação (n.º 2) | **Direto** | Eficiência reduz o custo de habitar e reabilita casas antigas (as mesmas que geram os 20,8% de pobreza energética) |
| Burocracia/Estado (n.º 4) | **Direto — o mais forte** | Agregação, verificação de elegibilidade e acompanhamento atacam exatamente a fricção que tornou IMT/IHRU/AIMA as marcas mais reclamadas do país |
| Pobreza energética (n.º 11) | **Direto — núcleo** | 2,2 milhões de pessoas sem conseguir aquecer a casa; pior da UE |
| Fricção nos apoios (n.º 12) | **Direto — é a tese** | Vale Eficiência: <3% execução, 28 mil elegíveis sem vale; Bairros Sustentáveis: morto por "ausência total de candidaturas" |
| Impostos (n.º 7), situação económica (n.º 5), insegurança futuro (n.º 10) | Indireto | Benefícios fiscais, alívio orçamental, previsibilidade |
| Saúde, desemprego, imigração, pensões (n.º 3, 6, 8, 9) | Nenhum | Fora de âmbito |

Três linhas de evidência independentes convergem: inquéritos oficiais UE (custo de vida 43%, habitação 28-43%), inquérito académico (65,3% muito preocupados com preços de habitação) e dados de reclamações (IHRU 4.ª marca mais reclamada). **O projeto está alinhado com 3 das 4 maiores dores do país.**

## Veredicto: continuar — com dois ajustes

**Sim, faz sentido continuar.** A dor é real, intensa, documentada e estrutural (não conjuntural: parque habitacional antigo + pobreza energética pior da UE + Fundo Social para o Clima a injetar novos programas até 2032). O estado técnico do projeto (~65-70% de um MVP, fundação sólida) não justifica abandonar.

### Ajuste 1 — Posicionamento: "poupa dinheiro e desbloqueia apoios", não "eficiência energética"

- "Eficiência energética" é linguagem de quem desenha programas, não de quem sofre a dor. Só 2% dos portugueses citam energia como preocupação; 43% citam custo de vida e 28-43% habitação.
- A comunicação deve liderar com: quanto dinheiro há disponível para a tua casa, quanto poupas na fatura, casa quente no inverno — e não com taxonomia de programas.

### Ajuste 2 — Produto resiliente à instabilidade dos programas

O maior risco validado pela pesquisa: os programas-alvo mudam, atrasam-se e morrem (Vale Eficiência cancelado; solar adiado; substituto só em 2027). Implicações:

1. **O estado do programa é o produto**: mostrar com honestidade "aberto / dotação esgotada / suspenso / pagamentos em atraso" é um diferencial que nenhuma fonte oficial oferece de forma agregada — e evita queimar confiança.
2. **Alertas como feature central**: "avisa-me quando abrir apoio para janelas no meu concelho" resolve a dor do timing (candidaturas que esgotam) e cria retenção; alinha com a Fase 5 (notificações) já planeada.
3. **Alargar o inventário para lá da eficiência estrita**: apoios municipais, IFRRU/reabilitação, benefícios fiscais (IMI/IVA), E-Lar e futuros programas do Plano Social para o Clima — amortece o vazio deixado pelo Vale Eficiência e aproxima o portal da dor "habitação" completa.
4. **Cuidado com a promessa**: o portal não controla se o Estado paga. Gerir expectativas (prazos reais observados, histórico de execução do programa) transforma o risco em credibilidade.

### Oportunidade validada mas não explorada na pesquisa

- Sem dados sobre volume de queixas específicas ao Fundo Ambiental (a pesquisa cobriu IHRU); vale a pena monitorizar o Portal da Queixa como fonte de dor contínua.
- O sinal social direto (Reddit/Facebook) ficou por confirmar em profundidade.

## Próximos passos sugeridos (ordem de impacto)

1. Fechar o MVP (ligar o engine de elegibilidade real às recomendações; substituir mocks; povoar a base com ingestão real) — o roadmap em `proximospassos.md` já aponta para isto.
2. Reposicionar copy da landing para custo de vida/poupança.
3. Implementar estado-do-programa + alertas (Fase 5) como prioridade de produto, não como "nice to have".
4. Validar procura com tráfego real: SEO em torno de pesquisas de dor ("apoio janelas 2026", "vale eficiência pagamentos atraso", "apoios casa [concelho]") — as notícias de cancelamento geram volume de pesquisa que o portal pode capturar com conteúdo honesto.

---

# Sinal social qualitativo — queixas de portugueses online (2024-2026)

**Nota metodológica:** o acesso direto a reddit.com está bloqueado a crawlers e o Facebook praticamente não é indexado por pesquisa web. As pesquisas `site:reddit.com` (r/portugal, r/literaciafinanceira) não devolveram threads recuperáveis — limitação explícita, não ausência de queixas. O sinal social citável concentra-se no **Portal da Queixa** e na **DECO Reclamar** (queixas primárias, verbatim), com a imprensa como proxy do sentimento das redes.

## 1. Apoios à eficiência energética — queixas primárias (sinal forte, fiabilidade alta)

### Vale Eficiência — "labirinto burocrático"

- **DECO Reclamar (ago-2025)**: candidatura aceite a 07-12-2024, **mais de 8 meses sem atribuição de Facilitador Técnico** (o regulamento previa 30 dias úteis); resposta do Fundo Ambiental: *"não existe prazo para tal atribuição"*. Queixoso: *"Esta situação está a impedir a execução do projeto e poderá comprometer a utilização do vale atribuído."* — [queixa](https://www.deco.proteste.pt/reclamar/todas-as-reclamacoes/atraso-excessivo-na-atribui-C3-A7-C3-A3o/80001b0802ee126c4f)
- **Portal da Queixa (marca Ministério do Ambiente)**: candidaturas de nov-2023 só consideradas elegíveis em out-2024 e ainda sem facilitador; utilizadores à espera **há 2 anos** de apoio técnico no seu concelho; fornecedores: *"a plataforma não funciona e os facilitadores complicam em vez de ajudar"*. — [queixas](https://portaldaqueixa.com/brands/ministerio-do-ambiente-e-da-acao-climatica/complaints)
- 1.ª fase: queixas por **custos escondidos** (desinstalação, tamponamento do gás) e obrigação de comprar tudo na mesma loja (DECO).

### E-Lar — corrida, colapso da plataforma, elegibilidade frustrada

- Verba de 30 M€ esgotada em **6 dias** (~40 mil candidaturas); 1.ª edição acumulou **247 reclamações** no Portal da Queixa. Citações: *"O site, ou simplesmente não funciona, ou recebo um email a pedir um procedimento que, igualmente, não é possível concretizar"*; *"O portal do E-Lar não dá acesso ao formulário"*; beneficiária de tarifa social excluída por falha técnica. — [Gazeta Rural](https://gazetarural.com/e-lar-portal-da-queixa-recebeu-varias-reclamacoes-sobre-problemas-com-candidaturas/)
- 2.ª fase (dez-2025): "corrida ao E-Lar faz curto-circuito" — 30 mil acessos em 10 segundos ([Jornal de Negócios](https://www.jornaldenegocios.pt/empresas/energia/detalhe/corrida-ao-e-lar-faz-curto-circuito-na-pagina-das-candidaturas)); Governo recorreu ao servidor do LNEG para evitar novo colapso ([Público](https://www.publico.pt/2025/12/10/azul/noticia/evitar-problemas-arranque-elar-governo-recorre-servidor-lneg-2157531)).

### Porta 65 (habitação, domínio adjacente)

- Reclamações dispararam **+80% num ano**; 82,4% por demora na aprovação; famílias esperam quase 2 anos pelo apoio. — [Executive Digest](https://executivedigest.sapo.pt/noticias/porta-65-reclamacoes-disparam-80-no-ultimo-ano-atrasos-na-aprovacao-e-no-pagamento-sao-principais-motivos-das-queixas/) · [JN](https://www.jn.pt/nacional/artigo/familias-esperam-quase-dois-anos-por-apoios-do-porta-65/17754895)

## 2. Queixas gerais sobre viver em Portugal (proxies de imprensa, fiabilidade média)

- **Emigração jovem por salários/habitação**: fosso salarial face a Suíça/UK/Alemanha, custo de vida e crise de habitação como motivos — [Portugal Resident](https://www.portugalresident.com/young-professionals-portugals-biggest-export/)
- **Acessibilidade da habitação caiu para metade**: o salário médio comprava ~1 m²/mês em 2010, ~0,5 m² em 2024 — [João Neves Analytics](https://joaonevesanalytics.substack.com/p/impact-of-migration-on-housing-prices)

## 3. Facebook/Instagram

Nenhum grupo específico confirmável via pesquisa web (não indexado/não fetchável). O equivalente funcional português do "grupo de queixas" é o Portal da Queixa. **Recomendação:** pesquisa manual com sessão iniciada no Facebook — termos: "Vale Eficiência dúvidas", "E-Lar candidaturas", "Porta 65 apoio".

## O padrão-chave para o produto

As 4 dores dominantes nas queixas primárias:

1. Lógica *first come, first served* — verbas esgotam em dias (o timing é tudo → valida alertas/notificações).
2. Plataformas estatais frágeis — caem no dia 1, formulários inacessíveis.
3. Elegibilidade e documentação confusas — exclusões por falha técnica, custos escondidos.
4. Silêncio pós-candidatura — meses/anos sem resposta, sem prazos ("não existe prazo para tal atribuição").

O Portal Casa Eficiente ataca diretamente 1, 3 e 4; a 2 é a razão pela qual as pessoas precisam de um intermediário que monitorize por elas.

---

# Recomendações completas — o que fazer com base nas dores

Consolidação de todas as recomendações da pesquisa: primeiro as que dizem respeito ao Portal Casa Eficiente, depois as ideias de novo software que atacam as mesmas dores.

## A. Portal Casa Eficiente — veredicto e ajustes

**Veredicto: continuar.** O projeto alinha com 3 das 4 maiores dores do país (custo de vida, habitação, burocracia no acesso a apoios) e com duas dores de nicho totalmente validadas (pobreza energética — 20,8%, pior da UE; fricção nos apoios — Vale Eficiência com <3% de execução e 28 mil elegíveis abandonados). Estado técnico: ~65-70% de um MVP, fundação sólida.

### Ajuste 1 — Posicionamento: "poupa dinheiro e desbloqueia apoios", não "eficiência energética"

Só 2% dos portugueses citam "energia" como preocupação; 43% citam custo de vida e 28-43% habitação. "Eficiência energética" é linguagem de quem desenha programas, não de quem sofre a dor. A comunicação deve liderar com: quanto dinheiro há disponível para a tua casa, quanto poupas na fatura, casa quente no inverno.

### Ajuste 2 — Produto resiliente à instabilidade dos programas

O maior risco validado: os programas-alvo mudam, atrasam-se e morrem (Vale Eficiência cancelado fev-2026; apoio solar adiado; substituto só em 2027).

1. **O estado do programa é o produto** — mostrar "aberto / dotação esgotada / suspenso / pagamentos em atraso" de forma agregada e honesta; nenhuma fonte oficial o faz.
2. **Alertas como feature central** — "avisa-me quando abrir apoio para janelas no meu concelho" resolve a dor do first-come-first-served (E-Lar: 30 M€ esgotados em 6 dias) e cria retenção. Alinha com a Fase 5 já planeada.
3. **Alargar o inventário** — municipais, IFRRU/reabilitação, benefícios fiscais (IMI/IVA), E-Lar, futuros programas do Plano Social para o Clima; amortece o vazio do Vale Eficiência.
4. **Gerir a promessa** — o portal não controla se o Estado paga; publicar prazos reais observados e histórico de execução transforma o risco em credibilidade.

### Próximos passos técnicos (ordem de impacto)

1. Fechar o MVP: ligar o engine de elegibilidade real às recomendações (hoje em mock), substituir dados-mock dos workers, povoar a base com ingestão real.
2. Reposicionar a copy da landing para custo de vida/poupança.
3. Implementar estado-do-programa + alertas como prioridade de produto.
4. SEO sobre pesquisas de dor ("apoio janelas 2026", "vale eficiência pagamentos atraso", "apoios casa [concelho]") — as notícias de cancelamento geram volume de pesquisa que conteúdo honesto captura.

## B. Novo software — ideias ordenadas por evidência × viabilidade × sinergia

### 1. Radar de Apoios do Estado (generalização deste portal) — a aposta mais forte

- **Dor**: a fricção validada não é específica da eficiência energética — é transversal a todos os apoios públicos (IHRU 4.ª marca mais reclamada de 2025, AIMA e IMT no top, Porta 65 +80% de reclamações, verbas esgotadas em dias, silêncio pós-candidatura).
- **Produto**: agregador universal de apoios ao cidadão — Porta 65, IRS Jovem, abono, bolsas, apoios sociais, municipais, E-Lar, futuros programas. Verificação de elegibilidade por perfil + alertas "abriu apoio X para ti".
- **Porquê tu**: ~70% do motor já existe neste repo (ingestão multi-fonte, elegibilidade, geografia por concelho, alertas planeados). É expansão de inventário, não produto novo — e elimina o risco de dependência de um nicho instável.

### 2. Acompanhador de processos públicos ("onde está o meu processo?")

- **Dor**: silêncio pós-candidatura — "não existe prazo para tal atribuição" (resposta oficial do Fundo Ambiental); famílias 2 anos à espera do Porta 65; IMT marca mais reclamada de 2024 (cartas de condução); AIMA no top (autorizações de residência).
- **Produto**: tracker de processos com prazos reais observados via crowdsourcing — "candidatei-me em X, respondeu em Y" agregado por instituto/tipo/mês. O Estado não publica tempos reais; este dataset não existe em lado nenhum. Alertas de "processo fora do prazo típico" + minuta de reclamação pronta.
- **Risco**: cold start — precisa de massa crítica de reports. Mitigação: começar por um único processo de alto volume (Porta 65 ou AIMA).

### 3. Assistente de fatura de energia

- **Dor**: energia é o 4.º setor mais reclamado na DECO (6.258 queixas em 2024, sobretudo faturação excessiva); custo de vida é a dor n.º 1; tarifa social atribuída com falhas técnicas.
- **Produto**: foto/PDF da fatura → explicação linha a linha, deteção de cobranças anómalas, verificação de direito a tarifa social, comparação de tarifários com poupança estimada. Mesma audiência e mesma promessa deste portal ("poupar dinheiro na casa").

### 4. Gerador de reclamações

- **Dor**: 238.698 reclamações no Portal da Queixa em 2025, recordes consecutivos — reclamar é massivo, mas fazê-lo bem (canal certo, fundamentação legal, prazos) é confuso.
- **Produto**: descreves o problema → gera reclamação fundamentada, escolhe o canal (Livro de Reclamações eletrónico, DECO, ANACOM, ERSE, Provedoria), acompanha prazos legais de resposta. Monetização clara (freemium).

### Menções com reservas

- **SNS/tempos de espera**: dor n.º 3 do país, mas o SNS já publica tempos de espera e integração real (marcações) exige acordos institucionais — evitar.
- **B2B para facilitadores técnicos/agências de energia**: dor real (pagos a 50 EUR/candidatura, plataformas estatais que falham), mas mercado minúsculo e dependente dos mesmos programas instáveis.

## C. Leitura estratégica

Os quatro produtos partilham uma tese única, validada pela pesquisa: **o cidadão português perde dinheiro e tempo na interface com o Estado e com serviços essenciais, e ninguém agrega, traduz e vigia isso por ele.**

O funil natural é um só: **descobrir apoio → verificar elegibilidade → candidatar → acompanhar → reclamar.** As ideias 1 e 2 podem ser o mesmo produto a prazo; a 4 é a última etapa do mesmo funil.

**Recomendação prática:** acabar o MVP deste portal (prova o motor), expandir para o Radar de Apoios (1), acrescentar o tracker (2) como feature — em vez de três produtos separados.
