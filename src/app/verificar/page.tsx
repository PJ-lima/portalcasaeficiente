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
      
      <main className="flex-1">
        <div className="container py-10 sm:py-14">
          <div className="mx-auto max-w-2xl">
            <div className="mb-8 text-center">
              <p className="section-eyebrow">Verificação de elegibilidade</p>
              <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
                Vê a que apoios te podes candidatar
              </h1>
              <p className="mt-2 text-muted-foreground">
                Quatro perguntas simples. Sem registo, sem compromisso.
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
