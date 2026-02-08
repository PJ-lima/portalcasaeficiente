import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import siteLogo from '../../assets/media/LogoSemFundo.png';
import favicon from '../../assets/media/favicon.png';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Portal Casa Eficiente — Apoios à Habitação',
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
  authors: [{ name: 'Portal Casa Eficiente' }],
  openGraph: {
    title: 'Portal Casa Eficiente — Apoios à Habitação',
    description: 'Descobre apoios para tornar a tua casa mais eficiente e confortável — sem confusão.',
    type: 'website',
    locale: 'pt_PT',
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
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
