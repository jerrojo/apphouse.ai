// =============================================================================
// api/voice/route.ts — process voice input for live editing
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/voice — receive audio, transcribe via OpenAI Whisper, return text
export async function POST(req: NextRequest) {
  try {
    // ── Auth check ──────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // ── Parse form data ─────────────────────────────────────────────
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const appId = formData.get('appId') as string;
    const sessionId = formData.get('sessionId') as string;

    if (!audioFile || !appId) {
      return NextResponse.json({ error: 'audio file and appId required' }, { status: 400 });
    }

    // ── Transcribe with OpenAI Whisper ──────────────────────────────
    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
      return NextResponse.json({ error: 'openai api key not configured' }, { status: 500 });
    }

    const whisperForm = new FormData();
    whisperForm.append('file', audioFile, 'recording.webm');
    whisperForm.append('model', 'whisper-1');
    whisperForm.append('response_format', 'json');
    // Auto-detect language — Whisper handles es/en/etc natively

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_KEY}` },
      body: whisperForm,
    });

    if (!whisperRes.ok) {
      const err = await whisperRes.text();
      console.error('whisper error:', err);
      return NextResponse.json({ error: 'transcription failed' }, { status: 502 });
    }

    const { text: transcript } = await whisperRes.json();

    // ── Store in edit_sessions ──────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('edit_sessions').insert({
      app_id: appId,
      user_id: user.id,
      input_type: 'voice',
      input_data: { transcript, sessionId },
    });

    return NextResponse.json({
      transcript,
      sessionId: sessionId || crypto.randomUUID(),
    });
  } catch (error) {
    console.error('voice processing failed:', error);
    return NextResponse.json({ error: 'voice processing failed' }, { status: 500 });
  }
}
