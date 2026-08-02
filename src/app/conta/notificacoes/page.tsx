'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowLeft, BellRing } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { programDomainLabels } from '@/lib/utils';

type Settings = {
  emailEnabled: boolean;
  savedProgramUpdates: boolean;
  deadlineReminders: boolean;
  domains: string[];
  concelhoIds: string[];
};

const DEFAULT_SETTINGS: Settings = {
  emailEnabled: true,
  savedProgramUpdates: true,
  deadlineReminders: true,
  domains: [],
  concelhoIds: [],
};

const DOMAIN_OPTIONS = Object.entries(programDomainLabels);

export default function NotificacoesPage() {
  const { status } = useSession();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') return;

    async function load() {
      try {
        const response = await fetch('/api/notifications/settings');
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.error ?? 'Não foi possível carregar as preferências');
        }

        setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : 'Erro ao carregar preferências',
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [status]);

  function toggleDomain(domain: string) {
    setSettings((current) => ({
      ...current,
      domains: current.domains.includes(domain)
        ? current.domains.filter((value) => value !== domain)
        : [...current.domains, domain],
    }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error ?? 'Não foi possível guardar');
      }

      setMessage('Preferências guardadas.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Erro ao guardar');
    } finally {
      setSaving(false);
    }
  }

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <>
        <Header />
        <main className="container py-16">
          <p className="text-muted-foreground">A carregar…</p>
        </main>
      </>
    );
  }

  if (status !== 'authenticated') {
    return (
      <>
        <Header />
        <main className="container py-16">
          <h1 className="text-2xl font-bold text-ink">Alertas de apoios</h1>
          <p className="mt-3 text-muted-foreground">
            Inicia sessão para escolher quando queres ser avisado.
          </p>
          <Link
            href="/conta?callbackUrl=/conta/notificacoes"
            className="mt-6 inline-flex items-center rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground"
          >
            Entrar
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="container py-10">
        <Link
          href="/perfil"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao perfil
        </Link>

        <div className="mt-6 flex items-start gap-3">
          <BellRing className="mt-1 h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-ink sm:text-3xl">Alertas de apoios</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Há verbas que esgotam em dias. Escolhe o que queres saber e avisamos-te
              por email — sem spam, e podes desligar a qualquer momento.
            </p>
          </div>
        </div>

        <div className="mt-8 max-w-2xl space-y-6">
          <section className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold text-ink">Quando avisar</h2>

            <div className="mt-4 space-y-3">
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={settings.emailEnabled}
                  onChange={(event) =>
                    setSettings({ ...settings, emailEnabled: event.target.checked })
                  }
                  className="mt-1 rounded border-input text-primary focus:ring-primary"
                />
                <span>
                  <span className="font-medium text-ink">Receber emails</span>
                  <span className="block text-muted-foreground">
                    Desliga isto para parar todos os avisos.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={settings.savedProgramUpdates}
                  disabled={!settings.emailEnabled}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      savedProgramUpdates: event.target.checked,
                    })
                  }
                  className="mt-1 rounded border-input text-primary focus:ring-primary disabled:opacity-50"
                />
                <span>
                  <span className="font-medium text-ink">
                    Mudanças nos apoios que guardei
                  </span>
                  <span className="block text-muted-foreground">
                    Inclui dotação esgotada, suspensão e pagamentos em atraso.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={settings.deadlineReminders}
                  disabled={!settings.emailEnabled}
                  onChange={(event) =>
                    setSettings({ ...settings, deadlineReminders: event.target.checked })
                  }
                  className="mt-1 rounded border-input text-primary focus:ring-primary disabled:opacity-50"
                />
                <span>
                  <span className="font-medium text-ink">Prazos a terminar</span>
                  <span className="block text-muted-foreground">
                    Aviso antes de fechar a candidatura de um apoio guardado.
                  </span>
                </span>
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold text-ink">Que tipo de apoios</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sem nenhum selecionado, avisamos sobre todos.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {DOMAIN_OPTIONS.map(([value, label]) => {
                const active = settings.domains.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleDomain(value)}
                    disabled={!settings.emailEnabled}
                    className={`rounded-full border px-3 py-1.5 text-sm transition disabled:opacity-50 ${
                      active
                        ? 'border-primary bg-primary-50 font-medium text-primary'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </section>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
          )}
          {message && (
            <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
              {message}
            </p>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? 'A guardar…' : 'Guardar preferências'}
          </button>
        </div>
      </main>
    </>
  );
}
