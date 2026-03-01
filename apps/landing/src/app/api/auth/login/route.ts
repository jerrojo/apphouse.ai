// =============================================================================
// api/auth/login — server-side sign in (sets cookies properly for SSR)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { phone, pin } = await req.json();

    if (!phone || !pin) {
      return NextResponse.json({ error: 'phone and pin required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      phone,
      password: pin,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({
      user: { id: data.user?.id, phone: data.user?.phone },
    });
  } catch (error) {
    console.error('login error:', error);
    return NextResponse.json({ error: 'login failed' }, { status: 500 });
  }
}
