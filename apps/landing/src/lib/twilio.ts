// =============================================================================
// Twilio Verify helpers — sends and verifies OTP codes via SMS
// =============================================================================

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
const TWILIO_VERIFY_SID = process.env.TWILIO_VERIFY_SERVICE_SID!;

function authHeader() {
  return `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`;
}

/** Send an OTP code to a phone number via SMS */
export async function sendOtp(phone: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(
    `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SID}/Verifications`,
    {
      method: 'POST',
      headers: {
        Authorization: authHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: phone, Channel: 'sms' }),
    }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { success: false, error: body.message || 'failed to send code' };
  }

  return { success: true };
}

/** Verify an OTP code for a phone number */
export async function verifyOtp(
  phone: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(
    `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SID}/VerificationCheck`,
    {
      method: 'POST',
      headers: {
        Authorization: authHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: phone, Code: code }),
    }
  );

  const body = await res.json().catch(() => ({} as Record<string, unknown>));

  if (!res.ok || body.status !== 'approved') {
    return { success: false, error: body.message || 'invalid code' };
  }

  return { success: true };
}
