import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function withRlsContext<T>(
  userId: string,
  run: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // Match RLS policies scoped to role authenticated when available.
    const roleCheck = await tx.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM pg_catalog.pg_roles
        WHERE rolname = 'authenticated'
      ) AS "exists"
    `;
    if (roleCheck[0]?.exists) {
      await tx.$executeRawUnsafe('SET LOCAL ROLE authenticated');
    }

    // Inject caller identity expected by policies.
    await tx.$executeRaw`SELECT set_config('request.jwt.claim.sub', ${userId}, true)`;

    return run(tx);
  });
}
