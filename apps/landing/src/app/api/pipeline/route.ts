// =============================================================================
// api/pipeline/route.ts — start or check pipeline status
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';

// POST /api/pipeline — start a new pipeline run
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { appId, orderId } = body;

    if (!appId || !orderId) {
      return NextResponse.json({ error: 'appId and orderId required' }, { status: 400 });
    }

    // TODO: authenticate user via supabase
    // TODO: create pipeline_runs row
    // TODO: create agent_tasks rows for all 9 agents
    // TODO: trigger orchestrator.run() (async — don't await)

    return NextResponse.json({
      pipelineId: 'placeholder-pipeline-id',
      status: 'queued',
      message: 'pipeline started — cooking your app...',
    });
  } catch (error) {
    return NextResponse.json({ error: 'failed to start pipeline' }, { status: 500 });
  }
}

// GET /api/pipeline?id=xxx — check pipeline status
export async function GET(req: NextRequest) {
  const pipelineId = req.nextUrl.searchParams.get('id');

  if (!pipelineId) {
    return NextResponse.json({ error: 'pipeline id required' }, { status: 400 });
  }

  // TODO: fetch pipeline_runs + agent_tasks from supabase
  // TODO: return current status, progress, current agent

  return NextResponse.json({
    pipelineId,
    status: 'running',
    progress: 0,
    currentAgent: 'ux',
    agents: [],
  });
}
