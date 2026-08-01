import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { withRlsContext } from '@/lib/prisma-rls';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SaveProgramButton } from '@/components/programs/SaveProgramButton';
import { 
  programStatusLabels,
  programStatusColors,
  formatRelativeDaysFromNow,
} from '@/lib/utils';
import { ArrowLeft, ExternalLink, CheckCircle2, MapPin, Landmark, Building2, Lightbulb } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProgramDetailPage({ params }: PageProps) {
  const session = await auth();
  const { slug } = await params;
  
  const program = await prisma.program.findUnique({
    where: { slug },
    include: {
      geographies: true,
      versions: {
        orderBy: { versionDate: 'desc' },
        take: 1,
      },
      sources: true,
    },
  });

  if (!program) {
    notFound();
  }

  const isSavedByUser = session?.user?.id
    ? Boolean(
        await withRlsContext(session.user.id, async (tx) =>
          tx.userSavedProgram.findUnique({
            where: {
              userId_programId: {
                userId: session.user.id,
                programId: program.id,
              },
            },
            select: { id: true },
          })
        )
      )
    : false;

  // Determinar geografia legível
  const geographyText = program.geographies.map(g => {
    if (g.level === 'NATIONAL') return 'Todo o país';
    if (g.municipality) return g.municipality;
    if (g.district) return g.district;
    return 'N/A';
  }).join(', ');

  const latestVerificationDate = program.sources.reduce(
    (latestDate, source) => {
      if (!source.fetchedAt) return latestDate;
      return source.fetchedAt > latestDate ? source.fetchedAt : latestDate;
    },
    program.updatedAt
  );

  return (
    <>
      <Header />
      
      <main className="flex-1">
        {/* Navegação */}
        <div className="border-b border-border bg-card">
          <div className="container py-4">
            <Link 
              href="/apoios" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar aos apoios
            </Link>
          </div>
        </div>

        {/* Cabeçalho do programa */}
        <div className="border-b border-border bg-card">
          <div className="container py-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Estado do apoio
                    </p>
                    <span className={`mt-1 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${programStatusColors[program.status] || 'bg-muted'}`}>
                      {programStatusLabels[program.status] || program.status}
                    </span>
                  </div>
                  <span className="text-sm font-semibold uppercase tracking-wide text-primary">
                    {program.programType === 'NATIONAL' ? 'Nacional' : 'Municipal'}
                  </span>
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  Última verificação: {formatRelativeDaysFromNow(latestVerificationDate)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Mostramos &ldquo;Aberto&rdquo; quando a fonte oficial indica datas ou estado ativo. Se não houver datas públicas, marcamos como &ldquo;Sem data pública&rdquo;.
                </p>
                
                <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
                  {program.title}
                </h1>
                
                {program.entity && (
                  <p className="mt-2 text-lg text-muted-foreground">
                    {program.entity}
                  </p>
                )}
                
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {geographyText}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Link
                  href={`/verificar?programa=${program.slug}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-success-600 px-5 py-3 font-semibold text-white shadow-card transition hover:bg-success-700"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  Ver se sou elegível
                </Link>

                <SaveProgramButton slug={program.slug} initialSaved={isSavedByUser} />
                
                {program.officialUrl && (
                  <a
                    href={program.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-input bg-card px-5 py-2.5 text-sm font-medium text-ink transition hover:border-primary-300 hover:bg-primary-50"
                  >
                    Fonte oficial
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="container py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Coluna principal */}
            <div className="lg:col-span-2 space-y-8">
              {/* Resumo */}
              {program.summary && (
                <section className="rounded-xl border border-border bg-card p-6 shadow-card">
                  <h2 className="text-xl font-semibold text-ink">Resumo</h2>
                  <p className="mt-4 leading-relaxed text-muted-foreground">
                    {program.summary}
                  </p>
                </section>
              )}

              {/* O que precisas (placeholder) */}
              <section className="rounded-xl border border-border bg-card p-6 shadow-card">
                <h2 className="text-xl font-semibold text-ink mb-4">
                  O que vais precisar
                </h2>
                <div className="rounded-lg bg-sun-100 p-4 mb-6">
                  <p className="text-sm text-sun-foreground">
                    Esta secção está em desenvolvimento. Em breve vamos mostrar-te
                    uma lista personalizada de documentos e requisitos para te candidatares.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center text-sm font-semibold text-primary">
                      1
                    </div>
                    <div>
                      <h3 className="font-medium text-ink">Documentação pessoal</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        NIF, comprovativo de morada, composição do agregado familiar
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center text-sm font-semibold text-primary">
                      2
                    </div>
                    <div>
                      <h3 className="font-medium text-ink">Documentação do imóvel</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Caderneta predial, certificado energético, licenças
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center text-sm font-semibold text-primary">
                      3
                    </div>
                    <div>
                      <h3 className="font-medium text-ink">Orçamentos e propostas</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Orçamentos detalhados das obras a realizar com descrição técnica
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Informações das versões */}
              {program.versions.length > 0 && program.versions[0].rulesJson && (
                <section className="rounded-xl border border-border bg-card p-6 shadow-card">
                  <h2 className="text-xl font-semibold text-ink">Informação adicional</h2>
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p>Última atualização: {new Date(program.versions[0].versionDate).toLocaleDateString('pt-PT')}</p>
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Geografia */}
              <section className="rounded-xl border border-border bg-card p-6 shadow-card">
                <h2 className="text-lg font-semibold text-ink mb-3">Onde se aplica</h2>
                <div className="space-y-2">
                  {program.geographies.map((geo) => (
                    <div
                      key={geo.id}
                      className="rounded-lg bg-background px-3 py-2 text-sm"
                    >
                      {geo.level === 'NATIONAL' ? (
                        <span className="flex items-center gap-1.5 font-medium text-ink"><MapPin className="h-3.5 w-3.5 text-primary" /> Todo o país</span>
                      ) : (
                        <div>
                          <span className="flex items-center gap-1.5 font-medium text-ink">
                            <MapPin className="h-3.5 w-3.5 text-primary" />
                            {geo.municipality || geo.district || geo.parish}
                          </span>
                          {geo.district && geo.municipality && (
                            <span className="text-muted-foreground"> • {geo.district}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Tipo de programa */}
              <section className="rounded-xl border border-border bg-card p-6 shadow-card">
                <h2 className="text-lg font-semibold text-ink mb-3">Tipo de programa</h2>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary">
                  {program.programType === 'NATIONAL' ? <Landmark className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                  {program.programType === 'NATIONAL' ? 'Nacional' : 'Municipal'}
                </span>
              </section>

              {/* Fontes */}
              {program.sources.length > 0 && (
                <section className="rounded-xl border border-border bg-card p-6 shadow-card">
                  <h2 className="text-lg font-semibold text-ink mb-3">Fontes oficiais</h2>
                  <ul className="space-y-3">
                    {program.sources.map((source) => (
                      <li key={source.id} className="text-sm">
                        <div className="font-medium text-ink mb-1">
                          {source.sourceType.replace('_', ' ')}
                        </div>
                        {source.sourceUrl && (
                          <a
                            href={source.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span className="truncate">Ver fonte</span>
                          </a>
                        )}
                        {source.fetchedAt && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Atualizado: {new Date(source.fetchedAt).toLocaleDateString('pt-PT')}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              
              {/* Dica */}
              <section className="rounded-xl bg-primary-50 p-6">
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-primary-800">
                  <Lightbulb className="h-4 w-4" />
                  Dica
                </h3>
                <p className="text-sm leading-6 text-primary-800">
                  Antes de te candidatares, usa a nossa verificação de
                  elegibilidade para confirmar se cumpres todos os requisitos.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const program = await prisma.program.findUnique({
    where: { slug },
    select: { title: true, summary: true, entity: true },
  });

  if (!program) {
    return { title: 'Programa não encontrado' };
  }

  return {
    title: `${program.title} | Portal Casa Eficiente`,
    description: program.summary || `Informação sobre o programa ${program.title}${program.entity ? ` de ${program.entity}` : ''}`,
  };
}
