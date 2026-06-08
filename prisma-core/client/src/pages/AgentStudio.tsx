import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft, Save, FlaskConical, Brain, Heart, Mic, History,
  User, Plus, Trash2, Star, Zap, RefreshCw, Send, Bot,
  Sparkles, ChevronDown, ChevronRight, MessageSquare, X,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentFromDB = {
  id: number;
  agentKey: string;
  name: string;
  role: string;
  division: string;
  verticalModule: string | null;
  purpose: string | null;
  avatar: string | null;
  customTraits: string | null;
  constitution: string | null;
  reasoningDefault: "intuitive" | "analytical" | "exploratory" | "reflective";
  thinkingStyle: string | null;
  knowledgeDomains: string | null;
  scopeDomains: string | null;
  communicationStyle: string | null;
  emotionalRegister: string | null;
  primarySkills: string | null;
  outputFormats: string | null;
  tone: "professional" | "warm" | "direct" | "playful" | "precise";
  vocabularyLevel: "technical" | "accessible" | "adaptive";
  responseLength: "concise" | "detailed" | "adaptive";
  signaturePhrases: string | null;
  systemPrompt: string | null;
  isDefault: boolean;
  isActive: boolean;
  trainingVersion: number;
  createdAt: Date;
  updatedAt: Date;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseJsonArray(val: string | null | undefined): string[] {
  if (!val) return [];
  try { return JSON.parse(val); } catch { return []; }
}

const UNIVERSAL_TRAITS = [
  "collaborative", "positive", "efficient", "practical", "sincere",
  "honest", "passionate", "creative", "hardworking", "scientific",
  "curious", "experimental", "genius", "expert", "holistic",
  "conscious", "compassionate", "inventive",
];

const EMOJI_OPTIONS = ["🤖", "🎯", "📋", "🎨", "✍️", "🔬", "🏗️", "📱", "💻", "🎬", "🎵", "🎤", "🔊", "🎭", "🔍", "📊", "⚙️", "🛡️", "🌟", "💡", "🧠", "🎪", "🚀", "🌈"];

// ─── Section wrapper with collapse ───────────────────────────────────────────

function Section({
  id, icon: Icon, title, description, accent, defaultOpen = true, children,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  accent: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div id={id} className="rounded-2xl border overflow-hidden"
      style={{ background: "var(--color-surface)", borderColor: "var(--color-border-subtle)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors"
        style={{ background: open ? "transparent" : "var(--color-surface)" }}
      >
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: accent + "22" }}>
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-display)" }}>
            {title}
          </p>
          <p className="text-xs" style={{ color: "var(--color-muted)" }}>{description}</p>
        </div>
        {open
          ? <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-muted)" }} />
          : <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-muted)" }} />
        }
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-5 border-t" style={{ borderColor: "var(--color-border-subtle)" }}>
          <div className="pt-4 space-y-5">{children}</div>
        </div>
      )}
    </div>
  );
}

// ─── Tag Input ────────────────────────────────────────────────────────────────

function TagInput({ label, values, onChange, placeholder }: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInput("");
  };

  return (
    <div>
      <label className="block text-xs font-medium mb-2" style={{ color: "var(--color-muted-foreground)" }}>{label}</label>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {values.map(v => (
            <span key={v} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
              style={{ background: "var(--color-accent-subtle)", color: "var(--color-accent)" }}>
              {v}
              <button onClick={() => onChange(values.filter(x => x !== v))} className="opacity-60 hover:opacity-100 ml-0.5">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder ?? "Type and press Enter"}
          className="h-8 text-xs"
          style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}
        />
        <Button size="sm" variant="outline" onClick={add} className="h-8 px-3 flex-shrink-0">
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Test Chat (slide-in panel) ───────────────────────────────────────────────

function TestChat({ agent, onClose }: { agent: AgentFromDB; onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = useCallback(async () => {
    if (!input.trim() || streaming) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setStreaming(true);

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          agentId: agent.agentKey,
          mode: "agent",
          message: userMsg,
          projectId: 0,
          history: messages,
          systemPromptOverride: agent.systemPrompt,
        }),
      });

      if (!response.body) throw new Error("No stream");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = "";

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            assistantMsg += data;
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: "assistant", content: assistantMsg };
              return updated;
            });
          }
        }
      }
    } catch {
      toast.error("Chat failed");
    } finally {
      setStreaming(false);
    }
  }, [input, streaming, messages, agent]);

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: "var(--color-border-subtle)" }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: "var(--color-surface-elevated)" }}>
          {agent.avatar ?? "🤖"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--color-foreground)" }}>{agent.name}</p>
          <p className="text-xs" style={{ color: "var(--color-muted)" }}>
            {streaming ? "Thinking..." : "Test conversation"}
          </p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--color-muted)" }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Bot className="w-8 h-8 mb-3" style={{ color: "var(--color-muted)" }} />
            <p className="text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>
              Test {agent.name}
            </p>
            <p className="text-xs max-w-xs" style={{ color: "var(--color-muted)" }}>
              Send a message to see how this agent responds with its current configuration.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed"
              style={msg.role === "user"
                ? { background: "var(--color-accent)", color: "white" }
                : { background: "var(--color-surface-elevated)", color: "var(--color-foreground)" }}
            >
              {msg.content || (streaming && msg.role === "assistant" ? (
                <span className="flex gap-1 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--color-muted)", animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--color-muted)", animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--color-muted)", animationDelay: "300ms" }} />
                </span>
              ) : "")}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t flex-shrink-0" style={{ borderColor: "var(--color-border-subtle)" }}>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Message..."
            className="h-9 text-sm"
            style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}
          />
          <Button size="sm" onClick={send} disabled={streaming || !input.trim()} className="h-9 px-3 flex-shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AgentStudio() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const agentId = Number(id);
  const [chatOpen, setChatOpen] = useState(false);

  const { data: agent, isLoading, refetch } = trpc.agents.get.useQuery(
    { id: agentId },
    { enabled: isAuthenticated && !!agentId }
  );

  const { data: knowledge = [], refetch: refetchKnowledge } = trpc.agentKnowledge.list.useQuery(
    { agentId },
    { enabled: isAuthenticated && !!agentId }
  );

  const { data: feedback = [] } = trpc.agentFeedback.list.useQuery(
    { agentId },
    { enabled: isAuthenticated && !!agentId }
  );

  const updateAgent = trpc.agents.update.useMutation({
    onSuccess: () => {
      refetch();
      setIsDirty(false);
      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus("idle"), 2000);
    },
    onError: () => toast.error("Failed to save"),
  });

  const addKnowledge = trpc.agentKnowledge.add.useMutation({
    onSuccess: () => {
      toast.success("Knowledge added");
      refetchKnowledge();
      setKnowledgeForm({ type: "rule", title: "", content: "", sourceUrl: "" });
    },
    onError: () => toast.error("Failed to add knowledge"),
  });

  const removeKnowledge = trpc.agentKnowledge.remove.useMutation({
    onSuccess: () => { toast.success("Knowledge removed"); refetchKnowledge(); },
  });

  // Form state
  const [form, setForm] = useState<Partial<AgentFromDB>>({});
  const [customTraits, setCustomTraits] = useState<string[]>([]);
  const [constitution, setConstitution] = useState<string[]>([]);
  const [primarySkills, setPrimarySkills] = useState<string[]>([]);
  const [outputFormats, setOutputFormats] = useState<string[]>([]);
  const [knowledgeDomains, setKnowledgeDomains] = useState<string[]>([]);
  const [scopeDomains, setScopeDomains] = useState<string[]>([]);
  const [signaturePhrases, setSignaturePhrases] = useState<string[]>([]);
  const [knowledgeForm, setKnowledgeForm] = useState({ type: "rule" as const, title: "", content: "", sourceUrl: "" });
  const [isDirty, setIsDirty] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (agent) {
      setForm(agent);
      setCustomTraits(parseJsonArray(agent.customTraits));
      setConstitution(parseJsonArray(agent.constitution));
      setPrimarySkills(parseJsonArray(agent.primarySkills));
      setOutputFormats(parseJsonArray(agent.outputFormats));
      setKnowledgeDomains(parseJsonArray(agent.knowledgeDomains));
      setScopeDomains(parseJsonArray(agent.scopeDomains));
      setSignaturePhrases(parseJsonArray(agent.signaturePhrases));
    }
  }, [agent]);

  const setField = (key: keyof AgentFromDB, value: unknown) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
    scheduleAutoSave();
  };

  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      setAutoSaveStatus("saving");
      // auto-save fires via the save() function below
      autoSaveTimer.current = null;
    }, 2000);
  }, []);

  // Trigger save when autoSaveStatus transitions to "saving"
  useEffect(() => {
    if (autoSaveStatus === "saving" && agent && isDirty) {
      save();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSaveStatus]);

  const save = () => {
    if (!agent) return;
    updateAgent.mutate({
      id: agent.id,
      name: form.name ?? agent.name,
      role: form.role ?? agent.role,
      division: (form.division ?? agent.division) as "Strategy & Leadership" | "Design & Creative" | "Engineering & Architecture" | "Data, AI & Analytics" | "Content & Community" | "Marketing & Growth" | "Customer Success & Support" | "Operations, Finance & Legal" | "Vertical Module" | "Custom",
      verticalModule: (form.verticalModule ?? agent.verticalModule ?? undefined) as "App & SaaS" | "E-commerce & Retail" | "Fashion, Luxury & Beauty" | "Fintech & Financial Services" | "Health & Life Sciences" | "Media, Content & Creator" | "Interactive Entertainment" | "Education & EdTech" | "Real Estate & Built Environment" | "Industrial, Hardware & Climate" | "Professional Services & B2B" | "Social Impact, Government & Web3" | "Hospitality & Food" | undefined,
      purpose: form.purpose ?? undefined,
      avatar: form.avatar ?? undefined,
      customTraits,
      constitution,
      reasoningDefault: form.reasoningDefault ?? agent.reasoningDefault,
      thinkingStyle: form.thinkingStyle ?? undefined,
      knowledgeDomains,
      scopeDomains,
      communicationStyle: form.communicationStyle ?? undefined,
      emotionalRegister: form.emotionalRegister ?? undefined,
      primarySkills,
      outputFormats,
      tone: form.tone ?? agent.tone,
      vocabularyLevel: form.vocabularyLevel ?? agent.vocabularyLevel,
      responseLength: form.responseLength ?? agent.responseLength,
      signaturePhrases,
      systemPrompt: form.systemPrompt ?? undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-6 h-6 animate-spin" style={{ color: "var(--color-accent)" }} />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>Agent not found</p>
          <Button onClick={() => navigate("/agents/library")} variant="outline" size="sm">
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-10 px-5 py-3"
        style={{ background: "oklch(0.065 0.008 264 / 0.90)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid var(--color-border-subtle)" }}>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/agents/library")}
            className="gap-1.5 text-xs h-8 px-2 flex-shrink-0">
            <ArrowLeft className="w-3.5 h-3.5" /> Library
          </Button>
          <div className="w-px h-5 flex-shrink-0" style={{ background: "var(--color-border-subtle)" }} />
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: "var(--color-surface)" }}>
              {agent.avatar ?? "🤖"}
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-sm truncate"
                style={{ color: "var(--color-foreground)", fontFamily: "var(--font-display)" }}>
                {agent.name}
              </h1>
              <p className="text-xs truncate" style={{ color: "var(--color-muted)" }}>
                {agent.role} · {agent.division}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setChatOpen(o => !o)}
              className="gap-1.5 text-xs h-8 rounded-full"
              style={chatOpen ? { background: "var(--color-accent-subtle)", borderColor: "var(--color-accent)", color: "var(--color-accent)" } : { borderColor: "var(--color-border)" }}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Test
            </Button>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "var(--color-surface-elevated)", color: "var(--color-muted)" }}>
              v{agent.trainingVersion}
            </span>
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex h-[calc(100dvh-57px)]">

        {/* Left: scrollable sections */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-5 space-y-4 max-w-2xl">

            {/* ── Identity ──────────────────────────────────────────────── */}
            <Section
              id="identity"
              icon={User}
              title="Identity"
              description="Name, role, avatar, and core purpose"
              accent="oklch(0.65 0.22 290)"
            >
              {/* Avatar */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: "var(--color-muted-foreground)" }}>Avatar</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setField("avatar", emoji)}
                      className="w-9 h-9 rounded-xl text-lg transition-all"
                      style={{
                        background: form.avatar === emoji ? "var(--color-accent-subtle)" : "var(--color-surface-elevated)",
                        border: form.avatar === emoji ? "2px solid var(--color-accent)" : "2px solid transparent",
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Name</label>
                  <Input value={form.name ?? ""} onChange={e => setField("name", e.target.value)}
                    className="h-9 text-sm" style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Role</label>
                  <Input value={form.role ?? ""} onChange={e => setField("role", e.target.value)}
                    className="h-9 text-sm" style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Division</label>
                <Select value={form.division ?? ""} onValueChange={v => setField("division", v)}>
                  <SelectTrigger className="h-9 text-sm" style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}>
                    {["Strategy & Leadership", "Design & Creative", "Engineering & Architecture", "Data, AI & Analytics", "Content & Community", "Marketing & Growth", "Customer Success & Support", "Operations, Finance & Legal", "Vertical Module", "Custom"].map(d => (
                      <SelectItem key={d} value={d} className="text-sm">{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Vertical Module — only shown when division is Vertical Module */}
              {(form.division ?? agent?.division) === "Vertical Module" && (
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Vertical Module</label>
                  <Select value={form.verticalModule ?? ""} onValueChange={v => setField("verticalModule", v)}>
                    <SelectTrigger className="h-9 text-sm" style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}>
                      <SelectValue placeholder="Select vertical..." />
                    </SelectTrigger>
                    <SelectContent style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}>
                      {["App & SaaS", "E-commerce & Retail", "Fashion, Luxury & Beauty", "Fintech & Financial Services", "Health & Life Sciences", "Media, Content & Creator", "Interactive Entertainment", "Education & EdTech", "Real Estate & Built Environment", "Industrial, Hardware & Climate", "Professional Services & B2B", "Social Impact, Government & Web3", "Hospitality & Food"].map(m => (
                        <SelectItem key={m} value={m} className="text-sm">{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Purpose</label>
                <Textarea value={form.purpose ?? ""} onChange={e => setField("purpose", e.target.value)}
                  placeholder="1-2 sentences describing why this agent exists..."
                  rows={2} className="text-sm resize-none"
                  style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>System Prompt</label>
                <Textarea value={form.systemPrompt ?? ""} onChange={e => setField("systemPrompt", e.target.value)}
                  placeholder="Full system prompt for this agent..."
                  rows={8} className="text-xs font-mono resize-none"
                  style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }} />
              </div>
            </Section>

            {/* ── Soul & Values ─────────────────────────────────────────── */}
            <Section
              id="soul"
              icon={Heart}
              title="Soul & Values"
              description="Character, traits, and behavioral constitution"
              accent="oklch(0.65 0.20 10)"
              defaultOpen={false}
            >
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: "var(--color-muted-foreground)" }}>
                  Universal Traits <span className="opacity-50 font-normal">(shared by all PRISMA agents)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {UNIVERSAL_TRAITS.map(trait => (
                    <span key={trait} className="px-2.5 py-1 rounded-full text-xs"
                      style={{ background: "var(--color-surface-elevated)", color: "var(--color-muted-foreground)", border: "1px solid var(--color-border-subtle)" }}>
                      {trait}
                    </span>
                  ))}
                </div>
              </div>

              <TagInput label="Custom Traits" values={customTraits}
                onChange={v => { setCustomTraits(v); setIsDirty(true); scheduleAutoSave(); }}
                placeholder="Add a unique trait..." />

              <TagInput label="Constitution (Behavioral Rules)" values={constitution}
                onChange={v => { setConstitution(v); setIsDirty(true); scheduleAutoSave(); }}
                placeholder="e.g. Always cite sources when making claims" />

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Communication Style</label>
                <Input value={form.communicationStyle ?? ""} onChange={e => setField("communicationStyle", e.target.value)}
                  placeholder="e.g. Direct and concise, uses visual metaphors"
                  className="h-9 text-sm" style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Emotional Register</label>
                <Input value={form.emotionalRegister ?? ""} onChange={e => setField("emotionalRegister", e.target.value)}
                  placeholder="e.g. Calm under pressure, enthusiastic about craft"
                  className="h-9 text-sm" style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }} />
              </div>
            </Section>

            {/* ── Mind & Craft ──────────────────────────────────────────── */}
            <Section
              id="mind"
              icon={Brain}
              title="Mind & Craft"
              description="Reasoning mode, expertise, and output formats"
              accent="oklch(0.65 0.18 220)"
              defaultOpen={false}
            >
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Default Reasoning Mode</label>
                <Select value={form.reasoningDefault ?? "analytical"} onValueChange={v => setField("reasoningDefault", v)}>
                  <SelectTrigger className="h-9 text-sm" style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}>
                    <SelectItem value="intuitive">Intuitive — fast pattern recognition</SelectItem>
                    <SelectItem value="analytical">Analytical — systematic, evidence-based</SelectItem>
                    <SelectItem value="exploratory">Exploratory — divergent, generative</SelectItem>
                    <SelectItem value="reflective">Reflective — deep consideration, meta-thinking</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Thinking Style</label>
                <Textarea value={form.thinkingStyle ?? ""} onChange={e => setField("thinkingStyle", e.target.value)}
                  placeholder="Describe how this agent approaches problems..."
                  rows={3} className="text-sm resize-none"
                  style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }} />
              </div>

              <TagInput label="Knowledge Domains" values={knowledgeDomains}
                onChange={v => { setKnowledgeDomains(v); setIsDirty(true); scheduleAutoSave(); }}
                placeholder="e.g. React, TypeScript, Performance optimization" />

              <TagInput label="Scope Domains" values={scopeDomains}
                onChange={v => { setScopeDomains(v); setIsDirty(true); scheduleAutoSave(); }}
                placeholder="e.g. App Building, Content Creation, Research" />

              <TagInput label="Primary Skills" values={primarySkills}
                onChange={v => { setPrimarySkills(v); setIsDirty(true); scheduleAutoSave(); }}
                placeholder="e.g. UI design, Prototyping, User research" />

              <TagInput label="Output Formats" values={outputFormats}
                onChange={v => { setOutputFormats(v); setIsDirty(true); scheduleAutoSave(); }}
                placeholder="e.g. Markdown reports, JSON specs, Figma annotations" />
            </Section>

            {/* ── Voice & Style ─────────────────────────────────────────── */}
            <Section
              id="voice"
              icon={Mic}
              title="Voice & Style"
              description="Tone, vocabulary, and signature phrases"
              accent="oklch(0.65 0.20 55)"
              defaultOpen={false}
            >
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Tone</label>
                  <Select value={form.tone ?? "professional"} onValueChange={v => setField("tone", v)}>
                    <SelectTrigger className="h-9 text-sm" style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="warm">Warm</SelectItem>
                      <SelectItem value="direct">Direct</SelectItem>
                      <SelectItem value="playful">Playful</SelectItem>
                      <SelectItem value="precise">Precise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Vocabulary</label>
                  <Select value={form.vocabularyLevel ?? "adaptive"} onValueChange={v => setField("vocabularyLevel", v)}>
                    <SelectTrigger className="h-9 text-sm" style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="accessible">Accessible</SelectItem>
                      <SelectItem value="adaptive">Adaptive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Response Length</label>
                  <Select value={form.responseLength ?? "adaptive"} onValueChange={v => setField("responseLength", v)}>
                    <SelectTrigger className="h-9 text-sm" style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}>
                      <SelectItem value="concise">Concise</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                      <SelectItem value="adaptive">Adaptive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <TagInput label="Signature Phrases" values={signaturePhrases}
                onChange={v => { setSignaturePhrases(v); setIsDirty(true); scheduleAutoSave(); }}
                placeholder="e.g. Let me break this down systematically..." />
            </Section>

            {/* ── Training ──────────────────────────────────────────────── */}
            <Section
              id="training"
              icon={History}
              title="Training"
              description="Knowledge base, rules, and feedback history"
              accent="oklch(0.65 0.18 140)"
              defaultOpen={false}
            >
              {/* Add knowledge form */}
              <div className="rounded-xl border p-4 space-y-3"
                style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border-subtle)" }}>
                <p className="text-xs font-semibold" style={{ color: "var(--color-foreground)" }}>Add Knowledge</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-muted-foreground)" }}>Type</label>
                    <Select value={knowledgeForm.type} onValueChange={v => setKnowledgeForm(f => ({ ...f, type: v as typeof f.type }))}>
                      <SelectTrigger className="h-8 text-xs" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}>
                        <SelectItem value="rule">Rule</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="example">Example</SelectItem>
                        <SelectItem value="persona">Persona</SelectItem>
                        <SelectItem value="url">URL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-muted-foreground)" }}>Title</label>
                    <Input value={knowledgeForm.title} onChange={e => setKnowledgeForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="Knowledge title" className="h-8 text-xs"
                      style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-muted-foreground)" }}>Content</label>
                  <Textarea value={knowledgeForm.content} onChange={e => setKnowledgeForm(f => ({ ...f, content: e.target.value }))}
                    placeholder="Paste document content, rules, or examples..."
                    rows={3} className="text-xs resize-none"
                    style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }} />
                </div>

                <Button size="sm" onClick={() => addKnowledge.mutate({ agentId, ...knowledgeForm })}
                  disabled={addKnowledge.isPending || !knowledgeForm.title || !knowledgeForm.content}
                  className="gap-2 text-xs">
                  {addKnowledge.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Add Knowledge
                </Button>
              </div>

              {/* Knowledge list */}
              {knowledge.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold" style={{ color: "var(--color-muted-foreground)" }}>
                    Knowledge Base ({knowledge.length})
                  </p>
                  {knowledge.map(k => (
                    <div key={k.id} className="flex items-start gap-3 p-3 rounded-xl border"
                      style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border-subtle)" }}>
                      <span className="text-xs px-1.5 py-0.5 rounded-md flex-shrink-0 mt-0.5"
                        style={{ background: "var(--color-accent-subtle)", color: "var(--color-accent)" }}>
                        {k.type}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>{k.title}</p>
                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--color-muted)" }}>{k.content}</p>
                      </div>
                      <button onClick={() => removeKnowledge.mutate({ id: k.id })}
                        className="flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.18 25)" }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Feedback history */}
              {feedback.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold" style={{ color: "var(--color-muted-foreground)" }}>
                    Feedback History ({feedback.length})
                  </p>
                  {feedback.map(f => (
                    <div key={f.id} className="p-3 rounded-xl border"
                      style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border-subtle)" }}>
                      <div className="flex items-center gap-2 mb-1">
                        {f.rating && (
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className="w-3 h-3"
                                style={{ color: i < (f.rating ?? 0) ? "oklch(0.75 0.18 55)" : "var(--color-border)" }}
                                fill={i < (f.rating ?? 0) ? "oklch(0.75 0.18 55)" : "none"} />
                            ))}
                          </div>
                        )}
                        <span className="text-xs" style={{ color: "var(--color-muted)" }}>
                          {new Date(f.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {f.note && <p className="text-xs" style={{ color: "var(--color-muted)" }}>{f.note}</p>}
                      {f.correction && (
                        <p className="text-xs mt-1 italic" style={{ color: "var(--color-foreground)" }}>
                          Correction: {f.correction}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Bottom padding so sticky bar doesn't cover last section */}
            <div className="h-20" />
          </div>
        </div>

        {/* Right: Test Chat panel (slide in) */}
        {chatOpen && (
          <div className="w-80 flex-shrink-0 border-l flex flex-col"
            style={{ borderColor: "var(--color-border-subtle)", background: "var(--color-background)" }}>
            <TestChat agent={agent} onClose={() => setChatOpen(false)} />
          </div>
        )}
      </div>

      {/* ── Sticky save bar ── */}
      {(isDirty || autoSaveStatus === "saved") && (
        <div className="sticky bottom-0 z-10 px-6 py-3 flex items-center justify-between"
          style={{ background: "oklch(0.065 0.008 264 / 0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderTop: "1px solid var(--color-border)" }}>
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            {autoSaveStatus === "saving" ? "Auto-saving..." :
             autoSaveStatus === "saved" ? "✓ Saved" :
             "Unsaved changes"}
          </p>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => {
              if (agent) {
                setForm(agent);
                setCustomTraits(parseJsonArray(agent.customTraits));
                setConstitution(parseJsonArray(agent.constitution));
                setPrimarySkills(parseJsonArray(agent.primarySkills));
                setOutputFormats(parseJsonArray(agent.outputFormats));
                setKnowledgeDomains(parseJsonArray(agent.knowledgeDomains));
                setScopeDomains(parseJsonArray(agent.scopeDomains));
                setSignaturePhrases(parseJsonArray(agent.signaturePhrases));
                setIsDirty(false);
              }
            }}>
              Discard
            </Button>
            <Button size="sm" onClick={save} disabled={updateAgent.isPending}
              className="gap-2 prisma-glow-btn text-white rounded-full">
              {updateAgent.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
