// =============================================================================
// /_app/[slug] — serves published apps via subdomain rewrite
// middleware rewrites appname.apphouse.ai → /_app/appname
// =============================================================================

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string; path?: string[] }>;
}

export default async function AppPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  // Look up published app by slug
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: app } = await (supabase as any)
    .from('apps')
    .select('id, slug, name, published_status, published_url, vercel_deployment_id, icon_url, description')
    .eq('slug', slug)
    .single();

  if (!app || app.published_status !== 'published') {
    notFound();
  }

  // For now, render a branded container with the app info
  // Later: iframe to the app's Vercel deployment or serve build artifacts directly
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        {/* analytics injection point for data agent */}
        <div id="apphouse-analytics" data-app-id={app.id} data-slug={slug} />

        {app.vercel_deployment_id ? (
          // If deployed, serve via iframe (will be replaced by direct serving later)
          <iframe
            src={app.published_url || `https://${slug}-apphouse.vercel.app`}
            style={{
              width: '100vw',
              height: '100vh',
              border: 'none',
            }}
            title={app.name}
            allow="camera; microphone; geolocation; fullscreen"
          />
        ) : (
          // Placeholder: app is published but no deployment yet
          <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            background: '#fafafa',
            color: '#111',
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: '#111',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
            }}>
              <span style={{ fontSize: 28, color: '#fff', fontWeight: 700 }}>
                {app.icon_url || 'a.'}
              </span>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>{app.name}</h1>
            {app.description && (
              <p style={{ fontSize: 16, color: '#666', marginTop: 8, maxWidth: 400, textAlign: 'center' }}>
                {app.description}
              </p>
            )}
            <p style={{ fontSize: 14, color: '#999', marginTop: 24 }}>
              this app is being built by{' '}
              <a href="https://apphouse.ai" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                apphouse.ai
              </a>
            </p>
          </div>
        )}
      </body>
    </html>
  );
}
