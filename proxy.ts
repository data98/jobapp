import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

// Routes that require authentication (matched after stripping locale prefix)
const seekerProtectedPaths = ['/dashboard', '/applications', '/resume', '/settings'];
const employerProtectedPaths = ['/employer/dashboard', '/employer/jobs', '/employer/candidates',
                                '/employer/analytics', '/employer/settings'];

// Build locale regex from routing config
const localePattern = routing.locales.join('|');
const localeRegex = new RegExp(`^\\/(${localePattern})`);

export default async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Strip locale prefix to get the path
  const pathnameWithoutLocale = pathname.replace(localeRegex, '') || '/';
  const locale = pathname.match(localeRegex)?.[1] || 'en';

  const isSeekerProtected = seekerProtectedPaths.some((p) =>
    pathnameWithoutLocale.startsWith(p)
  );
  const isEmployerProtected = employerProtectedPaths.some((p) =>
    pathnameWithoutLocale.startsWith(p)
  );

  if (isSeekerProtected || isEmployerProtected) {
    // Check for Better Auth session cookie
    const sessionCookie =
      req.cookies.get('better-auth.session_token') ||
      req.cookies.get('__Secure-better-auth.session_token');

    if (!sessionCookie) {
      // Redirect to the appropriate login page
      const loginPath = isEmployerProtected ? '/employer/login' : '/login';
      return NextResponse.redirect(new URL(`/${locale}${loginPath}`, req.url));
    }
  }

  // Run next-intl middleware (handles locale detection and redirects)
  return intlMiddleware(req);
}

export const config = {
  // Match all paths except: API routes, Next.js internals, static files
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
