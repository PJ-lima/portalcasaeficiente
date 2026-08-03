import Link from 'next/link';
import { buildMetadata, SITE_NAME } from '@/lib/seo';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LegalPlaceholderNotice } from '@/components/legal/LegalPlaceholderNotice';
import { LEGAL, formatLastUpdated } from '@/lib/legal';

const TBD = '[por preencher]';

export default function TermosPage() {
  return (
    <>
      <Header />

      <main className="flex-1">
        <section className="bg-gradient-to-b from-primary-50 to-background py-12">
          <div className="container">
            <div className="mx-auto max-w-3xl">
              <h1 className="text-3xl font-bold text-ink sm:text-4xl">
                Termos de Utilização
              </h1>
              <p className="mt-3 text-muted-foreground">
                Última atualização: {formatLastUpdated()}
              </p>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container">
            <div className="mx-auto max-w-3xl space-y-10 text-muted-foreground leading-relaxed">
              <LegalPlaceholderNotice />

              <div>
                <h2 className="text-2xl font-bold text-ink">
                  1. O que é este serviço
                </h2>
                <p className="mt-4">
                  O {SITE_NAME} reúne e organiza informação pública sobre apoios
                  do Estado e das autarquias para habitação e eficiência
                  energética. É explicado por outras palavras aquilo que os avisos
                  oficiais dizem, para ser mais fácil de perceber.
                </p>
                <p className="mt-4">
                  É uma <strong>plataforma independente</strong>. Não é um serviço
                  público, não está oficialmente afiliada ao Estado Português nem
                  a qualquer entidade gestora dos apoios, e não intermedeia
                  candidaturas.
                </p>
                <p className="mt-4">
                  Serviço prestado por {LEGAL.entityName || TBD}, NIF{' '}
                  {LEGAL.taxId || TBD}.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-ink">
                  2. A informação não substitui a fonte oficial
                </h2>
                <p className="mt-4">
                  A informação é recolhida automaticamente de fontes públicas e
                  pode estar desatualizada, incompleta ou conter erros. Os prazos,
                  valores e condições mudam sem aviso.
                </p>
                <p className="mt-4">
                  <strong>
                    Confirma sempre na fonte oficial antes de tomares qualquer
                    decisão ou submeteres uma candidatura.
                  </strong>{' '}
                  Cada apoio no site tem a ligação para a página oficial do
                  programa.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-ink">
                  3. A verificação de elegibilidade é uma estimativa
                </h2>
                <p className="mt-4">
                  O resultado da verificação é indicativo e baseia-se apenas nos
                  dados que introduzes e na leitura que fazemos das regras
                  publicadas. Não é uma decisão, não vincula ninguém e não
                  garante a atribuição de qualquer apoio. Quem decide é sempre a
                  entidade responsável pelo programa.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-ink">4. A tua conta</h2>
                <p className="mt-4">
                  Criar conta é opcional e serve para guardares apoios e
                  receberes alertas. És responsável por manter a tua palavra-passe
                  em segredo e por tudo o que aconteça na tua conta.
                </p>
                <p className="mt-4">
                  Compromete-te a fornecer informação verdadeira. Podes apagar a
                  tua conta a qualquer momento.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-ink">
                  5. Utilização aceitável
                </h2>
                <p className="mt-4">Não podes:</p>
                <ul className="mt-3 list-disc space-y-1 pl-6">
                  <li>
                    Extrair conteúdo do site de forma automatizada e massiva sem
                    autorização
                  </li>
                  <li>
                    Tentar aceder a contas, dados ou áreas que não te pertencem
                  </li>
                  <li>
                    Sobrecarregar deliberadamente a infraestrutura do serviço
                  </li>
                  <li>
                    Usar o serviço para fins ilícitos ou para enganar terceiros
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-ink">
                  6. Propriedade intelectual
                </h2>
                <p className="mt-4">
                  A informação sobre os apoios provém de fontes públicas e
                  pertence às respetivas entidades. A organização, os textos
                  próprios, a marca e o desenho do site pertencem a{' '}
                  {LEGAL.entityName || TBD}.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-ink">
                  7. Limitação de responsabilidade
                </h2>
                <p className="mt-4">
                  O serviço é disponibilizado tal como está, sem garantia de
                  disponibilidade permanente nem de exatidão da informação.
                </p>
                <p className="mt-4">
                  Na medida permitida pela lei, não respondemos por prejuízos
                  resultantes de decisões tomadas com base na informação do site,
                  de candidaturas indeferidas, de prazos perdidos ou de
                  interrupções do serviço. Nada nestes termos exclui
                  responsabilidade por dolo ou culpa grave, nem afeta os direitos
                  que a lei reconhece aos consumidores.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-ink">
                  8. Dados pessoais
                </h2>
                <p className="mt-4">
                  O tratamento dos teus dados está descrito na{' '}
                  <Link href="/privacidade" className="text-primary underline">
                    Política de Privacidade
                  </Link>
                  , que faz parte integrante destes termos.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-ink">
                  9. Alterações e lei aplicável
                </h2>
                <p className="mt-4">
                  Estes termos podem ser alterados. As alterações relevantes são
                  anunciadas nesta página, com atualização da data no topo.
                </p>
                <p className="mt-4">
                  Aplica-se a lei portuguesa. Em caso de litígio de consumo,
                  podes recorrer às entidades de resolução alternativa de
                  litígios de consumo territorialmente competentes, nos termos da
                  Lei n.º 144/2015.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-ink">10. Contacto</h2>
                <p className="mt-4">
                  Dúvidas sobre estes termos:{' '}
                  <Link href="/contactos" className="text-primary underline">
                    página de contactos
                  </Link>
                  .
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
  title: 'Termos de Utilização',
  description: `Condições de utilização do ${SITE_NAME}, limites da informação apresentada e responsabilidades de cada parte.`,
  path: '/termos',
});
