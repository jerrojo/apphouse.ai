// =============================================================================
// api/publish/route.ts — publish app to appname.apphouse.ai
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/publish — publish an app (set subdomain live)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { appId } = await req.json();
    if (!appId) {
      return NextResponse.json({ error: 'appId required' }, { status: 400 });
    }

    // Verify ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: app } = await (supabase as any)
      .from('apps')
      .select('id, slug, name, status, published_status, created_by')
      .eq('id', appId)
      .single();

    if (!app || app.created_by !== user.id) {
      return NextResponse.json({ error: 'app not found' }, { status: 404 });
    }

    // App must have completed pipeline (status = 'live' or 'cooking' at minimum)
    if (app.status === 'draft') {
      return NextResponse.json({
        error: 'app pipeline has not started yet — create the app first',
      }, { status: 400 });
    }

    // Already published?
    if (app.published_status === 'published') {
      return NextResponse.json({
        appId: app.id,
        slug: app.slug,
        url: `https://${app.slug}.apphouse.ai`,
        status: 'already_published',
        message: `already live at ${app.slug}.apphouse.ai`,
      });
    }

    const publishedUrl = `https://${app.slug}.apphouse.ai`;

    // Update app as published
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('apps')
      .update({
        published_status: 'published',
        published_url: publishedUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', appId);

    if (updateError) throw updateError;

    // Create publish request record for tracking
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('publish_requests')
      .insert({
        app_id: appId,
        requested_by: user.id,
        platform: 'web',
        status: 'published',
        store_url: publishedUrl,
      });

    return NextResponse.json({
      appId: app.id,
      slug: app.slug,
      url: publishedUrl,
      status: 'published',
      message: `your app is now live at ${app.slug}.apphouse.ai`,
    });
  } catch (error) {
    console.error('publish error:', error);
    return NextResponse.json({ error: 'publish failed' }, { status: 500 });
  }
}

// GET /api/publish?appId=xxx — check publish status
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const appId = req.nextUrl.searchParams.get('appId');
    if (!appId) {
      return NextResponse.json({ error: 'appId required' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: app } = await (supabase as any)
      .from('apps')
      .select('id, slug, name, status, published_status, published_url, vercel_deployment_id')
      .eq('id', appId)
      .eq('created_by', user.id)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'app not found' }, { status: 404 });
    }

    // Check publish requests for all platforms
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: requests } = await (supabase as any)
      .from('publish_requests')
      .select('platform, status, store_url, created_at')
      .eq('app_id', appId)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      appId: app.id,
      slug: app.slug,
      publishedStatus: app.published_status,
      publishedUrl: app.published_url,
      platforms: {
        web: {
          status: app.published_status === 'published' ? 'published' : 'not_published',
          url: app.published_url,
        },
        ios: {
          status: requests?.find((r: { platform: string }) => r.platform === 'ios')?.status || 'not_submitted',
        },
        android: {
          status: requests?.find((r: { platform: string }) => r.platform === 'android')?.status || 'not_submitted',
        },
      },
    });
  } catch (error) {
    console.error('publish status error:', error);
    return NextResponse.json({ error: 'failed to get status' }, { status: 500 });
  }
}
