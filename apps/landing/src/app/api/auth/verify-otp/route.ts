import { NextResponse } from 'next/server';
import { verifyOtp } from '@/lib/twilio';
import { createVerificationToken } from '@/lib/verification-token';

export async function POST(request: Request) {
  try {
    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json({ error: 'phone and code are required' }, { status: 400 });
    }

    const result = await verifyOtp(phone, code);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'invalid code' }, { status: 400 });
    }

    // OTP verified — create a signed token so the register endpoint
    // can trust that this phone was actually verified.
    const token = createVerificationToken(phone);

    return NextResponse.json({ verified: true, token });
  } catch (err) {
    console.error('verify-otp error:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
