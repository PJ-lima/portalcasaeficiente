import { normalizeText } from '../lib/worker-utils';

/**
 * Gate de beneficiário — a regra de relevância do produto (decisão de âmbito
 * 2026-08-10 em proximospassos.md): um apoio pertence ao site se quem recebe
 * o dinheiro ou o benefício é uma pessoa singular (ou agregado familiar /
 * condomínio), diretamente. Empresas, autarquias, associações, escolas e
 * afins ficam fora.
 *
 * Duas camadas de texto com pesos diferentes:
 * - "targeted": secções que falam explicitamente de beneficiários/destinatários/
 *   elegibilidade. Aqui aceitam-se termos mais fracos (cidadãos, famílias,
 *   inquilinos...), porque o contexto garante que descrevem quem candidata.
 * - "full": todo o texto da página. Só termos inequívocos — as rawSections
 *   arrastam navegação e rodapés ("empresas", "municípios"...) que num scan
 *   cego dariam falsos negativos.
 *
 * Positivo ganha sempre a negativo: um apoio aberto a "pessoas singulares e
 * coletivas" continua a servir o cidadão, logo pertence ao radar.
 */

export type BeneficiaryVerdict = 'INDIVIDUAL' | 'ORGANIZATION' | 'UNKNOWN';

export interface BeneficiaryGateInput {
  title?: string;
  description?: string;
  beneficiaries?: string;
  eligibilityCriteria?: string;
  rawSections?: Record<string, string>;
}

export interface BeneficiaryGateResult {
  verdict: BeneficiaryVerdict;
  matchedPositive: string[];
  matchedNegative: string[];
  /// Camada de texto que decidiu o veredicto ('none' = sem texto utilizável).
  scope: 'targeted' | 'full' | 'none';
}

const STRONG_POSITIVE = [
  'pessoa singular',
  'pessoas singulares',
  'agregado familiar',
  'agregados familiares',
  'condominio',
  'condominios',
  'condominos',
  'a titulo individual',
] as const;

const TARGETED_POSITIVE = [
  ...STRONG_POSITIVE,
  'cidadao',
  'cidadaos',
  'municipes',
  'particulares',
  'familias',
  'familia',
  'proprietarios',
  'proprietario',
  'inquilinos',
  'arrendatarios',
  'senhorios',
  'estudantes',
  'jovens',
  'idosos',
  'pensionistas',
  'reformados',
  'desempregados',
  'consumidores',
  'pessoas com deficiencia',
  'atletas individuais',
] as const;

const STRONG_NEGATIVE = [
  'pessoa coletiva',
  'pessoas coletivas',
  'pequenas e medias empresas',
  'micro pequenas e medias empresas',
  'pme',
  'administracao publica',
  'entidades gestoras',
  'autarquias locais',
  'entidades empregadoras',
  // Vocabulário de aviso P2030 que aparece logo no TÍTULO ("Investimento
  // Empresarial Produtivo", "TeSP – Entidades Públicas") — inequívoco mesmo
  // sem texto enriquecido, o que importa quando o deep crawl falha.
  'empresarial',
  'entidades publicas',
] as const;

const TARGETED_NEGATIVE = [
  ...STRONG_NEGATIVE,
  'empresa',
  'empresas',
  'autarquias',
  'municipios',
  'freguesias',
  'juntas de freguesia',
  'associacoes',
  'fundacoes',
  'ipss',
  'misericordias',
  'entidades',
  'operadores economicos',
  'escolas',
  'agrupamentos de escolas',
  'instituicoes de ensino superior',
  'centros de investigacao',
  'entidades formadoras',
  'organismos',
  'institutos publicos',
  'coletividades',
  'startups',
  // Vocabulário de fundos estruturais (Portugal 2030 e afins): quem candidata
  // é um "promotor" (entidade pública ou privada), nunca o cidadão.
  'promotor',
  'promotores',
] as const;

/// Secções cujo título indica que descrevem quem pode candidatar-se.
const TARGETED_SECTION_KEY = /benefici|destinat|elegiv|elegib|quem (se )?pode|a quem/;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findMatches(text: string, keywords: readonly string[]): string[] {
  const matches: string[] = [];
  for (const keyword of keywords) {
    if (new RegExp(`\\b${escapeRegExp(keyword)}\\b`).test(text)) {
      matches.push(keyword);
    }
  }
  return matches;
}

function buildTargetedText(input: BeneficiaryGateInput): string {
  const parts: string[] = [];
  if (input.beneficiaries) parts.push(input.beneficiaries);
  if (input.eligibilityCriteria) parts.push(input.eligibilityCriteria);
  for (const [key, content] of Object.entries(input.rawSections ?? {})) {
    if (TARGETED_SECTION_KEY.test(normalizeText(key))) {
      parts.push(content);
    }
  }
  return normalizeText(parts.join(' '));
}

function buildFullText(input: BeneficiaryGateInput): string {
  const parts = [
    input.title ?? '',
    input.description ?? '',
    input.beneficiaries ?? '',
    input.eligibilityCriteria ?? '',
    ...Object.values(input.rawSections ?? {}),
  ];
  return normalizeText(parts.join(' '));
}

export function classifyBeneficiary(input: BeneficiaryGateInput): BeneficiaryGateResult {
  const targetedText = buildTargetedText(input);

  if (targetedText.length > 0) {
    const positive = findMatches(targetedText, TARGETED_POSITIVE);
    const negative = findMatches(targetedText, TARGETED_NEGATIVE);

    if (positive.length > 0) {
      return { verdict: 'INDIVIDUAL', matchedPositive: positive, matchedNegative: negative, scope: 'targeted' };
    }
    if (negative.length > 0) {
      return { verdict: 'ORGANIZATION', matchedPositive: positive, matchedNegative: negative, scope: 'targeted' };
    }
  }

  const fullText = buildFullText(input);
  if (fullText.length === 0) {
    return { verdict: 'UNKNOWN', matchedPositive: [], matchedNegative: [], scope: 'none' };
  }

  const positive = findMatches(fullText, STRONG_POSITIVE);
  const negative = findMatches(fullText, STRONG_NEGATIVE);

  if (positive.length > 0) {
    return { verdict: 'INDIVIDUAL', matchedPositive: positive, matchedNegative: negative, scope: 'full' };
  }
  if (negative.length > 0) {
    return { verdict: 'ORGANIZATION', matchedPositive: positive, matchedNegative: negative, scope: 'full' };
  }

  return { verdict: 'UNKNOWN', matchedPositive: [], matchedNegative: [], scope: 'full' };
}
