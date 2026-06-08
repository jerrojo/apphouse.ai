import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Play, ShieldCheck, Zap, Users, Lock, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";


const PILLARS = [
  { key: "User-Friendly", icon: Users, color: "var(--pillar-friendly)", desc: "Usability, mobile-first, LukeW principles" },
  { key: "Zero-Latency", icon: Zap, color: "var(--pillar-latency)", desc: "LCP, INP, CLS, API response times, 60fps" },
  { key: "Fool-Proof", icon: Lock, color: "var(--pillar-foolproof)", desc: "Error handling, validation, resilience, undo" },
  { key: "Accessibility", icon: ShieldCheck, color: "var(--pillar-accessibility)", desc: "WCAG 2.1 AA/AAA, contrast, keyboard, semantics" },
] as const;

function ScoreRing({ score, color, size = 80 }: { score: number; color: string; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-surface-elevated)" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={6}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="score-ring"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PillarCard({ pillar, latestResult, isRunning }: { pillar: typeof PILLARS[number]; latestResult?: any; isRunning: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = pillar.icon;
  const score = latestResult?.score ?? null;
  const findings = latestResult?.findings ? JSON.parse(latestResult.findings) : [];
  const recommendations = latestResult?.recommendations ? JSON.parse(latestResult.recommendations) : [];

  return (
    <div className="prisma-card p-5">
      <div className="flex items-start gap-4">
        {/* Score ring */}
        <div className="relative flex-shrink-0">
          {isRunning ? (
            <div className="w-20 h-20 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: pillar.color }} />
            </div>
          ) : score !== null ? (
            <div className="relative w-20 h-20">
              <ScoreRing score={score} color={pillar.color} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold font-display tabular-nums">{Math.round(score)}</span>
              </div>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "var(--color-surface-elevated)" }}>
              <Icon className="w-8 h-8" style={{ color: pillar.color }} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold font-display text-sm">{pillar.key}</h3>
            {pillar.key === "Accessibility" && latestResult?.wcagLevel && (
              <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: `${pillar.color}20`, color: pillar.color, border: `1px solid ${pillar.color}40` }}>
                WCAG {latestResult.wcagLevel}
              </span>
            )}
          </div>
          <p className="text-xs mb-3" style={{ color: "var(--color-muted)" }}>{pillar.desc}</p>

          {score !== null && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-surface-elevated)" }}>
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${score}%`, background: pillar.color }} />
              </div>
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs flex items-center gap-1"
                style={{ color: "var(--color-muted)" }}
              >
                Details {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && score !== null && (
        <div className="mt-4 pt-4 border-t space-y-4" style={{ borderColor: "var(--color-border-subtle)" }}>
          {findings.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-muted)" }}>Findings</p>
              <ul className="space-y-1.5">
                {findings.map((f: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--color-muted)" }}>
                    <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: "oklch(0.65 0.20 55)" }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {recommendations.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-muted)" }}>Recommendations</p>
              <ul className="space-y-1.5">
                {recommendations.map((r: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--color-muted)" }}>
                    <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: pillar.color }} />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AuditPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = Number(params.projectId);
  const [isRunning, setIsRunning] = useState(false);

  const { data: auditResults, refetch } = trpc.audit.latest.useQuery({ projectId });
  const { data: project } = trpc.projects.get.useQuery({ id: projectId });

  const runAudit = trpc.audit.create.useMutation({
    onSuccess: () => {
      refetch();
      setIsRunning(false);
      toast.success("Audit complete! Scores updated.");
    },
    onError: () => {
      setIsRunning(false);
      toast.error("Audit failed. Please try again.");
    },
  });

  const handleRunAudit = async () => {
    setIsRunning(true);
    const pillarsToRun = ["User-Friendly", "Zero-Latency", "Fool-Proof", "Accessibility"] as const;
    try {
      const results = await Promise.allSettled(
        pillarsToRun.map(async (pillar) => {
          const res = await fetch("/api/audit-run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId, pillar, context: project ? `${project.name}: ${project.description || ""}` : "" }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
            throw new Error(`${pillar}: ${err?.error || res.statusText}`);
          }
          return pillar;
        })
      );
      await refetch();
      const failed = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
      if (failed.length === 0) {
        toast.success("Audit complete — all 4 pillars scored.");
      } else if (failed.length < 4) {
        toast.warning(`Audit partial — ${4 - failed.length}/4 pillars scored.`);
      } else {
        toast.error(`Audit failed: ${(failed[0] as PromiseRejectedResult).reason?.message || "Unknown error"}`);
      }
    } catch (err) {
      toast.error(`Audit error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Get latest result per pillar
  const latestByPillar = PILLARS.reduce((acc: Record<string, { score: number; findings: string | null; recommendations: string | null; wcagLevel: string | null } | null>, p) => {
    const results = auditResults?.filter((r: { pillar: string }) => r.pillar === p.key) || [];
    acc[p.key] = (results[0] as { score: number; findings: string | null; recommendations: string | null; wcagLevel: string | null }) || null;
    return acc;
  }, {} as Record<string, { score: number; findings: string | null; recommendations: string | null; wcagLevel: string | null } | null>);

  const avgScore = PILLARS.reduce((sum, p) => sum + (latestByPillar[p.key]?.score || 0), 0) / PILLARS.length;
  const hasResults = PILLARS.some((p) => latestByPillar[p.key]);

  return (
    <div className="flex flex-col h-full animate-fade-up">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--color-border-subtle)", background: "oklch(0.065 0.008 264 / 0.90)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        <div>
          <h1 className="text-base font-bold font-display">Audit & Universal Rules</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
            Compliance scores across User-Friendly, Zero-Latency, Fool-Proof, and Accessibility pillars
          </p>
        </div>
        <Button
          className="prisma-glow-btn text-white text-sm rounded-full"
          onClick={handleRunAudit}
          disabled={isRunning}
        >
          {isRunning ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Running Audit...</>
          ) : (
            <><Play className="w-4 h-4 mr-2" /> Run Audit</>
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1 p-6">
        {/* Overall score */}
        {hasResults && (
          <div className="prisma-card p-6 mb-6 flex items-center gap-6">
            <div className="relative">
              <ScoreRing score={avgScore} color="oklch(0.62 0.22 275)" size={96} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold font-display tabular-nums">{Math.round(avgScore)}</span>
                <span className="text-xs" style={{ color: "var(--color-muted)" }}>Overall</span>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold font-display mb-1">Universal Rules Score</h2>
              <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                {avgScore >= 90 ? "Excellent — world-class standards met." :
                 avgScore >= 75 ? "Good — a few areas need attention." :
                 avgScore >= 60 ? "Fair — significant improvements needed." :
                 "Needs Work — critical issues to address."}
              </p>
              <div className="flex items-center gap-4 mt-3">
                {PILLARS.map((p) => {
                  const s = latestByPillar[p.key]?.score;
                  return s !== undefined ? (
                    <div key={p.key} className="text-center">
                      <div className="w-8 h-1.5 rounded-full mb-1" style={{ background: p.color, opacity: s / 100 }} />
                      <span className="text-xs font-mono" style={{ color: p.color }}>{Math.round(s)}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        )}

        {/* Pillar cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {PILLARS.map((pillar) => (
            <PillarCard
              key={pillar.key}
              pillar={pillar}
              latestResult={latestByPillar[pillar.key]}
              isRunning={isRunning}
            />
          ))}
        </div>

        {/* Empty state */}
        {!hasResults && !isRunning && (
          <div className="text-center py-12">
            <ShieldCheck className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--color-muted)" }} />
            <h2 className="text-base font-bold font-display mb-2">No Audit Results Yet</h2>
            <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "var(--color-muted)" }}>
              Run your first audit to get compliance scores across all four Universal Rules pillars. The Constructive Feedback Agent will analyze your project against LukeW principles and WCAG 2.1 AA/AAA standards.
            </p>
            <Button className="prisma-glow-btn text-white" onClick={handleRunAudit}>
              <Play className="w-4 h-4 mr-2" /> Run First Audit
            </Button>
          </div>
        )}

        {/* Audit history */}
        {auditResults && auditResults.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold font-display mb-3">Audit History</h3>
            <div className="space-y-1.5">
              {auditResults.slice(0, 12).map((result: { id: number; pillar: string; score: number; createdAt: Date }) => {
                const pillar = PILLARS.find((p) => p.key === result.pillar);
                return (
                  <div key={result.id} className="flex items-center gap-3 px-4 py-2.5 rounded-lg" style={{ background: "var(--color-surface-elevated)" }}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: pillar?.color || "var(--color-muted)" }} />
                    <span className="text-xs font-medium flex-1">{result.pillar}</span>
                    <span className="text-xs font-mono font-bold" style={{ color: pillar?.color || "var(--color-muted)" }}>{Math.round(result.score)}/100</span>
                    <span className="text-xs" style={{ color: "var(--color-muted)" }}>{new Date(result.createdAt).toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
