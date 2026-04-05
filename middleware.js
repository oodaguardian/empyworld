import { NextResponse } from 'next/server';

export function middleware(request) {
  const host = request.headers.get('host') || '';
  if (host.startsWith('mvx.empy.my') && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/movies/upload', request.url));
  }
}

export const config = {
  matcher: '/',
};
