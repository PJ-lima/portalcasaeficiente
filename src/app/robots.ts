import type { MetadataRoute } from 'next';
import { getSiteUrl, isIndexable } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  // Staging gera Production Deployments, logo NODE_ENV/VERCEL_ENV não servem
  // de discriminador — ver src/lib/site-url.ts.
  if (!isIndexable()) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Só /api: não serve HTML, logo não tem onde pôr um noindex.
      //
      // /admin, /conta, /dashboard e /perfil NÃO entram aqui de propósito. Um
      // Disallow impede o crawler de descarregar a página — e portanto de ver o
      // noindex que lá está. O URL acabava indexado sem snippet se fosse
      // linkado de fora, que é exatamente o que se quer evitar. Com o crawl
      // permitido, o noindex desses layouts é respeitado e o URL sai do índice.
      disallow: ['/api'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
