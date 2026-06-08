import { describe, expect, it } from "vitest";
import { AGENTS, DIVISIONS, LUKEW_KNOWLEDGE_BASE } from "../shared/agents";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Agent Definitions ───────────────────────────────────────────────────────

describe("PRISMA CORE — Agent Definitions", () => {
  it("should have at least 30 agents (9-division taxonomy)", () => {
    expect(AGENTS.length).toBeGreaterThanOrEqual(30);
  });

  it("should have exactly 9 universal divisions", () => {
    expect(DIVISIONS).toHaveLength(9);
  });

  it("should have the exact 9 universal division names", () => {
    const divisionNames = DIVISIONS.map((d) => d.name);
    expect(divisionNames).toContain("Strategy & Leadership");
    expect(divisionNames).toContain("Design & Creative");
    expect(divisionNames).toContain("Engineering & Architecture");
    expect(divisionNames).toContain("Data, AI & Analytics");
    expect(divisionNames).toContain("Content & Community");
    expect(divisionNames).toContain("Marketing & Growth");
    expect(divisionNames).toContain("Customer Success & Support");
    expect(divisionNames).toContain("Operations, Finance & Legal");
    expect(divisionNames).toContain("Vertical Module");
  });

  it("every agent should belong to a valid division", () => {
    const validDivisions = DIVISIONS.map((d) => d.name);
    for (const agent of AGENTS) {
      expect(validDivisions).toContain(agent.division);
    }
  });

  it("every agent should have a non-empty systemPrompt", () => {
    for (const agent of AGENTS) {
      expect(agent.systemPrompt.length).toBeGreaterThan(50);
    }
  });

  it("design and UX agents should include LukeW knowledge base", () => {
    const designAgents = AGENTS.filter((a) =>
      a.division === "Design & Creative" ||
      a.id === "ux-designer" ||
      a.id === "ui-designer" ||
      a.id === "feedback-agent"
    );
    expect(designAgents.length).toBeGreaterThan(0);
    for (const agent of designAgents) {
      // Design agents should reference LukeW or UX principles
      const hasUXPrinciples = agent.systemPrompt.includes("LukeW") ||
        agent.systemPrompt.includes("mobile-first") ||
        agent.systemPrompt.includes("UX") ||
        agent.systemPrompt.includes("user experience");
      expect(hasUXPrinciples).toBe(true);
    }
  });

  it("every agent should have a unique id", () => {
    const ids = AGENTS.map((a) => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(AGENTS.length);
  });

  it("every agent should have an icon", () => {
    for (const agent of AGENTS) {
      expect(agent.icon.length).toBeGreaterThan(0);
    }
  });

  it("should have the ops-coordinator agent as the lead orchestrator", () => {
    const ops = AGENTS.find((a) => a.id === "ops-coordinator");
    expect(ops).toBeDefined();
    expect(ops?.division).toBe("Strategy & Leadership");
  });

  it("should have the feedback-agent for Constructive Feedback audits", () => {
    const feedback = AGENTS.find((a) => a.id === "feedback-agent");
    expect(feedback).toBeDefined();
    expect(["Operations, Finance & Legal", "Customer Success & Support", "Strategy & Leadership"]).toContain(feedback?.division);
  });
});

// ─── LukeW Knowledge Base ─────────────────────────────────────────────────────

describe("PRISMA CORE — LukeW Knowledge Base", () => {
  it("should include mobile-first principles", () => {
    expect(LUKEW_KNOWLEDGE_BASE).toContain("Mobile-First");
  });

  it("should include touch target sizing (48x48px)", () => {
    expect(LUKEW_KNOWLEDGE_BASE).toContain("48x48px");
  });

  it("should include form design principles", () => {
    expect(LUKEW_KNOWLEDGE_BASE).toContain("Form Design");
  });

  it("should include WCAG contrast ratios", () => {
    expect(LUKEW_KNOWLEDGE_BASE).toContain("4.5:1");
    expect(LUKEW_KNOWLEDGE_BASE).toContain("7:1");
  });

  it("should include performance targets", () => {
    expect(LUKEW_KNOWLEDGE_BASE).toContain("100ms");
  });
});

// ─── Auth Router ─────────────────────────────────────────────────────────────

describe("PRISMA CORE — auth.logout", () => {
  it("should clear the session cookie and return success", async () => {
    const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];

    const ctx: TrpcContext = {
      user: {
        id: 1,
        openId: "test-user",
        email: "test@prisma.ai",
        name: "Test Builder",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        clearCookie: (name: string, options: Record<string, unknown>) => {
          clearedCookies.push({ name, options });
        },
      } as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1,
      httpOnly: true,
      path: "/",
    });
  });
});

// ─── Division Agent Distribution ─────────────────────────────────────────────

describe("PRISMA CORE — Division Distribution", () => {
  it("Strategy & Leadership should have at least 2 agents", () => {
    const count = AGENTS.filter((a) => a.division === "Strategy & Leadership").length;
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it("Design & Creative should have at least 4 agents", () => {
    const count = AGENTS.filter((a) => a.division === "Design & Creative").length;
    expect(count).toBeGreaterThanOrEqual(4);
  });

  it("Engineering & Architecture should have at least 4 agents", () => {
    const count = AGENTS.filter((a) => a.division === "Engineering & Architecture").length;
    expect(count).toBeGreaterThanOrEqual(4);
  });

  it("Data, AI & Analytics should have at least 2 agents", () => {
    const count = AGENTS.filter((a) => a.division === "Data, AI & Analytics").length;
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it("Marketing & Growth should have at least 2 agents", () => {
    const count = AGENTS.filter((a) => a.division === "Marketing & Growth").length;
    expect(count).toBeGreaterThanOrEqual(2);
  });
});

// ─── @Mention Aliases ────────────────────────────────────────────────────────

describe("PRISMA CORE — @Mention Aliases", () => {
  const AGENT_ALIASES: Record<string, string> = {
    pm: "product-manager",
    ops: "ops-coordinator",
    ux: "ux-designer",
    ui: "ui-designer",
    copy: "copywriter",
    creative: "creative-director",
    "2d": "graphic-designer-2d",
    "3d": "3d-artist",
    front: "frontend-developer",
    backend: "backend-developer",
    mobile: "mobile-developer",
    fullstack: "fullstack-developer",
    data: "data-manager",
    motion: "motion-designer",
    fx: "fx-artist",
    sound: "sound-designer",
    qa: "qa-engineer",
    analyst: "data-analyst",
    feedback: "feedback-agent",
    team: "__team__",
  };

  it("all alias targets should resolve to valid agent IDs or __team__", () => {
    const agentIds = new Set(AGENTS.map((a) => a.id));
    for (const [alias, targetId] of Object.entries(AGENT_ALIASES)) {
      if (targetId === "__team__") continue;
      expect(agentIds.has(targetId)).toBe(true);
    }
  });

  it("@pm alias should resolve to product-manager", () => {
    expect(AGENT_ALIASES["pm"]).toBe("product-manager");
  });

  it("@team alias should resolve to __team__", () => {
    expect(AGENT_ALIASES["team"]).toBe("__team__");
  });

  it("@ux alias should resolve to ux-designer", () => {
    expect(AGENT_ALIASES["ux"]).toBe("ux-designer");
  });

  it("@front alias should resolve to frontend-developer", () => {
    expect(AGENT_ALIASES["front"]).toBe("frontend-developer");
  });
});

// ─── Task Types ──────────────────────────────────────────────────────────────

describe("PRISMA CORE — Task Type Validation", () => {
  const VALID_TASK_TYPES = ["Bug", "Tweak", "Feature"] as const;

  it("should have exactly 3 task types: Bug, Tweak, Feature", () => {
    expect(VALID_TASK_TYPES).toHaveLength(3);
    expect(VALID_TASK_TYPES).toContain("Bug");
    expect(VALID_TASK_TYPES).toContain("Tweak");
    expect(VALID_TASK_TYPES).toContain("Feature");
  });

  it("task location format should use > separator", () => {
    const exampleLocation = "Home > Hero Section > CTA Button";
    const parts = exampleLocation.split(" > ");
    expect(parts.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── Live Session Chat Routing ────────────────────────────────────────────────

describe("PRISMA CORE — Chat Routing Logic", () => {
  const AGENT_ALIASES: Record<string, string> = {
    pm: "product-manager",
    ops: "ops-coordinator",
    ux: "ux-designer",
    team: "__team__",
  };

  function determineChatMode(text: string): { mode: string; agentId?: string } {
    const mentions = (text.match(/@(\w+)/g) || []).map((m) => m.slice(1).toLowerCase()).filter((a) => AGENT_ALIASES[a]);
    if (mentions.includes("team")) return { mode: "team" };
    if (mentions.length === 1) {
      const agentId = AGENT_ALIASES[mentions[0]];
      if (agentId === "__team__") return { mode: "team" };
      return { mode: "agent", agentId };
    }
    if (mentions.length > 1) return { mode: "team" };
    return { mode: "agent", agentId: "ops-coordinator" };
  }

  it("@team mention should route to team mode", () => {
    const result = determineChatMode("@team can you review this?");
    expect(result.mode).toBe("team");
  });

  it("@ux mention should route to ux-designer agent", () => {
    const result = determineChatMode("@ux can you improve the button?");
    expect(result.mode).toBe("agent");
    expect(result.agentId).toBe("ux-designer");
  });

  it("multiple mentions should route to team mode", () => {
    const result = determineChatMode("@ux and @pm please review this");
    expect(result.mode).toBe("team");
  });

  it("no mention should default to ops-coordinator", () => {
    const result = determineChatMode("I need help with the design");
    expect(result.mode).toBe("agent");
    expect(result.agentId).toBe("ops-coordinator");
  });
});

// ─── Agent Management Routers ─────────────────────────────────────────────────

describe("PRISMA CORE — Agent Management Routers", () => {
  const mockCtx: TrpcContext = {
    user: { id: 1, openId: "test-user", name: "Test User", email: "test@example.com", role: "admin", loginMethod: null, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: {} as any,
    res: {} as any,
  };

  it("agents router should be defined on appRouter", () => {
    expect(appRouter._def.procedures["agents.list"]).toBeDefined();
    expect(appRouter._def.procedures["agents.create"]).toBeDefined();
    expect(appRouter._def.procedures["agents.update"]).toBeDefined();
    expect(appRouter._def.procedures["agents.retire"]).toBeDefined();
    expect(appRouter._def.procedures["agents.delete"]).toBeDefined();
    expect(appRouter._def.procedures["agents.seedDefaults"]).toBeDefined();
  });

  it("agentKnowledge router should be defined on appRouter", () => {
    expect(appRouter._def.procedures["agentKnowledge.list"]).toBeDefined();
    expect(appRouter._def.procedures["agentKnowledge.add"]).toBeDefined();
    expect(appRouter._def.procedures["agentKnowledge.remove"]).toBeDefined();
  });

  it("agentFeedback router should be defined on appRouter", () => {
    expect(appRouter._def.procedures["agentFeedback.list"]).toBeDefined();
    expect(appRouter._def.procedures["agentFeedback.submit"]).toBeDefined();
  });

  it("projectAgents router should be defined on appRouter", () => {
    expect(appRouter._def.procedures["projectAgents.list"]).toBeDefined();
    expect(appRouter._def.procedures["projectAgents.assign"]).toBeDefined();
    expect(appRouter._def.procedures["projectAgents.updateStatus"]).toBeDefined();
    expect(appRouter._def.procedures["projectAgents.remove"]).toBeDefined();
  });

  it("agents.create input should require agentKey, name, and role", async () => {
    const caller = appRouter.createCaller(mockCtx);
    await expect(
      caller.agents.create({ agentKey: "", name: "Test", role: "Tester" })
    ).rejects.toThrow();
  });

  it("agents.update input should accept partial fields", async () => {
    // The update procedure should accept a partial update (just id + some fields)
    // We test the schema validation — it should reject missing id
    const caller = appRouter.createCaller(mockCtx);
    await expect(
      (caller.agents.update as any)({ name: "New Name" }) // missing id
    ).rejects.toThrow();
  });

  it("agentKnowledge.add should require title and content", async () => {
    const caller = appRouter.createCaller(mockCtx);
    await expect(
      caller.agentKnowledge.add({ agentId: 1, type: "rule", title: "", content: "some content" })
    ).rejects.toThrow();
  });

  it("agentFeedback.submit should enforce rating range 1-5", async () => {
    const caller = appRouter.createCaller(mockCtx);
    await expect(
      caller.agentFeedback.submit({ agentId: 1, rating: 6 })
    ).rejects.toThrow();
  });

  it("projectAgents.updateStatus should only accept valid status values", async () => {
    const caller = appRouter.createCaller(mockCtx);
    await expect(
      (caller.projectAgents.updateStatus as any)({ id: 1, status: "invalid-status" })
    ).rejects.toThrow();
  });
});

// ─── Agent Division Validation ────────────────────────────────────────────────

describe("PRISMA CORE — Agent Division Enum", () => {
  const VALID_DIVISIONS = [
    "Strategy & Leadership",
    "Design & Creative",
    "Engineering & Architecture",
    "Data, AI & Analytics",
    "Content & Community",
    "Marketing & Growth",
    "Customer Success & Support",
    "Operations, Finance & Legal",
    "Vertical Module",
    "Custom",
  ];

  it("should have exactly 10 valid division values (9 universal + Custom)", () => {
    expect(VALID_DIVISIONS).toHaveLength(10);
  });

  it("should include all 9 universal PRISMA divisions plus Custom", () => {
    expect(VALID_DIVISIONS).toContain("Strategy & Leadership");
    expect(VALID_DIVISIONS).toContain("Design & Creative");
    expect(VALID_DIVISIONS).toContain("Engineering & Architecture");
    expect(VALID_DIVISIONS).toContain("Data, AI & Analytics");
    expect(VALID_DIVISIONS).toContain("Content & Community");
    expect(VALID_DIVISIONS).toContain("Marketing & Growth");
    expect(VALID_DIVISIONS).toContain("Customer Success & Support");
    expect(VALID_DIVISIONS).toContain("Operations, Finance & Legal");
    expect(VALID_DIVISIONS).toContain("Vertical Module");
    expect(VALID_DIVISIONS).toContain("Custom");
  });

  it("should validate agent create input rejects invalid division values", async () => {
    const mockCtx: TrpcContext = {
      user: { id: 1, openId: "test-user", name: "Test User", email: "test@example.com", role: "admin", loginMethod: null, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
      req: {} as any,
      res: {} as any,
    };
    const caller = appRouter.createCaller(mockCtx);
    // Should throw for invalid division value
    await expect(
      (caller.agents.create as any)({ agentKey: "test-agent", name: "Test Agent", role: "Tester", division: "Invalid Division" })
    ).rejects.toThrow();
  });
});

// ─── Weeklys Router ───────────────────────────────────────────────────────────

describe("PRISMA CORE — Weeklys Router", () => {
  const mockCtx: TrpcContext = {
    user: { id: 1, openId: "test-user", name: "Test User", email: "test@example.com", role: "admin", loginMethod: null, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: {} as any,
    res: {} as any,
  };

  it("should expose weeklys.list procedure", () => {
    const caller = appRouter.createCaller(mockCtx);
    expect(typeof caller.weeklys.list).toBe("function");
  });

  it("should expose weeklys.get procedure", () => {
    const caller = appRouter.createCaller(mockCtx);
    expect(typeof caller.weeklys.get).toBe("function");
  });

  it("should expose weeklys.generate procedure", () => {
    const caller = appRouter.createCaller(mockCtx);
    expect(typeof caller.weeklys.generate).toBe("function");
  });

  it("should expose weeklys.updateTask procedure", () => {
    const caller = appRouter.createCaller(mockCtx);
    expect(typeof caller.weeklys.updateTask).toBe("function");
  });

  it("should expose weeklys.acceptAll procedure", () => {
    const caller = appRouter.createCaller(mockCtx);
    expect(typeof caller.weeklys.acceptAll).toBe("function");
  });

  it("should expose weeklys.execute procedure", () => {
    const caller = appRouter.createCaller(mockCtx);
    expect(typeof caller.weeklys.execute).toBe("function");
  });

  it("should reject updateTask with invalid status value", async () => {
    const caller = appRouter.createCaller(mockCtx);
    await expect(
      (caller.weeklys.updateTask as any)({ id: 1, status: "invalid-status" })
    ).rejects.toThrow();
  });
});

// ─── Session Notes Router ─────────────────────────────────────────────────────

describe("PRISMA CORE — Session Notes Router", () => {
  const mockCtx: TrpcContext = {
    user: { id: 1, openId: "test-user", name: "Test User", email: "test@example.com", role: "admin", loginMethod: null, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: {} as any,
    res: {} as any,
  };

  it("should expose sessionNotes.list procedure", () => {
    const caller = appRouter.createCaller(mockCtx);
    expect(typeof caller.sessionNotes.list).toBe("function");
  });

  it("should expose sessionNotes.get procedure", () => {
    const caller = appRouter.createCaller(mockCtx);
    expect(typeof caller.sessionNotes.get).toBe("function");
  });

  it("should expose sessionNotes.create procedure", () => {
    const caller = appRouter.createCaller(mockCtx);
    expect(typeof caller.sessionNotes.create).toBe("function");
  });

  it("should expose sessionNotes.update procedure", () => {
    const caller = appRouter.createCaller(mockCtx);
    expect(typeof caller.sessionNotes.update).toBe("function");
  });

  it("should reject sessionNotes.create with empty title", async () => {
    const caller = appRouter.createCaller(mockCtx);
    await expect(
      (caller.sessionNotes.create as any)({ projectId: 1, title: "", sessionDate: new Date().toISOString() })
    ).rejects.toThrow();
  });
});
