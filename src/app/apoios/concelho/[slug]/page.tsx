import { Suspense } from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProgramList } from '@/components/programs/ProgramList';
import { JsonLd } from '@/components/seo/JsonLd';
import { prisma } from '@/lib/prisma';
import { buildMetadata } from '@/lib/seo';
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd } from '@/lib/json-ld';
import {
  concelhoHasMunicipalPrograms,
  getConcelhoBySlug,
  programGeographyFilter,
} from '@/lib/concelhos';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Sem generateStaticParams: o ProgramList chama auth(), o que força render
// dinâmico na árvore toda (PPR não está ligado). Gerar params seria uma query
// de build que não produz HTML estático nenhum.

function pageDescription(concelhoName: string): string {
  return `Apoios à habitação e à eficiência energética em ${concelhoName}: programas municipais do concelho e apoios nacionais aplicáveis, com o estado real de cada um.`;
}

export default async function ConcelhoPage({ params }: PageProps) {
  const { slug } = await params;
  const concelho = await getConcelhoBySlug(slug);

  if (!concelho) {
    notFound();
  }

  // Concelho válido mas sem apoio municipal próprio: a página só repetiria os
  // apoios nacionais que todas as outras mostram. Redireciona em vez de servir
  // conteúdo duplicado — e é temporário, porque amanhã pode ganhar um programa.
  if (!(await concelhoHasMunicipalPrograms(concelho.name))) {
    redirect(`/apoios?concelhoId=${concelho.id}`);
  }

  const programs = await prisma.program.findMany({
    where: { OR: programGeographyFilter(concelho.name) },
    select: { slug: true, title: true },
    orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
  });

  const path = `/apoios/concelho/${slug}`;

  return (
    <>
      <Header />

      <JsonLd
        data={[
          buildCollectionPageJsonLd({
            name: `Apoios em ${concelho.name}`,
            description: pageDescription(concelho.name),
            path,
            programs,
          }),
          buildBreadcrumbJsonLd([
            { name: 'Início', path: '/' },
            { name: 'Apoios', path: '/apoios' },
            { name: concelho.name, path },
          ]),
        ]}
      />

      <main className="flex-1">
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

        <div className="border-b border-border bg-card">
          <div className="container py-8">
            <p className="section-eyebrow">Apoios por concelho</p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
              Apoios em {concelho.name}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              {concelho.distrito.name}
            </p>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              {pageDescription(concelho.name)}
            </p>
          </div>
        </div>

        <div className="container py-8">
          {/* Sem <ProgramFilters>: esse componente faz router.push('/apoios?...')
              e lê o concelho de useSearchParams(), mas aqui o concelho é
              segmento de path — o primeiro clique num filtro deitaria fora o
              âmbito do concelho. Quem quiser filtrar vai para /apoios com o
              concelho já aplicado. */}
          <Suspense fallback={<ProgramListSkeleton />}>
            <ProgramList searchParams={{ concelhoId: concelho.id }} />
          </Suspense>

          <div className="mt-8 border-t border-border pt-6">
            <Link
              href={`/apoios?concelhoId=${concelho.id}`}
              className="text-sm font-medium text-primary transition hover:underline"
            >
              Ver todos os filtros para {concelho.name} →
            </Link>
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
          <div className="h-6 w-64 rounded bg-muted" />
          <div className="mt-4 h-4 w-48 rounded bg-muted/60" />
        </div>
      ))}
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const concelho = await getConcelhoBySlug(slug);

  if (!concelho) {
    return { title: 'Concelho não encontrado', robots: { index: false, follow: false } };
  }

  return buildMetadata({
    title: `Apoios à casa em ${concelho.name}`,
    description: pageDescription(concelho.name),
    path: `/apoios/concelho/${slug}`,
  });
}
