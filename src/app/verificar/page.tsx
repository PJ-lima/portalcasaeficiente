import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { EligibilityWizard } from '@/components/eligibility/EligibilityWizard';

interface PageProps {
  searchParams: Promise<{
    programa?: string;
  }>;
}

export default async function VerificarPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  return (
    <>
      <Header />
      
      <main className="flex-1 bg-gray-50">
        <div className="container py-8">
          <div className="mx-auto max-w-2xl">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Verifica a tua elegibilidade
              </h1>
              <p className="mt-2 text-gray-600">
                Responde a algumas perguntas simples para descobrires a que apoios te podes candidatar.
              </p>
            </div>

            <EligibilityWizard programSlug={params.programa} />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

export const metadata = {
  title: 'Verificar Elegibilidade | Portal Casa Eficiente',
  description: 'Descobre se és elegível para apoios à eficiência energética. Questionário simples e rápido.',
};
