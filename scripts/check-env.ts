import fs from 'node:fs';
import path from 'node:path';

type EnvMode = 'dev' | 'staging' | 'production';

function getMode(): EnvMode {
  const arg = process.argv.find((value) => value.startsWith('--mode='));
  const parsed = arg?.split('=')[1]?.trim();

  if (parsed === 'staging' || parsed === 'production' || parsed === 'dev') {
    return parsed;
  }

  return 'dev';
}

function hasValue(key: string): boolean {
  return Boolean(process.env[key]?.trim());
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isPostgresUrl(value: string): boolean {
  return value.startsWith('postgres://') || value.startsWith('postgresql://');
}

function validateDatabaseUrl(value: string, key: string): string[] {
  const issues: string[] = [];

  if (!isPostgresUrl(value)) {
    issues.push(`${key} must be a postgres URL`);
    return issues;
  }

  try {
    const url = new URL(value);
    if (!url.hostname) {
      issues.push(`${key} must include hostname`);
    }
    if (url.hash) {
      issues.push(
        `${key} contains URL hash fragment (#). If password contains special chars (ex: #), URL-encode them (ex: %23).`,
      );
    }
    if (!url.username) {
      issues.push(`${key} missing username`);
    }
    if (!url.password) {
      issues.push(`${key} missing password`);
    }
  } catch {
    issues.push(`${key} must be a valid URL`);
  }

  return issues;
}

function isPlaceholderSecret(value: string): boolean {
  const normalized = value.toLowerCase();
  return (
    normalized.includes('replace') ||
    normalized.includes('changeme') ||
    normalized.includes('example') ||
    value.length < 24
  );
}

function parseEnvLine(line: string): [string, string] | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  const match = trimmed.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (!match) return null;

  const key = match[1];
  let value = match[2].trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return [key, value];
}

function loadEnvFile(filepath: string, protectedKeys: Set<string>): boolean {
  if (!fs.existsSync(filepath)) return false;

  const content = fs.readFileSync(filepath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const entry = parseEnvLine(line);
    if (!entry) continue;

    const [key, value] = entry;
    if (protectedKeys.has(key)) continue;

    process.env[key] = value;
  }

  return true;
}

function loadEnvFiles(mode: EnvMode): string[] {
  const cwd = process.cwd();
  const protectedKeys = new Set(Object.keys(process.env));
  const loaded: string[] = [];

  const candidates = [
    '.env',
    `.env.${mode}`,
    '.env.local',
    `.env.${mode}.local`,
  ];

  for (const file of candidates) {
    const fullpath = path.join(cwd, file);
    if (loadEnvFile(fullpath, protectedKeys)) {
      loaded.push(file);
    }
  }

  return loaded;
}

const mode = getMode();
const loadedFiles = loadEnvFiles(mode);

const requiredCommon = ['DATABASE_URL', 'DIRECT_URL', 'NEXTAUTH_URL'];
const requiredForDeployed = ['CRON_SECRET'];

const missing = requiredCommon.filter((key) => !hasValue(key));
const authSecret = process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
const authSecretValue = authSecret ?? '';
if (!authSecretValue) missing.push('AUTH_SECRET (or NEXTAUTH_SECRET)');

if (mode !== 'dev' && !hasValue('CRON_SECRET')) {
  missing.push(...requiredForDeployed);
}

if (missing.length > 0) {
  console.error(`[env:check] Missing required variables (${mode}): ${missing.join(', ')}`);
  if (loadedFiles.length > 0) {
    console.error(`[env:check] Loaded files: ${loadedFiles.join(', ')}`);
  }
  process.exit(1);
}

const invalid: string[] = [];

invalid.push(...validateDatabaseUrl(process.env.DATABASE_URL!, 'DATABASE_URL'));
invalid.push(...validateDatabaseUrl(process.env.DIRECT_URL!, 'DIRECT_URL'));
if (!isHttpUrl(process.env.NEXTAUTH_URL!)) invalid.push('NEXTAUTH_URL must be a valid http(s) URL');

if (invalid.length > 0) {
  console.error(`[env:check] Invalid values (${mode}):`);
  for (const issue of invalid) {
    console.error(` - ${issue}`);
  }
  process.exit(1);
}

if (!hasValue('AUTH_SECRET') && hasValue('NEXTAUTH_SECRET')) {
  console.warn('[env:check] Using legacy NEXTAUTH_SECRET; prefer AUTH_SECRET.');
}

const weakSecrets = ['AUTH_SECRET', ...(mode === 'dev' ? [] : ['CRON_SECRET'])]
  .map((key) => (key === 'AUTH_SECRET' ? authSecretValue : process.env[key] ?? ''))
  .filter((value) => isPlaceholderSecret(value));

if (weakSecrets.length > 0) {
  console.warn('[env:check] Warning: one or more secrets look weak/placeholders.');
}

const optional = [
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'PASSWORD_RESET_TOKEN_TTL_MINUTES',
  'MUNICIPAL_DISCOVERY_LIMIT',
  'MUNICIPAL_REQUEST_DELAY_MS',
  'MUNICIPAL_SCAN_PATH_LIMIT',
  'POSTAL_CACHE_TTL_DAYS',
  'POSTAL_VALIDATION_TIMEOUT_MS',
];

const missingOptional = optional.filter((key) => !hasValue(key));
if (missingOptional.length > 0) {
  console.warn(`[env:check] Optional variables not set: ${missingOptional.join(', ')}`);
}

const loaded = loadedFiles.length > 0 ? loadedFiles.join(', ') : 'none';
console.log(`[env:check] OK (${mode}) - loaded env files: ${loaded}`);
