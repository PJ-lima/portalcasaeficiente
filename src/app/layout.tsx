import type { Metadata } from 'next';
import { Bricolage_Grotesque, Instrument_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from '@/lib/json-ld';
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_TAGLINE } from '@/lib/seo';
import { getSiteUrl, isIndexable } from '@/lib/site-url';
import siteLogo from '../../assets/media/LogoSemFundo.png';
import favicon from '../../assets/media/favicon.png';

const displayFont = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
});

const sansFont = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

// Sem `alternates` aqui: o Next herda-o em todas as rotas que não definam o
// seu, e o site inteiro passaria a apontar canonical para "/". Cada página
// declara o seu via buildMetadata().
export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  robots: isIndexable()
    ? { index: true, follow: true }
    : { index: false, follow: false },
  title: `${SITE_NAME} — ${SITE_TAGLINE}`,
  description: 'Descobre apoios para tornar a tua casa mais eficiente e confortável. Encontra programas nacionais e municipais de eficiência energética em Portugal.',
  keywords: [
    'eficiência energética',
    'apoios habitação',
    'fundo ambiental',
    'vale eficiência',
    'isolamento térmico',
    'janelas eficientes',
    'bomba de calor',
    'solar fotovoltaico',
    'Portugal',
  ],
  authors: [{ name: SITE_NAME }],
  openGraph: {
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: 'Descobre apoios para tornar a tua casa mais eficiente e confortável — sem confusão.',
    type: 'website',
    locale: 'pt_PT',
    siteName: SITE_NAME,
    images: [DEFAULT_OG_IMAGE],
  },
  icons: {
    icon: favicon.src,
    shortcut: favicon.src,
    apple: siteLogo.src,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-PT">
      <body className={`${sansFont.variable} ${displayFont.variable} font-sans`}>
        <JsonLd data={[buildOrganizationJsonLd(), buildWebSiteJsonLd()]} />
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
