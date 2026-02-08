import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { forgotPasswordSchema } from '@/lib/validations';
import { buildPasswordResetUrl, createPasswordResetToken } from '@/lib/password-reset';
import { sendPasswordResetEmail } from '@/lib/email';

const GENERIC_FORGOT_PASSWORD_MESSAGE =
  'Se o email existir, iremos enviar instrucoes para recuperar a password.';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados invalidos', details: validation.error.issues },
        { status: 400 }
      );
    }

    const email = validation.data.email.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user?.email) {
      return NextResponse.json({ message: GENERIC_FORGOT_PASSWORD_MESSAGE }, { status: 200 });
    }

    const { token, tokenHash, expiresAt, expiresInMinutes } = createPasswordResetToken();

    await prisma.$transaction([
      prisma.$executeRaw`
        DELETE FROM "password_reset_tokens"
        WHERE "user_id" = ${user.id}
          AND "used_at" IS NULL
      `,
      prisma.$executeRaw`
        INSERT INTO "password_reset_tokens" ("id", "user_id", "token_hash", "expires_at", "created_at")
        VALUES (${randomUUID()}, ${user.id}, ${tokenHash}, ${expiresAt}, NOW())
      `,
    ]);

    const resetUrl = buildPasswordResetUrl(token);

    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
        expiresInMinutes,
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
    }

    return NextResponse.json({ message: GENERIC_FORGOT_PASSWORD_MESSAGE }, { status: 200 });
  } catch (error) {
    console.error('Forgot password error:', error);

    // Keep generic response to avoid leaking whether an account exists.
    return NextResponse.json({ message: GENERIC_FORGOT_PASSWORD_MESSAGE }, { status: 200 });
  }
}
