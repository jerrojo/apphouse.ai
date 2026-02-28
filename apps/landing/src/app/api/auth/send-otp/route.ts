import { NextResponse } from 'next/server';
import { sendOtp } from '@/lib/twilio';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ error: 'phone is required' }, { status: 400 });
    }

    // Basic E.164 validation
    if (!/^\+[1-9]\d{6,14}$/.test(phone)) {
      return NextResponse.json(
        { error: 'invalid phone format — use E.164 (e.g. +521234567890)' },
        { status: 400 }
      );
    }

    const result = await sendOtp(phone);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error('send-otp error:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
