import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Routes that require authentication
const protectedRoutes = [
  '/perfil',
  '/dashboard',
  '/conta/dossier',
  '/conta/recomendacoes',
  '/conta/favoritos',
];

// Routes that require admin role
const adminRoutes = ['/admin'];

export default auth((request) => {
  const { pathname, search } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  if ((isProtectedRoute || isAdminRoute) && !request.auth) {
    const loginUrl = new URL('/conta', request.url);
    loginUrl.searchParams.set('callbackUrl', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && request.auth?.user?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/perfil/:path*',
    '/dashboard/:path*',
    '/conta/dossier/:path*',
    '/conta/recomendacoes/:path*',
    '/conta/favoritos/:path*',
    '/admin/:path*',
  ],
};
