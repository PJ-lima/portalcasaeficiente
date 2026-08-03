import Link from 'next/link';
import { Mail, ShieldCheck, AlertTriangle } from 'lucide-react';
import { buildMetadata, SITE_NAME } from '@/lib/seo';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LegalPlaceholderNotice } from '@/components/legal/LegalPlaceholderNotice';
import { LEGAL } from '@/lib/legal';

const TBD = '[por preencher]';

export default function ContactosPage() {
  return (
    <>
      <Header />

      <main className="flex-1">
        <section className="bg-gradient-to-b from-primary-50 to-background py-12">
          <div className="container">
            <div className="mx-auto max-w-3xl">
              <h1 className="text-3xl font-bold text-ink sm:text-4xl">
                Contactos
              </h1>
              <p className="mt-3 text-lg text-muted-foreground">
                Uma dúvida, um erro na informação, um pedido sobre os teus dados.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container">
            <div className="mx-auto max-w-3xl space-y-8">
              <LegalPlaceholderNotice />

              <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-ink">Email</h2>
                    <p className="mt-2 text-muted-foreground">
                      {LEGAL.email ? (
                        <a
                          href={`mailto:${LEGAL.email}`}
                          className="text-primary underline"
                        >
                          {LEGAL.email}
                        </a>
                      ) : (
                        TBD
                      )}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Respondemos normalmente em poucos dias úteis.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-ink">
                      Dados pessoais
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                      Para aceder, corrigir ou apagar os teus dados, usa o mesmo
                      email e diz o que pretendes. Temos um mês para responder.
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      O detalhe está na{' '}
                      <Link
                        href="/privacidade"
                        className="text-primary underline"
                      >
                        Política de Privacidade
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-sun-100 text-sun-foreground">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-ink">
                      Informação errada sobre um apoio
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                      Se encontrares um prazo, valor ou condição que não bate
                      certo com a fonte oficial, diz-nos. Inclui a ligação para a
                      página do apoio aqui no site e, se possível, a ligação
                      oficial.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-primary-50 p-6">
                <h2 className="font-display text-lg font-semibold text-ink">
                  O que não conseguimos fazer
                </h2>
                <p className="mt-2 text-muted-foreground">
                  O {SITE_NAME} não submete candidaturas, não consulta o estado
                  de candidaturas já submetidas e não tem acesso aos sistemas das
                  entidades gestoras. Para isso tens de contactar diretamente a
                  entidade responsável pelo programa — o contacto está sempre na
                  página oficial de cada apoio.
                </p>
              </div>

              <div className="border-t border-border pt-6 text-sm text-muted-foreground">
                <p>
                  <strong>Responsável:</strong> {LEGAL.entityName || TBD}
                </p>
                <p className="mt-1">
                  <strong>Morada:</strong> {LEGAL.address || TBD}
                </p>
                <p className="mt-1">
                  <strong>NIF/NIPC:</strong> {LEGAL.taxId || TBD}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export const metadata = buildMetadata({
  title: 'Contactos',
  description: `Como falar com o ${SITE_NAME}: dúvidas, correções de informação e pedidos sobre dados pessoais.`,
  path: '/contactos',
});
