// =============================================================================
// packages/supabase-client/src/client.ts
// Cliente Supabase compartido con contexto de app para multi-tenancy
// =============================================================================

import { createBrowserClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Tipo genérico para la DB (se genera con `supabase gen types typescript`)
import type { Database } from './types';

// ---------------------------------------------------------------------------
// Browser Client (para componentes client-side)
// ---------------------------------------------------------------------------
export function createAppBrowserClient(appId: string) {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          'x-app-id': appId,
        },
      },
    }
  );
}

// ---------------------------------------------------------------------------
// Server Client (para Server Components, API routes, Server Actions)
// ---------------------------------------------------------------------------
export function createAppServerClient(appId: string): SupabaseClient<Database> {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        headers: {
          'x-app-id': appId,
        },
      },
    }
  );
}

// ---------------------------------------------------------------------------
// Helper: Track analytics event
// ---------------------------------------------------------------------------
export async function trackEvent(
  client: SupabaseClient<Database>,
  appId: string,
  eventType: string,
  eventData: Record<string, unknown> = {},
  options: { anonymousId?: string; sessionId?: string; pageUrl?: string } = {}
) {
  const { error } = await client.from('analytics_events').insert({
    app_id: appId,
    anonymous_id: options.anonymousId,
    event_type: eventType,
    event_data: eventData,
    session_id: options.sessionId,
    page_url: options.pageUrl,
    device_type: typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop') : null,
  });

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Helper: Create app order (intake form submission)
// ---------------------------------------------------------------------------
export async function createAppOrder(
  client: SupabaseClient<Database>,
  order: {
    appId: string;
    creatorId: string;
    oneSentence: string;
    targetUser?: string;
    problemSolved?: string;
    platforms?: string;
    desiredDomain?: string;
    revenueModel?: string;
    vibe?: string;
    referenceUrls?: string[];
    additionalNotes?: string;
  }
) {
  const { data, error } = await client
    .from('app_orders')
    .insert({
      app_id: order.appId,
      creator_id: order.creatorId,
      one_sentence: order.oneSentence,
      target_user: order.targetUser,
      problem_solved: order.problemSolved,
      platforms: order.platforms || 'web',
      desired_domain: order.desiredDomain,
      revenue_model: order.revenueModel,
      vibe: order.vibe || 'minimal',
      reference_urls: order.referenceUrls,
      additional_notes: order.additionalNotes,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Helper: Start pipeline run
// ---------------------------------------------------------------------------
export async function startPipeline(
  client: SupabaseClient<Database>,
  appId: string,
  orderId: string
) {
  const { data, error } = await client
    .from('pipeline_runs')
    .insert({
      app_id: appId,
      order_id: orderId,
      status: 'running',
      current_agent: 'ux',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Helper: Get app config
// ---------------------------------------------------------------------------
export async function getAppBySlug(
  client: SupabaseClient<Database>,
  slug: string
) {
  const { data, error } = await client
    .from('apps')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return data;
}
