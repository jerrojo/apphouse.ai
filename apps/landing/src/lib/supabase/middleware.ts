// =============================================================================
// Supabase middleware helper — refreshes auth tokens on every request
// + subdomain detection for published apps (appname.apphouse.ai)
// =============================================================================

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  // ── Subdomain detection ──────────────────────────────────────────
  // If request is for appname.apphouse.ai, rewrite to /_app/appname
  const host = request.headers.get('host') || '';
  const subdomainMatch = host.match(/^([a-z0-9-]+)\.apphouse\.ai$/);

  if (subdomainMatch && subdomainMatch[1] !== 'www') {
    const slug = subdomainMatch[1];
    const url = request.nextUrl.clone();
    url.pathname = `/_app/${slug}${request.nextUrl.pathname}`;
    return NextResponse.rewrite(url);
  }

  // ── Standard auth middleware ──────────────────────────────────────
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as any)
          );
        },
      },
    }
  );

  // Refresh session — IMPORTANT: don't remove this
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes: redirect to /login if not authenticated
  const protectedPaths = ['/new', '/dashboard', '/app', '/preview'];
  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // If logged in and visiting /login, redirect to home
  if (request.nextUrl.pathname === '/login' && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
