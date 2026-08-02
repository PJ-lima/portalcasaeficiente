import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Header } from '@/components/layout/Header';
import { formatDate } from '@/lib/utils';
import { AlertTriangle, Activity, Database } from 'lucide-react';

export const dynamic = 'force-dynamic';

type ErrorEntry = {
  step?: string;
  url?: string;
  title?: string;
  message?: string;
};

/**
 * Painel de observabilidade da ingestão.
 *
 * A API de ingestão manual já existia, mas não havia forma de ver se os
 * workers estavam a correr — uma fonte podia estar partida durante semanas
 * sem ninguém dar por isso.
 */
export default async function AdminPage() {
  const session = await auth();

  if (session?.user?.role !== 'ADMIN') {
    redirect('/');
  }

  const [runs, snapshots, pendingNotifications, failedNotifications] =
    await Promise.all([
      prisma.ingestionRun.findMany({
        orderBy: { startedAt: 'desc' },
        take: 40,
      }),
      prisma.applicationStatusSnapshot.findMany({
        orderBy: { capturedAt: 'desc' },
        take: 10,
        select: { id: true, url: true, source: true, capturedAt: true },
      }),
      prisma.notificationQueue.count({ where: { status: 'pending' } }),
      prisma.notificationQueue.count({ where: { status: 'failed' } }),
    ]);

  // Taxa de sucesso por fonte, a partir dos runs mais recentes.
  const bySource = new Map<string, { total: number; completed: number }>();
  for (const run of runs) {
    const entry = bySource.get(run.source) ?? { total: 0, completed: 0 };
    entry.total++;
    if (run.status === 'completed') entry.completed++;
    bySource.set(run.source, entry);
  }

  // Erros agregados por mensagem — o que está partido, não quantas vezes correu.
  const errorCounts = new Map<string, number>();
  for (const run of runs) {
    const entries = Array.isArray(run.errors) ? (run.errors as ErrorEntry[]) : [];
    for (const entry of entries) {
      const key = entry?.message ?? 'erro sem mensagem';
      errorCounts.set(key, (errorCounts.get(key) ?? 0) + 1);
    }
  }
  const topErrors = [...errorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <>
      <Header />

      <main className="container py-10">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Ingestão</h1>
        <p className="mt-2 text-muted-foreground">
          Últimas {runs.length} execuções registadas.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <section className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
              <Activity className="h-5 w-5 text-primary" />
              Sucesso por fonte
            </h2>

            {bySource.size === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">Sem execuções.</p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm">
                {[...bySource.entries()].map(([source, entry]) => {
                  const rate = Math.round((entry.completed / entry.total) * 100);
                  return (
                    <li key={source} className="flex items-center justify-between gap-3">
                      <span className="truncate text-ink">{source}</span>
                      <span
                        className={
                          rate === 100
                            ? 'text-green-700'
                            : rate >= 50
                              ? 'text-amber-700'
                              : 'text-red-700'
                        }
                      >
                        {rate}% ({entry.completed}/{entry.total})
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Erros mais frequentes
            </h2>

            {topErrors.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">Sem erros registados.</p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm">
                {topErrors.map(([message, count]) => (
                  <li key={message} className="flex items-start justify-between gap-3">
                    <span className="line-clamp-2 text-muted-foreground">{message}</span>
                    <span className="shrink-0 font-medium text-ink">{count}×</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
              <Database className="h-5 w-5 text-primary" />
              Fila de notificações
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Por enviar</dt>
                <dd className="font-medium text-ink">{pendingNotifications}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Falhadas</dt>
                <dd
                  className={
                    failedNotifications > 0 ? 'font-medium text-red-700' : 'font-medium text-ink'
                  }
                >
                  {failedNotifications}
                </dd>
              </div>
            </dl>

            <h3 className="mt-6 text-sm font-semibold text-ink">
              Últimos snapshots de candidaturas
            </h3>
            {snapshots.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Nenhum ainda.</p>
            ) : (
              <ul className="mt-2 space-y-2 text-xs">
                {snapshots.map((snapshot) => (
                  <li key={snapshot.id}>
                    <a
                      href={snapshot.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {new URL(snapshot.url).pathname}
                    </a>
                    <span className="ml-2 text-muted-foreground">
                      {formatDate(snapshot.capturedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="mt-8 rounded-xl border border-border bg-card shadow-card">
          <h2 className="border-b border-border px-6 py-4 text-lg font-semibold text-ink">
            Execuções recentes
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">Fonte</th>
                  <th className="px-6 py-3 font-medium">Estado</th>
                  <th className="px-6 py-3 font-medium">Início</th>
                  <th className="px-6 py-3 font-medium">Duração</th>
                  <th className="px-6 py-3 font-medium">Encontrados</th>
                  <th className="px-6 py-3 font-medium">Novos</th>
                  <th className="px-6 py-3 font-medium">Atualizados</th>
                  <th className="px-6 py-3 font-medium">Ignorados</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id} className="border-t border-border">
                    <td className="px-6 py-3 text-ink">{run.source}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          run.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : run.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {formatDate(run.startedAt)}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {run.durationMs ? `${(run.durationMs / 1000).toFixed(1)}s` : '—'}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{run.itemsFound}</td>
                    <td className="px-6 py-3 text-muted-foreground">{run.itemsInserted}</td>
                    <td className="px-6 py-3 text-muted-foreground">{run.itemsUpdated}</td>
                    <td className="px-6 py-3 text-muted-foreground">{run.itemsSkipped}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {runs.length === 0 && (
            <p className="px-6 py-6 text-sm text-muted-foreground">
              Ainda não há execuções registadas.
            </p>
          )}
        </section>

        <p className="mt-6 text-sm text-muted-foreground">
          Para correr uma ingestão manual, usa{' '}
          <code className="rounded bg-muted px-1.5 py-0.5">POST /api/admin/ingest</code>{' '}
          com <code className="rounded bg-muted px-1.5 py-0.5">{'{ "source": "..." }'}</code>.{' '}
          <Link href="/apoios" className="text-primary hover:underline">
            Ver apoios
          </Link>
        </p>
      </main>
    </>
  );
}
