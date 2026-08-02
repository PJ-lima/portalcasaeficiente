import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { ProgramDomain } from '@prisma/client';

const settingsSchema = z.object({
  emailEnabled: z.boolean(),
  savedProgramUpdates: z.boolean(),
  deadlineReminders: z.boolean(),
  domains: z.array(z.nativeEnum(ProgramDomain)).max(10),
  concelhoIds: z.array(z.string().min(1)).max(50),
});

const DEFAULT_SETTINGS = {
  emailEnabled: true,
  savedProgramUpdates: true,
  deadlineReminders: true,
  domains: [] as ProgramDomain[],
  concelhoIds: [] as string[],
};

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const settings = await prisma.userNotificationSettings.findUnique({
    where: { userId: session.user.id },
    select: {
      emailEnabled: true,
      savedProgramUpdates: true,
      deadlineReminders: true,
      domains: true,
      concelhoIds: true,
    },
  });

  return NextResponse.json({ settings: settings ?? DEFAULT_SETTINGS });
}

export async function PUT(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const parsed = settingsSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const settings = await prisma.userNotificationSettings.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...parsed.data },
    update: parsed.data,
    select: {
      emailEnabled: true,
      savedProgramUpdates: true,
      deadlineReminders: true,
      domains: true,
      concelhoIds: true,
    },
  });

  return NextResponse.json({ settings });
}
