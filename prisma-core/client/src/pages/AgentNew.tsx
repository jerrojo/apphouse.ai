import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Sparkles, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EMOJI_OPTIONS = [
  "🤖", "🎯", "📋", "🎨", "✍️", "🔬", "🏗️", "📱", "💻", "🎬",
  "🎵", "🎤", "🔊", "🎭", "🔍", "📊", "⚙️", "🛡️", "🌟", "💡",
  "🧠", "🎪", "🚀", "🌈", "⚡", "🔮", "🎲", "🦁", "🦊", "🐉",
];

const DIVISIONS = [
  "Strategy & Leadership",
  "Design & Creative",
  "Engineering & Architecture",
  "Data, AI & Analytics",
  "Content & Community",
  "Marketing & Growth",
  "Customer Success & Support",
  "Operations, Finance & Legal",
  "Vertical Module",
] as const;

const VERTICAL_MODULES = [
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
  "Hospitality & Food",
] as const;

const REASONING_MODES = [
  { value: "intuitive",    label: "Intuitive",    description: "Fast pattern recognition" },
  { value: "analytical",   label: "Analytical",   description: "Systematic, evidence-based" },
  { value: "exploratory",  label: "Exploratory",  description: "Divergent, generative" },
  { value: "reflective",   label: "Reflective",   description: "Deep consideration, meta-thinking" },
];

const TONES = ["professional", "warm", "direct", "playful", "precise"] as const;

export default function AgentNew() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);

  // Step 1 — Identity
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [division, setDivision] = useState<string>("Strategy & Leadership");
  const [verticalModule, setVerticalModule] = useState<string>("");
  const [avatar, setAvatar] = useState("🤖");
  const [purpose, setPurpose] = useState("");

  // Step 2 — Mind
  const [reasoningDefault, setReasoningDefault] = useState<"intuitive" | "analytical" | "exploratory" | "reflective">("analytical");
  const [tone, setTone] = useState<typeof TONES[number]>("professional");
  const [thinkingStyle, setThinkingStyle] = useState("");

  // Step 3 — System Prompt
  const [systemPrompt, setSystemPrompt] = useState("");

  const createAgent = trpc.agents.create.useMutation({
    onSuccess: () => {
      toast.success(`${name} is ready`);
      navigate("/agents/library");
    },
    onError: () => toast.error("Failed to create agent"),
  });

  const canProceedStep1 = name.trim().length > 0 && role.trim().length > 0;
  const canProceedStep2 = true; // all have defaults

  const handleCreate = () => {
    // Generate a URL-safe agentKey from name
    const agentKey = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);
    createAgent.mutate({
      agentKey,
      name: name.trim(),
      role: role.trim(),
      division: division as typeof DIVISIONS[number],
      verticalModule: (verticalModule || undefined) as any,
      avatar,
      purpose: purpose.trim() || undefined,
      reasoningDefault,
      tone,
      thinkingStyle: thinkingStyle.trim() || undefined,
      systemPrompt: systemPrompt.trim() || undefined,
    });
  };

  if (!isAuthenticated) return null;

  return (
    <div>
      {/* Top bar */}
      <div className="sticky top-0 z-20 px-5 py-3 flex items-center gap-3"
        style={{ background: "oklch(0.065 0.008 264 / 0.90)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid var(--color-border-subtle)" }}>
        <Button variant="ghost" size="sm" onClick={() => navigate("/agents/library")}
          className="gap-1.5 text-xs h-8 px-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Library
        </Button>
        <div className="w-px h-5" style={{ background: "var(--color-border-subtle)" }} />
        <h1 className="font-bold text-sm" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-display)" }}>
          New Agent
        </h1>

        {/* Step indicator */}
        <div className="ml-auto flex items-center gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-1.5">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background: s === step ? "var(--color-accent)" : s < step ? "var(--color-accent-subtle)" : "var(--color-surface-elevated)",
                  color: s === step ? "white" : s < step ? "var(--color-accent)" : "var(--color-muted)",
                }}
              >
                {s}
              </div>
              {s < 3 && <div className="w-6 h-px" style={{ background: s < step ? "var(--color-accent)" : "var(--color-border-subtle)" }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-5 py-8 space-y-6">

        {/* ── Step 1: Identity ─────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-display)" }}>
                Who is this agent?
              </h2>
              <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                Define the identity and purpose of your new agent.
              </p>
            </div>

            {/* Avatar */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--color-muted-foreground)" }}>Avatar</label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setAvatar(emoji)}
                    className="w-9 h-9 rounded-xl text-lg transition-all"
                    style={{
                      background: avatar === emoji ? "var(--color-accent-subtle)" : "var(--color-surface-elevated)",
                      border: avatar === emoji ? "2px solid var(--color-accent)" : "2px solid transparent",
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Name + Role */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>
                  Name <span style={{ color: "var(--color-accent)" }}>*</span>
                </label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Aria"
                  autoFocus
                  className="h-9 text-sm"
                  style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>
                  Role <span style={{ color: "var(--color-accent)" }}>*</span>
                </label>
                <Input
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  placeholder="e.g. Content Strategist"
                  className="h-9 text-sm"
                  style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}
                />
              </div>
            </div>

            {/* Division */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Division</label>
              <Select value={division} onValueChange={setDivision}>
                <SelectTrigger className="h-9 text-sm" style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}>
                  {DIVISIONS.map(d => <SelectItem key={d} value={d} className="text-sm">{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Vertical Module — only shown when division is Vertical Module */}
            {division === "Vertical Module" && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Vertical Module</label>
                <Select value={verticalModule} onValueChange={setVerticalModule}>
                  <SelectTrigger className="h-9 text-sm" style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}>
                    <SelectValue placeholder="Select vertical..." />
                  </SelectTrigger>
                  <SelectContent style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}>
                    {VERTICAL_MODULES.map(m => <SelectItem key={m} value={m} className="text-sm">{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Purpose */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>
                Purpose <span className="font-normal" style={{ color: "var(--color-muted)" }}>(optional)</span>
              </label>
              <Textarea
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                placeholder="1-2 sentences describing why this agent exists..."
                rows={3}
                className="text-sm resize-none"
                style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}
              />
            </div>

            <Button
              className="w-full prisma-glow-btn text-white gap-2"
              disabled={!canProceedStep1}
              onClick={() => setStep(2)}
            >
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* ── Step 2: Mind & Voice ─────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-display)" }}>
                How does {name || "this agent"} think?
              </h2>
              <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                Set the reasoning mode and communication style.
              </p>
            </div>

            {/* Reasoning mode — card selection */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--color-muted-foreground)" }}>Reasoning Mode</label>
              <div className="grid grid-cols-2 gap-2">
                {REASONING_MODES.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setReasoningDefault(m.value as typeof reasoningDefault)}
                    className="p-3 rounded-xl text-left transition-all"
                    style={{
                      background: reasoningDefault === m.value ? "var(--color-accent-subtle)" : "var(--color-surface-elevated)",
                      border: reasoningDefault === m.value ? "1.5px solid var(--color-accent)" : "1.5px solid var(--color-border-subtle)",
                    }}
                  >
                    <p className="text-xs font-semibold" style={{ color: reasoningDefault === m.value ? "var(--color-accent)" : "var(--color-foreground)" }}>
                      {m.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>{m.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Tone */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--color-muted-foreground)" }}>Tone</label>
              <div className="flex flex-wrap gap-2">
                {TONES.map(t => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all"
                    style={{
                      background: tone === t ? "var(--color-accent)" : "var(--color-surface-elevated)",
                      color: tone === t ? "white" : "var(--color-muted-foreground)",
                      border: tone === t ? "none" : "1px solid var(--color-border-subtle)",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Thinking style */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>
                Thinking Style <span className="font-normal" style={{ color: "var(--color-muted)" }}>(optional)</span>
              </label>
              <Textarea
                value={thinkingStyle}
                onChange={e => setThinkingStyle(e.target.value)}
                placeholder="Describe how this agent approaches problems..."
                rows={3}
                className="text-sm resize-none"
                style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </Button>
              <Button
                className="flex-1 prisma-glow-btn text-white gap-2"
                onClick={() => setStep(3)}
              >
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: System Prompt ────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-display)" }}>
                System Prompt
              </h2>
              <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                Optional — write a full system prompt or leave blank to use the auto-generated one based on your settings.
              </p>
            </div>

            {/* Agent preview card */}
            <div className="flex items-center gap-3 p-4 rounded-2xl border"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-border-subtle)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: "var(--color-surface-elevated)" }}>
                {avatar}
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-display)" }}>
                  {name || "Agent"}
                </p>
                <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                  {role} · {division} · {reasoningDefault} · {tone}
                </p>
              </div>
              <div className="ml-auto">
                <Sparkles className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
              </div>
            </div>

            <div>
              <Textarea
                value={systemPrompt}
                onChange={e => setSystemPrompt(e.target.value)}
                placeholder="You are [name], a [role] at PRISMA. Your purpose is..."
                rows={10}
                className="text-xs font-mono resize-none"
                style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}
              />
              <p className="text-xs mt-1.5" style={{ color: "var(--color-muted)" }}>
                Leave blank to auto-generate from identity and mind settings.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </Button>
              <Button
                className="flex-1 prisma-glow-btn text-white gap-2 rounded-full"
                disabled={createAgent.isPending}
                onClick={handleCreate}
              >
                {createAgent.isPending
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Creating...</>
                  : <><Sparkles className="w-4 h-4" /> Create Agent</>
                }
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
