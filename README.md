# apphouse.ai — PRISMA Monorepo

> **PRISMA** is the AI Agent Team Platform that builds, manages, and evolves every product inside this repository. Each project under `apps/` is an independent product, custodied and orchestrated by PRISMA.

---

## Repository Structure

```
apphouse.ai/                        ← This repo (GitHub: jerrojo/apphouse.ai)
│
├── prisma-core/                    ← PRISMA CORE — the umbrella platform (React + tRPC + Drizzle)
│   ├── client/                     ← Frontend (React 19, Tailwind 4, shadcn/ui)
│   ├── server/                     ← Backend (Express, tRPC, Drizzle ORM)
│   ├── drizzle/                    ← DB schema & migrations
│   └── shared/                     ← Shared types & constants
│
├── apps/                           ← Child projects — each is an independent product
│   ├── wao-earth/                  ← WAO Earth (biodiversity / geo platform)
│   ├── pio/                        ← PÍO (social / content app)
│   ├── zawi/                       ← Zawi
│   ├── habito/                     ← HÁBITO
│   ├── irradia/                    ← IRRADIA
│   ├── pure-intentions/            ← PURE INTENTIONS
│   ├── pranksta/                   ← Pranksta
│   ├── fresa/                      ← fresa.ai
│   ├── _template/                  ← Web app template (Next.js)
│   └── _template-mobile/           ← Mobile app template (Expo)
│
├── packages/                       ← Shared libraries (consumed by apps + prisma-core)
│   ├── ui/                         ← Shared component library
│   ├── agents/                     ← Agent definitions & prompts
│   ├── supabase-client/            ← Multi-tenant Supabase client
│   └── utils/                      ← Shared utilities
│
├── supabase/                       ← Database migrations (global schema)
├── scripts/                        ← Automation scripts (create-app, setup-keys, publish)
├── AGENTS.md                       ← PRISMA governance — how to add new projects
├── ARCHITECTURE.md                 ← System architecture overview
└── turbo.json                      ← Turborepo build pipeline
```

---

## PRISMA CORE

PRISMA CORE (`/prisma-core`) is the command center. It provides:

- **Dashboard** — overview of all active projects and their agent teams
- **Agent Library** — 30+ specialized AI agents across 9 divisions
- **Live Sessions** — real-time AI team meetings with voice, tasks, and decisions
- **Weekly Intelligence** — automated Monday 4am AI team meeting: executive summary + creative task list, with review/approve/reject/execute workflow
- **Session Notes** — persistent log of every session: transcript, decisions, agent outputs
- **Audit** — AI-powered code and product quality audits
- **Agent Studio** — configure and customize any agent for any project

---

## Adding a New Project

When a new project is created inside PRISMA, it automatically gets its own folder under `apps/`. See `AGENTS.md` for the full workflow.

**Quick start:**
```bash
cd scripts
./create-app.sh my-new-app
```

This scaffolds a new app from `apps/_template`, registers it in PRISMA CORE, and creates the initial agent team.

---

## Tech Stack

| Layer | Technology |
|---|---|
| PRISMA Frontend | React 19, Tailwind 4, shadcn/ui, tRPC |
| PRISMA Backend | Express 4, tRPC 11, Drizzle ORM, MySQL/TiDB |
| App Template (Web) | Next.js 14, Tailwind, Supabase |
| App Template (Mobile) | Expo, React Native |
| Monorepo | Turborepo, pnpm workspaces |
| Database | Supabase (apps) + Manus DB (PRISMA CORE) |
| Auth | Manus OAuth (PRISMA) + Supabase Auth (apps) |
| Hosting | Manus (PRISMA CORE) + Vercel (apps) |

---

## Development

```bash
# Install all dependencies
pnpm install

# Run PRISMA CORE dev server
cd prisma-core && pnpm dev

# Run a specific app
cd apps/wao-earth && pnpm dev

# Run everything (Turborepo)
pnpm turbo dev
```

---

*Maintained by the PRISMA AI Agent Team — apphouse.ai*
