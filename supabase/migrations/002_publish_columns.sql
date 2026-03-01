-- =============================================================================
-- 002: add publish columns to apps table
-- supports subdomain routing (appname.apphouse.ai) and preview system
-- =============================================================================

alter table public.apps
  add column if not exists published_status text default 'draft'
    check (published_status in ('draft', 'preview', 'published')),
  add column if not exists published_url text,
  add column if not exists vercel_deployment_id text,
  add column if not exists build_artifact_path text;

-- index for fast subdomain → app lookup
create index if not exists idx_apps_slug_published
  on public.apps (slug)
  where published_status = 'published';
