// =============================================================================
// HMAC-based verification token — proves a phone was verified via OTP
// Used to link OTP verification to the PIN registration step securely.
// =============================================================================

import { createHmac } from 'crypto';

const SECRET = process.env.OTP_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'change-me';

/** Create a signed token after OTP verification (valid for 10 minutes) */
export function createVerificationToken(phone: string): string {
  const ts = Date.now().toString();
  const hmac = createHmac('sha256', SECRET)
    .update(`${phone}:${ts}`)
    .digest('hex');
  return Buffer.from(`${phone}:${ts}:${hmac}`).toString('base64url');
}

/** Verify a token is valid and matches the phone */
export function verifyVerificationToken(
  token: string,
  phone: string,
  maxAgeMs = 10 * 60 * 1000
): boolean {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const parts = decoded.split(':');
    if (parts.length < 3) return false;

    const hmac = parts.pop()!;
    const ts = parts.pop()!;
    const tokenPhone = parts.join(':'); // phone might contain ':'? unlikely with E.164

    if (tokenPhone !== phone) return false;
    if (Date.now() - parseInt(ts) > maxAgeMs) return false;

    const expected = createHmac('sha256', SECRET)
      .update(`${tokenPhone}:${ts}`)
      .digest('hex');

    return hmac === expected;
  } catch {
    return false;
  }
}
