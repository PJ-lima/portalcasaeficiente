'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';
import RecommendationsList from '@/components/eligibility/RecommendationsList';
import { Header } from '@/components/layout/Header';

export default function RecommendationsPage() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  // O middleware já protege esta rota
  if (!session?.user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Navigation */}
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <Link 
                href="/perfil" 
                className="flex items-center gap-2 text-muted-foreground hover:text-ink transition"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar ao Perfil</span>
              </Link>
              
              <span className="text-border">|</span>
              
              <Link 
                href="/" 
                className="flex items-center gap-2 text-muted-foreground hover:text-ink transition"
              >
                <Home className="h-4 w-4" />
                <span>Página Inicial</span>
              </Link>
            </div>
          </div>
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-ink mb-2">
              Os Seus Apoios Personalizados
            </h1>
            <p className="text-lg text-muted-foreground">
              Com base no dossiê que preencheu, calculámos a sua elegibilidade para cada programa disponível.
            </p>
          </div>

          <RecommendationsList />
        </div>
      </div>
    </>
  );
}
