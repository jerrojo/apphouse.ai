// =============================================================================
// i18n utilities — detects browser locale, provides translation helper
// =============================================================================

export { default as translations } from './translations';
export type { Locale } from './translations';

/** Detect locale from browser — returns 'es' or 'en' */
export function detectLocale(): 'es' | 'en' {
  if (typeof navigator === 'undefined') return 'en';
  const lang = navigator.language?.toLowerCase() || '';
  return lang.startsWith('es') ? 'es' : 'en';
}

/**
 * Translation helper — use with the translations object.
 * Example: t(translations.login.welcome, locale)
 */
export function t(entry: { es: string; en: string }, locale: 'es' | 'en'): string {
  return entry[locale] || entry.en;
}
