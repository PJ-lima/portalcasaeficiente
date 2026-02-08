import crypto from 'crypto';

/**
 * Calcula hash SHA-256 de conteúdo para deduplicação
 */
export function calculateContentHash(content: string | object): string {
  const text = typeof content === 'string' ? content : JSON.stringify(content);
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Normaliza texto para comparação (remove espaços, acentos, lowercase)
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrai data de diferentes formatos de string
 */
export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Tentar diferentes formatos comuns em PT
  const patterns = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // DD/MM/YYYY
    /(\d{4})-(\d{2})-(\d{2})/,        // YYYY-MM-DD
    /(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i, // DD de Mês de YYYY
  ];

  for (const pattern of patterns) {
    const match = dateStr.match(pattern);
    if (match) {
      try {
        if (pattern === patterns[2]) {
          // Formato "DD de Mês de YYYY"
          const months: Record<string, number> = {
            'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3,
            'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7,
            'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11,
          };
          const day = parseInt(match[1]);
          const month = months[match[2].toLowerCase()];
          const year = parseInt(match[3]);
          if (month !== undefined) {
            return new Date(year, month, day);
          }
        } else if (pattern === patterns[0]) {
          // DD/MM/YYYY
          const day = parseInt(match[1]);
          const month = parseInt(match[2]) - 1;
          const year = parseInt(match[3]);
          return new Date(year, month, day);
        } else {
          // YYYY-MM-DD
          return new Date(match[0]);
        }
      } catch {
        continue;
      }
    }
  }
  
  return null;
}

/**
 * Logger estruturado para workers
 */
export class WorkerLogger {
  private context: string;
  
  constructor(context: string) {
    this.context = context;
  }

  private log(level: string, message: string, data?: unknown) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      context: this.context,
      message,
      ...(typeof data === 'undefined' ? {} : { data }),
    };
    
    console.log(JSON.stringify(logEntry));
  }

  info(message: string, data?: unknown) {
    this.log('INFO', message, data);
  }

  error(message: string, error?: Error | unknown) {
    this.log('ERROR', message, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
  }

  success(message: string, data?: unknown) {
    this.log('SUCCESS', message, data);
  }

  warn(message: string, data?: unknown) {
    this.log('WARN', message, data);
  }
}
