import { createHash, randomBytes } from 'crypto';

const DEFAULT_PASSWORD_RESET_TTL_MINUTES = 60;
const PASSWORD_RESET_TOKEN_BYTES = 32;

function getPasswordResetTtlMinutes(): number {
  const envValue = Number.parseInt(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES ?? '', 10);

  if (!Number.isFinite(envValue) || envValue <= 0) {
    return DEFAULT_PASSWORD_RESET_TTL_MINUTES;
  }

  return envValue;
}

export function hashPasswordResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createPasswordResetToken() {
  const token = randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString('hex');
  const tokenHash = hashPasswordResetToken(token);
  const expiresInMinutes = getPasswordResetTtlMinutes();
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  return {
    token,
    tokenHash,
    expiresAt,
    expiresInMinutes,
  };
}

function getAppBaseUrl(): string {
  const configuredUrl = process.env.NEXTAUTH_URL?.trim();

  if (!configuredUrl) {
    return 'http://localhost:3000';
  }

  return configuredUrl.replace(/\/$/, '');
}

export function buildPasswordResetUrl(token: string): string {
  return `${getAppBaseUrl()}/conta/redefinir-password?token=${encodeURIComponent(token)}`;
}
