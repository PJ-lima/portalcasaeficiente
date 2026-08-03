/**
 * URL base e interruptor de indexação.
 *
 * Server-only por desenho: nada disto corre em componentes 'use client', logo
 * as variáveis não levam prefixo NEXT_PUBLIC_ e ficam fora do bundle.
 */

/**
 * URL base absoluta, sem barra final.
 *
 * Cadeia: SITE_URL → VERCEL_PROJECT_PRODUCTION_URL → VERCEL_URL → localhost.
 * Não há domínio de produção hardcoded — o domínio ainda não está registado.
 */
export function getSiteUrl(): string {
  const explicit = process.env.SITE_URL?.trim().replace(/\/$/, '');
  if (explicit) return explicit;

  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProduction) return `https://${vercelProduction}`;

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl}`;

  return 'http://localhost:3000';
}

/**
 * O deployment pode ser indexado?
 *
 * O branch `staging` gera Production Deployments na Vercel, por isso NODE_ENV e
 * VERCEL_ENV valem "production" tanto em staging como em produção — nenhum dos
 * dois distingue os ambientes. Esta flag explícita é o único discriminador
 * seguro, e a ausência dela bloqueia.
 */
export function isIndexable(): boolean {
  return process.env.SITE_INDEXABLE === 'true';
}
