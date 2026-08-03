import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SITE_NAME } from '@/lib/seo';

export const metadata: Metadata = {
  title: `Página não encontrada | ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <Header />

      <main className="flex flex-1 items-center">
        <div className="container py-20">
          <div className="mx-auto max-w-xl text-center">
            <span
              aria-hidden="true"
              className="label-tag inline-block bg-cert-f px-5 py-2 font-display text-4xl font-bold text-white"
            >
              404
            </span>
            <h1 className="mt-6 text-3xl font-bold sm:text-4xl">
              Esta página não existe
            </h1>
            <p className="mt-4 leading-7 text-muted-foreground">
              O endereço pode estar errado, ou a página foi movida. Os apoios
              continuam todos no sítio do costume.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/apoios" className="btn-primary">
                Ver apoios abertos
              </Link>
              <Link href="/" className="btn-secondary">
                Ir para a página inicial
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
