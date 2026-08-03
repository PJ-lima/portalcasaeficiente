import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ConcelhoSearch } from '@/components/search/ConcelhoSearch';
import { buildMetadata, SITE_NAME, SITE_TAGLINE } from '@/lib/seo';

export const metadata = buildMetadata({
  title: `${SITE_NAME} — ${SITE_TAGLINE}`,
  description:
    'Há dinheiro do Estado para a tua casa. Mostramos-te que apoios existem, se ainda há verba e qual o estado real de cada programa.',
  path: '/',
});
import {
  Search,
  FileCheck,
  FolderOpen,
  AppWindow,
  Layers,
  Home,
  Thermometer,
  Sun,
  Droplets,
  BellRing,
  ListChecks,
  Landmark,
  Building2,
  BookOpenCheck,
  CalendarClock,
} from 'lucide-react';

const energyClasses = [
  { label: 'A+', color: 'bg-cert-aplus', width: 'w-[38%]' },
  { label: 'A', color: 'bg-cert-a', width: 'w-[48%]' },
  { label: 'B', color: 'bg-cert-b', width: 'w-[58%]' },
  { label: 'C', color: 'bg-cert-c', width: 'w-[68%]' },
  { label: 'D', color: 'bg-cert-d', width: 'w-[78%]' },
  { label: 'E', color: 'bg-cert-e', width: 'w-[88%]' },
  { label: 'F', color: 'bg-cert-f', width: 'w-[98%]' },
];

const steps = [
  {
    icon: Search,
    title: 'Descobre o que está aberto',
    description:
      'Pesquisa pelo teu concelho e vê os apoios ativos — nacionais e municipais — sempre com link para a fonte oficial.',
  },
  {
    icon: FileCheck,
    title: 'Verifica a elegibilidade em minutos',
    description:
      'Responde a um questionário simples. Dizemos-te o que encaixa contigo e o que te pode bloquear.',
  },
  {
    icon: FolderOpen,
    title: 'Prepara a candidatura',
    description:
      'Checklist de documentos e passos práticos para submeter com confiança.',
  },
];

const features = [
  {
    icon: Landmark,
    title: 'Apoios nacionais',
    description: 'Fundo Ambiental, PRR e outros programas do Estado.',
  },
  {
    icon: Building2,
    title: 'Apoios municipais',
    description: 'Programas da tua câmara municipal, ligados ao teu concelho.',
  },
  {
    icon: BookOpenCheck,
    title: 'Informação clara',
    description: 'Resumos em português simples e links oficiais.',
  },
  {
    icon: CalendarClock,
    title: 'Estado real, sem rodeios',
    description:
      'Aberto, fechado, dotação esgotada, suspenso ou com pagamentos em atraso — com a data da última verificação.',
  },
  {
    icon: BellRing,
    title: 'Alertas de novos apoios',
    description:
      'Aviso quando abre um apoio no teu concelho. Há verbas que esgotam em dias.',
    badge: 'Em breve',
  },
  {
    icon: ListChecks,
    title: 'Checklists de documentos',
    description: 'Sabe exatamente o que precisas antes de te candidatar.',
  },
];

const workTypes = [
  {
    icon: AppWindow,
    title: 'Janelas eficientes',
    description: 'Substituição por janelas com melhor isolamento térmico',
  },
  {
    icon: Layers,
    title: 'Isolamento / Capoto',
    description: 'Isolamento térmico de paredes pelo exterior',
  },
  {
    icon: Home,
    title: 'Cobertura',
    description: 'Isolamento térmico do telhado e do sótão',
  },
  {
    icon: Thermometer,
    title: 'Bomba de calor',
    description: 'Sistemas eficientes de aquecimento e arrefecimento',
  },
  {
    icon: Sun,
    title: 'Solar fotovoltaico',
    description: 'Painéis solares para produção de eletricidade',
  },
  {
    icon: Droplets,
    title: 'Aquecimento de águas',
    description: 'Sistemas solares térmicos e bombas de calor',
  },
];

export default function HomePage() {
  return (
    <>
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="overflow-hidden border-b border-border bg-background">
          <div className="container py-14 sm:py-20">
            <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="animate-riseIn">
                <p className="section-eyebrow">
                  Apoios do Estado e da tua câmara, num só sítio
                </p>
                <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-[3.4rem]">
                  Há{' '}
                  <span className="label-tag inline-block bg-success px-3 text-success-foreground">
                    dinheiro
                  </span>{' '}
                  do Estado para obras na tua casa
                </h1>

                <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
                  Dizemos-te quais os apoios que existem para o teu concelho, se
                  tens direito, e — o que ninguém te diz — se ainda há verba.
                  Sem horas perdidas em PDFs.
                </p>

                {/* Search Box */}
                <div className="mt-8 max-w-xl">
                  <ConcelhoSearch />
                </div>

                <p className="mt-5 text-sm text-muted-foreground">
                  Plataforma independente de apoio ao cidadão. Informação de
                  fontes oficiais, com link original e data da última
                  verificação.
                </p>
              </div>

              {/* Painel-certificado: a assinatura visual */}
              <div className="relative mx-auto w-full max-w-md animate-riseIn [animation-delay:120ms]">
                <div
                  aria-hidden="true"
                  className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-sun-200/60 blur-2xl"
                />
                <div className="relative rounded-2xl border border-border bg-card p-6 shadow-card-hover sm:p-8">
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 className="font-display text-base font-bold text-ink">
                      Certificado energético
                    </h2>
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      da tua casa
                    </span>
                  </div>

                  <div className="mt-5 space-y-1.5" aria-hidden="true">
                    {energyClasses.map((cls) => (
                      <div key={cls.label} className="flex items-center gap-2">
                        <div
                          className={`label-tag flex h-7 items-center pl-3 text-sm font-bold text-white ${cls.color} ${cls.width} ${cls.label === 'C' || cls.label === 'B' ? '!text-ink/80' : ''}`}
                        >
                          {cls.label}
                        </div>
                        {cls.label === 'A' && (
                          <span className="whitespace-nowrap text-xs font-semibold text-success-700">
                            ← com apoio
                          </span>
                        )}
                        {cls.label === 'E' && (
                          <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">
                            ← hoje
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 rounded-lg bg-primary-50 p-4">
                    <p className="text-sm leading-6 text-primary-800">
                      Janelas, isolamento, bomba de calor ou painéis solares:
                      há apoios que pagam parte da obra e baixam a fatura todos
                      os meses. Começa por ver os que estão abertos no teu
                      concelho.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Como funciona — sequência real de 3 passos */}
        <section className="py-16 sm:py-24">
          <div className="container">
            <p className="section-eyebrow">Como funciona</p>
            <h2 className="mt-3 max-w-2xl text-2xl font-bold sm:text-3xl">
              Do concelho à candidatura, em três passos
            </h2>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="relative rounded-2xl border border-border bg-card p-7 shadow-card transition hover:shadow-card-hover"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary">
                      <step.icon className="h-5 w-5" />
                    </div>
                    <span className="font-display text-3xl font-bold text-primary-100">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2 leading-7 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* O que encontras */}
        <section className="border-y border-border bg-card py-16 sm:py-24">
          <div className="container">
            <p className="section-eyebrow">O que encontras aqui</p>
            <h2 className="mt-3 max-w-2xl text-2xl font-bold sm:text-3xl">
              Tudo o que precisas para decidir, num só sítio
            </h2>

            <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-ink">{feature.title}</h3>
                      {feature.badge && (
                        <span className="inline-flex items-center rounded-full bg-sun-100 px-2 py-0.5 text-xs font-semibold text-sun-600">
                          {feature.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tipos de apoio */}
        <section className="py-16 sm:py-24">
          <div className="container">
            <p className="section-eyebrow">Tipos de obras apoiadas</p>
            <h2 className="mt-3 max-w-2xl text-2xl font-bold sm:text-3xl">
              Há apoios para quase todas as obras que aquecem, arrefecem ou
              poupam
            </h2>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {workTypes.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-4 rounded-xl border border-border bg-card p-6 shadow-card transition hover:border-primary-200 hover:shadow-card-hover"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-success-50 text-success-700">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <Link href="/apoios" className="btn-primary">
                Ver todos os apoios
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ curta */}
        <section className="border-t border-border bg-card py-16 sm:py-20">
          <div className="container">
            <p className="section-eyebrow">Perguntas frequentes</p>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
              Antes que perguntes
            </h2>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <article className="rounded-xl border border-border bg-background p-6">
                <h3 className="font-semibold text-ink">Isto é oficial?</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Não. Somos uma plataforma independente. A candidatura e a
                  decisão final são sempre das entidades responsáveis.
                </p>
              </article>

              <article className="rounded-xl border border-border bg-background p-6">
                <h3 className="font-semibold text-ink">
                  Como sabem se um apoio está aberto?
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Usamos o estado e as datas da fonte oficial. Quando não é
                  possível confirmar, assinalamos isso.
                </p>
              </article>

              <article className="rounded-xl border border-border bg-background p-6">
                <h3 className="font-semibold text-ink">
                  Vão tentar vender-me obras ou instaladores?
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Não. Não vendemos serviços de obra, não favorecemos marcas e
                  cada apoio inclui link para a fonte oficial.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Transparência */}
        <section className="bg-primary-900 py-16 text-primary-50">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold text-white">Transparência</h2>
              <p className="mt-4 leading-8 text-primary-100">
                <strong className="text-white">
                  Somos uma plataforma independente.
                </strong>{' '}
                Não vendemos obras, não favorecemos marcas nem instaladores e
                não somos o Estado — ajudamos-te a navegar os apoios públicos.
              </p>
              <p className="mt-4 text-sm text-primary-200">
                Toda a informação vem de fontes oficiais, inclui o link
                original e mostra a última verificação.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
