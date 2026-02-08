import { Metadata } from 'next';
import { DossierForm } from '@/components/dossier/DossierForm';

export const metadata: Metadata = {
  title: 'O Meu Dossiê | Portal Casa Eficiente',
  description: 'Guarda as tuas informações para receber recomendações personalizadas',
};

export default function DossierPage() {
  return (
    <main className="flex-1 bg-gray-50">
      <div className="container py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">O Meu Dossiê</h1>
            <p className="mt-2 text-gray-600">
              Preenche as tuas informações para receberes recomendações personalizadas de apoios
            </p>
          </div>

          <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-4 mb-6">
            <p className="text-sm text-yellow-800">
              🔒 Os teus dados são privados e seguros. Apenas tu tens acesso ao teu dossiê.
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <DossierForm />
          </div>
        </div>
      </div>
    </main>
  );
}
