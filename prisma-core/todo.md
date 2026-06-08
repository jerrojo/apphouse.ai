# PRISMA CORE — Project TODO

## Phase 1: Database Schema & Project Structure
- [x] Define database schema: projects, agents, sessions, messages, change_log, annotations, audit_results
- [x] Run migrations
- [x] Write server-side db helpers and tRPC routers

## Phase 2: Design System & Layout
- [x] Global design tokens (colors, typography, spacing, shadows) in index.css
- [x] Dark premium theme (deep navy/charcoal + prismatic accent)
- [x] PrismaLayout sidebar navigation with project switcher
- [x] Responsive layout shell

## Phase 3: Agent Cards Dashboard
- [x] 19 agent definitions with roles, divisions, expertise, and system prompts
- [x] 5 division sections: Product & Strategy, Creative & UX, Engineering & Dev, Sensory & FX, QA & Verification
- [x] Agent card component (role, status, expertise, avatar/icon)
- [x] Agent status indicator (idle, active, thinking, responding)
- [x] Division filter tabs
- [x] Agent chat interface with LukeW-injected system prompts

## Phase 4: Live Voice Co-Design Session
- [x] Voice recording UI (start/stop, waveform visualizer)
- [x] Audio upload and transcription via Whisper API
- [x] Real-time transcription display
- [x] Ops & Coordinator agent parses transcript and routes to specialist agents
- [x] Session notes panel (structured notes taken by Ops agent)
- [x] Auto-creation of change log entries from voice sessions

## Phase 5: Pointer Annotation Canvas & Agent Chat
- [x] App preview canvas (click-to-annotate overlay)
- [x] Pointer annotation overlay (click to place pins with coordinates)
- [x] Annotation list panel (all pins with descriptions)
- [x] Agent chat interface (per-agent conversation threads)
- [x] LukeW knowledge base injected into every agent's system prompt

## Phase 6: Change Log & Project Management
- [x] Project creation/management (CRUD)
- [x] agents.md living specification per project (view/edit)
- [x] Change log entries: location + change type + priority + description
- [x] Change log filter by location (Header, Footer, Modal, etc.)
- [x] Change log filter by type (Visual, Functional, UX, Performance)
- [x] Manual entry creation dialog

## Phase 7: Audit Panel & Compliance Dashboard
- [x] Constructive Feedback Agent audit panel
- [x] WCAG 2.1 AA/AAA compliance checks
- [x] LukeW principles checklist
- [x] Universal Rules compliance dashboard (4 pillars)
- [x] Pillar scores: User-Friendly, Zero-Latency, Fool-Proof, Accessibility
- [x] Score rings with animated progress

## Phase 8: Polish & Delivery
- [x] Animations and micro-interactions
- [x] Loading states and skeleton screens
- [x] Empty states for all sections
- [x] Error handling and toast notifications
- [x] Vitest unit tests (22 tests passing)
- [x] Final checkpoint and delivery

## Phase 9: Text Chat System
- [x] Streaming chat endpoint (SSE) for individual agent, division, and full team
- [x] Project context injection (agents.md, change log summary) into every chat
- [x] Chat page with agent/division/team selector tabs
- [x] Message thread UI with streaming markdown rendering per agent
- [x] Division broadcast — all agents in a division respond in sequence
- [x] Team broadcast — Ops Agent coordinates and routes to relevant specialists
- [x] Chat history persisted per project in DB
- [x] Quick-access chat button on every agent card
- [x] Navigation link in sidebar
- [x] Vitest tests for chat router

## Phase 10: Slack-like Chat + Live Sessions + PM Task Lists

- [x] Fix TypeScript import errors in server/_core/index.ts
- [x] Create AuditPage.tsx (was missing, causing Vite error)
- [x] Slack-like chat UI with channels per project
- [x] @mention system with agent aliases (@ux, @front, @data, @3d, @team, etc.)
- [x] @mention autocompletado dropdown al escribir @
- [x] Agent avatars, timestamps, and message threading
- [x] Live Session page with WebRTC screen share (getDisplayMedia)
- [x] Real-time mouse pointer sync via SSE/broadcast
- [x] Pointer overlay visible to all session participants
- [x] PM always present in sessions, listens and reasons
- [x] PM generates structured task list (Bugs / Tweaks / Features)
- [x] Task format: Ubicación > Tipo > Tarea
- [x] Task review panel: accept ✓ or reject ✗ per task
- [x] Inline task editing on click/tap
- [x] PM asks clarifying questions when unclear
- [x] Execute approved task list
- [x] Update PrismaLayout navigation with new Chat and Live Session routes

## Phase 11: Agent Management System

- [x] Fix stale 'agentMessages' import error (was a cached module reference, no longer in source)
- [x] Add agent management tables to drizzle/schema.ts: agentDefinitions, agentKnowledge, agentFeedback, projectAgents
- [x] Apply database migration via webdev_execute_sql (4 new tables created)
- [x] Add DB helpers in server/db.ts: createAgentDefinition, getAgentsByUser, getDefaultAgents, getAgentById, updateAgentDefinition, deleteAgentDefinition, addAgentKnowledge, getAgentKnowledge, removeAgentKnowledge, addAgentFeedback, getAgentFeedback, assignAgentToProject, getProjectAgents, updateProjectAgent, removeProjectAgent
- [x] Add tRPC routers in server/routers.ts: agents (list, listDefaults, get, create, update, retire, delete, seedDefaults), agentKnowledge (list, add, remove), agentFeedback (list, submit), projectAgents (list, assign, updateStatus, remove)
- [x] Build AgentLibrary.tsx — grid of all agents with division grouping, search/filter, hire/train buttons, retire action
- [x] Build AgentStudio.tsx — 5-tab editor (Identity, Soul & Values, Mind & Craft, Voice & Style, Training) + live test chat preview
- [x] Add Agent Library route /agents/library to App.tsx
- [x] Add Agent Studio route /agents/:id/studio to App.tsx
- [x] Add Agent Library nav item to PrismaLayout sidebar
- [x] Add vitest tests for agent management routers (45 tests passing)
- [x] Seed default agents on first load (seedDefaults mutation — auto-triggered from Agent Library empty state)
- [x] Update getProjectAgents DB helper to JOIN with agentDefinitions (returns agentName, agentRole, agentDivision, agentAvatar)
- [x] Project Team Assembly: ProjectTeamPage.tsx — assign/bench/retire/remove agents per project, role override, division grouping, status filter

## Phase 12: LukeW UX Redesign

- [x] PrismaLayout: clickable logo → dashboard, rooms collapsed by default, rooms only shown when they exist, Enter-to-submit in create dialog
- [x] Dashboard: action-first layout, quick-links row, fixed all stale CSS tokens, skeleton loading, dashed empty state
- [x] Agent Library: always-visible Studio + Archive buttons on every card, division pills with counts, skeleton loading matches card shape
- [x] Agent Studio: 5 collapsible sections instead of tabs, sticky save bar only when dirty, Test Chat as slide-in panel
- [x] ProjectView: fixed all stale CSS tokens, 5-column quick-actions grid, skeleton loading
- [x] Global: all --prisma-surface / --prisma-text-dim tokens replaced with --color-* tokens

## Phase 12b: LukeW Gaps

- [x] Build /agents/new page (AgentNew.tsx) — 3-step wizard: Identity → Mind → System Prompt
- [x] Fix remaining stale tokens in LiveSession.tsx, AgentsPage.tsx, AuditPage.tsx (0 stale tokens remain)
- [x] Add auto-save to AgentStudio (2s debounce, status indicator: Unsaved / Auto-saving... / ✓ Saved)

## Phase 13: PRISMA Agent Division Framework Implementation

- [x] Redesign shared/agents.ts — 9 universal divisions, 30+ core agents, 3 vertical modules (App/SaaS, Fashion, Fintech)
- [x] Update drizzle/schema.ts — add verticalModule column to agentDefinitions, update division enum
- [x] Run DB migration for new schema fields (ALTER TABLE executed via webdev_execute_sql)
- [x] Update server/routers.ts — seedDefaults uses new taxonomy, create/update accept new division enum + verticalModule
- [x] Update Agent Library UI — 9 division pills with new icons and oklch colors
- [x] Update Agent Studio — 9-option division dropdown, conditional verticalModule selector
- [x] Update ProjectTeamPage — DIVISION_COLORS updated to new taxonomy
- [x] Add Vertical Module selector to Dashboard new-project flow (13 verticals)
- [x] Update all tests to reflect new 9-division taxonomy (45/45 passing)

## Phase 13b: Division Framework Gaps

- [x] Add `verticalModule` column to `projects` table in DB and schema (ALTER TABLE + schema.ts updated)
- [x] Add `activateVerticalModule` mutation to projects router (persists vertical on project)
- [x] Wire Dashboard new-project dialog to actually save the selected vertical (full enum type cast)
- [x] Add Agent Library module activation banner when filtering Vertical Module with no agents
- [x] Update PrismaLayout to show active vertical badge (first word of module name) on project items

## Phase 14: 12-Module Vertical Taxonomy Implementation

- [x] Update verticalModule enum in drizzle/schema.ts (12 modules + Hospitality & Food = 13 total)
- [x] Run DB migration for updated enum on both projects and agent_definitions tables
- [x] Update all router zod enums to match new 12-module list (routers.ts, 5 occurrences)
- [x] Update Dashboard new-project dialog with 13 modules + emoji + descriptions
- [x] Update Agent Studio verticalModule selector with 13 modules
- [x] Update AgentNew.tsx VERTICAL_MODULES + conditional selector when division=Vertical Module
- [x] PrismaLayout badge already works with new module names (first word extraction)

## Phase 15: Comprehensive Polish Pass

- [x] Home.tsx: rewritten — 30+ agents copy, 13 vertical module strip, 6-feature grid, stronger hero
- [x] Dashboard.tsx: removed duplicate useState import, extracted VerticalModuleValue type helper
- [x] PrismaLayout.tsx: added Industry selector to new-project dialog, added Select imports
- [x] AgentsPage.tsx: fixed 7 stale tokens, updated copy to dynamic agent count
- [x] AuditPage.tsx: fixed 12 stale var(--border) / var(--muted-foreground) / var(--div-sensory) tokens
- [x] LiveSession.tsx: fixed all 18 stale var(--border) / var(--foreground) / var(--prisma-accent) tokens
- [x] ProjectTeamPage.tsx: made action menu always visible (removed opacity-0 group-hover), fixed muted-foreground token
- [x] shared/agents.ts: VerticalModule type updated to 13-module taxonomy, all old verticalModule strings fixed, all 13 modules added to VERTICAL_MODULES export
- [x] 0 stale tokens remaining across all client pages
- [x] TypeScript: 0 errors | Tests: 45/45 passing

## Phase 16: Full QA Pass & Polish

### Critical Bugs Fixed
- [x] client/index.html: title "{{project_title}}" → "PRISMA" + Inter + Space Grotesk fonts added
- [x] App.tsx: ALL pages now wrapped in PrismaLayout via WithLayout helper — sidebar shows on every route
- [x] App.tsx: /projects/:projectId/rooms/:roomId route added (renders AgentsPage)
- [x] App.tsx: /projects/:projectId/tasks route added (renders TasksPlaceholder with "coming soon")
- [x] App.tsx: unused params variable in ProjectView route removed
- [x] server: /api/audit-run endpoint created (was 404) — uses LLM to generate real audit scores per pillar
- [x] AgentsPage: /api/chat-stream (404) → /api/chat/stream (correct endpoint)
- [x] AgentsPage: removed unused trpc, Skeleton, X imports

### UX Fixes
- [x] AgentStudio: save bar changed from fixed (full viewport) to sticky bottom of scroll container
- [x] AgentStudio: sticky top bar z-index lowered from z-20 to z-10 (no longer overlaps sidebar)
- [x] All pages: min-h-dvh wrappers removed from pages inside PrismaLayout scroll container

### TypeScript & Tests
- [x] TypeScript: 0 errors | Tests: 45/45 passing

## Phase 17: World-Class Visual Redesign (LukeW + Jony Ive + Instagram level)

- [x] index.css: Complete PRISMA Design System v2 — 5-layer Z-stack surfaces, 4-tier text hierarchy, OKLCH accent palette, 9-division colors, motion system, glassmorphism utilities, stagger animations, score ring, waveform, streaming cursor
- [x] Home.tsx: Asymmetric hero with animated gradient, 30+ agents stat, 13-module strip, 6-feature grid, CTA section
- [x] PrismaLayout.tsx: Sidebar background darkened to oklch(0.075), section label color corrected to --color-faint, border-t uses style prop for consistency
- [x] Dashboard.tsx: Sticky glassmorphism top bar, rounded-full New Project button, quick-action cards with hover glow
- [x] AgentLibrary.tsx: Premium agent cards with accent glow on hover, division pills with counts, skeleton loading
- [x] ProjectView.tsx: Ambient glow header, quick-action 5-column grid, premium card hover effects
- [x] AgentStudio.tsx: Sticky glassmorphism header and save bar, rounded-full buttons
- [x] AgentNew.tsx: 3-step wizard with premium step indicator, rounded-full create button
- [x] ProjectTeamPage.tsx: Glassmorphism header, filter pills, always-visible action buttons
- [x] AgentsPage.tsx: Compact 64px sidebar, refined division headers, glassmorphism chat header + input bar, rounded-xl send button
- [x] AuditPage.tsx: Glassmorphism sticky header, rounded-full Run Audit button
- [x] LiveSession.tsx: Glassmorphism toolbar, rounded-full session control buttons
- [x] Tests: 45/45 passing

## Phase 18: Weekly Intelligence + Session Notes

### DB Schema
- [x] Add `weeklys` table: id, projectId, weekStart, weekEnd, status (pending|generating|ready|executed), executiveSummary, createdAt, executedAt
- [x] Add `weekly_tasks` table: id, weeklyId, type (Bug|Tweak|Feature|Strategy), title, description, agentId, priority, status (pending|accepted|rejected), editedTitle, editedDescription, order
- [x] Add `session_notes` table: id, projectId, sessionDate, title, transcript (text), decisions (json), agentOutputs (json), createdAt
- [x] Run DB migrations

### Backend
- [x] DB helpers: createWeekly, getWeeklys, getWeeklyById, updateWeeklyStatus, createWeeklyTask, getWeeklyTasks, updateWeeklyTask, bulkUpdateWeeklyTasks, createSessionNote, getSessionNotes, getSessionNoteById
- [x] tRPC router `weeklys`: list, get, generate (triggers LLM), updateTask, bulkReview, execute
- [x] tRPC router `sessionNotes`: list, get, create, update
- [x] Scheduled job: every Monday 4:00am — /api/scheduled/weekly-intelligence handler ready (register after deploy)

### Frontend
- [x] WeeklysPage.tsx — list of past weeklys + current week card with status
- [x] Weekly detail view: executive summary panel + task list with accept/reject/edit per task + Execute All button
- [x] Inline task editing (click title/description to edit)
- [x] Accept/reject individual tasks with visual feedback
- [x] Execute approved tasks (calls execute mutation, shows progress)
- [x] SessionNotesPage.tsx — chronological list of session notes
- [x] Session note detail: transcript, decisions, agent outputs sections
- [x] Add Weekly's and Session Notes to PrismaLayout sidebar under project nav
- [x] Add routes to App.tsx

### Tests & Delivery
- [x] Vitest tests for weeklys and sessionNotes routers
- [x] 57/57 tests passing
- [x] Checkpoint and delivery
