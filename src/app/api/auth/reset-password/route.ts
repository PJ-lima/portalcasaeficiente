import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { hashPasswordResetToken } from '@/lib/password-reset';
import { resetPasswordSchema } from '@/lib/validations';

type ResetTokenRow = {
  id: string;
  userId: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados invalidos', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;
    const tokenHash = hashPasswordResetToken(token);

    const resetTokens = await prisma.$queryRaw<ResetTokenRow[]>`
      SELECT "id", "user_id" AS "userId"
      FROM "password_reset_tokens"
      WHERE "token_hash" = ${tokenHash}
        AND "used_at" IS NULL
        AND "expires_at" > NOW()
      LIMIT 1
    `;
    const resetToken = resetTokens[0];

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Token invalido ou expirado.' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.$executeRaw`
        UPDATE "password_reset_tokens"
        SET "used_at" = NOW()
        WHERE "id" = ${resetToken.id}
      `,
      prisma.$executeRaw`
        DELETE FROM "password_reset_tokens"
        WHERE "user_id" = ${resetToken.userId}
          AND "id" <> ${resetToken.id}
      `,
    ]);

    return NextResponse.json(
      { message: 'Password redefinida com sucesso.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Nao foi possivel redefinir a password.' },
      { status: 500 }
    );
  }
}
