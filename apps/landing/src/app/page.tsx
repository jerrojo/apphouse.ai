import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If logged in, fetch their apps
  let apps: { slug: string; name: string; status: string; icon_url: string | null; description: string | null }[] = [];
  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('apps')
      .select('slug, name, status, icon_url, description')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });
    apps = data || [];
  }

  return (
    <main className="min-h-screen bg-white">
      {/* nav */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight text-gray-900">
            apphouse<span className="text-blue-600">.ai</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/new"
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <span className="text-lg leading-none">+</span>
              new app
            </Link>
            {user ? (
              <form action="/auth/signout" method="POST">
                <button
                  type="submit"
                  className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold hover:bg-blue-700 transition-colors"
                  aria-label="profile menu"
                  title={user.email || 'Account'}
                >
                  {(user.email || '?')[0].toUpperCase()}
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                aria-label="sign in"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* hero */}
      <section className="flex flex-col items-center justify-center min-h-screen px-6 text-center pt-16">
        <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-8">
          <span className="text-2xl font-bold text-white">a.</span>
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl">
          describe it.<br />
          <span className="text-gray-300">we build it.</span>
        </h1>
        <p className="mt-6 text-lg text-gray-500 max-w-xl">
          ai-powered app factory. tell us what you need, our 9 agents design, build, and deploy your app to web, ios, and android.
        </p>
        <div className="mt-10 flex gap-4">
          <Link
            href={user ? '/new' : '/login'}
            className="px-8 py-3.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            create your first app
          </Link>
          <a
            href="#how"
            className="px-8 py-3.5 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            how it works
          </a>
        </div>
      </section>

      {/* how it works */}
      <section id="how" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">
            from idea to app store in minutes
          </h2>
          <div className="space-y-12">
            {[
              { step: '01', title: 'describe', text: 'tell us what you want in plain words. our ai asks smart questions until it fully understands your vision.' },
              { step: '02', title: 'cooking', text: '9 specialized agents work in sequence: ux → wireframes → ui → dev → data → ai → sales → cfo → pm.' },
              { step: '03', title: 'refine', text: 'navigate your live app and speak your edits. the ai watches and listens, then updates in real-time.' },
              { step: '04', title: 'publish', text: 'one click to submit to the app store and play store. your app goes live on web instantly.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <span className="text-sm font-mono text-gray-300 pt-1 shrink-0">{item.step}</span>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-gray-500 leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* app gallery — only shows when logged in and has apps */}
      {user && (
        <section id="apps" className="py-24 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-bold text-gray-900">your apps</h2>
              <Link
                href="/new"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors flex items-center gap-2"
              >
                <span className="text-lg leading-none">+</span>
                new app
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {apps.map((app) => (
                <div
                  key={app.slug}
                  className="group p-6 bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="text-3xl mb-4">{app.icon_url || '🚀'}</div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {app.name}
                  </h3>
                  <p className="mt-1 text-gray-500 text-sm">{app.description || 'no description yet'}</p>
                  <div className="mt-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {app.status}
                    </span>
                  </div>
                </div>
              ))}
              {/* empty state: create new */}
              <Link
                href="/new"
                className="p-6 rounded-2xl border-2 border-dashed border-gray-200 hover:border-gray-400 transition-colors flex flex-col items-center justify-center min-h-[200px] group"
              >
                <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors flex items-center justify-center mb-3">
                  <span className="text-2xl text-gray-400 group-hover:text-gray-600">+</span>
                </div>
                <span className="text-sm text-gray-400 group-hover:text-gray-600 font-medium">create new app</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* agents */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">9 agents. one pipeline.</h2>
          <p className="text-gray-500 mb-12">each agent is a specialist. together they build complete apps.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: 'ux', emoji: '🔬', color: 'bg-purple-50 text-purple-700' },
              { name: 'wireframes', emoji: '📐', color: 'bg-blue-50 text-blue-700' },
              { name: 'ui', emoji: '🎨', color: 'bg-pink-50 text-pink-700' },
              { name: 'dev', emoji: '⚡', color: 'bg-yellow-50 text-yellow-700' },
              { name: 'data', emoji: '📊', color: 'bg-green-50 text-green-700' },
              { name: 'ai', emoji: '🧠', color: 'bg-cyan-50 text-cyan-700' },
              { name: 'sales', emoji: '📈', color: 'bg-orange-50 text-orange-700' },
              { name: 'cfo', emoji: '💰', color: 'bg-emerald-50 text-emerald-700' },
              { name: 'pm', emoji: '✅', color: 'bg-indigo-50 text-indigo-700' },
            ].map((agent) => (
              <div key={agent.name} className={`p-4 rounded-xl ${agent.color}`}>
                <span className="text-2xl">{agent.emoji}</span>
                <p className="mt-2 text-sm font-semibold">{agent.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="py-12 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} apphouse.ai</p>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-gray-600 transition-colors">about</a>
            <a href="#" className="hover:text-gray-600 transition-colors">docs</a>
            <a href="#" className="hover:text-gray-600 transition-colors">github</a>
          </div>
        </div>
      </footer>

      {/* feedback bubble */}
      <button className="fixed bottom-6 right-6 w-12 h-12 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-110 active:scale-95 flex items-center justify-center z-50" aria-label="send feedback">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    </main>
  );
}
