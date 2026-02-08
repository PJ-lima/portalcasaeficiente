import Link from 'next/link';
import Image from 'next/image';
import siteLogo from '../../../assets/media/LogoSemFundo.png';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Logo e descrição */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src={siteLogo}
                alt="Casa Eficiente"
                width={64}
                height={64}
                className="rounded-md object-cover w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16"
              />
              <span className="text-xl font-bold text-white">Portal Casa Eficiente</span>
            </Link>
            <p className="mt-4 text-sm text-gray-400 max-w-md">
              O ponto de acesso aos apoios para tornar a tua casa mais confortável, 
              eficiente e económica. Descobre programas nacionais e municipais de 
              eficiência energética em Portugal.
            </p>
          </div>

          {/* Links rápidos */}
          <div>
            <h3 className="font-semibold text-white">Explorar</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/apoios" className="hover:text-white transition">
                  Ver Apoios
                </Link>
              </li>
              <li>
                <Link href="/verificar" className="hover:text-white transition">
                  Verificar Elegibilidade
                </Link>
              </li>
              <li>
                <Link href="/como-funciona" className="hover:text-white transition">
                  Como Funciona
                </Link>
              </li>
              <li>
                <Link href="/sobre" className="hover:text-white transition">
                  Sobre Nós
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-white">Legal</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/termos" className="hover:text-white transition">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="hover:text-white transition">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="/contactos" className="hover:text-white transition">
                  Contactos
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <p className="text-xs text-gray-500 text-center">
            Plataforma independente de informação e apoio ao cidadão. 
            Não afiliada oficialmente ao Estado Português.
          </p>
          <p className="mt-2 text-xs text-gray-600 text-center">
            © {new Date().getFullYear()} Portal Casa Eficiente. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
