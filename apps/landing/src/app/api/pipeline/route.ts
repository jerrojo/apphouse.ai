// =============================================================================
// api/pipeline/route.ts — start or check pipeline status
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
// Agent pipeline order (mirrors packages/agents/src/config.ts)
const PIPELINE_ORDER = ['ux', 'wireframes', 'ui', 'dev', 'data', 'ai', 'sales', 'cfo', 'pm'] as const;

// POST /api/pipeline — start a new pipeline run
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { appId, orderId } = await req.json();
    if (!appId || !orderId) {
      return NextResponse.json({ error: 'appId and orderId required' }, { status: 400 });
    }

    // Verify app belongs to user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: app } = await (supabase as any)
      .from('apps')
      .select('id, created_by')
      .eq('id', appId)
      .single();

    if (!app || app.created_by !== user.id) {
      return NextResponse.json({ error: 'app not found' }, { status: 404 });
    }

    // Create pipeline run
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: run, error: runError } = await (supabase as any)
      .from('pipeline_runs')
      .insert({
        app_id: appId,
        order_id: orderId,
        status: 'running',
        current_agent: PIPELINE_ORDER[0],
        progress: 0,
      })
      .select()
      .single();

    if (runError) throw runError;

    // Create agent tasks for all 9 agents
    const agentTasks = PIPELINE_ORDER.map((agentName, idx) => ({
      pipeline_run_id: run.id,
      agent_name: agentName,
      status: idx === 0 ? 'running' : 'pending',
      input_data: {},
      output_data: null,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('agent_tasks').insert(agentTasks);

    // Update app status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('apps')
      .update({ status: 'cooking' })
      .eq('id', appId);

    // TODO: trigger orchestrator.run() asynchronously
    // For now, the pipeline run is created and agents can be polled

    return NextResponse.json({
      pipelineId: run.id,
      status: 'running',
      currentAgent: PIPELINE_ORDER[0],
      message: 'pipeline started — cooking your app...',
    });
  } catch (error) {
    console.error('pipeline start error:', error);
    return NextResponse.json({ error: 'failed to start pipeline' }, { status: 500 });
  }
}

// GET /api/pipeline?id=xxx — check pipeline status
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const pipelineId = req.nextUrl.searchParams.get('id');
    if (!pipelineId) {
      return NextResponse.json({ error: 'pipeline id required' }, { status: 400 });
    }

    // Fetch pipeline run with agent tasks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: run } = await (supabase as any)
      .from('pipeline_runs')
      .select('*')
      .eq('id', pipelineId)
      .single();

    if (!run) {
      return NextResponse.json({ error: 'pipeline not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tasks } = await (supabase as any)
      .from('agent_tasks')
      .select('agent_name, status, started_at, completed_at')
      .eq('pipeline_run_id', pipelineId)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      pipelineId: run.id,
      status: run.status,
      progress: run.progress,
      currentAgent: run.current_agent,
      agents: tasks || [],
    });
  } catch (error) {
    console.error('pipeline status error:', error);
    return NextResponse.json({ error: 'failed to get status' }, { status: 500 });
  }
}
