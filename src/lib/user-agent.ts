/**
 * User-Agent dos workers de ingestão.
 *
 * Sem `+https://…` de propósito: o domínio ainda não está registado, e um URL
 * de contacto que dá 404 é pior do que nenhum — um webmaster que queira saber
 * quem lhe está a bater à porta fica sem sítio para onde ir. Assim que houver
 * domínio, acrescentar `; +https://<dominio>` aqui e fica feito em todo o lado.
 */
export const CRAWLER_USER_AGENT = 'Mozilla/5.0 (compatible; RadarDeApoiosBot/1.0)';
