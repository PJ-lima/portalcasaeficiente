/**
 * Identificação legal do responsável pelo tratamento de dados.
 *
 * Estes campos NÃO podem ir para produção vazios: o RGPD (art. 13.º, n.º 1,
 * al. a)) obriga a identificar o responsável pelo tratamento e a fornecer os
 * seus contactos. As páginas /privacidade, /termos e /contactos mostram um
 * aviso visível enquanto estiverem por preencher, para isto não passar
 * despercebido no dia do lançamento.
 */
export const LEGAL = {
  /** Nome da pessoa singular ou coletiva responsável. Ex: 'Paulo Lima' ou 'Exemplo, Lda.' */
  entityName: '',
  /** NIF/NIPC do responsável. */
  taxId: '',
  /** Morada completa para efeitos legais. */
  address: '',
  /** Email de contacto para exercício de direitos e questões gerais. */
  email: '',
  /** Data da última revisão dos documentos legais, formato ISO. */
  lastUpdated: '2026-08-03',
} as const;

export function isLegalIdentityComplete(): boolean {
  return Boolean(LEGAL.entityName && LEGAL.taxId && LEGAL.address && LEGAL.email);
}

export function formatLastUpdated(): string {
  return new Date(LEGAL.lastUpdated).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
