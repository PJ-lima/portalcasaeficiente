import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ConcelhoSearch } from '@/components/search/ConcelhoSearch';
import { Search, FileCheck, FolderOpen } from 'lucide-react';

export default function HomePage() {
  return (
    <>
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-white py-16 sm:py-24">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
                Descobre apoios abertos para melhorar a tua casa
              </h1>
              
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Encontramos apoios nacionais e municipais, explicamos em português simples,
                e ajudamos-te a perceber se vale a pena candidatar-te — sem perder horas
                em PDFs e linguagem técnica.
              </p>

              {/* Search Box */}
              <div className="mt-10">
                <div className="mx-auto max-w-xl">
                  <ConcelhoSearch />
                </div>
              </div>

              {/* Trust Badge */}
              <p className="mt-6 text-sm text-gray-500">
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 rounded-full bg-green-500" />
                  Plataforma independente de apoio ao cidadão
                </span>
                <span className="mt-1 block">
                  Informação clara, links oficiais e alertas quando surgem novos apoios no teu concelho.
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* Como Funciona */}
        <section className="py-16 sm:py-24">
          <div className="container">
            <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
              Como funciona
            </h2>
            
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {/* Passo 1 */}
              <div className="relative rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200 transition hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  1. Descobre (só o que está aberto)
                </h3>
                <p className="mt-2 text-gray-600">
                  Pesquisa pelo teu concelho e vê apoios ativos — nacionais e municipais —
                  com link oficial.
                </p>
              </div>

              {/* Passo 2 */}
              <div className="relative rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200 transition hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success">
                  <FileCheck className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  2. Verifica elegibilidade em minutos
                </h3>
                <p className="mt-2 text-gray-600">
                  Responde a um questionário simples. Dizemos-te o que encaixa contigo
                  e o que te pode bloquear.
                </p>
              </div>

              {/* Passo 3 */}
              <div className="relative rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200 transition hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FolderOpen className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  3. Prepara a candidatura
                </h3>
                <p className="mt-2 text-gray-600">
                  Checklist de documentos e passos práticos para submeter com confiança.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* O que encontras */}
        <section className="bg-gray-50 py-16 sm:py-24">
          <div className="container">
            <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
              O que encontras aqui
            </h2>
            
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-start gap-3">
                <span className="mt-1 text-success">✓</span>
                <div>
                  <h3 className="font-medium text-gray-900">Apoios nacionais</h3>
                  <p className="text-sm text-gray-600">Fundo Ambiental, PRR, e outros programas do Estado</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="mt-1 text-success">✓</span>
                <div>
                  <h3 className="font-medium text-gray-900">Apoios municipais</h3>
                  <p className="text-sm text-gray-600">Programas da tua câmara municipal</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="mt-1 text-success">✓</span>
                <div>
                  <h3 className="font-medium text-gray-900">Informação clara</h3>
                  <p className="text-sm text-gray-600">Resumos simples e links oficiais</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="mt-1 text-success">✓</span>
                <div>
                  <h3 className="font-medium text-gray-900">Só apoios abertos</h3>
                  <p className="text-sm text-gray-600">
                    Mostramos o estado (aberto/fechado/a anunciar/sem data pública) e as datas quando existem.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="mt-1 text-success">✓</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">Alertas de novos apoios</h3>
                    <span className="inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                      Em breve
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    &ldquo;Notificar-me quando houver apoios novos&rdquo;. Sem spam. Só alertas relevantes.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-1 text-success">✓</span>
                <div>
                  <h3 className="font-medium text-gray-900">Checklists de documentos</h3>
                  <p className="text-sm text-gray-600">Sabe exatamente o que precisas</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tipos de apoio */}
        <section className="py-16 sm:py-24">
          <div className="container">
            <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
              Tipos de obras apoiadas
            </h2>
            <p className="mt-4 text-center text-gray-600">
              Descobre apoios para diferentes tipos de intervenções na tua casa
            </p>
            
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: '🪟', title: 'Janelas eficientes', desc: 'Substituição por janelas com melhor isolamento térmico' },
                { icon: '🧱', title: 'Isolamento / Capoto', desc: 'Isolamento térmico de paredes pelo exterior' },
                { icon: '🏠', title: 'Cobertura', desc: 'Isolamento térmico do telhado e sótão' },
                { icon: '🌡️', title: 'Bomba de calor', desc: 'Sistemas eficientes de aquecimento e arrefecimento' },
                { icon: '☀️', title: 'Solar fotovoltaico', desc: 'Painéis solares para produção de eletricidade' },
                { icon: '💧', title: 'Aquecimento de águas', desc: 'Sistemas solares térmicos e bombas de calor' },
              ].map((item) => (
                <div 
                  key={item.title}
                  className="flex items-start gap-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200"
                >
                  <span className="text-3xl">{item.icon}</span>
                  <div>
                    <h3 className="font-medium text-gray-900">{item.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                href="/apoios"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-white shadow-sm transition hover:bg-primary/90"
              >
                Ver todos os apoios
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ curta */}
        <section className="py-16 sm:py-20">
          <div className="container">
            <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
              Perguntas frequentes
            </h2>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <article className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <h3 className="font-semibold text-gray-900">Isto é oficial?</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Não. Somos uma plataforma independente. A candidatura e a decisão final são sempre das entidades responsáveis.
                </p>
              </article>

              <article className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <h3 className="font-semibold text-gray-900">Como sabem se um apoio está aberto?</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Usamos o estado e/ou datas da fonte oficial. Quando não é possível confirmar, assinalamos isso.
                </p>
              </article>

              <article className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <h3 className="font-semibold text-gray-900">Vão tentar vender-me obras ou instaladores?</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Não. Não vendemos serviços de obra, não favorecemos marcas e cada apoio inclui link para a fonte oficial.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Transparência */}
        <section className="bg-primary/5 py-16">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold text-gray-900">Transparência</h2>
              <p className="mt-4 text-gray-600">
                <strong>Somos uma plataforma independente.</strong> Não vendemos obras. 
                Não favorecemos marcas nem instaladores. Não somos o Estado — 
                ajudamos-te a navegar os apoios públicos.
              </p>
              <p className="mt-4 text-sm text-gray-500">
                Toda a informação vem de fontes oficiais, inclui o link original e mostra a última verificação.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
