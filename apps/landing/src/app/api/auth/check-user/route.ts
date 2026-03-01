// =============================================================================
// api/auth/check-user — check if a phone number is already registered
// Uses admin client (service_role) to query auth.users
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: 'phone required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Paginate through users to find one matching this phone
    // For early-stage app this is fine; can add DB function later for scale
    let page = 1;
    const perPage = 100;
    let found = false;

    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        console.error('check-user listUsers error:', error);
        return NextResponse.json({ error: 'check failed' }, { status: 500 });
      }

      if (data.users.some((u) => u.phone === phone)) {
        found = true;
        break;
      }

      // No more pages
      if (data.users.length < perPage) break;
      page++;
    }

    return NextResponse.json({ exists: found });
  } catch (error) {
    console.error('check-user error:', error);
    return NextResponse.json({ error: 'check failed' }, { status: 500 });
  }
}
