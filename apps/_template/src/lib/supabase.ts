import { createBrowserClient } from '@supabase/ssr';

const appId = process.env.NEXT_PUBLIC_APP_ID!;

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          'x-app-id': appId,
        },
      },
    }
  );
}
