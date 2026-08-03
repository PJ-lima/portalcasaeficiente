import type { Metadata } from 'next';
import { getSiteUrl, isIndexable } from './site-url';

export const SITE_NAME = 'Radar de Apoios';
export const SITE_TAGLINE = 'Apoios do Estado para a tua casa';
export const DEFAULT_OG_IMAGE = '/og-image.png';

interface BuildMetadataOptions {
  /** Título curto da página, sem o nome do site — o sufixo é acrescentado aqui. */
  title: string;
  description: string;
  /** Caminho absoluto na app, sempre a começar por '/'. Ex.: '/apoios/concelho/cascais' */
  path: string;
  /** Força noindex mesmo quando o site é indexável (rotas privadas). */
  noindex?: boolean;
  ogImage?: string;
}

/**
 * Metadata de página, com canonical absoluto e robots derivado do ambiente.
 *
 * O Next substitui o objeto `openGraph` inteiro em vez de o fundir com o do
 * layout pai, por isso `siteName` e `locale` são re-emitidos aqui — se
 * dependessem de herança, qualquer página que use este helper perdia-os.
 */
export function buildMetadata({
  title,
  description,
  path,
  noindex = false,
  ogImage = DEFAULT_OG_IMAGE,
}: BuildMetadataOptions): Metadata {
  const canonical = new URL(path, getSiteUrl()).toString();
  const indexable = isIndexable() && !noindex;

  // O sufixo é composto aqui em vez de por `title.template` do layout raiz,
  // porque o template não se aplica ao `openGraph.title` quando este é
  // definido explicitamente — e é. Assim os dois nunca divergem.
  // A homepage já leva o nome no próprio título — não o duplicar.
  const fullTitle = title.startsWith(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

  return {
    title: fullTitle,
    description,
    alternates: { canonical },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      type: 'website',
      locale: 'pt_PT',
      siteName: SITE_NAME,
      images: [ogImage],
    },
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}
