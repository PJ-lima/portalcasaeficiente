import { cache } from 'react';
import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { slugify } from './utils';

/**
 * Predicado único de geografia: um programa conta para um concelho se for
 * nacional ou se tiver geografia MUNICIPALITY com este nome exato.
 *
 * A igualdade é exata (sensível a maiúsculas e acentos) contra um campo
 * preenchido por scrapers. Isto é intencional: é a regra que o `ProgramList` já
 * usava, e ter dois predicados diferentes faria a página de concelho
 * redirecionar enquanto `/apoios?concelhoId=` mostrava apoios. Se algum dia os
 * scrapers começarem a escrever variantes não normalizadas, o sítio para
 * corrigir é este — e a correção passa a valer para todos os consumidores.
 */
export function programGeographyFilter(concelhoName: string): Prisma.ProgramWhereInput[] {
  return [
    { geographies: { some: { level: 'NATIONAL' } } },
    { geographies: { some: { level: 'MUNICIPALITY', municipality: concelhoName } } },
  ];
}

/** Slug de URL de um concelho. Único porque `Concelho.name` é `@unique` na DB. */
export function concelhoSlug(name: string): string {
  return slugify(name);
}

/**
 * Resolve um slug de URL para o concelho. São 308 linhas — vale mais carregá-las
 * todas e mapear em memória do que inventar uma coluna `slug` (que obrigaria a
 * migração) ou tentar reconstruir o nome a partir do slug.
 */
export const getConcelhoBySlug = cache(async (slug: string) => {
  const concelhos = await prisma.concelho.findMany({
    select: { id: true, name: true, distrito: { select: { name: true } } },
  });

  return concelhos.find((concelho) => concelhoSlug(concelho.name) === slug) ?? null;
});

/** Este concelho tem pelo menos um apoio municipal próprio? */
export const concelhoHasMunicipalPrograms = cache(async (concelhoName: string) => {
  const count = await prisma.programGeography.count({
    where: { level: 'MUNICIPALITY', municipality: concelhoName },
  });

  return count > 0;
});

/**
 * Concelhos com pelo menos um apoio municipal — os únicos que ganham página
 * própria e entram no sitemap. Concelhos sem apoio municipal só listariam os
 * mesmos programas nacionais que todos os outros, o que é conteúdo duplicado.
 */
export const getConcelhosWithMunicipalPrograms = cache(async () => {
  const geographies = await prisma.programGeography.findMany({
    where: { level: 'MUNICIPALITY', municipality: { not: null } },
    select: { municipality: true },
    distinct: ['municipality'],
  });

  const municipalities = new Set(
    geographies.map((geography) => geography.municipality).filter((name): name is string => Boolean(name))
  );

  if (municipalities.size === 0) return [];

  const concelhos = await prisma.concelho.findMany({
    where: { name: { in: Array.from(municipalities) } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return concelhos.map((concelho) => ({
    ...concelho,
    slug: concelhoSlug(concelho.name),
  }));
});
