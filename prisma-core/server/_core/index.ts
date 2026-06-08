import "dotenv/config";
import express from "express";
import { AGENTS } from "@shared/agents";
import { ENV } from "./env";
import * as db from "../db";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // === STREAMING CHAT ENDPOINT ===
  app.post("/api/chat/stream", async (req, res) => {
    const { agentId, divisionName, mode, message, projectId, history } = req.body as {
      agentId?: string;
      divisionName?: string;
      mode: "agent" | "division" | "team";
      message: string;
      projectId: number;
      history?: { role: "user" | "assistant"; content: string }[];
    };

    // Verify session cookie
    const cookieHeader = req.headers.cookie || "";
    const sessionMatch = cookieHeader.match(/prisma_session=([^;]+)/);
    if (!sessionMatch) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const sendEvent = (data: object) => {
      if (!res.writableEnded) res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const streamAgentResponse = async (agent: (typeof AGENTS)[0], msgs: { role: string; content: string }[]) => {
      const response = await fetch(`${ENV.forgeApiUrl}/v1/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${ENV.forgeApiKey}` },
        body: JSON.stringify({ messages: msgs, stream: true }),
      });

      if (!response.ok || !response.body) {
        sendEvent({ type: "error", agentId: agent.id, error: "LLM request failed" });
        return;
      }

      sendEvent({ type: "agent_start", agentId: agent.id, agentName: agent.name, agentIcon: agent.icon, division: agent.division });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";
      let finished = false;

      while (!finished) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") { finished = true; break; }
          try {
            const chunk = JSON.parse(raw);
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              sendEvent({ type: "chunk", agentId: agent.id, delta });
            }
          } catch { /* skip malformed */ }
        }
      }

      sendEvent({ type: "agent_done", agentId: agent.id, fullContent });
      return fullContent;
    };

    try {
      const baseHistory = (history || []).slice(-20);

      // ── Project Context Injection ─────────────────────────────────────────
      // Load agents.md spec and recent change log for this project
      let projectContext = "";
      if (projectId) {
        try {
          const project = await db.getProjectById(projectId);
          if (project) {
            if (project.agentsMd) {
              projectContext += `\n\n## Project Living Spec (agents.md)\n${project.agentsMd}`;
            }
            const recentTasks = await db.getTasksByProject(projectId);
            if (recentTasks && recentTasks.length > 0) {
              const recent = recentTasks.slice(0, 10);
              projectContext += `\n\n## Recent Tasks (last ${recent.length})\n` +
                recent.map((t: { priority: string; location: string; taskType: string; title: string; status: string }) => `- [${t.priority}] ${t.location} > ${t.taskType} > ${t.title} (${t.status})`).join("\n");
            }
          }
        } catch { /* non-blocking */ }
      }

      const injectContext = (systemPrompt: string) =>
        projectContext ? `${systemPrompt}\n\n---\n${projectContext}` : systemPrompt;

      // ── Persist user message ──────────────────────────────────────────────
      if (projectId) {
        try {
await db.createMessage({ projectId, roomId: 0, authorType: "user", authorId: "user", content: message });
        } catch { /* non-blocking */ }
      }

      if (mode === "agent" && agentId) {
        const agent = AGENTS.find((a: (typeof AGENTS)[0]) => a.id === agentId);
        if (!agent) { sendEvent({ type: "error", error: "Agent not found" }); res.end(); return; }
        const msgs = [
          { role: "system", content: injectContext(agent.systemPrompt) },
          ...baseHistory,
          { role: "user", content: message },
        ];
        const fullContent = await streamAgentResponse(agent, msgs);
        // Persist agent response
        if (projectId && fullContent) {
          try { await db.createMessage({ projectId, roomId: 0, authorType: "agent", authorId: agent.id, content: fullContent }); } catch { /* non-blocking */ }
        }

      } else if (mode === "division" && divisionName) {
        const divAgents = AGENTS.filter((a: (typeof AGENTS)[0]) => a.division === divisionName);
        for (const agent of divAgents) {
          const msgs = [
            { role: "system", content: injectContext(agent.systemPrompt) },
            ...baseHistory,
            { role: "user", content: message },
          ];
          const fullContent = await streamAgentResponse(agent, msgs);
          if (projectId && fullContent) {
            try { await db.createMessage({ projectId, roomId: 0, authorType: "agent", authorId: agent.id, content: fullContent }); } catch { /* non-blocking */ }
          }
        }

      } else if (mode === "team") {
        // Ops coordinator decides which agents to engage
        const opsAgent = AGENTS.find((a: (typeof AGENTS)[0]) => a.id === "ops-coordinator")!;
        const routingResponse = await fetch(`${ENV.forgeApiUrl}/v1/chat/completions`, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${ENV.forgeApiKey}` },
          body: JSON.stringify({
            messages: [
              { role: "system", content: injectContext(opsAgent.systemPrompt) },
              { role: "user", content: `The user sent this message to the full team: "${message}"\n\nRespond with a JSON object: { "agentIds": ["id1", "id2"] } — list the 2-4 most relevant specialist agent IDs from: ${AGENTS.map((a: (typeof AGENTS)[0]) => a.id).join(", ")}. Include ops-coordinator if coordination is needed.` },
            ],
            response_format: { type: "json_schema", json_schema: { name: "routing", strict: true, schema: { type: "object", properties: { agentIds: { type: "array", items: { type: "string" } } }, required: ["agentIds"], additionalProperties: false } } },
          }),
        });
        let agentIds: string[] = ["ops-coordinator"];
        try {
          const routingData = await routingResponse.json() as { choices: { message: { content: string } }[] };
          const parsed = JSON.parse(routingData.choices[0]?.message?.content || "{}");
          agentIds = parsed.agentIds || agentIds;
        } catch { /* use default */ }

        sendEvent({ type: "routing", agentIds });

        for (const id of agentIds) {
          const agent = AGENTS.find((a: (typeof AGENTS)[0]) => a.id === id);
          if (!agent) continue;
          const msgs = [
            { role: "system", content: injectContext(agent.systemPrompt) },
            ...baseHistory,
            { role: "user", content: message },
          ];
          const fullContent = await streamAgentResponse(agent, msgs);
          if (projectId && fullContent) {
            try { await db.createMessage({ projectId, roomId: 0, authorType: "agent", authorId: agent.id, content: fullContent }); } catch { /* non-blocking */ }
          }
        }
      }

      sendEvent({ type: "done" });
    } catch (err) {
      sendEvent({ type: "error", error: String(err) });
    } finally {
      res.end();
    }
  });

  // === AUDIT RUN ENDPOINT ===
  app.post("/api/audit-run", async (req, res) => {
    // Auth: require valid session cookie
    const cookieHeader = req.headers.cookie || "";
    const sessionMatch = cookieHeader.match(/prisma_session=([^;]+)/);
    if (!sessionMatch) { res.status(401).json({ error: "Unauthorized" }); return; }
    const { projectId, pillar, context } = req.body as { projectId: number; pillar: string; context: string };
    // Validate pillar
    const VALID_PILLARS = ["User-Friendly", "Zero-Latency", "Fool-Proof", "Accessibility"] as const;
    if (!VALID_PILLARS.includes(pillar as typeof VALID_PILLARS[number])) {
      res.status(400).json({ error: `Invalid pillar: ${pillar}` }); return;
    }
    if (!projectId || typeof projectId !== "number") {
      res.status(400).json({ error: "projectId is required" }); return;
    }
    try {
      const pillarDescriptions: Record<string, string> = {
        "User-Friendly": "intuitive navigation, clear information hierarchy, minimal cognitive load, helpful empty states, consistent UI patterns",
        "Zero-Latency": "fast load times, optimistic updates, skeleton loading, no blocking operations, efficient data fetching",
        "Fool-Proof": "error prevention, clear validation, undo/redo, confirmation dialogs for destructive actions, graceful error recovery",
        "Accessibility": "WCAG 2.1 AA compliance, keyboard navigation, screen reader support, color contrast, focus management",
      };
      const llmRes = await fetch(`${ENV.forgeApiUrl}/v1/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${ENV.forgeApiKey}` },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are a senior UX auditor. Evaluate the given project against the specified quality pillar and return a JSON audit result." },
            { role: "user", content: `Audit this project against the "${pillar}" pillar (${pillarDescriptions[pillar]}).\n\nProject context: ${context || "No context provided"}\n\nReturn a JSON object with:\n- score: number 0-100\n- findings: string (2-3 specific findings as bullet points, use \\n• prefix)\n- recommendations: string (2-3 actionable recommendations as bullet points, use \\n• prefix)\n- wcagLevel: "AA" or "AAA" (only for Accessibility pillar, otherwise null)` },
          ],
          response_format: { type: "json_schema", json_schema: { name: "audit_result", strict: true, schema: { type: "object", properties: { score: { type: "number" }, findings: { type: "string" }, recommendations: { type: "string" }, wcagLevel: { type: ["string", "null"] } }, required: ["score", "findings", "recommendations", "wcagLevel"], additionalProperties: false } } },
        }),
      });
      if (!llmRes.ok) {
        const errText = await llmRes.text();
        res.status(502).json({ error: `LLM request failed: ${llmRes.status} ${errText.slice(0, 200)}` }); return;
      }
      const llmData = await llmRes.json() as { choices: { message: { content: string } }[] };
      const content = llmData.choices?.[0]?.message?.content;
      if (!content) { res.status(502).json({ error: "LLM returned empty response" }); return; }
      const parsed = JSON.parse(content);
      await db.createAuditResult({
        projectId,
        pillar: pillar as typeof VALID_PILLARS[number],
        score: Math.round(Math.max(0, Math.min(100, Number(parsed.score) || 70))),
        findings: JSON.stringify([parsed.findings || ""]),
        recommendations: JSON.stringify([parsed.recommendations || ""]),
        wcagLevel: pillar === "Accessibility" ? ((parsed.wcagLevel === "AAA" ? "AAA" : "AA")) : undefined,
      });
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // === SCHEDULED: Weekly Intelligence ===
  app.post("/api/scheduled/weekly-intelligence", async (req, res) => {
    try {
      const { sdk } = await import("./sdk");
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) {
        return res.status(403).json({ error: "cron-only" });
      }
      // Find the weekly cron config row by taskUid
      const { invokeLLM } = await import("./llm");
      const projects = await db.getAllActiveProjects();
      const results: { projectId: number; weeklyId?: number; error?: string }[] = [];
      for (const project of projects) {
        try {
          const now = new Date();
          const dayOfWeek = now.getDay();
          const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          const lastMonday = new Date(now);
          lastMonday.setDate(now.getDate() - daysToLastMonday - 7);
          lastMonday.setHours(0, 0, 0, 0);
          const lastSunday = new Date(lastMonday);
          lastSunday.setDate(lastMonday.getDate() + 6);
          lastSunday.setHours(23, 59, 59, 999);
          const weeklyId = await db.createWeekly({
            projectId: project.id,
            weekStart: lastMonday,
            weekEnd: lastSunday,
            status: "generating",
          });
          const context = `Project: ${project.name}\nIndustry: ${project.verticalModule ?? "General"}\nDescription: ${project.description ?? ""}\nAgents.md:\n${project.agentsMd ?? ""}`;
          const response = await invokeLLM({
            messages: [
              { role: "system", content: "You are the PRISMA AI Team holding your Monday morning meeting. Generate a Weekly Intelligence Report. Be specific, bold, and think like the best teams in the world." },
              { role: "user", content: `${context}\n\nGenerate: { \"executiveSummary\": \"...\", \"creativeBrief\": \"...\", \"tasks\": [{\"taskType\": \"Feature\", \"title\": \"...\", \"description\": \"...\", \"rationale\": \"...\", \"proposedByAgent\": \"product-manager\", \"priority\": \"high\"}] }` },
            ],
            response_format: { type: "json_object" },
          });
          const rawContent = response.choices[0]?.message?.content;
          const content = typeof rawContent === "string" ? rawContent : "{}";
          const parsed = JSON.parse(content) as { executiveSummary?: string; creativeBrief?: string; tasks?: Array<{ taskType: string; title: string; description?: string; rationale?: string; proposedByAgent?: string; priority: string }> };
          await db.updateWeekly(weeklyId, { status: "ready", executiveSummary: parsed.executiveSummary ?? "", creativeBrief: parsed.creativeBrief ?? "", generatedByAgents: JSON.stringify(["product-manager", "ux-designer", "frontend-engineer"]) });
          const taskTypes = ["Bug", "Tweak", "Feature", "Strategy"] as const;
          const priorities = ["critical", "high", "medium", "low"] as const;
          for (let i = 0; i < (parsed.tasks ?? []).length; i++) {
            const t = (parsed.tasks ?? [])[i];
            await db.createWeeklyTask({ weeklyId, projectId: project.id, taskType: taskTypes.includes(t.taskType as typeof taskTypes[number]) ? t.taskType as typeof taskTypes[number] : "Feature", title: t.title ?? "Task", description: t.description, rationale: t.rationale, proposedByAgent: t.proposedByAgent, priority: priorities.includes(t.priority as typeof priorities[number]) ? t.priority as typeof priorities[number] : "medium", position: i });
          }
          results.push({ projectId: project.id, weeklyId });
        } catch (err) {
          results.push({ projectId: project.id, error: String(err) });
        }
      }
      return res.json({ ok: true, results });
    } catch (err) {
      return res.status(500).json({ error: String(err), timestamp: new Date().toISOString() });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
