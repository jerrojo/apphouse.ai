// =============================================================================
// api/publish/route.ts — submit app to stores
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';

// POST /api/publish — submit to app store / play store / web
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { appId, platform } = body;

    if (!appId || !platform) {
      return NextResponse.json({ error: 'appId and platform required' }, { status: 400 });
    }

    if (!['ios', 'android', 'web'].includes(platform)) {
      return NextResponse.json({ error: 'platform must be ios, android, or web' }, { status: 400 });
    }

    // TODO: authenticate user
    // TODO: create publish_requests row
    // TODO: for web: trigger vercel deploy
    // TODO: for ios: trigger eas build --platform ios + app store connect submit
    // TODO: for android: trigger eas build --platform android + play console upload

    return NextResponse.json({
      publishId: 'placeholder-publish-id',
      platform,
      status: 'pending',
      message: `submitting to ${platform}...`,
    });
  } catch (error) {
    return NextResponse.json({ error: 'publish failed' }, { status: 500 });
  }
}

// GET /api/publish?appId=xxx — check publish status for all platforms
export async function GET(req: NextRequest) {
  const appId = req.nextUrl.searchParams.get('appId');

  if (!appId) {
    return NextResponse.json({ error: 'appId required' }, { status: 400 });
  }

  // TODO: fetch publish_requests from supabase

  return NextResponse.json({
    appId,
    platforms: {
      web: { status: 'not_submitted' },
      ios: { status: 'not_submitted' },
      android: { status: 'not_submitted' },
    },
  });
}
