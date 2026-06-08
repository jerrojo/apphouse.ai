import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Search, Plus, Sparkles, FlaskConical, Users, BookOpen,
  Cpu, Palette, Star, Archive, RefreshCw,
  TrendingUp, MessageSquare, Rocket, HeartHandshake, Scale, Puzzle,
} from "lucide-react";

const DIVISION_META: Record<string, { color: string; icon: React.ElementType; short: string }> = {
  "Strategy & Leadership":       { color: "oklch(0.65 0.18 250)", icon: Star,           short: "Strategy"    },
  "Design & Creative":           { color: "oklch(0.65 0.20 310)", icon: Palette,        short: "Design"      },
  "Engineering & Architecture":  { color: "oklch(0.65 0.18 165)", icon: Cpu,            short: "Engineering" },
  "Data, AI & Analytics":        { color: "oklch(0.65 0.20 55)",  icon: TrendingUp,     short: "Data & AI"   },
  "Content & Community":         { color: "oklch(0.65 0.20 30)",  icon: MessageSquare,  short: "Content"     },
  "Marketing & Growth":          { color: "oklch(0.65 0.22 15)",  icon: Rocket,         short: "Growth"      },
  "Customer Success & Support":  { color: "oklch(0.65 0.18 140)", icon: HeartHandshake, short: "Success"     },
  "Operations, Finance & Legal": { color: "oklch(0.65 0.18 200)", icon: Scale,          short: "Ops"         },
  "Vertical Module":             { color: "oklch(0.65 0.22 290)", icon: Puzzle,         short: "Module"      },
  "Custom":                      { color: "oklch(0.65 0.22 270)", icon: Sparkles,       short: "Custom"      },
};

const DIVISION_ORDER = [
  "Strategy & Leadership", "Design & Creative", "Engineering & Architecture",
  "Data, AI & Analytics", "Content & Community", "Marketing & Growth",
  "Customer Success & Support", "Operations, Finance & Legal", "Vertical Module", "Custom",
];

type AgentFromDB = {
  id: number;
  agentKey: string;
  name: string;
  role: string;
  division: string;
  purpose: string | null;
  avatar: string | null;
  isDefault: boolean;
  isActive: boolean;
  trainingVersion: number;
  createdAt: Date;
};

function AgentCard({ agent, onRetire }: {
  agent: AgentFromDB;
  onRetire: (id: number) => void;
}) {
  const divMeta = DIVISION_META[agent.division] ?? DIVISION_META["Custom"];
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: "var(--color-surface)",
        border: `1px solid ${hovered ? divMeta.color + "66" : "var(--color-border-subtle)"}`,
        opacity: agent.isActive ? 1 : 0.45,
        boxShadow: hovered ? `0 8px 32px oklch(0 0 0 / 0.3), 0 0 0 1px ${divMeta.color}44` : "none",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "border-color 180ms var(--ease-out), box-shadow 180ms var(--ease-out), transform 120ms var(--ease-out)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Division accent line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${divMeta.color}88, transparent)` }}
      />

      {/* Hover glow overlay */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(ellipse at 0% 0%, ${divMeta.color}08, transparent 70%)`,
          opacity: hovered ? 1 : 0,
        }}
      />

      <div className="relative z-10 p-4">
        {/* Avatar + name row */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: "var(--color-surface-elevated)" }}
          >
            {agent.avatar ?? "🤖"}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p
              className="font-semibold text-sm truncate leading-tight"
              style={{ color: "var(--color-foreground)", fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
            >
              {agent.name}
            </p>
            <p className="text-xs truncate mt-0.5" style={{ color: "var(--color-muted)" }}>
              {agent.role}
            </p>
          </div>
        </div>

        {/* Purpose */}
        {agent.purpose && (
          <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: "var(--color-muted)" }}>
            {agent.purpose}
          </p>
        )}

        {/* Division badge */}
        <div className="mb-3">
          <span
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: divMeta.color + "18", color: divMeta.color }}
          >
            <span className="w-1 h-1 rounded-full" style={{ background: divMeta.color }} />
            {divMeta.short}
          </span>
        </div>

        {/* Actions — always visible */}
        <div
          className="flex items-center gap-2 pt-3 border-t"
          style={{ borderColor: "var(--color-border-subtle)" }}
        >
          <Link href={`/agents/${agent.id}/studio`} className="flex-1">
            <Button
              size="sm"
              variant="outline"
              className="w-full h-7 text-xs gap-1.5"
              style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}
            >
              <FlaskConical className="w-3 h-3" /> Studio
            </Button>
          </Link>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 flex-shrink-0"
            onClick={() => onRetire(agent.id)}
            title="Retire agent"
            style={{ color: "var(--color-muted)" }}
          >
            <Archive className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function AgentCardSkeleton() {
  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: "var(--color-surface)" }}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" style={{ background: "var(--color-surface-elevated)" }} />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-3/4 rounded" style={{ background: "var(--color-surface-elevated)" }} />
          <Skeleton className="h-3 w-1/2 rounded" style={{ background: "var(--color-surface-elevated)" }} />
        </div>
      </div>
      <Skeleton className="h-3 w-full rounded" style={{ background: "var(--color-surface-elevated)" }} />
      <Skeleton className="h-3 w-4/5 rounded" style={{ background: "var(--color-surface-elevated)" }} />
      <Skeleton className="h-5 w-16 rounded-full" style={{ background: "var(--color-surface-elevated)" }} />
      <Skeleton className="h-7 w-full rounded-lg" style={{ background: "var(--color-surface-elevated)" }} />
    </div>
  );
}

export default function AgentLibrary() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [filterDivision, setFilterDivision] = useState<string>("all");

  const { data: agents = [], isLoading, refetch } = trpc.agents.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const [autoSeeded, setAutoSeeded] = useState(false);
  const seedDefaults = trpc.agents.seedDefaults.useMutation({
    onSuccess: (data) => { toast.success(data.message); refetch(); },
    onError: () => toast.error("Failed to seed agents"),
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated && agents.length === 0 && !autoSeeded && !seedDefaults.isPending) {
      setAutoSeeded(true);
      seedDefaults.mutate();
    }
  }, [isLoading, isAuthenticated, agents.length, autoSeeded, seedDefaults.isPending]);

  const retireAgent = trpc.agents.retire.useMutation({
    onSuccess: () => { toast.success("Agent retired"); refetch(); },
    onError: () => toast.error("Failed to retire agent"),
  });

  const filtered = useMemo(() => {
    return agents.filter(a => {
      const matchesSearch = !search ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.role.toLowerCase().includes(search.toLowerCase()) ||
        (a.purpose ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesDivision = filterDivision === "all" || a.division === filterDivision;
      return matchesSearch && matchesDivision;
    });
  }, [agents, search, filterDivision]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof filtered> = {};
    for (const div of DIVISION_ORDER) map[div] = [];
    for (const agent of filtered) {
      const div = agent.division ?? "Custom";
      if (!map[div]) map[div] = [];
      map[div].push(agent);
    }
    return map;
  }, [filtered]);

  const divisionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of agents) {
      counts[a.division] = (counts[a.division] ?? 0) + 1;
    }
    return counts;
  }, [agents]);

  const activeCount = agents.filter(a => a.isActive).length;

  return (
    <div className="relative">
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 60% 0%, oklch(0.65 0.22 290 / 0.06), transparent 70%)" }}
      />

      {/* Sticky header */}
      <div
        className="sticky top-0 z-10"
        style={{
          background: "oklch(0.065 0.008 264 / 0.90)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--color-border-subtle)",
        }}
      >
        {/* Title row */}
        <div className="px-8 pt-5 pb-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--color-accent-subtle)" }}
            >
              <BookOpen className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
            </div>
            <div>
              <h1
                className="font-bold text-base leading-tight"
                style={{ color: "var(--color-foreground)", fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}
              >
                Agent Library
              </h1>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
                {activeCount} active · {agents.length} total
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => navigate("/agents/new")}
            className="gap-2 text-xs prisma-glow-btn text-white flex-shrink-0 rounded-full"
          >
            <Plus className="w-3.5 h-3.5" /> New Agent
          </Button>
        </div>

        {/* Search */}
        <div className="px-8 pb-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
              style={{ color: "var(--color-muted)" }}
            />
            <Input
              placeholder="Search by name, role, or expertise..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
            />
          </div>
        </div>

        {/* Division filter pills */}
        <div className="px-8 pb-3 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setFilterDivision("all")}
            className="flex-shrink-0 h-7 px-3 rounded-full text-xs font-medium transition-all duration-150"
            style={filterDivision === "all"
              ? { background: "var(--color-accent)", color: "white" }
              : { background: "var(--color-surface)", color: "var(--color-muted)", border: "1px solid var(--color-border-subtle)" }}
          >
            All · {agents.length}
          </button>
          {DIVISION_ORDER.filter(div => (divisionCounts[div] ?? 0) > 0).map(div => {
            const meta = DIVISION_META[div];
            const count = divisionCounts[div] ?? 0;
            const isActive = filterDivision === div;
            return (
              <button
                key={div}
                onClick={() => setFilterDivision(isActive ? "all" : div)}
                className="flex-shrink-0 h-7 px-3 rounded-full text-xs font-medium transition-all duration-150 flex items-center gap-1.5"
                style={isActive
                  ? { background: meta.color + "22", color: meta.color, border: `1px solid ${meta.color}55` }
                  : { background: "var(--color-surface)", color: "var(--color-muted)", border: "1px solid var(--color-border-subtle)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: meta.color }} />
                {meta.short} · {count}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-8 py-8">

        {/* Loading skeletons */}
        {(isLoading || seedDefaults.isPending) && (
          <div className="space-y-10">
            {[1, 2].map(s => (
              <div key={s}>
                <div className="flex items-center gap-3 mb-5">
                  <Skeleton className="w-6 h-6 rounded-lg" style={{ background: "var(--color-surface)" }} />
                  <Skeleton className="h-4 w-36 rounded" style={{ background: "var(--color-surface)" }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => <AgentCardSkeleton key={i} />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !seedDefaults.isPending && agents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: "var(--color-surface)" }}
            >
              <Users className="w-8 h-8" style={{ color: "var(--color-muted)" }} />
            </div>
            <h3
              className="font-semibold text-base mb-2"
              style={{ color: "var(--color-foreground)", fontFamily: "var(--font-display)" }}
            >
              No agents yet
            </h3>
            <p className="text-sm mb-8 max-w-sm" style={{ color: "var(--color-muted)", lineHeight: "1.6" }}>
              Load the default PRISMA team of 30+ specialized agents across 9 divisions, or create your own from scratch.
            </p>
            <Button
              onClick={() => seedDefaults.mutate()}
              disabled={seedDefaults.isPending}
              className="gap-2 prisma-glow-btn text-white rounded-full"
            >
              {seedDefaults.isPending
                ? <RefreshCw className="w-4 h-4 animate-spin" />
                : <Sparkles className="w-4 h-4" />}
              Load Default Team (30+ Agents)
            </Button>
          </div>
        )}

        {/* No search results */}
        {!isLoading && !seedDefaults.isPending && agents.length > 0 && filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-sm mb-2" style={{ color: "var(--color-foreground)" }}>
              No agents match "{search}"
            </p>
            <button
              onClick={() => { setSearch(""); setFilterDivision("all"); }}
              className="text-xs font-medium"
              style={{ color: "var(--color-accent)" }}
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Grouped agent grid */}
        {!isLoading && !seedDefaults.isPending && agents.length > 0 && filtered.length > 0 && (
          <div className="space-y-10">
            {DIVISION_ORDER.map(division => {
              const divAgents = grouped[division];
              if (!divAgents || divAgents.length === 0) return null;
              const meta = DIVISION_META[division] ?? DIVISION_META["Custom"];
              const DivIcon = meta.icon;
              return (
                <div key={division}>
                  {/* Division header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: meta.color + "18" }}
                    >
                      <DivIcon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                    </div>
                    <h2
                      className="font-semibold text-sm"
                      style={{ color: "var(--color-foreground)", fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
                    >
                      {division}
                    </h2>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: meta.color + "18", color: meta.color }}
                    >
                      {divAgents.length}
                    </span>
                    <div className="flex-1 h-px" style={{ background: "var(--color-border-subtle)" }} />
                  </div>

                  {/* Agent cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {divAgents.map(agent => (
                      <AgentCard
                        key={agent.id}
                        agent={agent}
                        onRetire={(id) => retireAgent.mutate({ id })}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
