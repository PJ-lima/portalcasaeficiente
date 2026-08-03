import type { Program, ProgramGeography } from '@prisma/client';
import { getSiteUrl } from './site-url';
import { SITE_NAME } from './seo';

/** Absolutiza um caminho da app. */
function absolute(path: string): string {
  return new URL(path, getSiteUrl()).toString();
}

export function buildOrganizationJsonLd() {
  const siteUrl = getSiteUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: siteUrl,
    logo: absolute('/og-image.png'),
    areaServed: { '@type': 'Country', name: 'Portugal' },
  };
}

/**
 * A SearchAction aponta para o filtro `q` que o `/apoios` já suporta — é uma
 * ação real, não markup decorativo.
 */
export function buildWebSiteJsonLd() {
  const siteUrl = getSiteUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: siteUrl,
    inLanguage: 'pt-PT',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/apoios?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absolute(item.path),
    })),
  };
}

function areaServed(geographies: ProgramGeography[]) {
  const areas = geographies.map((geography) => {
    if (geography.level === 'NATIONAL') {
      return { '@type': 'Country', name: 'Portugal' };
    }

    const name = geography.municipality || geography.district || geography.parish;
    if (!name) return null;

    return { '@type': 'AdministrativeArea', name };
  });

  return areas.filter((area): area is { '@type': string; name: string } => area !== null);
}

/**
 * `GovernmentService` não tem rich result no Google — o valor aqui é clareza de
 * entidade para crawling clássico e para citação por assistentes, não um
 * enhancement visual na SERP.
 */
export function buildGovernmentServiceJsonLd(
  program: Program & { geographies: ProgramGeography[] }
) {
  const areas = areaServed(program.geographies);

  return {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: program.title,
    url: absolute(`/apoios/${program.slug}`),
    ...(program.summary ? { description: program.summary } : {}),
    ...(program.entity
      ? { provider: { '@type': 'GovernmentOrganization', name: program.entity } }
      : {}),
    ...(areas.length > 0 ? { areaServed: areas } : {}),
    ...(program.officialUrl ? { serviceUrl: program.officialUrl } : {}),
    serviceType: 'Apoio à habitação',
  };
}

export interface ProgramListItem {
  slug: string;
  title: string;
}

/** ItemList sem `@context`, para ser embebida noutro nó. */
function itemList(programs: ProgramListItem[]) {
  return {
    '@type': 'ItemList',
    itemListElement: programs.map((program, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: program.title,
      url: absolute(`/apoios/${program.slug}`),
    })),
  };
}

export function buildItemListJsonLd(programs: ProgramListItem[]) {
  return { '@context': 'https://schema.org', ...itemList(programs) };
}

export function buildCollectionPageJsonLd(options: {
  name: string;
  description: string;
  path: string;
  programs: ProgramListItem[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: options.name,
    description: options.description,
    url: absolute(options.path),
    inLanguage: 'pt-PT',
    mainEntity: itemList(options.programs),
  };
}
