import { buildMetadata, SITE_NAME } from '@/lib/seo';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LegalPlaceholderNotice } from '@/components/legal/LegalPlaceholderNotice';
import { LEGAL, formatLastUpdated } from '@/lib/legal';

const TBD = '[por preencher]';

export default function PrivacidadePage() {
  return (
    <>
      <Header />

      <main className="flex-1">
        <section className="bg-gradient-to-b from-primary-50 to-background py-12">
          <div className="container">
            <div className="mx-auto max-w-3xl">
              <h1 className="text-3xl font-bold text-ink sm:text-4xl">
                Política de Privacidade
              </h1>
              <p className="mt-3 text-muted-foreground">
                Última atualização: {formatLastUpdated()}
              </p>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container">
            <div className="mx-auto max-w-3xl space-y-10 text-muted-foreground leading-relaxed">
              <LegalPlaceholderNotice />

              <div>
                <p>
                  Esta política explica que dados pessoais o {SITE_NAME} recolhe,
                  porque os recolhe, com quem os partilha e que direitos tens
                  sobre eles. Aplica-se ao site e a todas as suas funcionalidades.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-ink">
                  1. Quem é responsável pelos teus dados
                </h2>
                <ul className="mt-4 space-y-1">
                  <li>
                    <strong>Responsável pelo tratamento:</strong>{' '}
                    {LEGAL.entityName || TBD}
                  </li>
                  <li>
                    <strong>NIF/NIPC:</strong> {LEGAL.taxId || TBD}
                  </li>
                  <li>
                    <strong>Morada:</strong> {LEGAL.address || TBD}
                  </li>
                  <li>
                    <strong>Email:</strong> {LEGAL.email || TBD}
                  </li>
                </ul>
                <p className="mt-4">
                  O {SITE_NAME} é uma plataforma independente. Não é um serviço
                  público nem está oficialmente afiliado ao Estado Português ou a
                  qualquer entidade gestora dos apoios divulgados.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-ink">
                  2. Que dados recolhemos
                </h2>

                <h3 className="mt-6 text-lg font-semibold text-ink">
                  Dados de conta
                </h3>
                <p className="mt-2">
                  Nome, endereço de email e palavra-passe. A palavra-passe nunca
                  é guardada em texto simples — guardamos apenas um resumo
                  criptográfico (bcrypt), que não permite recuperar a palavra-passe
                  original. Opcionalmente, o NIF, se o indicares.
                </p>

                <h3 className="mt-6 text-lg font-semibold text-ink">
                  Dados do dossiê (opcionais)
                </h3>
                <p className="mt-2">
                  Só existem se decidires preencher o dossiê. Servem para
                  calcular a que apoios és elegível:
                </p>
                <ul className="mt-3 list-disc space-y-1 pl-6">
                  <li>Morada, código postal e concelho</li>
                  <li>
                    Se é habitação própria permanente, ano de construção, tipo de
                    imóvel e certificado energético
                  </li>
                  <li>Número de pessoas do agregado e rendimento anual</li>
                  <li>Se beneficias de tarifa social de energia</li>
                  <li>
                    Se há pessoas com deficiência ou pessoas idosas no agregado
                  </li>
                </ul>
                <p className="mt-3">
                  <strong>
                    A indicação de que existe uma pessoa com deficiência no
                    agregado é um dado de saúde
                  </strong>
                  , categoria especial ao abrigo do artigo 9.º do RGPD. Só o
                  tratamos com o teu consentimento explícito, dado ao preencheres
                  esse campo. Podes deixá-lo em branco — nesse caso deixamos de
                  conseguir avaliar os apoios que dependem desse critério, mas
                  todo o resto do serviço continua a funcionar.
                </p>

                <h3 className="mt-6 text-lg font-semibold text-ink">
                  Dados de utilização
                </h3>
                <p className="mt-2">
                  Apoios que guardas nos favoritos e as tuas preferências de
                  notificação (concelhos e temas a vigiar).
                </p>

                <h3 className="mt-6 text-lg font-semibold text-ink">
                  Dados técnicos
                </h3>
                <p className="mt-2">
                  Registos de servidor gerados automaticamente pelo alojamento,
                  incluindo endereço IP e tipo de navegador. Não usamos
                  ferramentas de análise de tráfego nem publicidade.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-ink">
                  3. Porque tratamos estes dados
                </h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[32rem] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-ink">
                        <th className="py-2 pr-4 font-semibold">Finalidade</th>
                        <th className="py-2 font-semibold">Fundamento legal</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="py-3 pr-4">Criar e gerir a tua conta</td>
                        <td className="py-3">
                          Execução do contrato (art. 6.º, n.º 1, al. b))
                        </td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-3 pr-4">
                          Avaliar a que apoios és elegível
                        </td>
                        <td className="py-3">
                          Execução do contrato; consentimento explícito quanto ao
                          dado de saúde (art. 9.º, n.º 2, al. a))
                        </td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-3 pr-4">
                          Enviar alertas sobre apoios e prazos
                        </td>
                        <td className="py-3">
                          Consentimento (art. 6.º, n.º 1, al. a)), revogável a
                          qualquer momento
                        </td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-3 pr-4">
                          Recuperação de palavra-passe
                        </td>
                        <td className="py-3">Execução do contrato</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4">
                          Segurança e prevenção de abuso
                        </td>
                        <td className="py-3">
                          Interesse legítimo (art. 6.º, n.º 1, al. f))
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-ink">
                  4. Com quem partilhamos
                </h2>
                <p className="mt-4">
                  Não vendemos dados pessoais nem os cedemos para fins
                  publicitários. Recorremos aos seguintes subcontratantes, cada
                  um apenas para a finalidade indicada:
                </p>
                <ul className="mt-4 list-disc space-y-2 pl-6">
                  <li>
                    <strong>Supabase</strong> — alojamento da base de dados.
                    Servidores na Irlanda (União Europeia).
                  </li>
                  <li>
                    <strong>Vercel</strong> — alojamento e entrega do site.
                  </li>
                  <li>
                    <strong>Resend</strong> — envio dos emails transacionais
                    (recuperação de palavra-passe e alertas).
                  </li>
                  <li>
                    <strong>GeoAPI.pt</strong> — validação de códigos postais.
                    Enviamos apenas o código postal, sem qualquer dado que te
                    identifique.
                  </li>
                </ul>
                <p className="mt-4">
                  A Vercel e a Resend são empresas norte-americanas, pelo que
                  pode haver transferência de dados para fora do Espaço Económico
                  Europeu. Essas transferências assentam nas Cláusulas
                  Contratuais-Tipo aprovadas pela Comissão Europeia.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-ink">
                  5. Durante quanto tempo guardamos
                </h2>
                <ul className="mt-4 list-disc space-y-2 pl-6">
                  <li>
                    <strong>Dados de conta e dossiê:</strong> enquanto a conta
                    existir. Se a apagares, são eliminados.
                  </li>
                  <li>
                    <strong>Tokens de recuperação de palavra-passe:</strong>{' '}
                    eliminados após utilização ou expiração.
                  </li>
                  <li>
                    <strong>Registos técnicos:</strong> conservados pelo período
                    definido pelos fornecedores de alojamento.
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-ink">6. Cookies</h2>
                <p className="mt-4">
                  Usamos apenas cookies estritamente necessários: o cookie de
                  sessão que te mantém autenticado depois de entrares na conta.
                  Não usamos cookies de análise, de perfil ou de publicidade, e
                  por isso não te pedimos consentimento para cookies. Se apagares
                  o cookie de sessão, terminas a sessão.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-ink">
                  7. Segurança
                </h2>
                <p className="mt-4">
                  As comunicações com o site são cifradas (HTTPS). As
                  palavras-passe são guardadas com bcrypt. O acesso à base de
                  dados está restringido ao servidor por políticas de segurança
                  ao nível das linhas (RLS). Nenhum sistema é infalível, mas
                  estas são as medidas em vigor.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-ink">
                  8. Os teus direitos
                </h2>
                <p className="mt-4">Tens direito a:</p>
                <ul className="mt-3 list-disc space-y-1 pl-6">
                  <li>Aceder aos dados que temos sobre ti</li>
                  <li>Corrigir dados incorretos ou incompletos</li>
                  <li>Apagar os teus dados</li>
                  <li>
                    Receber os teus dados em formato estruturado (portabilidade)
                  </li>
                  <li>Limitar ou opor-te a determinados tratamentos</li>
                  <li>
                    Retirar o consentimento a qualquer momento, sem afetar a
                    licitude do tratamento anterior
                  </li>
                </ul>
                <p className="mt-4">
                  Para exercer qualquer destes direitos, escreve para{' '}
                  {LEGAL.email || TBD}. Respondemos no prazo de um mês.
                </p>
                <p className="mt-4">
                  Se entenderes que os teus dados estão a ser tratados
                  indevidamente, podes apresentar reclamação à{' '}
                  <a
                    href="https://www.cnpd.pt"
                    className="text-primary underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Comissão Nacional de Proteção de Dados
                  </a>
                  .
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-ink">
                  9. Decisões automatizadas
                </h2>
                <p className="mt-4">
                  A verificação de elegibilidade é automática, mas é meramente
                  informativa: não produz efeitos jurídicos nem decide sobre
                  qualquer candidatura. A decisão sobre atribuir ou não um apoio é
                  sempre da entidade responsável pelo programa.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-ink">
                  10. Alterações a esta política
                </h2>
                <p className="mt-4">
                  Se esta política mudar de forma significativa, atualizamos a
                  data no topo da página e avisamos os utilizadores com conta por
                  email.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export const metadata = buildMetadata({
  title: 'Política de Privacidade',
  description: `Como o ${SITE_NAME} recolhe, usa e protege os teus dados pessoais, e que direitos tens sobre eles.`,
  path: '/privacidade',
});
