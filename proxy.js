import { NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

export async function proxy(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const valid = await verifySessionToken(token);

  const isApi = pathname.startsWith('/api/admin');
  const isLoginRoute = pathname === '/admin/login' || pathname === '/api/admin/login';

  if (isLoginRoute) {
    return NextResponse.next();
  }

  if (!valid) {
    if (isApi) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
