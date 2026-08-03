import type { Metadata } from 'next';

// Área autenticada: nunca indexada (ver nota em src/app/conta/layout.tsx).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PerfilLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
