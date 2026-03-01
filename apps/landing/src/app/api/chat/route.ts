// =============================================================================
// /api/chat — PM agent chat endpoint
// Receives user messages + optional edit-target coordinates, stores in DB,
// and returns a PM response (placeholder until real agent orchestration)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { appId, appSlug, message, editTarget } = await req.json();

    if (!message || !appId) {
      return NextResponse.json({ error: 'message and appId required' }, { status: 400 });
    }

    // Verify the user owns this app
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: app } = await (supabase as any)
      .from('apps')
      .select('id, name, status')
      .eq('id', appId)
      .eq('created_by', user.id)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'app not found' }, { status: 404 });
    }

    // Store the edit session / message
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('edit_sessions')
      .insert({
        app_id: appId,
        user_id: user.id,
        input_type: editTarget ? 'tap_edit' : 'chat',
        input_text: message,
        metadata: editTarget ? { target: editTarget, slug: appSlug } : { slug: appSlug },
      });

    // TODO: integrate with real PM agent orchestration
    // For now, return an acknowledgement
    const hasTarget = editTarget && editTarget.x !== undefined;
    const reply = hasTarget
      ? `got it — i'll update the area at (${editTarget.x}%, ${editTarget.y}%) based on your request. the agents will work on it.`
      : `understood. i'm passing your request to the agents. you'll see the changes in your preview shortly.`;

    return NextResponse.json({
      reply,
      status: 'queued',
      editId: `edit-${Date.now()}`,
    });
  } catch (error) {
    console.error('chat error:', error);
    return NextResponse.json({ error: 'chat failed' }, { status: 500 });
  }
}
