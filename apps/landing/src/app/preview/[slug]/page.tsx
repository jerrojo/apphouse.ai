// =============================================================================
// /preview/[slug] — auth-gated preview for app owners
// =============================================================================

import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PreviewPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/preview/${slug}`);
  }

  // Look up app — owner only
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: app } = await (supabase as any)
    .from('apps')
    .select('id, slug, name, status, published_status, published_url, vercel_deployment_id, icon_url, description, created_by')
    .eq('slug', slug)
    .single();

  if (!app || app.created_by !== user.id) {
    notFound();
  }

  const isPublished = app.published_status === 'published';
  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    cooking: 'bg-yellow-100 text-yellow-700',
    live: 'bg-green-100 text-green-700',
    paused: 'bg-orange-100 text-orange-700',
    archived: 'bg-red-100 text-red-600',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* preview banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-400 text-yellow-900 px-4 py-2 flex items-center justify-between text-sm font-medium">
        <div className="flex items-center gap-3">
          <span className="bg-yellow-500 text-yellow-100 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
            preview
          </span>
          <span className="font-semibold">{app.name}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[app.status] || 'bg-gray-100 text-gray-600'}`}>
            {app.status}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isPublished && app.published_url && (
            <a
              href={app.published_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 transition-colors"
            >
              view live ↗
            </a>
          )}
          {!isPublished && app.status === 'live' && (
            <form action={`/api/publish`} method="POST">
              <input type="hidden" name="appId" value={app.id} />
              <button
                type="submit"
                className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
              >
                publish →
              </button>
            </form>
          )}
          <Link
            href="/"
            className="px-3 py-1 bg-yellow-500 text-yellow-900 rounded-md text-xs font-medium hover:bg-yellow-600 transition-colors"
          >
            ← back
          </Link>
        </div>
      </div>

      {/* app preview area */}
      <div className="pt-10">
        {app.vercel_deployment_id ? (
          <iframe
            src={app.published_url || `https://${slug}-apphouse.vercel.app`}
            className="w-full border-none"
            style={{ height: 'calc(100vh - 40px)' }}
            title={`Preview: ${app.name}`}
            allow="camera; microphone; geolocation; fullscreen"
          />
        ) : (
          // No deployment yet — show status card
          <div className="flex flex-col items-center justify-center" style={{ height: 'calc(100vh - 40px)' }}>
            <div className="max-w-md w-full p-8 bg-white rounded-2xl border border-gray-200 shadow-sm text-center">
              <div className="text-4xl mb-4">{app.icon_url || '🚀'}</div>
              <h2 className="text-xl font-bold text-gray-900">{app.name}</h2>
              {app.description && (
                <p className="mt-2 text-gray-500 text-sm">{app.description}</p>
              )}
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">status</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[app.status] || 'bg-gray-100'}`}>
                    {app.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">publish</span>
                  <span className="text-gray-400">
                    {isPublished ? `${slug}.apphouse.ai` : 'not published'}
                  </span>
                </div>
              </div>
              {app.status === 'draft' && (
                <p className="mt-6 text-xs text-gray-400">
                  your app pipeline hasn&apos;t started yet. preview will be available once the agents begin cooking.
                </p>
              )}
              {app.status === 'cooking' && (
                <p className="mt-6 text-xs text-gray-400">
                  agents are working on your app. preview will update as they complete.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
