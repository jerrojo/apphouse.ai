// =============================================================================
// api/voice/route.ts — process voice input for live editing
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';

// POST /api/voice — receive audio, transcribe, parse change requests
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const appId = formData.get('appId') as string;
    const sessionId = formData.get('sessionId') as string;

    if (!audioFile || !appId) {
      return NextResponse.json({ error: 'audio file and appId required' }, { status: 400 });
    }

    // TODO: send audio to openai whisper api for transcription
    // TODO: parse transcript into structured change requests using claude
    // TODO: store in edit_sessions table
    // TODO: trigger pipeline re-run for relevant agents

    return NextResponse.json({
      transcript: 'placeholder — whisper transcription goes here',
      changeRequests: [],
      sessionId: sessionId || 'new-session-id',
    });
  } catch (error) {
    return NextResponse.json({ error: 'voice processing failed' }, { status: 500 });
  }
}
