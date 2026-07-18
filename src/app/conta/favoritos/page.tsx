'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Heart, Home } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { SaveProgramButton } from '@/components/programs/SaveProgramButton';

interface SavedProgramItem {
  savedId: string;
  savedAt: string;
  notes: string | null;
  program: {
    id: string;
    slug: string;
    title: string;
    entity: string | null;
    programType: 'NATIONAL' | 'MUNICIPAL' | string;
    status: string;
    summary: string | null;
    officialUrl: string | null;
  };
}

export default function FavoritosPage() {
  const { data: session, status } = useSession();
  const [programs, setPrograms] = useState<SavedProgramItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSavedPrograms() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/programs/saved');
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao carregar favoritos');
        }

        setPrograms(data.programs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar favoritos');
      } finally {
        setLoading(false);
      }
    }

    if (session?.user?.id) {
      fetchSavedPrograms();
    }
  }, [session?.user?.id]);

  const total = useMemo(() => programs.length, [programs]);

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
            <p className="mt-4 text-muted-foreground">A carregar favoritos...</p>
          </div>
        </div>
      </>
    );
  }

  if (!session?.user) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <p className="text-ink">Sessão inválida. Volte a iniciar sessão.</p>
            <Link
              href="/conta"
              className="mt-3 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-800"
            >
              Ir para login
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <Link
                href="/perfil"
                className="flex items-center gap-2 text-muted-foreground transition hover:text-ink"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar ao Perfil</span>
              </Link>
              <span className="text-border">|</span>
              <Link
                href="/"
                className="flex items-center gap-2 text-muted-foreground transition hover:text-ink"
              >
                <Home className="h-4 w-4" />
                <span>Página Inicial</span>
              </Link>
            </div>
          </div>

          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-ink">Programas Guardados</h1>
              <p className="mt-2 text-lg text-muted-foreground">
                Acompanhe os programas que marcou como favoritos.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
              <Heart className="h-4 w-4 fill-current" />
              {total} {total === 1 ? 'favorito' : 'favoritos'}
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {!error && total === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center shadow-card">
              <p className="text-ink">Ainda não guardou nenhum programa.</p>
              <Link
                href="/apoios"
                className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-800"
              >
                Explorar apoios
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {programs.map((saved) => (
                <article
                  key={saved.savedId}
                  className="rounded-xl border border-border bg-card p-6 shadow-card"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/apoios/${saved.program.slug}`}
                        className="text-xl font-semibold text-ink transition hover:text-primary"
                      >
                        {saved.program.title}
                      </Link>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Guardado em {new Date(saved.savedAt).toLocaleDateString('pt-PT')}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>{saved.program.entity || 'Sem entidade'}</span>
                        <span>•</span>
                        <span>{saved.program.programType === 'NATIONAL' ? 'Nacional' : 'Municipal'}</span>
                      </div>
                      {saved.program.summary && (
                        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{saved.program.summary}</p>
                      )}
                      {saved.notes && (
                        <div className="mt-3 rounded-lg bg-muted p-3 text-sm text-ink">
                          <span className="font-medium">Nota:</span> {saved.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <SaveProgramButton
                        slug={saved.program.slug}
                        initialSaved
                        size="sm"
                        onSavedChange={(nextSaved) => {
                          if (!nextSaved) {
                            setPrograms((prev) => prev.filter((item) => item.savedId !== saved.savedId));
                          }
                        }}
                      />
                      <Link
                        href={`/apoios/${saved.program.slug}`}
                        className="text-sm font-medium text-primary hover:text-primary/80"
                      >
                        Ver detalhes
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
