const RESEND_API_URL = 'https://api.resend.com/emails';

export type PasswordResetEmailParams = {
  to: string;
  name?: string | null;
  resetUrl: string;
  expiresInMinutes: number;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildPasswordResetHtml({
  name,
  resetUrl,
  expiresInMinutes,
}: Omit<PasswordResetEmailParams, 'to'>): string {
  const greeting = name ? `Ola ${escapeHtml(name)},` : 'Ola,';

  return `
    <p>${greeting}</p>
    <p>Recebemos um pedido para redefinir a password da sua conta no Portal Casa Eficiente.</p>
    <p>
      <a href="${escapeHtml(resetUrl)}" style="background:#2563eb;color:#ffffff;padding:10px 16px;border-radius:8px;text-decoration:none;display:inline-block;">
        Redefinir password
      </a>
    </p>
    <p>Este link expira em ${expiresInMinutes} minutos.</p>
    <p>Se nao pediu esta alteracao, pode ignorar este email.</p>
  `;
}

function buildPasswordResetText({
  name,
  resetUrl,
  expiresInMinutes,
}: Omit<PasswordResetEmailParams, 'to'>): string {
  const greeting = name ? `Ola ${name},` : 'Ola,';

  return [
    greeting,
    '',
    'Recebemos um pedido para redefinir a password da sua conta no Portal Casa Eficiente.',
    `Redefina aqui: ${resetUrl}`,
    '',
    `Este link expira em ${expiresInMinutes} minutos.`,
    'Se nao pediu esta alteracao, pode ignorar este email.',
  ].join('\n');
}

export async function sendPasswordResetEmail(params: PasswordResetEmailParams): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const emailFrom = process.env.EMAIL_FROM?.trim();

  if (!resendApiKey || !emailFrom) {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[auth] Password reset link for ${params.to}: ${params.resetUrl}`);
      return;
    }

    console.warn('[auth] Email provider is not configured (RESEND_API_KEY/EMAIL_FROM).');
    return;
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: emailFrom,
      to: [params.to],
      subject: 'Recuperacao de password - Portal Casa Eficiente',
      html: buildPasswordResetHtml(params),
      text: buildPasswordResetText(params),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to send password reset email: ${response.status} ${errorBody}`);
  }
}
