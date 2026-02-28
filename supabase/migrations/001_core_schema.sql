-- =============================================================================
-- apphouse.ai — core database schema
-- covers: apps, profiles, orders, pipeline, agents, edits, publishing, analytics
-- =============================================================================

-- app registry
create table if not exists public.apps (
    id uuid primary key default gen_random_uuid(),
    slug text unique not null,
    name text not null,
    description text,
    domain text,
    status text default 'draft' check (status in ('draft','cooking','live','paused','archived')),
    platforms text default 'web' check (platforms in ('web','mobile','full')),
    icon_url text,
    cover_url text,
    vibe text default 'minimal' check (vibe in ('minimal','playful','corporate','premium','bold')),
    revenue_model text check (revenue_model in ('free','freemium','subscription','pay_per_use','ads','one_time')),
    stripe_product_id text,
    config jsonb default '{}',
    created_by uuid references auth.users(id),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- user profiles (extends auth.users)
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text,
    display_name text,
    avatar_url text,
    role text default 'creator' check (role in ('admin','creator','viewer')),
    metadata jsonb default '{}',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- app creation orders (intake form)
create table if not exists public.app_orders (
    id uuid primary key default gen_random_uuid(),
    app_id uuid references public.apps(id) on delete cascade,
    creator_id uuid references auth.users(id),
    one_sentence text not null,
    target_user text,
    problem_solved text,
    platforms text default 'web',
    desired_domain text,
    revenue_model text,
    vibe text default 'minimal',
    reference_urls text[],
    additional_notes text,
    clarifications jsonb default '[]',
    understanding_complete boolean default false,
    status text default 'pending' check (status in ('pending','clarifying','approved','building','complete')),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- pipeline runs
create table if not exists public.pipeline_runs (
    id uuid primary key default gen_random_uuid(),
    app_id uuid references public.apps(id) on delete cascade not null,
    order_id uuid references public.app_orders(id),
    status text default 'queued' check (status in ('queued','running','paused','complete','failed')),
    current_agent text,
    progress integer default 0 check (progress >= 0 and progress <= 100),
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz default now()
);

-- agent tasks
create table if not exists public.agent_tasks (
    id uuid primary key default gen_random_uuid(),
    pipeline_id uuid references public.pipeline_runs(id) on delete cascade not null,
    agent text not null check (agent in ('ux','wireframes','ui','dev','data','ai','sales','cfo','pm')),
    status text default 'pending' check (status in ('pending','understanding','working','review','complete','blocked')),
    input jsonb default '{}',
    output jsonb default '{}',
    understanding_score integer default 0 check (understanding_score >= 0 and understanding_score <= 100),
    questions jsonb default '[]',
    error_log text,
    sort_order integer default 0,
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz default now()
);

-- live edit sessions
create table if not exists public.edit_sessions (
    id uuid primary key default gen_random_uuid(),
    app_id uuid references public.apps(id) on delete cascade not null,
    user_id uuid references auth.users(id),
    voice_transcript text,
    navigation_log jsonb default '[]',
    change_requests jsonb default '[]',
    status text default 'active' check (status in ('active','processing','applied','discarded')),
    created_at timestamptz default now()
);

-- publishing
create table if not exists public.publish_requests (
    id uuid primary key default gen_random_uuid(),
    app_id uuid references public.apps(id) on delete cascade not null,
    platform text not null check (platform in ('ios','android','web')),
    status text default 'pending' check (status in ('pending','building','submitted','review','live','rejected')),
    store_url text,
    build_id text,
    version text,
    metadata jsonb default '{}',
    submitted_at timestamptz,
    live_at timestamptz,
    created_at timestamptz default now()
);

-- analytics events
create table if not exists public.analytics_events (
    id uuid primary key default gen_random_uuid(),
    app_id uuid references public.apps(id) not null,
    anonymous_id text,
    event_type text not null,
    event_data jsonb default '{}',
    session_id text,
    page_url text,
    device_type text,
    os text,
    browser text,
    viewport_width integer,
    country text,
    created_at timestamptz default now()
);

-- financials
create table if not exists public.financials (
    id uuid primary key default gen_random_uuid(),
    app_id uuid references public.apps(id) on delete cascade not null,
    period date not null,
    revenue numeric(12,2) default 0,
    costs numeric(12,2) default 0,
    profit numeric(12,2) default 0,
    active_users integer default 0,
    new_users integer default 0,
    api_calls integer default 0,
    storage_mb numeric(10,2) default 0,
    metadata jsonb default '{}',
    created_at timestamptz default now(),
    unique(app_id, period)
);

-- feedback
create table if not exists public.feedback (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id),
    app_id uuid references public.apps(id),
    message text not null,
    type text default 'feedback' check (type in ('feedback','bug','feature','question')),
    status text default 'new' check (status in ('new','read','replied','resolved')),
    created_at timestamptz default now()
);

-- indexes
create index if not exists idx_apps_created_by on public.apps(created_by);
create index if not exists idx_apps_status on public.apps(status);
create index if not exists idx_pipeline_runs_app on public.pipeline_runs(app_id);
create index if not exists idx_agent_tasks_pipeline on public.agent_tasks(pipeline_id);
create index if not exists idx_analytics_app_created on public.analytics_events(app_id, created_at);
create index if not exists idx_financials_app_period on public.financials(app_id, period);

-- rls
alter table public.apps enable row level security;
alter table public.profiles enable row level security;
alter table public.app_orders enable row level security;
alter table public.pipeline_runs enable row level security;
alter table public.agent_tasks enable row level security;
alter table public.edit_sessions enable row level security;
alter table public.publish_requests enable row level security;
alter table public.analytics_events enable row level security;
alter table public.financials enable row level security;
alter table public.feedback enable row level security;

-- policies
create policy "profiles_select_own" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid());
create policy "apps_select_own" on public.apps for select to authenticated using (created_by = auth.uid());
create policy "apps_insert_own" on public.apps for insert to authenticated with check (created_by = auth.uid());
create policy "apps_update_own" on public.apps for update to authenticated using (created_by = auth.uid());
create policy "orders_select_own" on public.app_orders for select to authenticated using (creator_id = auth.uid());
create policy "orders_insert_own" on public.app_orders for insert to authenticated with check (creator_id = auth.uid());
create policy "pipeline_select" on public.pipeline_runs for select to authenticated using (app_id in (select id from public.apps where created_by = auth.uid()));
create policy "tasks_select" on public.agent_tasks for select to authenticated using (pipeline_id in (select pr.id from public.pipeline_runs pr join public.apps a on a.id = pr.app_id where a.created_by = auth.uid()));
create policy "edits_select" on public.edit_sessions for select to authenticated using (user_id = auth.uid());
create policy "edits_insert" on public.edit_sessions for insert to authenticated with check (user_id = auth.uid());
create policy "publish_select" on public.publish_requests for select to authenticated using (app_id in (select id from public.apps where created_by = auth.uid()));
create policy "analytics_select" on public.analytics_events for select to authenticated using (app_id in (select id from public.apps where created_by = auth.uid()));
create policy "financials_select" on public.financials for select to authenticated using (app_id in (select id from public.apps where created_by = auth.uid()));
create policy "feedback_insert" on public.feedback for insert to authenticated with check (user_id = auth.uid());
create policy "feedback_select" on public.feedback for select to authenticated using (user_id = auth.uid());

-- analytics: allow anonymous inserts for event tracking (public-facing apps)
create policy "analytics_insert_anon" on public.analytics_events for insert to anon with check (true);
create policy "analytics_insert_auth" on public.analytics_events for insert to authenticated with check (true);

-- financials: allow service role inserts (agents write financial data)
-- note: RLS is bypassed by service_role key, so no explicit insert policy needed for agents

-- triggers
create or replace function update_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger apps_updated_at before update on public.apps for each row execute function update_updated_at();
create trigger profiles_updated_at before update on public.profiles for each row execute function update_updated_at();
create trigger orders_updated_at before update on public.app_orders for each row execute function update_updated_at();

-- auto-create profile on signup
create or replace function handle_new_user() returns trigger as $$
begin
    insert into public.profiles (id, email, display_name)
    values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
    return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();
