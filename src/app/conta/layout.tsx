import type { Metadata } from 'next';

// Área pessoal: nunca indexada. O robots.txt já bloqueia /conta, mas um URL
// bloqueado por Disallow ainda pode ser indexado sem conteúdo se for linkado de
// fora — só o noindex na página o impede.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ContaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
