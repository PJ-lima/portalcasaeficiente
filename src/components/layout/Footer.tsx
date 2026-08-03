import Link from 'next/link';
import Image from 'next/image';
import siteLogo from '../../../assets/media/LogoSemFundo.png';
import { SITE_NAME } from '@/lib/seo';

export function Footer() {
  return (
    <footer className="bg-[#08281F] text-primary-200">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Logo e descrição */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src={siteLogo}
                alt=""
                width={64}
                height={64}
                className="h-10 w-10 rounded-md object-contain sm:h-12 sm:w-12"
              />
              <span className="font-display text-xl font-bold text-white">
                {SITE_NAME}
              </span>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-6 text-primary-300">
              O ponto de acesso aos apoios para tornar a tua casa mais
              confortável, eficiente e económica. Programas nacionais e
              municipais de eficiência energética em Portugal.
            </p>
          </div>

          {/* Links rápidos */}
          <div>
            <h3 className="font-display font-semibold text-white">Explorar</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/apoios" className="transition hover:text-white">
                  Ver apoios
                </Link>
              </li>
              <li>
                <Link href="/verificar" className="transition hover:text-white">
                  Verificar elegibilidade
                </Link>
              </li>
              <li>
                <Link href="/como-funciona" className="transition hover:text-white">
                  Como funciona
                </Link>
              </li>
              <li>
                <Link href="/sobre" className="transition hover:text-white">
                  Sobre nós
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal — os links para /termos, /privacidade e /contactos foram
              removidos porque nenhuma dessas rotas existe: eram três 404 em
              todas as páginas do site. Voltam assim que houver conteúdo real
              (a política de privacidade é obrigatória antes de produção, o site
              tem contas de utilizador). */}
        </div>

        {/* Disclaimer */}
        <div className="mt-12 border-t border-white/10 pt-8">
          <p className="text-center text-xs text-primary-300">
            Plataforma independente de informação e apoio ao cidadão. Não
            afiliada oficialmente ao Estado Português.
          </p>
          <p className="mt-2 text-center text-xs text-primary-400">
            © {new Date().getFullYear()} {SITE_NAME}. Todos os
            direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
