import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Target, Users, Eye, Award } from 'lucide-react';

export default function SobrePage() {
  return (
    <>
      <Header />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-primary/5 to-white py-16">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Sobre o Portal Casa Eficiente
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                O ponto de acesso aos apoios para tornar a tua casa mais confortável, 
                eficiente e económica.
              </p>
            </div>
          </div>
        </section>

        {/* Missão */}
        <section className="py-16">
          <div className="container">
            <div className="mx-auto max-w-3xl">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">A nossa missão</h2>
                  <p className="mt-4 text-lg text-gray-600 leading-relaxed">
                    <strong>Democratizar o acesso aos apoios públicos de eficiência energética em Portugal</strong>, 
                    tornando simples, claro e acessível aquilo que hoje é confuso, burocrático e desigual.
                  </p>
                  <p className="mt-4 text-gray-600 leading-relaxed">
                    Acreditamos que todos os cidadãos devem ter acesso igual à informação sobre 
                    apoios públicos, independentemente dos seus conhecimentos técnicos ou legais. 
                    A burocracia não deve ser uma barreira à eficiência energética.
                  </p>

                  <h3 className="mt-6 text-lg font-semibold text-gray-900">Porque isto existe</h3>
                  <p className="mt-3 text-gray-600 leading-relaxed">
                    Hoje, a informação sobre apoios está espalhada por vários sites, em linguagem técnica,
                    com documentos longos e requisitos difíceis de interpretar. Isso cria uma desigualdade
                    simples: quem tem tempo e literacia burocrática consegue; quem não tem, fica de fora.
                    O Portal Casa Eficiente existe para ser um tradutor prático: menos ruído, mais clareza.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* O que é */}
        <section className="bg-gray-50 py-16">
          <div className="container">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-2xl font-bold text-gray-900">O que é o Portal Casa Eficiente</h2>
              
              <p className="mt-6 text-gray-600 leading-relaxed">
                O Portal Casa Eficiente é uma <strong>plataforma independente</strong> que ajuda 
                qualquer cidadão a:
              </p>
              
              <ul className="mt-6 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-success mt-1">✓</span>
                  <span className="text-gray-600"><strong>Descobrir</strong> que apoios existem no seu concelho</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-success mt-1">✓</span>
                  <span className="text-gray-600"><strong>Perceber</strong> se é elegível para cada programa</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-success mt-1">✓</span>
                  <span className="text-gray-600"><strong>Saber</strong> exatamente que documentos precisa</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-success mt-1">✓</span>
                  <span className="text-gray-600"><strong>Preparar</strong> a candidatura sem erros</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* O que fazemos */}
        <section className="py-16">
          <div className="container">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-2xl font-bold text-gray-900">O que fazemos (na prática)</h2>

              <ul className="mt-6 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-success mt-1">✓</span>
                  <span className="text-gray-600">Agregamos apoios oficiais (nacionais e municipais) num só sítio</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-success mt-1">✓</span>
                  <span className="text-gray-600">Simplificamos regras, prazos e documentos para linguagem clara</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-success mt-1">✓</span>
                  <span className="text-gray-600">Mostramos apenas apoios abertos (quando existe informação pública suficiente para validar o estado)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-success mt-1">✓</span>
                  <span className="text-gray-600">Notificações de novos apoios no teu concelho/perfil (em breve)</span>
                </li>
              </ul>

              <p className="mt-6 text-gray-600 leading-relaxed">
                E em cada apoio, tens sempre o link original para confirmares tudo na fonte.
              </p>
            </div>
          </div>
        </section>

        {/* Para quem */}
        <section className="py-16">
          <div className="container">
            <div className="mx-auto max-w-3xl">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success flex-shrink-0">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Para quem é</h2>
                  
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-gray-50 p-5">
                      <h3 className="font-semibold text-gray-900">Famílias</h3>
                      <p className="mt-2 text-sm text-gray-600">
                        Que querem melhorar o conforto de casa e reduzir contas de energia
                      </p>
                    </div>
                    
                    <div className="rounded-xl bg-gray-50 p-5">
                      <h3 className="font-semibold text-gray-900">Proprietários de HPP</h3>
                      <p className="mt-2 text-sm text-gray-600">
                        Que procuram apoios para obras de reabilitação energética
                      </p>
                    </div>
                    
                    <div className="rounded-xl bg-gray-50 p-5">
                      <h3 className="font-semibold text-gray-900">Pessoas em situação de pobreza energética</h3>
                      <p className="mt-2 text-sm text-gray-600">
                        Com frio, humidade ou contas de energia elevadas
                      </p>
                    </div>
                    
                    <div className="rounded-xl bg-gray-50 p-5">
                      <h3 className="font-semibold text-gray-900">Técnicos sociais</h3>
                      <p className="mt-2 text-sm text-gray-600">
                        IPSS, Juntas de Freguesia e outras entidades que apoiam cidadãos
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Visão */}
        <section className="bg-primary/5 py-16">
          <div className="container">
            <div className="mx-auto max-w-3xl">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-primary flex-shrink-0">
                  <Eye className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">A nossa visão</h2>
                  <p className="mt-4 text-lg text-gray-600 leading-relaxed">
                    Um Portugal onde todas as famílias vivem em casas confortáveis e eficientes, 
                    onde a informação sobre apoios públicos é acessível a todos, 
                    e onde a transição energética não deixa ninguém para trás.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="py-16">
          <div className="container">
            <div className="mx-auto max-w-3xl">
              <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-8">
                <div className="flex items-start gap-4">
                  <Award className="h-8 w-8 text-primary flex-shrink-0" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Nota de Transparência</h2>
                    <p className="mt-4 text-gray-600 leading-relaxed">
                      O Portal Casa Eficiente é uma <strong>plataforma independente</strong> de 
                      informação e apoio ao cidadão. Não somos afiliados oficialmente ao Estado 
                      Português, Fundo Ambiental, ou qualquer outra entidade governamental.
                    </p>
                    <p className="mt-4 text-gray-600 leading-relaxed">
                      Toda a informação apresentada é obtida de fontes públicas oficiais, 
                      verificada regularmente, e apresentada de forma simplificada para 
                      facilitar o acesso do cidadão comum.
                    </p>
                    <h3 className="mt-6 text-lg font-semibold text-gray-900">Como decidimos o que aparece</h3>
                    <p className="mt-3 text-gray-600 leading-relaxed">
                      O Portal Casa Eficiente não &ldquo;inventa&rdquo; apoios. Só publicamos programas
                      que tenham fonte oficial identificável (site da entidade, aviso, regulamento,
                      ou publicação pública) e guardamos a referência para auditoria.
                    </p>
                    <p className="mt-3 text-gray-600 leading-relaxed">
                      Quando um programa não tem informação pública suficiente para confirmar datas/estado,
                      assinalamos isso claramente.
                    </p>
                    <h3 className="mt-6 text-lg font-semibold text-gray-900">Alertas e privacidade</h3>
                    <p className="mt-3 text-gray-600 leading-relaxed">
                      Estamos a preparar notificações para reduzir o fator sorte: alertas quando há um
                      apoio novo ou quando um apoio relevante abre no teu concelho. Guardamos apenas o
                      mínimo necessário para te avisar, e poderás desligar a qualquer momento.
                    </p>
                    <p className="mt-4 text-gray-600 leading-relaxed">
                      A decisão final sobre elegibilidade e aprovação de candidaturas 
                      é sempre das entidades responsáveis por cada programa.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export const metadata = {
  title: 'Sobre Nós | Portal Casa Eficiente',
  description: 'Conheça a missão e valores do Portal Casa Eficiente. Uma plataforma independente de apoio ao cidadão.',
};
