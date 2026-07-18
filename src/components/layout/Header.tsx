'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, User, FileText, Heart, LogOut } from 'lucide-react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import siteLogo from '../../../assets/media/LogoTransparent.png';

const navLinks = [
  { href: '/apoios', label: 'Apoios' },
  { href: '/verificar', label: 'Verificar elegibilidade' },
  { href: '/como-funciona', label: 'Como funciona' },
  { href: '/sobre', label: 'Sobre' },
];

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="container">
        <div className="flex site-header items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <Image
              src={siteLogo}
              alt=""
              width={96}
              height={96}
              className="site-logo"
            />
            <span className="hidden font-display text-lg font-bold leading-tight text-ink lg:block">
              Casa Eficiente
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? 'page' : undefined}
                className={`site-nav-link ${pathname === link.href ? 'bg-primary-50 text-primary' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth section */}
          <div className="flex items-center gap-2">
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="site-auth-btn gap-2"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    Olá, {session.user.name?.split(' ')[0] || 'Utilizador'}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-border bg-card py-1 shadow-card-hover">
                    <Link
                      href="/perfil"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-ink hover:bg-primary-50"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="h-4 w-4" />
                      Perfil
                    </Link>
                    <Link
                      href="/conta/recomendacoes"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-ink hover:bg-primary-50"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <FileText className="h-4 w-4" />
                      Recomendações
                    </Link>
                    <Link
                      href="/conta/favoritos"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-ink hover:bg-primary-50"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Heart className="h-4 w-4" />
                      Favoritos
                    </Link>
                    <hr className="my-1 border-border" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/conta" className="hidden sm:inline-flex site-auth-btn">
                  Entrar
                </Link>
                <Link
                  href="/verificar"
                  className="hidden rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-800 md:inline-flex"
                >
                  Ver se sou elegível
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              className="site-menu-btn"
              aria-label={showMobileMenu ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={showMobileMenu}
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {showMobileMenu && (
        <nav className="border-t border-border bg-background md:hidden">
          <div className="container flex flex-col gap-1 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? 'page' : undefined}
                className={`rounded-lg px-3 py-2.5 text-base font-medium transition ${
                  pathname === link.href
                    ? 'bg-primary-50 text-primary'
                    : 'text-ink hover:bg-muted'
                }`}
                onClick={() => setShowMobileMenu(false)}
              >
                {link.label}
              </Link>
            ))}
            {!session && (
              <Link
                href="/conta"
                className="rounded-lg px-3 py-2.5 text-base font-medium text-ink transition hover:bg-muted"
                onClick={() => setShowMobileMenu(false)}
              >
                Entrar
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
