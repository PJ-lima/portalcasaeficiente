'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu, User, FileText, Heart, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import siteLogo from '../../../assets/media/LogoTransparent.png';

export function Header() {
  const { data: session } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b">
      <div className="container">
        <div className="flex site-header items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src={siteLogo}
              alt="Portal Casa Eficiente logo"
              width={96}
              height={96}
              className="site-logo"
            />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/apoios" className="site-nav-link">Apoios</Link>
            <Link href="/verificar" className="site-nav-link">Verificar Elegibilidade</Link>
            <Link href="/como-funciona" className="site-nav-link">Como Funciona</Link>
            <Link href="/sobre" className="site-nav-link">Sobre</Link>
          </nav>

          {/* Auth section */}
          <div className="flex items-center gap-3">
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm font-medium">
                    Olá, {session.user.name?.split(' ')[0] || 'Utilizador'}
                  </span>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                    <Link
                      href="/perfil"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="h-4 w-4" />
                      Perfil
                    </Link>
                    <Link
                      href="/conta/recomendacoes"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <FileText className="h-4 w-4" />
                      Recomendações
                    </Link>
                    <Link
                      href="/conta/favoritos"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Heart className="h-4 w-4" />
                      Favoritos
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/conta" className="hidden sm:inline-flex site-auth-btn">Entrar</Link>
            )}
            
            {/* Mobile menu button */}
            <button type="button" className="site-menu-btn" aria-label="Menu">
              <Menu className="h-8 w-8" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
