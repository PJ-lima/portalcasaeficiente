import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProgramList } from '@/components/programs/ProgramList';
import { ProgramFilters } from '@/components/programs/ProgramFilters';
import { ConcelhoSearchBar } from '@/components/search/ConcelhoSearchBar';
import { prisma } from '@/lib/prisma';

interface PageProps {
  searchParams: Promise<{
    concelhoId?: string;
    status?: string | string[];
    programType?: string;
    domain?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function ApoiosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const concelhoId = params.concelhoId;

  // Só oferecemos o filtro de domínio quando há mais do que um na base.
  const domainGroups = await prisma.program.groupBy({
    by: ['domain'],
    _count: { _all: true },
  });
  const availableDomains = domainGroups.map((group) => group.domain);

  return (
    <>
      <Header />
      
      <main className="flex-1">
        {/* Header da página */}
        <div className="border-b border-border bg-card">
          <div className="container py-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="section-eyebrow">Apoios</p>
                <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                  Apoios disponíveis
                </h1>
                {concelhoId && (
                  <p className="mt-1 text-muted-foreground">
                    A mostrar apoios para o teu concelho
                  </p>
                )}
              </div>
              
              <div className="w-full sm:w-80">
                <ConcelhoSearchBar />
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="container py-8">
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Filtros (sidebar) */}
            <aside className="w-full lg:w-64 flex-shrink-0">
              <div className="sticky top-24">
                <ProgramFilters searchParams={params} availableDomains={availableDomains} />
              </div>
            </aside>

            {/* Lista de programas */}
            <div className="flex-1">
              <Suspense fallback={<ProgramListSkeleton />}>
                <ProgramList searchParams={params} />
              </Suspense>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

function ProgramListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-border bg-card p-6 shadow-card"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-6 w-64 rounded bg-muted" />
              <div className="h-4 w-48 rounded bg-muted" />
            </div>
            <div className="h-6 w-16 rounded-full bg-muted" />
          </div>
          <div className="mt-4 flex gap-2">
            <div className="h-6 w-20 rounded bg-muted/60" />
            <div className="h-6 w-24 rounded bg-muted/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

export const metadata = {
  title: 'Apoios à Eficiência Energética | Portal Casa Eficiente',
  description: 'Descobre todos os apoios disponíveis para melhorar a eficiência energética da tua casa. Programas nacionais e municipais em Portugal.',
};
