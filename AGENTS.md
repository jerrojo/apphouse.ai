# AGENTS.md — PRISMA Monorepo Governance

This file defines how AI agents (Manus, Claude, etc.) should interact with this repository. Every agent working on any part of this codebase must read this file first.

---

## Monorepo Ownership

**PRISMA CORE** (`/prisma-core`) is the umbrella platform. It owns and orchestrates all child projects. Never modify `prisma-core/` when working on a child app, and never modify a child app's code from within `prisma-core/`.

---

## Project Registry

| Folder | Project Name | Status | Stack |
|---|---|---|---|
| `prisma-core/` | PRISMA CORE | Active | React 19, tRPC, Drizzle, MySQL |
| `apps/wao-earth/` | WAO Earth | Active | Next.js 14, Supabase |
| `apps/pio/` | PÍO | Active | Next.js 14, Supabase |
| `apps/zawi/` | Zawi | Active | Next.js 14, Supabase |
| `apps/habito/` | HÁBITO | Active | Next.js 14, Supabase |
| `apps/irradia/` | IRRADIA | Active | Next.js 14, Supabase |
| `apps/pure-intentions/` | PURE INTENTIONS | Active | Next.js 14, Supabase |
| `apps/pranksta/` | Pranksta | Active | Next.js 14, Supabase |
| `apps/fresa/` | fresa.ai | Active | Next.js 14, Supabase |
| `apps/_template/` | Web Template | Template | Next.js 14, Supabase |
| `apps/_template-mobile/` | Mobile Template | Template | Expo, React Native |

---

## Adding a New Project

When PRISMA creates a new project, follow this exact workflow:

### 1. Scaffold the app
```bash
cd scripts
./create-app.sh <slug> "<Display Name>" "<domain.com>"
# Example: ./create-app.sh my-app "My App" "myapp.com"
```

This copies `apps/_template` into `apps/<slug>/` and sets up the package name.

### 2. Register in AGENTS.md
Add a row to the **Project Registry** table above with the new project's details.

### 3. Register in PRISMA CORE
Create the project in the PRISMA dashboard so the agent team can be assigned. The project will appear in the sidebar and be available for Live Sessions, Weeklys, and Audits.

### 4. Initial commit
```bash
git add apps/<slug>/
git commit -m "feat(apps): scaffold <slug> — <Display Name>"
git push origin main
```

---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production — always deployable |
| `prisma/feature-*` | PRISMA CORE features |
| `apps/<slug>/feature-*` | Child app features |
| `fix/*` | Bug fixes (any scope) |

All changes to `prisma-core/` go through a PR. Child app changes can be committed directly to `main` during early development.

---

## Scope Rules for AI Agents

- **Working on PRISMA CORE?** Only touch files under `prisma-core/`. Never touch `apps/`.
- **Working on a child app?** Only touch files under `apps/<slug>/`. Never touch `prisma-core/` or other apps.
- **Working on shared packages?** Only touch files under `packages/`. Verify no breaking changes across all consumers.
- **Never commit** `.env`, `.env.local`, secrets, or API keys.
- **Never delete** migration files in `supabase/migrations/` or `prisma-core/drizzle/`.

---

## Weekly Intelligence Automation

Every Monday at 4:00am, PRISMA automatically runs a Weekly Intelligence session for each active project. The endpoint is:

```
POST /api/scheduled/weekly-intelligence
```

This generates an executive summary of the past week and a creative task list. The project owner reviews, approves, and executes tasks from the PRISMA dashboard under **Weekly's**.

---

## Contact

This repository is maintained by **Jerónimo Vargas** and the PRISMA AI Agent Team.
All agent work is logged in PRISMA CORE under **Session Notes**.
