import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  float,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Projects ─────────────────────────────────────────────────────────────────

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["active", "paused", "completed", "archived"]).default("active").notNull(),
  agentsMd: text("agentsMd"),           // living specification (agents.md content)
  emoji: varchar("emoji", { length: 8 }).default("🚀"),
  verticalModule: mysqlEnum("verticalModule", [
    "App & SaaS",
    "E-commerce & Retail",
    "Fashion, Luxury & Beauty",
    "Fintech & Financial Services",
    "Health & Life Sciences",
    "Media, Content & Creator",
    "Interactive Entertainment",
    "Education & EdTech",
    "Real Estate & Built Environment",
    "Industrial, Hardware & Climate",
    "Professional Services & B2B",
    "Social Impact, Government & Web3",
    "Hospitality & Food"
  ]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// ─── Rooms ────────────────────────────────────────────────────────────────────
// A Room is a persistent workspace within a project (like a Slack channel).
// Default rooms: general, design, engineering, strategy, qa

export const rooms = mysqlTable("rooms", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 64 }).notNull(),   // e.g. "general", "design"
  description: text("description"),
  division: mysqlEnum("division", [
    "general", "Strategy & Leadership", "Design & Creative", "Engineering & Architecture",
    "Data, AI & Analytics", "Content & Community", "Marketing & Growth",
    "Customer Success & Support", "Operations, Finance & Legal", "Vertical Module"
  ]).default("general").notNull(),
  position: int("position").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = typeof rooms.$inferInsert;

// ─── Messages ─────────────────────────────────────────────────────────────────
// All messages in a room (user text, agent responses, system events)

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(),
  projectId: int("projectId").notNull(),
  momentId: int("momentId"),             // null = async chat; set = part of a Moment
  authorType: mysqlEnum("authorType", ["user", "agent", "system"]).notNull(),
  authorId: varchar("authorId", { length: 64 }).notNull(), // "user" or agentId
  content: text("content").notNull(),
  mentions: text("mentions"),            // JSON array of mentioned agentIds
  attachments: text("attachments"),      // JSON array of file URLs
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ─── Moments ──────────────────────────────────────────────────────────────────
// A Moment is a time-bounded interaction in a Room: voice session or live session

export const moments = mysqlTable("moments", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["voice", "live"]).notNull(),
  title: varchar("title", { length: 255 }),
  transcript: text("transcript"),
  audioUrl: varchar("audioUrl", { length: 1024 }),
  recordingUrl: varchar("recordingUrl", { length: 1024 }),  // screen recording
  status: mysqlEnum("status", ["active", "processing", "completed"]).default("active").notNull(),
  durationSeconds: int("durationSeconds"),
  participantAgents: text("participantAgents"),  // JSON array of agentIds present
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Moment = typeof moments.$inferSelect;
export type InsertMoment = typeof moments.$inferInsert;

// ─── Pointer Events ───────────────────────────────────────────────────────────
// Real-time pointer coordinates captured during Live Sessions

export const pointerEvents = mysqlTable("pointer_events", {
  id: int("id").autoincrement().primaryKey(),
  momentId: int("momentId").notNull(),
  authorType: mysqlEnum("authorType", ["user", "agent"]).notNull(),
  authorId: varchar("authorId", { length: 64 }).notNull(),
  x: float("x").notNull(),   // percentage 0-100 of shared screen
  y: float("y").notNull(),
  label: varchar("label", { length: 255 }),
  isPinned: boolean("isPinned").default(false).notNull(),  // pinned = annotation
  transcriptRef: text("transcriptRef"),  // what was being said at this moment
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PointerEvent = typeof pointerEvents.$inferSelect;
export type InsertPointerEvent = typeof pointerEvents.$inferInsert;

// ─── Tasks ────────────────────────────────────────────────────────────────────
// The spine of PRISMA. Generated from Moments, chat, or manually.
// Format: Ubicación > Bug | Tweak | Feature > Tarea

export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  roomId: int("roomId"),
  momentId: int("momentId"),             // which Moment generated this task
  messageId: int("messageId"),           // which message generated this task
  taskType: mysqlEnum("taskType", ["Bug", "Tweak", "Feature"]).notNull(),
  location: varchar("location", { length: 512 }).notNull(),  // e.g. "Home > Hero > CTA Button"
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  priority: mysqlEnum("priority", ["critical", "high", "medium", "low"]).default("medium").notNull(),
  status: mysqlEnum("status", ["proposed", "accepted", "in_progress", "done", "rejected"]).default("proposed").notNull(),
  assignedAgentId: varchar("assignedAgentId", { length: 64 }),
  proposedByAgentId: varchar("proposedByAgentId", { length: 64 }),
  pointerX: float("pointerX"),           // screen coordinate reference
  pointerY: float("pointerY"),
  position: int("position").default(0),  // ordering within status group
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// ─── Agent Definitions ───────────────────────────────────────────────────────
// Custom and default agents in the PRISMA Agent Library

export const agentDefinitions = mysqlTable("agent_definitions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  agentKey: varchar("agentKey", { length: 64 }).notNull(),   // unique slug e.g. "ux-designer"
  name: varchar("name", { length: 128 }).notNull(),
  role: varchar("role", { length: 128 }).notNull(),
  division: mysqlEnum("division", [
    "Strategy & Leadership", "Design & Creative", "Engineering & Architecture",
    "Data, AI & Analytics", "Content & Community", "Marketing & Growth",
    "Customer Success & Support", "Operations, Finance & Legal", "Vertical Module", "Custom"
  ]).default("Custom").notNull(),
  verticalModule: mysqlEnum("verticalModule", [
    "App & SaaS",
    "E-commerce & Retail",
    "Fashion, Luxury & Beauty",
    "Fintech & Financial Services",
    "Health & Life Sciences",
    "Media, Content & Creator",
    "Interactive Entertainment",
    "Education & EdTech",
    "Real Estate & Built Environment",
    "Industrial, Hardware & Climate",
    "Professional Services & B2B",
    "Social Impact, Government & Web3",
    "Hospitality & Food"
  ]),
  purpose: text("purpose"),                          // 1-2 sentence "why this agent exists"
  avatar: varchar("avatar", { length: 8 }).default("🤖"),  // emoji avatar
  // Soul layer
  customTraits: text("customTraits"),                // JSON string[]
  constitution: text("constitution"),                // JSON string[] — behavioral rules
  // Mind layer
  reasoningDefault: mysqlEnum("reasoningDefault", ["intuitive", "analytical", "exploratory", "reflective"]).default("analytical").notNull(),
  thinkingStyle: text("thinkingStyle"),
  knowledgeDomains: text("knowledgeDomains"),         // JSON string[]
  scopeDomains: text("scopeDomains"),                 // JSON string[] — app-building, content, ops, etc.
  // Heart layer
  communicationStyle: varchar("communicationStyle", { length: 128 }),
  emotionalRegister: varchar("emotionalRegister", { length: 128 }),
  // Craft layer
  primarySkills: text("primarySkills"),               // JSON string[]
  outputFormats: text("outputFormats"),               // JSON string[]
  // Voice layer
  tone: mysqlEnum("tone", ["professional", "warm", "direct", "playful", "precise"]).default("professional").notNull(),
  vocabularyLevel: mysqlEnum("vocabularyLevel", ["technical", "accessible", "adaptive"]).default("adaptive").notNull(),
  responseLength: mysqlEnum("responseLength", ["concise", "detailed", "adaptive"]).default("adaptive").notNull(),
  signaturePhrases: text("signaturePhrases"),         // JSON string[]
  // Full system prompt (compiled from all layers)
  systemPrompt: text("systemPrompt"),
  // Meta
  isDefault: boolean("isDefault").default(false).notNull(),  // true = built-in PRISMA agent
  isActive: boolean("isActive").default(true).notNull(),
  trainingVersion: int("trainingVersion").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AgentDefinition = typeof agentDefinitions.$inferSelect;
export type InsertAgentDefinition = typeof agentDefinitions.$inferInsert;

// ─── Agent Knowledge ──────────────────────────────────────────────────────────
// Documents, URLs, and examples injected into an agent's context

export const agentKnowledge = mysqlTable("agent_knowledge", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  type: mysqlEnum("type", ["document", "url", "example", "rule", "persona"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  sourceUrl: varchar("sourceUrl", { length: 1024 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentKnowledge = typeof agentKnowledge.$inferSelect;
export type InsertAgentKnowledge = typeof agentKnowledge.$inferInsert;

// ─── Agent Feedback ───────────────────────────────────────────────────────────
// User ratings and corrections on agent responses

export const agentFeedback = mysqlTable("agent_feedback", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  messageId: int("messageId"),
  userId: int("userId").notNull(),
  rating: int("rating"),                             // 1-5 stars
  correction: text("correction"),                    // what the ideal response should have been
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentFeedback = typeof agentFeedback.$inferSelect;
export type InsertAgentFeedback = typeof agentFeedback.$inferInsert;

// ─── Project Agents ───────────────────────────────────────────────────────────
// Which agents are assigned to which projects, and in what role

export const projectAgents = mysqlTable("project_agents", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  agentId: int("agentId").notNull(),
  roleOverride: varchar("roleOverride", { length: 128 }),  // custom role within this project
  status: mysqlEnum("status", ["active", "benched", "retired"]).default("active").notNull(),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProjectAgent = typeof projectAgents.$inferSelect;
export type InsertProjectAgent = typeof projectAgents.$inferInsert;

// ─── Audit Results ────────────────────────────────────────────────────────────

export const auditResults = mysqlTable("audit_results", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  pillar: mysqlEnum("pillar", ["User-Friendly", "Zero-Latency", "Fool-Proof", "Accessibility"]).notNull(),
  score: float("score").notNull(),
  findings: text("findings"),
  recommendations: text("recommendations"),
  wcagLevel: mysqlEnum("wcagLevel", ["AA", "AAA"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditResult = typeof auditResults.$inferSelect;
export type InsertAuditResult = typeof auditResults.$inferInsert;

// ─── Weeklys ─────────────────────────────────────────────────────────────────────────────
// Automated Monday 4–5am AI team meeting: executive summary + creative task list

export const weeklys = mysqlTable("weeklys", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  weekStart: timestamp("weekStart").notNull(),          // Monday 00:00 UTC of the week covered
  weekEnd: timestamp("weekEnd").notNull(),              // Sunday 23:59 UTC of the week covered
  status: mysqlEnum("status", ["pending", "generating", "ready", "executed"]).default("pending").notNull(),
  executiveSummary: text("executiveSummary"),           // markdown — what happened last week
  creativeBrief: text("creativeBrief"),                 // markdown — strategic direction for this week
  generatedByAgents: text("generatedByAgents"),         // JSON string[] of agentIds that participated
  executedAt: timestamp("executedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Weekly = typeof weeklys.$inferSelect;
export type InsertWeekly = typeof weeklys.$inferInsert;

// ─── Weekly Tasks ──────────────────────────────────────────────────────────────────────
// Individual tasks proposed by the AI team in a Weekly meeting

export const weeklyTasks = mysqlTable("weekly_tasks", {
  id: int("id").autoincrement().primaryKey(),
  weeklyId: int("weeklyId").notNull(),
  projectId: int("projectId").notNull(),
  taskType: mysqlEnum("taskType", ["Bug", "Tweak", "Feature", "Strategy"]).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  rationale: text("rationale"),                        // why the AI team proposes this
  proposedByAgent: varchar("proposedByAgent", { length: 64 }),  // agentId
  priority: mysqlEnum("priority", ["critical", "high", "medium", "low"]).default("medium").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "rejected"]).default("pending").notNull(),
  editedTitle: varchar("editedTitle", { length: 512 }),         // user-edited version
  editedDescription: text("editedDescription"),
  position: int("position").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WeeklyTask = typeof weeklyTasks.$inferSelect;
export type InsertWeeklyTask = typeof weeklyTasks.$inferInsert;

// ─── Session Notes ─────────────────────────────────────────────────────────────────────
// Persistent log of all live session transcripts, decisions, and agent outputs

export const sessionNotes = mysqlTable("session_notes", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  momentId: int("momentId"),                           // linked Moment if from a live session
  title: varchar("title", { length: 255 }).notNull(),
  sessionDate: timestamp("sessionDate").notNull(),
  transcript: text("transcript"),                      // raw voice/text transcript
  summary: text("summary"),                            // AI-generated summary
  decisions: text("decisions"),                        // JSON: { decision: string, owner: string }[]
  agentOutputs: text("agentOutputs"),                  // JSON: { agentId: string, output: string }[]
  taskCount: int("taskCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SessionNote = typeof sessionNotes.$inferSelect;
export type InsertSessionNote = typeof sessionNotes.$inferInsert;
