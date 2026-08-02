/**
 * Worker "situação das candidaturas" — Fundo Ambiental
 *
 * Porquê: o cidadão não fica bloqueado por não encontrar o apoio, fica bloqueado
 * por não saber em que ponto está o processo. O Fundo Ambiental publica tabelas
 * de situação das candidaturas, mas em páginas soltas e sem histórico — quando a
 * tabela muda, a versão anterior desaparece.
 *
 * Este worker captura essas tabelas e guarda um snapshot por cada versão nova
 * (dedup por hash do conteúdo normalizado). É a matéria-prima para responder a
 * "a minha candidatura foi das que ficaram de fora?".
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { prisma } from '../lib/prisma';
import { calculateContentHash, normalizeText, WorkerLogger } from '../lib/worker-utils';
import { withIngestionRun } from '../lib/ingestion';
import type { WorkerRunResult } from './discovery-engine';

const SOURCE_ID = 'fundo-ambiental-status';

const USER_AGENT =
  'Mozilla/5.0 (compatible; PortalCasaEficienteBot/1.0; +https://portalcasaeficiente.pt)';

const REQUEST_TIMEOUT_MS = 20_000;

const STATUS_PAGES = [
  'https://www.fundoambiental.pt/plataforma-vales-de-eficiencia/beneficiarios-situacao-das-candidaturas.aspx',
  'https://www.fundoambiental.pt/plataforma-vales-de-eficiencia/situacao-das-candidaturas.aspx',
  'https://www.fundoambiental.pt/plataforma-vales-de-eficiencia/candidaturas-a-medidas-situacao-das-candidaturas.aspx',
] as const;

const logger = new WorkerLogger(SOURCE_ID);

export type StatusTable = {
  caption: string | null;
  headers: string[];
  rows: string[][];
  rowCount: number;
};

function cleanCell(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * Extrai as tabelas de uma página. Ignora tabelas de layout (sem cabeçalho ou
 * com uma única coluna), que são comuns em páginas .aspx antigas.
 */
export function extractTables(html: string): StatusTable[] {
  const $ = cheerio.load(html);
  const tables: StatusTable[] = [];

  $('table').each((_, element) => {
    const table = $(element);

    const headers = table
      .find('tr')
      .first()
      .find('th, td')
      .map((__, cell) => cleanCell($(cell).text()))
      .get()
      .filter((header) => header.length > 0);

    if (headers.length < 2) return;

    const rows: string[][] = [];
    table
      .find('tr')
      .slice(1)
      .each((__, row) => {
        const cells = $(row)
          .find('td, th')
          .map((___, cell) => cleanCell($(cell).text()))
          .get();

        if (cells.some((cell) => cell.length > 0)) {
          rows.push(cells);
        }
      });

    if (rows.length === 0) return;

    const caption = cleanCell(table.find('caption').first().text());

    tables.push({
      caption: caption.length > 0 ? caption : null,
      headers,
      rows,
      rowCount: rows.length,
    });
  });

  return tables;
}

/**
 * Hash sobre o conteúdo normalizado: mudanças de espaçamento ou de
 * capitalização não contam como tabela nova.
 */
export function hashTables(tables: StatusTable[]): string {
  return calculateContentHash(
    tables.map((table) => ({
      caption: table.caption ? normalizeText(table.caption) : null,
      headers: table.headers.map(normalizeText),
      rows: table.rows.map((row) => row.map(normalizeText)),
    })),
  );
}

async function captureUrl(url: string): Promise<'new' | 'skipped'> {
  const response = await axios.get<string>(url, {
    timeout: REQUEST_TIMEOUT_MS,
    headers: { 'User-Agent': USER_AGENT },
    responseType: 'text',
  });

  const tables = extractTables(response.data);

  if (tables.length === 0) {
    throw new Error('Nenhuma tabela de situação encontrada na página');
  }

  const tableHash = hashTables(tables);

  const existing = await prisma.applicationStatusSnapshot.findUnique({
    where: { url_tableHash: { url, tableHash } },
    select: { id: true },
  });

  if (existing) {
    logger.info('Tabela inalterada desde o último snapshot', { url });
    return 'skipped';
  }

  await prisma.applicationStatusSnapshot.create({
    data: {
      source: SOURCE_ID,
      url,
      tableHash,
      data: {
        capturedFrom: url,
        tableCount: tables.length,
        tables,
      },
    },
  });

  logger.success('Snapshot novo guardado', {
    url,
    tables: tables.length,
    rows: tables.reduce((total, table) => total + table.rowCount, 0),
  });

  return 'new';
}

async function ingestInner(): Promise<WorkerRunResult> {
  const startedAt = Date.now();
  const errors: Array<{ title?: string; url?: string; error: string }> = [];

  let newCount = 0;
  let skippedCount = 0;

  for (const url of STATUS_PAGES) {
    try {
      const outcome = await captureUrl(url);
      if (outcome === 'new') newCount++;
      else skippedCount++;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Falha ao capturar página de situação', error);
      errors.push({ url, error: message });
    }
  }

  return {
    success: errors.length < STATUS_PAGES.length,
    stats: {
      found: STATUS_PAGES.length,
      new: newCount,
      updated: 0,
      skipped: skippedCount,
      errors: errors.length,
      duration: ((Date.now() - startedAt) / 1000).toFixed(2),
    },
    errors,
  };
}

export async function ingestFundoAmbientalStatus(): Promise<WorkerRunResult> {
  return withIngestionRun(SOURCE_ID, ingestInner);
}

if (require.main === module) {
  ingestFundoAmbientalStatus()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
      process.exitCode = result.success ? 0 : 1;
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
