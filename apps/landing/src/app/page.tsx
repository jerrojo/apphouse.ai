import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { getServerLocale } from '@/lib/i18n/server';
import translations from '@/lib/i18n/translations';
import { t } from '@/lib/i18n';
import ReactiveOrbs from './ReactiveOrbs';

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
    <main className={hasApps ? 'bg-white' : 'bg-white h-screen overflow-hidden'}>
      {/* reactive animated background */}
      <ReactiveOrbs />

      {/* nav — floating over canvas */}
      <nav className="fixed top-0 w-full z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight text-gray-900">
            apphouse<span className="text-blue-600">.ai</span>
          </Link>
          <div className="flex items-center gap-4">
            {user && (
              <Link
                href="/new"
                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <span className="text-lg leading-none">+</span>
                {t(H.newApp, locale)}
              </Link>
            )}
            {user ? (
              <form action="/auth/signout" method="POST">
                <button
                  type="submit"
                  className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold hover:bg-blue-700 transition-colors"
                  aria-label="profile menu"
                  title={user.phone || user.email || 'Account'}
                >
                  {(user.phone || user.email || '?').slice(-2)}
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg transition-colors"
              >
                {t(H.signIn, locale)}
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* hero — always exactly one screen */}
      <section className="relative z-10 flex flex-col items-center justify-center h-screen px-6 text-center">
        <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-8 shadow-2xl">
          <span className="text-2xl font-bold text-white">a.</span>
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl">
          {t(H.heroTitle1, locale)}<br />
          <span className="text-gray-300">{t(H.heroTitle2, locale)}</span>
        </h1>
        <p className="mt-6 text-lg text-gray-500 max-w-xl">
          {t(H.heroSubtitle, locale)}
        </p>
        <div className="mt-10 flex gap-4">
          {user ? (
            <Link
              href="/new"
              className="px-8 py-3.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              {t(H.ctaCreate, locale)}
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-8 py-3.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              {t(H.ctaLogin, locale)}
            </Link>
          )}
        </div>

        {/* scroll hint — only when user has apps */}
        {hasApps && (
          <a href="#apps" className="absolute bottom-8 animate-bounce text-gray-300 hover:text-gray-500 transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
            </svg>
          </a>
        )}
      </section>

      {/* app gallery — only renders when logged in AND has apps (enables scroll) */}
      {hasApps && (
        <section id="apps" className="relative z-10 py-24 px-6 bg-gray-50/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-bold text-gray-900">{t(H.yourApps, locale)}</h2>
              <Link
                href="/new"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors flex items-center gap-2"
              >
                <span className="text-lg leading-none">+</span>
                {t(H.newApp, locale)}
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {apps.map((app) => (
                <div
                  key={app.slug}
                  className="group p-6 bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all"
                >
                  <div className="text-3xl mb-4">{app.icon_url || '🚀'}</div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {app.name}
                  </h3>
                  <p className="mt-1 text-gray-500 text-sm">{app.description || t(H.noDescription, locale)}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {app.status}
                    </span>
                    {app.published_status === 'published' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        {t(H.published, locale)}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Link
                      href={`/preview/${app.slug}`}
                      className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      {t(H.preview, locale)}
                    </Link>
                    {app.published_status === 'published' && app.published_url ? (
                      <a
                        href={app.published_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        {t(H.viewLive, locale)} ↗
                      </a>
                    ) : app.status !== 'draft' ? (
                      <span className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg cursor-default">
                        {t(H.publish, locale)}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
              {/* new app card */}
              <Link
                href="/new"
                className="p-6 rounded-2xl border-2 border-dashed border-gray-200 hover:border-gray-400 transition-colors flex flex-col items-center justify-center min-h-[200px] group"
              >
                <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors flex items-center justify-center mb-3">
                  <span className="text-2xl text-gray-400 group-hover:text-gray-600">+</span>
                </div>
                <span className="text-sm text-gray-400 group-hover:text-gray-600 font-medium">{t(H.createNew, locale)}</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* minimal footer — only shows when scrollable */}
      {hasApps && (
        <footer className="relative z-10 py-8 px-6 border-t border-gray-100 bg-white">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <p className="text-gray-400 text-sm">© {new Date().getFullYear()} apphouse.ai</p>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-gray-600 transition-colors">{t(H.about, locale)}</a>
              <a href="#" className="hover:text-gray-600 transition-colors">{t(H.docs, locale)}</a>
            </div>
          </div>
        </footer>
      )}
    </main>
  );
}
