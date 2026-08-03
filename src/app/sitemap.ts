import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { getConcelhosWithMunicipalPrograms } from '@/lib/concelhos';
import { getSiteUrl, isIndexable } from '@/lib/site-url';

// Sem isto o sitemap era gerado uma vez no build e o cron diário nunca lá
// chegava. Também evita depender de acesso à DB durante `next build`.
export const revalidate = 3600;

// Allowlist explícita, nunca um scan do filesystem: é o que garante que /admin
// e /conta não entram no sitemap por acidente ao surgir uma rota nova.
const STATIC_ROUTES = [
  '/',
  '/apoios',
  '/verificar',
  '/como-funciona',
  '/sobre',
  '/termos',
  '/privacidade',
  '/contactos',
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isIndexable()) return [];

  const siteUrl = getSiteUrl();

  const [programs, concelhos] = await Promise.all([
    prisma.program.findMany({ select: { slug: true, updatedAt: true } }),
    getConcelhosWithMunicipalPrograms(),
  ]);

  // Um sitemap só aguenta 50 000 URL. Quando chegarmos perto, é preciso
  // partir em vários ficheiros com generateSitemaps() — este aviso existe para
  // isso não ser descoberto por o Google deixar de ler metade do inventário.
  if (programs.length + concelhos.length > 45_000) {
    console.warn(
      `[sitemap] ${programs.length + concelhos.length} URL — perto do limite de 50k. Partir com generateSitemaps().`
    );
  }

  return [
    ...STATIC_ROUTES.map((path) => ({
      url: `${siteUrl}${path}`,
      changeFrequency: 'daily' as const,
    })),
    ...programs.map((program) => ({
      url: `${siteUrl}/apoios/${program.slug}`,
      lastModified: program.updatedAt,
      changeFrequency: 'daily' as const,
    })),
    ...concelhos.map((concelho) => ({
      url: `${siteUrl}/apoios/concelho/${concelho.slug}`,
      changeFrequency: 'weekly' as const,
    })),
  ];
}
