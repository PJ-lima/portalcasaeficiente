'use client';

import { FormEvent, Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function RedefinirPasswordContent() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setError('Link invalido. Peca um novo link de recuperacao.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As passwords nao coincidem.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Nao foi possivel redefinir a password.');
        return;
      }

      setSuccess(data.message || 'Password redefinida com sucesso.');
      setPassword('');
      setConfirmPassword('');
    } catch {
      setError('Erro ao redefinir password. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white shadow-lg rounded-2xl p-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Redefinir password</h1>
          <p className="text-sm text-gray-600 mb-6">
            Defina uma nova password para entrar novamente na sua conta.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Nova password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Minimo 8 caracteres"
                minLength={8}
                required
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar nova password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Repita a password"
                minLength={8}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !token}
              className="w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'A guardar...' : 'Guardar nova password'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">
              Nao recebeu o link?{' '}
              <Link href="/conta/recuperar-password" className="text-primary-600 hover:underline">
                Pedir novo link
              </Link>
            </p>
            <Link href="/conta" className="inline-block text-sm text-primary-600 hover:underline">
              Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function RedefinirPasswordPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <RedefinirPasswordContent />
    </Suspense>
  );
}
