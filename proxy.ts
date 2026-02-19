import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

// Routes that require authentication (matched after stripping locale prefix)
const protectedPaths = ['/dashboard', '/applications', '/resume', '/settings'];

export default async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Strip locale prefix to get the path
  const pathnameWithoutLocale = pathname.replace(/^\/(en|ru)/, '') || '/';

  // Check if this path is protected
  const isProtected = protectedPaths.some((p) =>
    pathnameWithoutLocale.startsWith(p)
  );

  if (isProtected) {
    // Check for Better Auth session cookie
    const sessionCookie =
      req.cookies.get('better-auth.session_token') ||
      req.cookies.get('__Secure-better-auth.session_token');

    if (!sessionCookie) {
      const locale = pathname.match(/^\/(en|ru)/)?.[1] || 'en';
      return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
    }
  }

  // Run next-intl middleware (handles locale detection and redirects)
  return intlMiddleware(req);
}

export const config = {
  // Match all paths except: API routes, Next.js internals, static files
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
