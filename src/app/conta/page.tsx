'use client';

import { useState, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import siteLogo from '../../../assets/media/LogoSemFundo.png';
import { SITE_NAME } from '@/lib/seo';

function ContaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/perfil';
  
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    nif: '',
  });

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: loginData.email,
        password: loginData.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email ou password incorretos');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (registerData.password !== registerData.confirmPassword) {
      setError('As passwords não coincidem');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerData.name,
          email: registerData.email,
          password: registerData.password,
          nif: registerData.nif || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao criar conta');
        return;
      }

      setSuccess('Conta criada com sucesso! Pode fazer login.');
      setIsLogin(true);
      setLoginData({ email: registerData.email, password: '' });
      setRegisterData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        nif: '',
      });
    } catch {
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              src={siteLogo}
              alt={SITE_NAME}
              width={56}
              height={56}
              className="rounded-lg object-cover w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14"
            />
            <span className="text-xl font-bold text-ink">{SITE_NAME}</span>
          </Link>
        </div>

        {/* Card */}
        <div className="border border-border bg-card shadow-card rounded-2xl p-8">
          {/* Tabs */}
          <div className="flex border-b border-border mb-6">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                isLogin
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-muted-foreground hover:text-ink'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                !isLogin
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-muted-foreground hover:text-ink'
              }`}
            >
              Criar Conta
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-success-50 border border-success-200 rounded-lg text-success-700 text-sm">
              {success}
            </div>
          )}

          {/* Login Form */}
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-ink mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-input bg-card rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="seu@email.pt"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-ink mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-input bg-card rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="text-right">
                <Link href="/conta/recuperar-password" className="text-sm text-primary-600 hover:underline">
                  Esqueceu-se da password?
                </Link>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary-800 focus:ring-4 focus:ring-primary-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'A entrar...' : 'Entrar'}
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-ink mb-1">
                  Nome completo
                </label>
                <input
                  type="text"
                  id="name"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-input bg-card rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="O seu nome"
                  required
                />
              </div>
              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-ink mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="reg-email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-input bg-card rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="seu@email.pt"
                  required
                />
              </div>
              <div>
                <label htmlFor="nif" className="block text-sm font-medium text-ink mb-1">
                  NIF <span className="text-muted-foreground">(opcional)</span>
                </label>
                <input
                  type="text"
                  id="nif"
                  value={registerData.nif}
                  onChange={(e) => setRegisterData({ ...registerData, nif: e.target.value })}
                  className="w-full px-4 py-2 border border-input bg-card rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="123456789"
                  maxLength={9}
                  pattern="[0-9]{9}"
                />
              </div>
              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-ink mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="reg-password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-input bg-card rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                  required
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-ink mb-1">
                  Confirmar Password
                </label>
                <input
                  type="password"
                  id="confirm-password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-input bg-card rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Repita a password"
                  minLength={8}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary-800 focus:ring-4 focus:ring-primary-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'A criar conta...' : 'Criar Conta'}
              </button>
            </form>
          )}

          {/* Terms */}
          {!isLogin && (
            <p className="mt-4 text-xs text-muted-foreground text-center">
              Ao criar conta, aceita os{' '}
              <Link href="/termos" className="text-primary-600 hover:underline">
                Termos de Serviço
              </Link>{' '}
              e a{' '}
              <Link href="/privacidade" className="text-primary-600 hover:underline">
                Política de Privacidade
              </Link>
              .
            </p>
          )}
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary-600">
            ← Voltar à página inicial
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function ContaPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ContaContent />
    </Suspense>
  );
}
