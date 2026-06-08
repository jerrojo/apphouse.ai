import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

// ─── Projects Router ──────────────────────────────────────────────────────────

const projectsRouter = router({
  list: protectedProcedure.query(({ ctx }) =>
    db.getProjectsByUser(ctx.user.id)
  ),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => db.getProjectById(input.id)),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      emoji: z.string().optional(),
      verticalModule: z.enum(["App & SaaS", "E-commerce & Retail", "Fashion, Luxury & Beauty", "Fintech & Financial Services", "Health & Life Sciences", "Media, Content & Creator", "Interactive Entertainment", "Education & EdTech", "Real Estate & Built Environment", "Industrial, Hardware & Climate", "Professional Services & B2B", "Social Impact, Government & Web3", "Hospitality & Food"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.createProject({
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        emoji: input.emoji ?? "🚀",
        verticalModule: input.verticalModule,
        agentsMd: `# ${input.name} — agents.md\n\n## Project Overview\n${input.description ?? ""}\n${input.verticalModule ? `\n## Industry Vertical\n${input.verticalModule}\n` : ""}\n## Active Agents\nAll PRISMA agents are available for this project.\n\n## Current Focus\nTBD\n\n## Key Decisions\nNone yet.\n`,
      });
      // Auto-create default rooms
      const defaultRooms = [
        { name: "general", division: "general" as const, position: 0, description: "Cross-cutting discussions for the whole team" },
        { name: "strategy", division: "Strategy & Leadership" as const, position: 1, description: "PM, Business Analyst, and Coordinator workspace" },
        { name: "design", division: "Design & Creative" as const, position: 2, description: "UX, UI, Creative, Motion, and Sound" },
        { name: "engineering", division: "Engineering & Architecture" as const, position: 3, description: "Frontend, Backend, Mobile, and Systems Architect" },
        { name: "data", division: "Data, AI & Analytics" as const, position: 4, description: "Data Analyst, AI Engineer, and Privacy Officer" },
        { name: "qa", division: "Operations, Finance & Legal" as const, position: 5, description: "QA, Compliance, and Standards" },
      ];
      const projectId = (result as { insertId: number }).insertId;
      for (const room of defaultRooms) {
        await db.createRoom({ projectId, ...room });
      }
      return { projectId };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["active", "paused", "completed", "archived"]).optional(),
      agentsMd: z.string().optional(),
      emoji: z.string().optional(),
      verticalModule: z.enum(["App & SaaS", "E-commerce & Retail", "Fashion, Luxury & Beauty", "Fintech & Financial Services", "Health & Life Sciences", "Media, Content & Creator", "Interactive Entertainment", "Education & EdTech", "Real Estate & Built Environment", "Industrial, Hardware & Climate", "Professional Services & B2B", "Social Impact, Government & Web3", "Hospitality & Food"]).optional().nullable(),
    }))
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return db.updateProject(id, data);
    }),

  activateVerticalModule: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      verticalModule: z.enum(["App & SaaS", "E-commerce & Retail", "Fashion, Luxury & Beauty", "Fintech & Financial Services", "Health & Life Sciences", "Media, Content & Creator", "Interactive Entertainment", "Education & EdTech", "Real Estate & Built Environment", "Industrial, Hardware & Climate", "Professional Services & B2B", "Social Impact, Government & Web3", "Hospitality & Food"]).nullable(),
    }))
    .mutation(({ input }) =>
      db.updateProject(input.projectId, { verticalModule: input.verticalModule ?? undefined })
    ),
});

// ─── Rooms Router ─────────────────────────────────────────────────────────────

const roomsRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(({ input }) => db.getRoomsByProject(input.projectId)),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => db.getRoomById(input.id)),

  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      name: z.string().min(1).max(64),
      description: z.string().optional(),
      division: z.enum(["general", "Strategy & Leadership", "Design & Creative", "Engineering & Architecture", "Data, AI & Analytics", "Content & Community", "Marketing & Growth", "Customer Success & Support", "Operations, Finance & Legal", "Vertical Module"]).optional(),
    }))
    .mutation(({ input }) => db.createRoom(input)),
});

// ─── Messages Router ──────────────────────────────────────────────────────────

const messagesRouter = router({
  list: protectedProcedure
    .input(z.object({ roomId: z.number(), limit: z.number().optional() }))
    .query(({ input }) => db.getMessagesByRoom(input.roomId, input.limit)),

  send: protectedProcedure
    .input(z.object({
      roomId: z.number(),
      projectId: z.number(),
      content: z.string().min(1),
      mentions: z.array(z.string()).optional(),
      momentId: z.number().optional(),
    }))
    .mutation(({ input }) =>
      db.createMessage({
        roomId: input.roomId,
        projectId: input.projectId,
        momentId: input.momentId,
        authorType: "user",
        authorId: "user",
        content: input.content,
        mentions: input.mentions ? JSON.stringify(input.mentions) : null,
      })
    ),
});

// ─── Moments Router ───────────────────────────────────────────────────────────

const momentsRouter = router({
  list: protectedProcedure
    .input(z.object({ roomId: z.number() }))
    .query(({ input }) => db.getMomentsByRoom(input.roomId)),

  create: protectedProcedure
    .input(z.object({
      roomId: z.number(),
      projectId: z.number(),
      type: z.enum(["voice", "live"]),
      title: z.string().optional(),
      participantAgents: z.array(z.string()).optional(),
    }))
    .mutation(({ ctx, input }) =>
      db.createMoment({
        roomId: input.roomId,
        projectId: input.projectId,
        userId: ctx.user.id,
        type: input.type,
        title: input.title,
        participantAgents: input.participantAgents ? JSON.stringify(input.participantAgents) : null,
        status: "active",
      })
    ),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      transcript: z.string().optional(),
      audioUrl: z.string().optional(),
      status: z.enum(["active", "processing", "completed"]).optional(),
      durationSeconds: z.number().optional(),
    }))
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return db.updateMoment(id, data);
    }),
});

// ─── Pointer Events Router ────────────────────────────────────────────────────

const pointerRouter = router({
  pin: protectedProcedure
    .input(z.object({
      momentId: z.number(),
      x: z.number(),
      y: z.number(),
      label: z.string().optional(),
      transcriptRef: z.string().optional(),
    }))
    .mutation(({ input }) =>
      db.createPointerEvent({
        momentId: input.momentId,
        authorType: "user",
        authorId: "user",
        x: input.x,
        y: input.y,
        label: input.label,
        isPinned: true,
        transcriptRef: input.transcriptRef,
      })
    ),

  listPinned: protectedProcedure
    .input(z.object({ momentId: z.number() }))
    .query(({ input }) => db.getPinnedPointersByMoment(input.momentId)),
});

// ─── Tasks Router ─────────────────────────────────────────────────────────────

const tasksRouter = router({
  listByProject: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(({ input }) => db.getTasksByProject(input.projectId)),

  listByRoom: protectedProcedure
    .input(z.object({ roomId: z.number() }))
    .query(({ input }) => db.getTasksByRoom(input.roomId)),

  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      roomId: z.number().optional(),
      momentId: z.number().optional(),
      taskType: z.enum(["Bug", "Tweak", "Feature"]),
      location: z.string().min(1).max(512),
      title: z.string().min(1).max(512),
      description: z.string().optional(),
      priority: z.enum(["critical", "high", "medium", "low"]).optional(),
      assignedAgentId: z.string().optional(),
      proposedByAgentId: z.string().optional(),
      pointerX: z.number().optional(),
      pointerY: z.number().optional(),
    }))
    .mutation(({ input }) => db.createTask(input)),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["proposed", "accepted", "in_progress", "done", "rejected"]).optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      priority: z.enum(["critical", "high", "medium", "low"]).optional(),
      location: z.string().optional(),
      taskType: z.enum(["Bug", "Tweak", "Feature"]).optional(),
      assignedAgentId: z.string().optional(),
    }))
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return db.updateTask(id, data);
    }),

  bulkAccept: protectedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      for (const id of input.ids) {
        await db.updateTask(id, { status: "accepted" });
      }
      return { updated: input.ids.length };
    }),

  bulkReject: protectedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      for (const id of input.ids) {
        await db.updateTask(id, { status: "rejected" });
      }
      return { updated: input.ids.length };
    }),
});

// ─── Audit Router ─────────────────────────────────────────────────────────────

const auditRouter = router({
  latest: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(({ input }) => db.getLatestAuditByProject(input.projectId)),

  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      pillar: z.enum(["User-Friendly", "Zero-Latency", "Fool-Proof", "Accessibility"]),
      score: z.number().min(0).max(100),
      findings: z.string().optional(),
      recommendations: z.string().optional(),
      wcagLevel: z.enum(["AA", "AAA"]).optional(),
    }))
    .mutation(({ input }) => db.createAuditResult(input)),
});

// ─── Agents Router ──────────────────────────────────────────────────────────

const agentsRouter = router({
  list: protectedProcedure.query(({ ctx }) =>
    db.getAgentsByUser(ctx.user.id)
  ),

  listDefaults: protectedProcedure.query(() =>
    db.getDefaultAgents()
  ),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => db.getAgentById(input.id)),

  create: protectedProcedure
    .input(z.object({
      agentKey: z.string().min(1).max(64),
      name: z.string().min(1).max(128),
      role: z.string().min(1).max(128),
      division: z.enum(["Strategy & Leadership", "Design & Creative", "Engineering & Architecture", "Data, AI & Analytics", "Content & Community", "Marketing & Growth", "Customer Success & Support", "Operations, Finance & Legal", "Vertical Module", "Custom"]).optional(),
      verticalModule: z.enum(["App & SaaS", "E-commerce & Retail", "Fashion, Luxury & Beauty", "Fintech & Financial Services", "Health & Life Sciences", "Media, Content & Creator", "Interactive Entertainment", "Education & EdTech", "Real Estate & Built Environment", "Industrial, Hardware & Climate", "Professional Services & B2B", "Social Impact, Government & Web3", "Hospitality & Food"]).optional(),
      purpose: z.string().optional(),
      avatar: z.string().optional(),
      customTraits: z.array(z.string()).optional(),
      constitution: z.array(z.string()).optional(),
      reasoningDefault: z.enum(["intuitive", "analytical", "exploratory", "reflective"]).optional(),
      thinkingStyle: z.string().optional(),
      knowledgeDomains: z.array(z.string()).optional(),
      scopeDomains: z.array(z.string()).optional(),
      communicationStyle: z.string().optional(),
      emotionalRegister: z.string().optional(),
      primarySkills: z.array(z.string()).optional(),
      outputFormats: z.array(z.string()).optional(),
      tone: z.enum(["professional", "warm", "direct", "playful", "precise"]).optional(),
      vocabularyLevel: z.enum(["technical", "accessible", "adaptive"]).optional(),
      responseLength: z.enum(["concise", "detailed", "adaptive"]).optional(),
      signaturePhrases: z.array(z.string()).optional(),
      systemPrompt: z.string().optional(),
    }))
    .mutation(({ ctx, input }) =>
      db.createAgentDefinition({
        userId: ctx.user.id,
        agentKey: input.agentKey,
        name: input.name,
        role: input.role,
        division: input.division ?? "Custom",
        purpose: input.purpose,
        avatar: input.avatar ?? "🤖",
        customTraits: input.customTraits ? JSON.stringify(input.customTraits) : null,
        constitution: input.constitution ? JSON.stringify(input.constitution) : null,
        reasoningDefault: input.reasoningDefault ?? "analytical",
        thinkingStyle: input.thinkingStyle,
        knowledgeDomains: input.knowledgeDomains ? JSON.stringify(input.knowledgeDomains) : null,
        scopeDomains: input.scopeDomains ? JSON.stringify(input.scopeDomains) : null,
        communicationStyle: input.communicationStyle,
        emotionalRegister: input.emotionalRegister,
        primarySkills: input.primarySkills ? JSON.stringify(input.primarySkills) : null,
        outputFormats: input.outputFormats ? JSON.stringify(input.outputFormats) : null,
        tone: input.tone ?? "professional",
        vocabularyLevel: input.vocabularyLevel ?? "adaptive",
        responseLength: input.responseLength ?? "adaptive",
        signaturePhrases: input.signaturePhrases ? JSON.stringify(input.signaturePhrases) : null,
        systemPrompt: input.systemPrompt,
        isDefault: false,
        isActive: true,
      })
    ),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      role: z.string().optional(),
      division: z.enum(["Strategy & Leadership", "Design & Creative", "Engineering & Architecture", "Data, AI & Analytics", "Content & Community", "Marketing & Growth", "Customer Success & Support", "Operations, Finance & Legal", "Vertical Module", "Custom"]).optional(),
      verticalModule: z.enum(["App & SaaS", "E-commerce & Retail", "Fashion, Luxury & Beauty", "Fintech & Financial Services", "Health & Life Sciences", "Media, Content & Creator", "Interactive Entertainment", "Education & EdTech", "Real Estate & Built Environment", "Industrial, Hardware & Climate", "Professional Services & B2B", "Social Impact, Government & Web3", "Hospitality & Food"]).optional(),
      purpose: z.string().optional(),
      avatar: z.string().optional(),
      customTraits: z.array(z.string()).optional(),
      constitution: z.array(z.string()).optional(),
      reasoningDefault: z.enum(["intuitive", "analytical", "exploratory", "reflective"]).optional(),
      thinkingStyle: z.string().optional(),
      knowledgeDomains: z.array(z.string()).optional(),
      scopeDomains: z.array(z.string()).optional(),
      communicationStyle: z.string().optional(),
      emotionalRegister: z.string().optional(),
      primarySkills: z.array(z.string()).optional(),
      outputFormats: z.array(z.string()).optional(),
      tone: z.enum(["professional", "warm", "direct", "playful", "precise"]).optional(),
      vocabularyLevel: z.enum(["technical", "accessible", "adaptive"]).optional(),
      responseLength: z.enum(["concise", "detailed", "adaptive"]).optional(),
      signaturePhrases: z.array(z.string()).optional(),
      systemPrompt: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(({ input }) => {
      const { id, customTraits, constitution, knowledgeDomains, scopeDomains, primarySkills, outputFormats, signaturePhrases, ...rest } = input;
      return db.updateAgentDefinition(id, {
        ...rest,
        ...(customTraits !== undefined ? { customTraits: JSON.stringify(customTraits) } : {}),
        ...(constitution !== undefined ? { constitution: JSON.stringify(constitution) } : {}),
        ...(knowledgeDomains !== undefined ? { knowledgeDomains: JSON.stringify(knowledgeDomains) } : {}),
        ...(scopeDomains !== undefined ? { scopeDomains: JSON.stringify(scopeDomains) } : {}),
        ...(primarySkills !== undefined ? { primarySkills: JSON.stringify(primarySkills) } : {}),
        ...(outputFormats !== undefined ? { outputFormats: JSON.stringify(outputFormats) } : {}),
        ...(signaturePhrases !== undefined ? { signaturePhrases: JSON.stringify(signaturePhrases) } : {}),
      });
    }),

  retire: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => db.updateAgentDefinition(input.id, { isActive: false })),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => db.deleteAgentDefinition(input.id)),

  seedDefaults: protectedProcedure
    .mutation(async ({ ctx }) => {
      const existing = await db.getAgentsByUser(ctx.user.id);
      if (existing.length > 0) return { seeded: 0, message: "Agents already seeded" };
      const { AGENTS } = await import("../shared/agents");
      let seeded = 0;
      for (const agent of AGENTS) {
        await db.createAgentDefinition({
          userId: ctx.user.id,
          agentKey: agent.id,
          name: agent.name,
          role: agent.role,
          division: agent.division as "Strategy & Leadership" | "Design & Creative" | "Engineering & Architecture" | "Data, AI & Analytics" | "Content & Community" | "Marketing & Growth" | "Customer Success & Support" | "Operations, Finance & Legal" | "Vertical Module" | "Custom",
          verticalModule: (agent.verticalModule ?? null) as "App & SaaS" | "E-commerce & Retail" | "Fashion, Luxury & Beauty" | "Fintech & Financial Services" | "Health & Life Sciences" | "Media, Content & Creator" | "Interactive Entertainment" | "Education & EdTech" | "Real Estate & Built Environment" | "Industrial, Hardware & Climate" | "Professional Services & B2B" | "Social Impact, Government & Web3" | "Hospitality & Food" | null | undefined,
          purpose: `${agent.role} — ${agent.division} division`,
          avatar: agent.icon,
          systemPrompt: agent.systemPrompt,
          isDefault: true,
          isActive: true,
          reasoningDefault: "analytical",
          tone: "professional",
          vocabularyLevel: "adaptive",
          responseLength: "adaptive",
        });
        seeded++;
      }
      return { seeded, message: `Seeded ${seeded} default agents` };
    }),
});

// ─── Agent Knowledge Router ───────────────────────────────────────────────────

const agentKnowledgeRouter = router({
  list: protectedProcedure
    .input(z.object({ agentId: z.number() }))
    .query(({ input }) => db.getAgentKnowledge(input.agentId)),

  add: protectedProcedure
    .input(z.object({
      agentId: z.number(),
      type: z.enum(["document", "url", "example", "rule", "persona"]),
      title: z.string().min(1).max(255),
      content: z.string().min(1),
      sourceUrl: z.string().optional(),
    }))
    .mutation(({ input }) => db.addAgentKnowledge(input)),

  remove: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => db.removeAgentKnowledge(input.id)),
});

// ─── Agent Feedback Router ────────────────────────────────────────────────────

const agentFeedbackRouter = router({
  list: protectedProcedure
    .input(z.object({ agentId: z.number(), limit: z.number().optional() }))
    .query(({ input }) => db.getAgentFeedback(input.agentId, input.limit)),

  submit: protectedProcedure
    .input(z.object({
      agentId: z.number(),
      messageId: z.number().optional(),
      rating: z.number().min(1).max(5).optional(),
      correction: z.string().optional(),
      note: z.string().optional(),
    }))
    .mutation(({ ctx, input }) =>
      db.addAgentFeedback({ ...input, userId: ctx.user.id })
    ),
});

// ─── Project Agents Router ────────────────────────────────────────────────────

const projectAgentsRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(({ input }) => db.getProjectAgents(input.projectId)),

  assign: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      agentId: z.number(),
      roleOverride: z.string().optional(),
    }))
    .mutation(({ input }) =>
      db.assignAgentToProject({
        projectId: input.projectId,
        agentId: input.agentId,
        roleOverride: input.roleOverride,
        status: "active",
      })
    ),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["active", "benched", "retired"]),
    }))
    .mutation(({ input }) =>
      db.updateProjectAgent(input.id, { status: input.status })
    ),

  remove: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => db.removeProjectAgent(input.id)),
});

// ─── Weeklys Router ─────────────────────────────────────────────────────────

const weeklysRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(({ input }) => db.getWeeklys(input.projectId)),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const weekly = await db.getWeeklyById(input.id);
      if (!weekly) return null;
      const tasks = await db.getWeeklyTasks(input.id);
      return { ...weekly, tasks };
    }),

  generate: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input }) => {
      const { invokeLLM } = await import("./_core/llm");
      const project = await db.getProjectById(input.projectId);
      if (!project) throw new Error("Project not found");

      // Compute week boundaries (last Monday → last Sunday)
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon
      const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const lastMonday = new Date(now);
      lastMonday.setDate(now.getDate() - daysToLastMonday - 7);
      lastMonday.setHours(0, 0, 0, 0);
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      lastSunday.setHours(23, 59, 59, 999);

      const weeklyId = await db.createWeekly({
        projectId: input.projectId,
        weekStart: lastMonday,
        weekEnd: lastSunday,
        status: "generating",
      });

      const context = `Project: ${project.name}\nIndustry: ${project.verticalModule ?? "General"}\nDescription: ${project.description ?? "No description"}\nAgents.md:\n${project.agentsMd ?? ""}`;

      const systemPrompt = `You are the PRISMA AI Team — a collective of world-class specialists (PM, UX, Engineering, Creative, Data, Marketing, QA) holding your Monday morning team meeting. Your job: review the past week and create an ambitious, creative, and actionable plan for the week ahead. Be specific, bold, and think like the best teams in the world (Apple, Airbnb, Stripe, Linear). Always aim for the highest possible quality and impact.`;

      const userPrompt = `${context}\n\nGenerate a Monday Weekly Intelligence Report with:\n1. EXECUTIVE SUMMARY (markdown, 3-5 paragraphs): What happened last week? Key wins, blockers, and learnings. Be honest and insightful.\n2. CREATIVE BRIEF (markdown, 2-3 paragraphs): Strategic direction and creative vision for this week. What should the team focus on to move the needle most?\n3. TASK LIST (JSON array): 8-12 specific, actionable tasks the team proposes. Each task:\n   - taskType: "Bug" | "Tweak" | "Feature" | "Strategy"\n   - title: short, action-oriented (max 80 chars)\n   - description: specific details (1-2 sentences)\n   - rationale: why this matters for the project goals\n   - proposedByAgent: the agent role proposing it (e.g. "ux-designer", "product-manager", "frontend-engineer")\n   - priority: "critical" | "high" | "medium" | "low"\n\nRespond with valid JSON: { "executiveSummary": "...", "creativeBrief": "...", "tasks": [...] }`;

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        });
        const rawContent = response.choices[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : "{}";
        const parsed = JSON.parse(content) as { executiveSummary?: string; creativeBrief?: string; tasks?: Array<{ taskType: string; title: string; description?: string; rationale?: string; proposedByAgent?: string; priority: string }> };

        await db.updateWeekly(weeklyId, {
          status: "ready",
          executiveSummary: parsed.executiveSummary ?? "",
          creativeBrief: parsed.creativeBrief ?? "",
          generatedByAgents: JSON.stringify(["product-manager", "ux-designer", "frontend-engineer", "creative-director", "data-analyst"]),
        });

        const taskTypes = ["Bug", "Tweak", "Feature", "Strategy"] as const;
        const priorities = ["critical", "high", "medium", "low"] as const;
        const tasks = parsed.tasks ?? [];
        for (let i = 0; i < tasks.length; i++) {
          const t = tasks[i];
          const validType = taskTypes.includes(t.taskType as typeof taskTypes[number]) ? t.taskType as typeof taskTypes[number] : "Feature";
          const validPriority = priorities.includes(t.priority as typeof priorities[number]) ? t.priority as typeof priorities[number] : "medium";
          await db.createWeeklyTask({
            weeklyId,
            projectId: input.projectId,
            taskType: validType,
            title: t.title ?? "Untitled task",
            description: t.description,
            rationale: t.rationale,
            proposedByAgent: t.proposedByAgent,
            priority: validPriority,
            position: i,
          });
        }
        return { weeklyId, taskCount: tasks.length };
      } catch (err) {
        await db.updateWeekly(weeklyId, { status: "pending" });
        throw err;
      }
    }),

  updateTask: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "accepted", "rejected"]).optional(),
      editedTitle: z.string().optional(),
      editedDescription: z.string().optional(),
    }))
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return db.updateWeeklyTask(id, data);
    }),

  acceptAll: protectedProcedure
    .input(z.object({ weeklyId: z.number() }))
    .mutation(({ input }) => db.bulkUpdateWeeklyTaskStatus(input.weeklyId, "accepted")),

  execute: protectedProcedure
    .input(z.object({ weeklyId: z.number() }))
    .mutation(async ({ input }) => {
      // Mark weekly as executed and accepted tasks as done
      await db.updateWeekly(input.weeklyId, { status: "executed", executedAt: new Date() });
      return { ok: true };
    }),
});

// ─── Session Notes Router ─────────────────────────────────────────────────────

const sessionNotesRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(({ input }) => db.getSessionNotes(input.projectId)),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => db.getSessionNoteById(input.id)),

  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      title: z.string().min(1).max(255),
      sessionDate: z.string(),
      transcript: z.string().optional(),
      summary: z.string().optional(),
      decisions: z.string().optional(),
      agentOutputs: z.string().optional(),
      momentId: z.number().optional(),
    }))
    .mutation(({ input }) =>
      db.createSessionNote({
        ...input,
        sessionDate: new Date(input.sessionDate),
      })
    ),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      summary: z.string().optional(),
      decisions: z.string().optional(),
      agentOutputs: z.string().optional(),
    }))
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return db.updateSessionNote(id, data);
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  projects: projectsRouter,
  rooms: roomsRouter,
  messages: messagesRouter,
  moments: momentsRouter,
  pointer: pointerRouter,
  tasks: tasksRouter,
  audit: auditRouter,
  agents: agentsRouter,
  agentKnowledge: agentKnowledgeRouter,
  agentFeedback: agentFeedbackRouter,
    projectAgents: projectAgentsRouter,
  weeklys: weeklysRouter,
  sessionNotes: sessionNotesRouter,
});
export type AppRouter = typeof appRouter;
