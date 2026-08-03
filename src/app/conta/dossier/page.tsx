import { DossierForm } from '@/components/dossier/DossierForm';
import { buildMetadata } from '@/lib/seo';

// noindex vem do layout de /conta; aqui só o título e o canonical.
export const metadata = buildMetadata({
  title: 'O Meu Dossiê',
  description: 'Guarda as tuas informações para receber recomendações personalizadas',
  path: '/conta/dossier',
  noindex: true,
});

export default function DossierPage() {
  return (
    <main className="flex-1 bg-background">
      <div className="container py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-ink">O Meu Dossiê</h1>
            <p className="mt-2 text-muted-foreground">
              Preenche as tuas informações para receberes recomendações personalizadas de apoios
            </p>
          </div>

          <div className="rounded-xl bg-sun-100 p-4 mb-6">
            <p className="text-sm text-sun-foreground">
              🔒 Os teus dados são privados e seguros. Apenas tu tens acesso ao teu dossiê.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <DossierForm />
          </div>
        </div>
      </div>
    </main>
  );
}
