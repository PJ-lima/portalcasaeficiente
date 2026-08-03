import type { Metadata } from 'next';

// Backoffice: nunca indexado (ver nota em src/app/conta/layout.tsx).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
