// =============================================================================
// /preview/[slug] — auth-gated preview for app owners
// Server component fetches data, delegates to PreviewClient for interactivity
// =============================================================================

import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import PreviewClient from './PreviewClient';

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

  return (
    <PreviewClient
      app={{
        id: app.id,
        slug: app.slug,
        name: app.name,
        status: app.status,
        published_status: app.published_status,
        published_url: app.published_url,
        vercel_deployment_id: app.vercel_deployment_id,
        icon_url: app.icon_url,
        description: app.description,
      }}
    />
  );
}
