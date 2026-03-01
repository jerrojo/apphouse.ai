// =============================================================================
// Server-side locale detection via Accept-Language header
// =============================================================================

import { headers } from 'next/headers';
import type { Locale } from './translations';

export async function getServerLocale(): Promise<Locale> {
  const headersList = await headers();
  const acceptLang = headersList.get('accept-language') || '';
  // Check if any Spanish variant appears before English
  const langs = acceptLang.split(',').map((l) => l.split(';')[0].trim().toLowerCase());
  for (const lang of langs) {
    if (lang.startsWith('es')) return 'es';
    if (lang.startsWith('en')) return 'en';
  }
  return 'en';
}
