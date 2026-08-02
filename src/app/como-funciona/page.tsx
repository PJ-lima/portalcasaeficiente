import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CheckCircle2, XCircle, HelpCircle, Lightbulb, Shield, Heart } from 'lucide-react';

export default function ComoFuncionaPage() {
  return (
    <>
      <Header />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-primary-50 to-background py-16">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-3xl font-bold text-ink sm:text-4xl">
                Como funciona o Portal Casa Eficiente
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Ajudamos-te a navegar o mundo dos apoios públicos à eficiência energética 
                de forma simples, clara e transparente.
              </p>
            </div>
          </div>
        </section>

        {/* O que fazemos */}
        <section className="py-16">
          <div className="container">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-2xl font-bold text-ink">O que fazemos</h2>
              
              <div className="mt-8 space-y-6">
                <div className="flex gap-4">
                  <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-ink">Agregamos informação oficial</h3>
                    <p className="mt-1 text-muted-foreground">
                      Pesquisamos diariamente o Diário da República e o Fundo Ambiental 
                      para encontrar todos os apoios disponíveis, nacionais e municipais.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-ink">Simplificamos a linguagem</h3>
                    <p className="mt-1 text-muted-foreground">
                      Traduzimos regulamentos complexos em informação clara e acessível, 
                      mantendo sempre o link para a fonte oficial.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-ink">Verificamos a tua elegibilidade</h3>
                    <p className="mt-1 text-muted-foreground">
                      Com um questionário simples, avaliamos automaticamente se cumpres 
                      os requisitos de cada programa.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-ink">Preparamos a tua candidatura</h3>
                    <p className="mt-1 text-muted-foreground">
                      Fornecemos checklists de documentos para que possas preparar 
                      tudo sem erros antes de submeter.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* O que NÃO fazemos */}
        <section className="bg-background py-16">
          <div className="container">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-2xl font-bold text-ink">O que NÃO fazemos</h2>
              
              <div className="mt-8 space-y-6">
                <div className="flex gap-4">
                  <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-ink">Não somos um site do governo</h3>
                    <p className="mt-1 text-muted-foreground">
                      O Portal Casa Eficiente é uma iniciativa independente. 
                      Não temos afiliação oficial com o Estado Português.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-ink">
                      Não decidimos quem recebe, nem quando o Estado paga
                    </h3>
                    <p className="mt-1 text-muted-foreground">
                      Ser considerado elegível não garante receber apoio: já houve
                      programas encerrados com milhares de candidaturas elegíveis por
                      atribuir. O que fazemos é mostrar-te o estado real de cada apoio —
                      incluindo quando a dotação está esgotada ou há pagamentos em atraso
                      — para não perderes tempo com uma candidatura sem verba do outro
                      lado.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-ink">Não vendemos obras</h3>
                    <p className="mt-1 text-muted-foreground">
                      Não fazemos instalações, não vendemos equipamentos, 
                      não somos uma empresa de construção.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-ink">Não favorecemos marcas</h3>
                    <p className="mt-1 text-muted-foreground">
                      Não temos parcerias comerciais com instaladores ou fabricantes. 
                      A nossa informação é imparcial.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-ink">Não substituímos os portais oficiais</h3>
                    <p className="mt-1 text-muted-foreground">
                      A candidatura final tem de ser feita sempre no portal oficial 
                      de cada programa. Nós simplificamos o caminho até lá.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Os nossos valores */}
        <section className="py-16">
          <div className="container">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-2xl font-bold text-ink text-center">Os nossos valores</h2>
              
              <div className="mt-12 grid gap-8 md:grid-cols-3">
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary">
                    <Shield className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-semibold text-ink">Transparência</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Toda a informação vem de fontes oficiais. Incluímos sempre os links originais.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success">
                    <Lightbulb className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-semibold text-ink">Clareza</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Explicamos tudo em português simples. Nada de jargão burocrático.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
                    <Heart className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-semibold text-ink">Acessibilidade</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Todos devem poder aceder a esta informação, independentemente de conhecimentos técnicos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-background py-16">
          <div className="container">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-2xl font-bold text-ink text-center">Perguntas frequentes</h2>
              
              <div className="mt-12 space-y-6">
                <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                  <div className="flex gap-3">
                    <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-ink">O serviço é gratuito?</h3>
                      <p className="mt-2 text-muted-foreground">
                        Sim, a consulta de programas e verificação de elegibilidade são completamente gratuitas.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                  <div className="flex gap-3">
                    <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-ink">A informação está atualizada?</h3>
                      <p className="mt-2 text-muted-foreground">
                        Fazemos ingestão automática diária das fontes oficiais. Cada programa mostra 
                        a data da última atualização e o link para a fonte original.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                  <div className="flex gap-3">
                    <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-ink">Posso confiar no resultado da elegibilidade?</h3>
                      <p className="mt-2 text-muted-foreground">
                        O nosso motor de elegibilidade é indicativo. A decisão final é sempre da 
                        entidade responsável pelo programa. Recomendamos sempre verificar junto 
                        da fonte oficial antes de submeter candidatura.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                  <div className="flex gap-3">
                    <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-ink">Como faço a candidatura?</h3>
                      <p className="mt-2 text-muted-foreground">
                        A candidatura é feita diretamente no portal oficial de cada programa. 
                        Nós ajudamos-te a preparar tudo — a submissão é feita por ti.
                      </p>
                    </div>
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
  title: 'Como Funciona | Portal Casa Eficiente',
  description: 'Descobre como o Portal Casa Eficiente te ajuda a encontrar e candidatar-te a apoios de eficiência energética.',
};
