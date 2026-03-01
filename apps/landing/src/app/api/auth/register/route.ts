import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyVerificationToken } from '@/lib/verification-token';

export async function POST(request: Request) {
  try {
    const { phone, pin, verificationToken } = await request.json();

    // ── Validate inputs ──────────────────────────────────────────────
    if (!phone || !pin || !verificationToken) {
      return NextResponse.json(
        { error: 'phone, pin, and verificationToken are required' },
        { status: 400 }
      );
    }

    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: 'pin must be exactly 4 digits' }, { status: 400 });
    }

    // ── Verify the OTP token ─────────────────────────────────────────
    if (!verifyVerificationToken(verificationToken, phone)) {
      return NextResponse.json(
        { error: 'verification expired or invalid — please verify your phone again' },
        { status: 403 }
      );
    }

    // ── Create user via Supabase Admin ───────────────────────────────
    const admin = createAdminClient();

    const { data, error } = await admin.auth.admin.createUser({
      phone,
      password: pin,
      phone_confirm: true,
      user_metadata: { phone_verified: true },
    });

    if (error) {
      // If user already exists, return a helpful message
      if (error.message?.includes('already been registered') || error.message?.includes('duplicate')) {
        return NextResponse.json(
          { error: 'this phone number is already registered — try signing in' },
          { status: 409 }
        );
      }
      console.error('admin.createUser error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ created: true, userId: data.user.id });
  } catch (err) {
    console.error('register error:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
