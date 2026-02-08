'use client';

import { FormEvent, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import siteLogo from '../../../../assets/media/LogoSemFundo.png';

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Nao foi possivel processar o pedido.');
        return;
      }

      setSuccess(
        data.message ||
          'Se o email existir, enviamos instrucoes para recuperar a password.'
      );
      setEmail('');
    } catch {
      setError('Erro ao enviar pedido. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              src={siteLogo}
              alt="Casa Eficiente"
              width={56}
              height={56}
              className="rounded-lg object-cover w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14"
            />
            <span className="text-xl font-bold text-gray-900">Casa Eficiente</span>
          </Link>
        </div>

        <div className="bg-white shadow-lg rounded-2xl p-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Recuperar password</h1>
          <p className="text-sm text-gray-600 mb-6">
            Introduza o seu email para receber o link de redefinicao.
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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="seu@email.pt"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'A enviar...' : 'Enviar link de recuperacao'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/conta" className="text-sm text-primary-600 hover:underline">
              Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
