import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { getServerLocale } from '@/lib/i18n/server';
import translations from '@/lib/i18n/translations';
import { t } from '@/lib/i18n';
import GradientBg from './GradientBg';
import ProfileMenu from './ProfileMenu';
import AppIcon from './AppIcon';

const H = translations.home;

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const locale = await getServerLocale();

  // If logged in, fetch their apps
  let apps: { slug: string; name: string; status: string; published_status: string | null; published_url: string | null; icon_url: string | null; description: string | null }[] = [];
  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('apps')
      .select('slug, name, status, published_status, published_url, icon_url, description')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });
    apps = data || [];
  }

  const hasApps = user && apps.length > 0;

  return (
    <main className="bg-[#0a0a0f] min-h-screen overflow-x-hidden">
      {/* Flowing gradient background */}
      <GradientBg />

      {/* Nav — logo center, login/profile right */}
      <nav className="fixed top-0 w-full z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-center relative">
          {/* Logo — top center */}
          <Link href="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white/90 hover:text-white transition-colors">
            <AppIcon size={28} />
            apphouse
          </Link>

          {/* Right side — login or profile */}
          <div className="absolute right-6 flex items-center gap-3">
            {user && (
              <Link
                href="/new"
                className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white/80 text-sm font-medium rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2 border border-white/10"
              >
                <span className="text-lg leading-none">+</span>
                {t(H.newApp, locale)}
              </Link>
            )}
            {user ? (
              <ProfileMenu
                phone={user.phone || user.email || '??'}
                locale={locale}
              />
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white rounded-lg transition-colors"
              >
                {t(H.signIn, locale)}
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero — just the bouncing Start button */}
      <section className="relative z-10 flex flex-col items-center justify-end h-screen pb-32">
        {/* Bouncing Start / Create button at bottom center */}
        <Link
          href={user ? '/new' : '/login'}
          className="group relative animate-bounce"
        >
          <span className="absolute inset-0 rounded-full bg-white/20 blur-xl group-hover:bg-white/30 transition-all scale-150" />
          <span className="relative px-10 py-4 bg-white text-gray-900 rounded-full text-lg font-semibold hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-white/20 flex items-center gap-2">
            start
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-1 transition-transform" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </Link>

        {/* Scroll hint if user has apps */}
        {hasApps && (
          <a href="#apps" className="absolute bottom-8 animate-bounce text-white/30 hover:text-white/50 transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
            </svg>
          </a>
        )}
      </section>

      {/* App gallery — only when logged in with apps */}
      {hasApps && (
        <section id="apps" className="relative z-10 py-24 px-6 bg-black/40 backdrop-blur-md border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-bold text-white">{t(H.yourApps, locale)}</h2>
              <Link
                href="/new"
                className="px-4 py-2 text-sm font-medium text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
              >
                <span className="text-lg leading-none">+</span>
                {t(H.newApp, locale)}
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {apps.map((app) => (
                <div
                  key={app.slug}
                  className="group p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all backdrop-blur-sm"
                >
                  <div className="text-3xl mb-4">{app.icon_url || '🚀'}</div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {app.name}
                  </h3>
                  <p className="mt-1 text-white/40 text-sm">{app.description || t(H.noDescription, locale)}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/60">
                      {app.status}
                    </span>
                    {app.published_status === 'published' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                        {t(H.published, locale)}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Link
                      href={`/preview/${app.slug}`}
                      className="px-3 py-1.5 text-xs font-medium text-white/60 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      {t(H.preview, locale)}
                    </Link>
                    {app.published_status === 'published' && app.published_url ? (
                      <a
                        href={app.published_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-medium text-green-400 bg-green-500/10 rounded-lg hover:bg-green-500/20 transition-colors"
                      >
                        {t(H.viewLive, locale)} ↗
                      </a>
                    ) : app.status !== 'draft' ? (
                      <span className="px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 rounded-lg cursor-default">
                        {t(H.publish, locale)}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
              {/* New app card */}
              <Link
                href="/new"
                className="p-6 rounded-2xl border-2 border-dashed border-white/10 hover:border-white/30 transition-colors flex flex-col items-center justify-center min-h-[200px] group"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors flex items-center justify-center mb-3">
                  <span className="text-2xl text-white/30 group-hover:text-white/60">+</span>
                </div>
                <span className="text-sm text-white/30 group-hover:text-white/60 font-medium">{t(H.createNew, locale)}</span>
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
