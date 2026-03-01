// =============================================================================
// api/auth/login — server-side sign in (sets cookies properly for SSR)
// Uses explicit cookie handling on the response object
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(req: NextRequest) {
  try {
    const { phone, pin } = await req.json();

    if (!phone || !pin) {
      return NextResponse.json({ error: 'phone and pin required' }, { status: 400 });
    }

    // Build response object first so we can attach cookies to it
    let response = NextResponse.json({ user: null });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Set on request for downstream reads
              req.cookies.set(name, value);
              // Set on response so browser receives them
              response.cookies.set(name, value, options as any);
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      phone,
      password: pin,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Rebuild response with user data, keeping the cookies that were set
    const successBody = JSON.stringify({
      user: { id: data.user?.id, phone: data.user?.phone },
    });
    const successResponse = new NextResponse(successBody, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    // Copy all cookies from the original response to the success response
    response.cookies.getAll().forEach((cookie) => {
      successResponse.cookies.set(cookie.name, cookie.value, cookie as any);
    });

    return successResponse;
  } catch (error) {
    console.error('login error:', error);
    return NextResponse.json({ error: 'login failed' }, { status: 500 });
  }
}
