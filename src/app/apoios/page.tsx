import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProgramList } from '@/components/programs/ProgramList';
import { ProgramFilters } from '@/components/programs/ProgramFilters';
import { ConcelhoSearchBar } from '@/components/search/ConcelhoSearchBar';

interface PageProps {
  searchParams: Promise<{
    concelhoId?: string;
    status?: string | string[];
    programType?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function ApoiosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const concelhoId = params.concelhoId;

  return (
    <>
      <Header />
      
      <main className="flex-1 bg-gray-50">
        {/* Header da página */}
        <div className="bg-white border-b">
          <div className="container py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Apoios disponíveis
                </h1>
                {concelhoId && (
                  <p className="mt-1 text-gray-600">
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
              <div className="sticky top-4">
                <ProgramFilters searchParams={params} />
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
          className="animate-pulse rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-6 w-64 bg-gray-200 rounded" />
              <div className="h-4 w-48 bg-gray-200 rounded" />
            </div>
            <div className="h-6 w-16 bg-gray-200 rounded-full" />
          </div>
          <div className="mt-4 flex gap-2">
            <div className="h-6 w-20 bg-gray-100 rounded" />
            <div className="h-6 w-24 bg-gray-100 rounded" />
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
