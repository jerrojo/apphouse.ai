import { eq, desc, and, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  InsertProject, projects,
  InsertRoom, rooms,
  InsertMessage, messages,
  InsertMoment, moments,
  InsertPointerEvent, pointerEvents,
  InsertTask, tasks,
  InsertAuditResult, auditResults,
  InsertAgentDefinition, agentDefinitions,
  InsertAgentKnowledge, agentKnowledge,
  InsertAgentFeedback, agentFeedback,
  InsertProjectAgent, projectAgents,
  InsertWeekly, weeklys,
  InsertWeeklyTask, weeklyTasks,
  InsertSessionNote, sessionNotes,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function createProject(data: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(projects).values(data);
  return result;
}

export async function getProjectsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.updatedAt));
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result[0];
}

export async function updateProject(id: number, data: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(projects).set(data).where(eq(projects.id, id));
}

// ─── Rooms ────────────────────────────────────────────────────────────────────

export async function createRoom(data: InsertRoom) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(rooms).values(data);
  return result;
}

export async function getRoomsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rooms).where(eq(rooms.projectId, projectId)).orderBy(asc(rooms.position));
}

export async function getRoomById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
  return result[0];
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function createMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(messages).values(data);
  return result;
}

export async function getMessagesByRoom(roomId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.roomId, roomId)).orderBy(asc(messages.createdAt)).limit(limit);
}

// ─── Moments ──────────────────────────────────────────────────────────────────

export async function createMoment(data: InsertMoment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(moments).values(data);
  return result;
}

export async function getMomentsByRoom(roomId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(moments).where(eq(moments.roomId, roomId)).orderBy(desc(moments.createdAt));
}

export async function updateMoment(id: number, data: Partial<InsertMoment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(moments).set(data).where(eq(moments.id, id));
}

// ─── Pointer Events ───────────────────────────────────────────────────────────

export async function createPointerEvent(data: InsertPointerEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(pointerEvents).values(data);
  return result;
}

export async function getPinnedPointersByMoment(momentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pointerEvents)
    .where(and(eq(pointerEvents.momentId, momentId), eq(pointerEvents.isPinned, true)))
    .orderBy(asc(pointerEvents.createdAt));
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function createTask(data: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(tasks).values(data);
  return result;
}

export async function getTasksByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tasks).where(eq(tasks.projectId, projectId)).orderBy(asc(tasks.position), desc(tasks.createdAt));
}

export async function getTasksByRoom(roomId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tasks).where(eq(tasks.roomId, roomId)).orderBy(asc(tasks.position), desc(tasks.createdAt));
}

export async function updateTask(id: number, data: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(tasks).set(data).where(eq(tasks.id, id));
}

// ─── Audit Results ────────────────────────────────────────────────────────────

export async function createAuditResult(data: InsertAuditResult) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(auditResults).values(data);
  return result;
}

export async function getLatestAuditByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditResults).where(eq(auditResults.projectId, projectId)).orderBy(desc(auditResults.createdAt)).limit(4);
}

// ─── Agent Definitions ───────────────────────────────────────────────────────────

export async function createAgentDefinition(data: InsertAgentDefinition) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(agentDefinitions).values(data);
  return result;
}

export async function getAgentsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agentDefinitions)
    .where(eq(agentDefinitions.userId, userId))
    .orderBy(asc(agentDefinitions.division), asc(agentDefinitions.name));
}

export async function getDefaultAgents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agentDefinitions)
    .where(eq(agentDefinitions.isDefault, true))
    .orderBy(asc(agentDefinitions.division), asc(agentDefinitions.name));
}

export async function getAgentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(agentDefinitions).where(eq(agentDefinitions.id, id)).limit(1);
  return result[0];
}

export async function getAgentByKey(agentKey: string, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(agentDefinitions)
    .where(and(eq(agentDefinitions.agentKey, agentKey), eq(agentDefinitions.userId, userId)))
    .limit(1);
  return result[0];
}

export async function updateAgentDefinition(id: number, data: Partial<InsertAgentDefinition>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(agentDefinitions).set(data).where(eq(agentDefinitions.id, id));
}

export async function deleteAgentDefinition(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(agentDefinitions).where(eq(agentDefinitions.id, id));
}

// ─── Agent Knowledge ───────────────────────────────────────────────────────────

export async function addAgentKnowledge(data: InsertAgentKnowledge) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(agentKnowledge).values(data);
  return result;
}

export async function getAgentKnowledge(agentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agentKnowledge)
    .where(and(eq(agentKnowledge.agentId, agentId), eq(agentKnowledge.isActive, true)))
    .orderBy(asc(agentKnowledge.createdAt));
}

export async function removeAgentKnowledge(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(agentKnowledge).set({ isActive: false }).where(eq(agentKnowledge.id, id));
}

// ─── Agent Feedback ───────────────────────────────────────────────────────────

export async function addAgentFeedback(data: InsertAgentFeedback) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(agentFeedback).values(data);
  return result;
}

export async function getAgentFeedback(agentId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agentFeedback)
    .where(eq(agentFeedback.agentId, agentId))
    .orderBy(desc(agentFeedback.createdAt))
    .limit(limit);
}

// ─── Project Agents ───────────────────────────────────────────────────────────

export async function assignAgentToProject(data: InsertProjectAgent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(projectAgents).values(data);
  return result;
}

export async function getProjectAgents(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    id: projectAgents.id,
    projectId: projectAgents.projectId,
    agentId: projectAgents.agentId,
    roleOverride: projectAgents.roleOverride,
    status: projectAgents.status,
    joinedAt: projectAgents.addedAt,
    agentName: agentDefinitions.name,
    agentRole: agentDefinitions.role,
    agentDivision: agentDefinitions.division,
    agentAvatar: agentDefinitions.avatar,
  })
    .from(projectAgents)
    .leftJoin(agentDefinitions, eq(projectAgents.agentId, agentDefinitions.id))
    .where(eq(projectAgents.projectId, projectId))
    .orderBy(asc(projectAgents.addedAt));
  return rows.map(r => ({
    ...r,
    agentName: r.agentName ?? "Unknown Agent",
    agentRole: r.agentRole ?? "Unknown Role",
    agentDivision: r.agentDivision ?? "Custom",
    agentAvatar: r.agentAvatar ?? "🤖",
  }));
}

export async function updateProjectAgent(id: number, data: Partial<InsertProjectAgent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(projectAgents).set(data).where(eq(projectAgents.id, id));
}

export async function removeProjectAgent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(projectAgents).where(eq(projectAgents.id, id));
}

// ─── Weeklys ──────────────────────────────────────────────────────────────────

export async function createWeekly(data: InsertWeekly) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(weeklys).values(data);
  return result.insertId as number;
}

export async function getWeeklys(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(weeklys)
    .where(eq(weeklys.projectId, projectId))
    .orderBy(desc(weeklys.weekStart));
}

export async function getWeeklyById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(weeklys).where(eq(weeklys.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updateWeekly(id: number, data: Partial<InsertWeekly>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(weeklys).set(data).where(eq(weeklys.id, id));
}

// ─── Weekly Tasks ─────────────────────────────────────────────────────────────

export async function createWeeklyTask(data: InsertWeeklyTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(weeklyTasks).values(data);
  return result.insertId as number;
}

export async function getWeeklyTasks(weeklyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(weeklyTasks)
    .where(eq(weeklyTasks.weeklyId, weeklyId))
    .orderBy(asc(weeklyTasks.position));
}

export async function updateWeeklyTask(id: number, data: Partial<InsertWeeklyTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(weeklyTasks).set(data).where(eq(weeklyTasks.id, id));
}

export async function bulkUpdateWeeklyTaskStatus(weeklyId: number, status: "accepted" | "rejected") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(weeklyTasks)
    .set({ status })
    .where(and(eq(weeklyTasks.weeklyId, weeklyId), eq(weeklyTasks.status, "pending")));
}

// ─── Session Notes ────────────────────────────────────────────────────────────

export async function createSessionNote(data: InsertSessionNote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(sessionNotes).values(data);
  return result.insertId as number;
}

export async function getSessionNotes(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sessionNotes)
    .where(eq(sessionNotes.projectId, projectId))
    .orderBy(desc(sessionNotes.sessionDate));
}

export async function getSessionNoteById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(sessionNotes).where(eq(sessionNotes.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updateSessionNote(id: number, data: Partial<InsertSessionNote>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(sessionNotes).set(data).where(eq(sessionNotes.id, id));
}

export async function getAllActiveProjects() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).where(eq(projects.status, "active"));
}
