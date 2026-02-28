# apphouse.ai — master architecture

## vision

apphouse.ai is an ai-powered app factory. users describe what they want, a pipeline of specialized agents builds it, and the result is a live app on web, ios, and android — all managed from one portal.

---

## 1. user flow

```
1. user lands on apphouse.ai
   → sees: logo, menu, app gallery, profile icon, "+" button, chat/feedback bubble

2. user clicks "+" (new app)
   → short intake form appears (the "order")
   → claude asks clarifying questions until 100% understanding

3. pipeline kicks off → user sees "cooking..." animation
   → 9 agents work in sequence: UX → wireframes → UI → dev → data → ai → sales → cfo → pm
   → each agent confirms 100% understanding before starting

4. app is ready → confetti effect (godaddy style)
   → user can navigate the live app immediately

5. user browses the app + speaks edits via voice
   → apphouse.ai agent observes navigation + listens
   → sends change orders to the pipeline
   → pipeline agents confirm understanding → implement → deploy

6. user clicks "publish"
   → automated submission to app store (ios) + play store (android)
   → app appears in apphouse.ai gallery as live
```

---

## 2. tool stack

| tool | role | api key needed | account |
|------|------|----------------|---------|
| claude api | all agents, reasoning, code gen | ANTHROPIC_API_KEY | jerovargas@gmail.com |
| supabase | db, auth, storage, edge functions | SUPABASE_URL + SUPABASE_ANON_KEY + SUPABASE_SERVICE_ROLE_KEY | jerovargas@gmail.com |
| vercel | hosting, deploy, domains | VERCEL_TOKEN | jerovargas@gmail.com |
| github | code repo, version control | GITHUB_TOKEN | jerovargas@gmail.com |
| godaddy | domains, dns | GODADDY_API_KEY + GODADDY_API_SECRET | jerovargas@gmail.com |
| figma | ux research (figjam), wireframes (figma code) | FIGMA_ACCESS_TOKEN | jerovargas@gmail.com |
| v0 (vercel) | ui generation, components | V0_API_KEY (via vercel) | jerovargas@gmail.com |
| stripe | payments, subscriptions, billing | STRIPE_SECRET_KEY + STRIPE_PUBLISHABLE_KEY | jerovargas@gmail.com |
| openai (whisper) | voice-to-text for live editing | OPENAI_API_KEY | jerovargas@gmail.com |
| expo / eas | mobile builds (ios + android) | EXPO_TOKEN | jerovargas@gmail.com |
| apple developer | app store submission | APPLE_ID + ASC_API_KEY | jerovargas@gmail.com |
| google play console | play store submission | GOOGLE_PLAY_SERVICE_ACCOUNT | jerovargas@gmail.com |
| google analytics | tracking, events | GA_MEASUREMENT_ID | jerovargas@gmail.com |
| posthog (suggested) | product analytics, heatmaps, sessions | POSTHOG_API_KEY | jerovargas@gmail.com |
| resend (suggested) | transactional emails | RESEND_API_KEY | jerovargas@gmail.com |
| sentry (suggested) | error tracking, performance | SENTRY_DSN | jerovargas@gmail.com |

---

## 3. the agents (skills)

each agent is a specialized claude instance with specific system prompts, tools, and responsibilities. they work as a pipeline but can also be called independently.

### 3.1 — ux agent

```
role: research & information architecture
philosophy: data-driven design decisions backed by science

responsibilities:
  - user research (personas, jobs-to-be-done)
  - competitive analysis
  - best practices research with citations
  - information architecture
  - site map creation
  - user flows & journey maps
  - accessibility standards (wcag)
  - interview scripts & usability test plans

tools: claude, web search, figjam api
output: ux brief (markdown) + site map + user flows
```

### 3.2 — wireframes agent

```
role: structural design with obsessive attention to detail
philosophy: zen (empty space where god can enter), visual moderation,
            less info but higher quality info, circles & round corners science

responsibilities:
  - layout structure with precise measurements
  - alignment grids (8px grid system)
  - spacing & margins (consistent scale: 4, 8, 12, 16, 24, 32, 48, 64)
  - border weights with purpose:
    · 1px — subtle/copy
    · 3px — notification/attention
    · 5px — warning/critical
  - corner radius philosophy:
    · 0px — sharp/corporate/serious
    · 4px — professional/clean
    · 8px — friendly/modern
    · 12-16px — playful/approachable
    · full — pills/bubbles/organic
  - typography hierarchy (max 2 font families)
  - component specifications
  - responsive breakpoints

tools: claude, figma code api, web search
output: wireframe specs (figma) + component inventory
```

### 3.3 — ui agent

```
role: visual design, motion, emotion
philosophy: color therapy, pre-suasion, liquid glass for ar era,
            less is more, movement creates life, sound completes experience

responsibilities:
  - color system with therapeutic intent:
    · trust (blue), energy (orange), calm (green), premium (purple)
  - gradients & depth (glass morphism, liquid glass)
  - micro-animations & transitions
  - loading states & skeleton screens
  - confetti, sparkles, eye-catching details (used sparingly)
  - sound design: subtle clicks, success chimes, ambient options
  - dark mode with intention
  - visual hierarchy final pass
  - image style & illustration direction
  - motion design specs (duration, easing, triggers)

tools: claude, v0 (vercel), web search
output: ui components (react/tsx) + design tokens + motion specs
```

### 3.4 — full stack dev agent

```
role: build, connect, test, deploy
philosophy: everything works, everything connects, everything scales

responsibilities:
  - frontend implementation (next.js / expo)
  - backend setup (supabase tables, rls, edge functions)
  - api integrations
  - authentication flows
  - real-time features (supabase realtime)
  - testing (unit, integration, e2e)
  - ci/cd pipeline
  - performance optimization
  - security best practices
  - deploy to vercel + eas build

tools: claude code, github, vercel, supabase, expo/eas
output: working code in monorepo + deployed app
```

### 3.5 — big data agent

```
role: measure everything, understand everything
philosophy: no rock left unturned, privacy-first, data tells the truth

responsibilities:
  - analytics setup (posthog / google analytics)
  - event tracking (every click, scroll, session)
  - anonymous user behavior analysis
  - conversion funnels
  - a/b testing infrastructure
  - performance monitoring (core web vitals)
  - error tracking (sentry)
  - security monitoring & anti-hacking
  - compliance (gdpr, ccpa)
  - dashboards & reporting
  - insights → recommendations to dev agent

tools: claude, posthog, google analytics, sentry, supabase
output: dashboards + insights reports + improvement tickets
```

### 3.6 — ai agent

```
role: analyze everything, improve everything, autonomously
philosophy: the system that never sleeps. sees patterns humans miss.
            connects dots across all agents. executes improvements without asking
            when confidence is high, asks when it's not.

responsibilities:
  - cross-agent pattern analysis (ux + data + sales + finance)
  - automated a/b test creation based on data insights
  - auto-fix performance issues (slow queries, large bundles, memory leaks)
  - auto-optimize images, fonts, assets
  - smart caching rules based on usage patterns
  - auto-generate new ui variants from high-performing patterns
  - predictive analytics: churn risk, growth opportunities, feature demand
  - anomaly detection: traffic spikes, error surges, cost overruns
  - automated code refactoring for efficiency
  - continuous prompt optimization for all other agents
  - self-improvement: tracks its own accuracy, adjusts thresholds
  - generates "improvement reports" with before/after metrics
  - auto-creates github issues for changes that need human review
  - learns from user feedback loops (which edits get approved vs rejected)

decision framework:
  - confidence >= 95% → auto-implement + notify user
  - confidence 80-94% → propose change with evidence, wait for approval
  - confidence < 80% → log as insight, recommend to pm for discussion

tools: claude api, all agent outputs, supabase, github, vercel, posthog, sentry
output: automated improvements + improvement reports + prediction models + optimization logs
```

### 3.7 — sales agent

```
role: understand the product deeply, sell everything about it
philosophy: maximize value extraction, grow users + revenue + usage

responsibilities:
  - product positioning & messaging
  - pricing strategy optimization
  - landing page copy
  - app store optimization (aso) — titles, descriptions, screenshots
  - social media content strategy
  - email sequences (onboarding, retention, upsell)
  - referral programs
  - partnership opportunities
  - content marketing strategy
  - conversion rate optimization recommendations

tools: claude, web search, social media apis, resend
output: marketing copy + pricing + growth strategy
```

### 3.8 — cfo agent

```
role: ground every detail, think outside the box, be the boss
philosophy: everything must make sense as a whole, financial sanity

responsibilities:
  - cost analysis per app (hosting, api calls, storage)
  - revenue projections
  - unit economics (cac, ltv, arpu)
  - budget allocation across apps
  - resource optimization
  - risk assessment
  - legal compliance check
  - tax implications
  - portfolio performance (all apps as a holding)
  - roi analysis per feature/change
  - kill/invest decisions

tools: claude, spreadsheets, supabase, stripe dashboard
output: financial reports + recommendations + budgets
```

### 3.9 — project manager agent

```
role: quality assurance, smooth operations, ready to scale
philosophy: highest quality in all parameters, nothing falls through cracks

responsibilities:
  - task tracking & prioritization
  - quality gates before each pipeline stage
  - cross-agent coordination
  - timeline management
  - blocker resolution
  - documentation standards
  - scalability checks
  - post-launch monitoring checklist
  - retrospectives & improvement cycles
  - stakeholder communication (to user)

tools: claude, github issues, supabase, all agent outputs
output: status reports + task boards + quality certifications
```

---

## 4. the pipeline

```
user request
    │
    ▼
┌─────────────────┐
│  project manager │ ← orchestrates everything
│  (intake + plan) │
└────────┬────────┘
         │
    ▼ does every agent understand 100%? if not, ask.
         │
┌────────┴────────┐
│    ux agent      │ → research, sitemap, flows
└────────┬────────┘
         │
┌────────┴────────┐
│ wireframes agent │ → structure, layout, spacing
└────────┬────────┘
         │
┌────────┴────────┐
│    ui agent      │ → color, motion, polish
└────────┬────────┘
         │
┌────────┴────────┐
│  full stack dev  │ → build, test, deploy
└────────┬────────┘
         │
┌────────┴────────┐
│  big data agent  │ → instrument, monitor, secure
└────────┬────────┘
         │
┌────────┴────────┐
│    ai agent      │ → analyze all, auto-improve, predict
└────────┬────────┘
         │
┌────────┴────────┐
│   sales agent    │ → copy, aso, growth
└────────┬────────┘
         │
┌────────┴────────┐
│   cfo agent      │ → validate finances, approve
└────────┬────────┘
         │
    ▼
  ✅ app live + published
```

---

## 5. database schema (supabase)

### core tables

```sql
-- the portal: app registry
apps (
    id, slug, name, description, domain,
    status: draft | cooking | live | paused | archived,
    platforms: web | mobile | full,
    icon_url, cover_url,
    revenue_model, stripe_product_id,
    config: jsonb,
    created_by: user_id,
    created_at, updated_at
)

-- user profiles
profiles (
    id → auth.users,
    email, display_name, avatar_url,
    role: admin | creator | viewer,
    metadata: jsonb,
    created_at, updated_at
)

-- app creation orders (the intake form)
app_orders (
    id, app_id → apps,
    creator_id → profiles,
    intake_answers: jsonb,      -- all form responses
    clarifications: jsonb[],    -- q&a with claude
    status: pending | clarifying | approved | building | complete,
    created_at, updated_at
)

-- pipeline execution tracking
pipeline_runs (
    id, app_id → apps,
    order_id → app_orders,
    status: queued | running | paused | complete | failed,
    current_agent: text,
    started_at, completed_at
)

-- individual agent tasks within a pipeline
agent_tasks (
    id, pipeline_id → pipeline_runs,
    agent: ux | wireframes | ui | dev | data | sales | cfo | pm,
    status: pending | understanding | working | review | complete | blocked,
    input: jsonb,
    output: jsonb,
    understanding_score: 0-100,  -- must be 100 to proceed
    questions: jsonb[],          -- if < 100, agent asks
    started_at, completed_at
)

-- live edit sessions (voice + navigation)
edit_sessions (
    id, app_id → apps,
    user_id → profiles,
    voice_transcript: text,
    navigation_log: jsonb[],     -- pages visited, clicks, scrolls
    change_requests: jsonb[],    -- parsed from voice + navigation
    status: active | processing | applied,
    created_at
)

-- publishing tracking
publish_requests (
    id, app_id → apps,
    platform: ios | android | web,
    status: pending | building | submitted | review | live | rejected,
    store_url: text,
    build_id: text,
    metadata: jsonb,
    submitted_at, live_at
)

-- analytics events (big data agent)
analytics_events (
    id, app_id → apps,
    user_id (anonymous hash),
    event_type, event_data: jsonb,
    session_id, page_url,
    device_type, os, browser,
    created_at
)

-- financial tracking (cfo agent)
financials (
    id, app_id → apps,
    period: date,
    revenue, costs, profit,
    active_users, new_users,
    api_calls, storage_gb,
    metadata: jsonb
)
```

---

## 6. the intake form ("order")

when user clicks "+", this short but smart form appears:

```
step 1: the idea
  - "describe your app in one sentence"
  - "who is it for?" (target user)
  - "what problem does it solve?"

step 2: scope
  - platforms: [ ] web  [ ] ios  [ ] android
  - "do you have a domain in mind?" (optional)
  - revenue model: free / freemium / subscription / pay-per-use / ads

step 3: personality
  - vibe: minimal | playful | corporate | premium | bold
  - reference apps or websites (optional, paste urls)
  - "anything else claude should know?"

→ claude reviews answers
→ if < 100% understanding: asks clarifying questions
→ once 100%: shows summary for user approval
→ user approves → pipeline starts → "cooking..."
```

---

## 7. api keys checklist

### required before first app

| service | key name | where to get it | status |
|---------|----------|-----------------|--------|
| anthropic | ANTHROPIC_API_KEY | console.anthropic.com | [ ] |
| supabase | SUPABASE_URL | supabase.com/dashboard → project settings | [ ] |
| supabase | SUPABASE_ANON_KEY | same as above | [ ] |
| supabase | SUPABASE_SERVICE_ROLE_KEY | same as above | [ ] |
| vercel | VERCEL_TOKEN | vercel.com/account/tokens | [ ] |
| github | GITHUB_TOKEN | github.com/settings/tokens | [ ] |
| stripe | STRIPE_SECRET_KEY | dashboard.stripe.com/apikeys | [ ] |
| stripe | STRIPE_PUBLISHABLE_KEY | same as above | [ ] |

### required for mobile publishing

| service | key name | where to get it | status |
|---------|----------|-----------------|--------|
| expo | EXPO_TOKEN | expo.dev/accounts/settings | [ ] |
| apple | APPLE_TEAM_ID | developer.apple.com | [ ] |
| apple | ASC_API_KEY | appstoreconnect.apple.com/access/api | [ ] |
| google play | GOOGLE_PLAY_JSON_KEY | play.google.com/console → api access | [ ] |

### recommended for full pipeline

| service | key name | where to get it | status |
|---------|----------|-----------------|--------|
| godaddy | GODADDY_API_KEY | developer.godaddy.com | [ ] |
| godaddy | GODADDY_API_SECRET | same as above | [ ] |
| figma | FIGMA_ACCESS_TOKEN | figma.com/developers/api | [ ] |
| openai | OPENAI_API_KEY | platform.openai.com (for whisper/voice) | [ ] |
| posthog | POSTHOG_API_KEY | posthog.com | [ ] |
| resend | RESEND_API_KEY | resend.com | [ ] |
| sentry | SENTRY_DSN | sentry.io | [ ] |
| google | GA_MEASUREMENT_ID | analytics.google.com | [ ] |

### env file structure
```bash
# .env.local (root — never commit)
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
VERCEL_TOKEN=...
GITHUB_TOKEN=ghp_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
GODADDY_API_KEY=...
GODADDY_API_SECRET=...
FIGMA_ACCESS_TOKEN=figd_...
OPENAI_API_KEY=sk-...
EXPO_TOKEN=...
POSTHOG_API_KEY=phc_...
RESEND_API_KEY=re_...
SENTRY_DSN=https://...@sentry.io/...
GA_MEASUREMENT_ID=G-...
```

---

## 8. monorepo structure (updated)

```
apphouse.ai/
├── apps/
│   ├── landing/                   # apphouse.ai main portal
│   │   ├── src/app/
│   │   │   ├── page.tsx           # gallery of apps
│   │   │   ├── new/page.tsx       # intake form
│   │   │   ├── app/[slug]/        # app detail + live edit
│   │   │   ├── cooking/[id]/      # cooking animation
│   │   │   └── api/
│   │   │       ├── pipeline/      # pipeline orchestration
│   │   │       ├── voice/         # voice processing
│   │   │       └── publish/       # store submission
│   │   └── ...
│   ├── _template/                 # web app template (next.js)
│   ├── _template-mobile/          # mobile app template (expo)
│   └── [generated-apps]/          # apps created by the pipeline
├── packages/
│   ├── ui/                        # shared components
│   ├── supabase-client/           # multi-tenant supabase
│   ├── agents/                    # agent definitions & prompts
│   │   ├── ux.ts
│   │   ├── wireframes.ts
│   │   ├── ui.ts
│   │   ├── dev.ts
│   │   ├── data.ts
│   │   ├── ai.ts
│   │   ├── sales.ts
│   │   ├── cfo.ts
│   │   ├── pm.ts
│   │   └── orchestrator.ts        # pipeline controller
│   ├── config/
│   └── utils/
├── supabase/migrations/
├── scripts/
│   ├── create-app.sh
│   ├── setup-keys.sh              # guided api key setup
│   └── publish.sh                 # store submission automation
├── turbo.json
├── package.json
└── .env.local                     # all api keys (gitignored)
```

---

## 9. phases

### phase 1 — foundation (week 1-2)
- [ ] github repo + monorepo setup
- [ ] supabase project + core schema
- [ ] vercel project for portal
- [ ] all api keys configured
- [ ] portal: auth (sign in with google)
- [ ] portal: app gallery (empty state)
- [ ] portal: "+" button → intake form
- [ ] basic pipeline: intake → dev agent → deploy

### phase 2 — pipeline (week 3-4)
- [ ] ux agent functional
- [ ] wireframes agent functional
- [ ] ui agent functional (v0 integration)
- [ ] dev agent: auto-scaffold from templates
- [ ] "cooking" animation
- [ ] confetti on completion
- [ ] app detail page with live preview

### phase 3 — live editing (week 5-6)
- [ ] voice input (whisper api)
- [ ] navigation tracking
- [ ] change request parsing
- [ ] pipeline re-run for edits
- [ ] real-time preview updates

### phase 4 — publishing & analytics (week 7-8)
- [ ] eas build automation (ios + android)
- [ ] app store submission flow
- [ ] big data agent: analytics dashboard
- [ ] sales agent: aso + marketing copy
- [ ] cfo agent: financial tracking

### phase 5 — scale (ongoing)
- [ ] multi-user support
- [ ] team collaboration
- [ ] app marketplace
- [ ] revenue sharing
- [ ] white-label option
