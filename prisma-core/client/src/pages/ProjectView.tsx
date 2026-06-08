import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Zap, Users, CheckSquare, ShieldCheck, FileText,
  ArrowRight, Hash, UserCog,
} from "lucide-react";
import { useState } from "react";

function QuickActionCard({
  icon: Icon,
  label,
  desc,
  href,
  accent,
  live,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  desc: string;
  href: string;
  accent: string;
  live?: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      className="group text-left rounded-2xl p-4 relative overflow-hidden"
      style={{
        background: "var(--color-surface)",
        border: `1px solid ${hovered ? accent + "55" : "var(--color-border-subtle)"}`,
        boxShadow: hovered ? `0 6px 24px oklch(0 0 0 / 0.25), 0 0 0 1px ${accent}33` : "none",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "border-color 180ms var(--ease-out), box-shadow 180ms var(--ease-out), transform 120ms var(--ease-out)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Accent top line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}66, transparent)` }}
      />
      {/* Hover glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${accent}0A, transparent 70%)`,
          opacity: hovered ? 1 : 0,
        }}
      />

      <div className="relative z-10">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
          style={{ background: accent + "18" }}
        >
          {live ? (
            <span className="live-dot" style={{ width: 9, height: 9 }} />
          ) : (
            <Icon className="w-4 h-4" style={{ color: accent }} />
          )}
        </div>
        <p
          className="text-sm font-semibold mb-0.5"
          style={{ color: "var(--color-foreground)", fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
        >
          {label}
        </p>
        <p className="text-xs leading-snug" style={{ color: "var(--color-muted)" }}>{desc}</p>
      </div>
    </button>
  );
}

export default function ProjectView() {
  const params = useParams<{ projectId: string }>();
  const projectId = Number(params.projectId);
  const [, navigate] = useLocation();

  const { data: project, isLoading } = trpc.projects.get.useQuery({ id: projectId }, { enabled: !!projectId });
  const { data: rooms } = trpc.rooms.list.useQuery({ projectId }, { enabled: !!projectId });
  const { data: tasks } = trpc.tasks.listByProject.useQuery({ projectId }, { enabled: !!projectId });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-2xl" style={{ background: "var(--color-surface)" }} />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48 rounded-lg" style={{ background: "var(--color-surface)" }} />
            <Skeleton className="h-3 w-72 rounded-lg" style={{ background: "var(--color-surface)" }} />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-28 rounded-2xl" style={{ background: "var(--color-surface)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center" style={{ color: "var(--color-muted)" }}>
        Project not found.
      </div>
    );
  }

  const pendingTasks = tasks?.filter((t: { status: string }) => t.status === "proposed" || t.status === "accepted") ?? [];
  const inProgressTasks = tasks?.filter((t: { status: string }) => t.status === "in_progress") ?? [];

  const QUICK_ACTIONS = [
    {
      icon: Zap,
      label: "Live Session",
      desc: "Screen share + pointer sync",
      href: `/projects/${projectId}/live`,
      accent: "oklch(0.65 0.22 140)",
      live: true,
    },
    {
      icon: Users,
      label: "Agent Chat",
      desc: "Talk to any specialist",
      href: `/projects/${projectId}/agents`,
      accent: "oklch(0.65 0.20 310)",
    },
    {
      icon: UserCog,
      label: "Team",
      desc: "Assign & manage agents",
      href: `/projects/${projectId}/team`,
      accent: "oklch(0.65 0.18 250)",
    },
    {
      icon: CheckSquare,
      label: "Tasks",
      desc: `${pendingTasks.length} pending · ${inProgressTasks.length} active`,
      href: `/projects/${projectId}/tasks`,
      accent: "oklch(0.65 0.18 165)",
    },
    {
      icon: ShieldCheck,
      label: "Audit",
      desc: "WCAG · Performance · UX",
      href: `/projects/${projectId}/audit`,
      accent: "oklch(0.65 0.18 55)",
    },
  ];

  return (
    <div className="relative">
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-0 right-0 h-56 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 20% 0%, oklch(0.68 0.24 292 / 0.06), transparent 70%)",
        }}
      />

      {/* ── Sticky header ── */}
      <div
        className="sticky top-0 z-10 px-8 py-4"
        style={{
          background: "oklch(0.065 0.008 264 / 0.90)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--color-border-subtle)",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl leading-none">{project.emoji}</span>
          <div className="min-w-0">
            <h1
              className="font-bold text-base truncate"
              style={{ color: "var(--color-foreground)", fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}
            >
              {project.name}
            </h1>
            {project.description && (
              <p className="text-xs truncate mt-0.5" style={{ color: "var(--color-muted)" }}>
                {project.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 px-8 py-8 max-w-5xl mx-auto space-y-8">

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {QUICK_ACTIONS.map(action => (
            <QuickActionCard
              key={action.href}
              {...action}
              onClick={() => navigate(action.href)}
            />
          ))}
        </div>

        {/* ── Two-column ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* agents.md */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border-subtle)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center"
                  style={{ background: "var(--color-accent-subtle)" }}
                >
                  <FileText className="w-3 h-3" style={{ color: "var(--color-accent)" }} />
                </div>
                <h3
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-foreground)", fontFamily: "var(--font-display)" }}
                >
                  agents.md
                </h3>
              </div>
              <span
                className="text-xs px-2 py-0.5 rounded-md font-medium"
                style={{ background: "var(--color-accent-subtle)", color: "var(--color-accent)" }}
              >
                Living Spec
              </span>
            </div>
            <div
              className="text-xs font-mono leading-relaxed line-clamp-8 overflow-hidden rounded-xl p-3"
              style={{ color: "var(--color-muted)", background: "var(--color-surface-elevated)" }}
            >
              {project.agentsMd || "No specification yet. Start a Live Session to generate your agents.md automatically."}
            </div>
          </div>

          {/* Rooms */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border-subtle)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center"
                  style={{ background: "oklch(0.65 0.20 310 / 0.12)" }}
                >
                  <Hash className="w-3 h-3" style={{ color: "oklch(0.65 0.20 310)" }} />
                </div>
                <h3
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-foreground)", fontFamily: "var(--font-display)" }}
                >
                  Rooms
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 gap-1"
                onClick={() => navigate(`/projects/${projectId}/agents`)}
                style={{ color: "var(--color-muted)" }}
              >
                Open <ArrowRight className="w-3 h-3" />
              </Button>
            </div>

            {rooms && rooms.length > 0 ? (
              <div className="space-y-1">
                {rooms.slice(0, 6).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => navigate(`/projects/${projectId}/rooms/${r.id}`)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-150"
                    style={{ background: "var(--color-surface-elevated)" }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "oklch(0.65 0.20 310 / 0.08)";
                      e.currentTarget.style.borderColor = "oklch(0.65 0.20 310 / 0.2)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "var(--color-surface-elevated)";
                      e.currentTarget.style.borderColor = "transparent";
                    }}
                  >
                    <Hash className="w-3 h-3 flex-shrink-0" style={{ color: "var(--color-muted)" }} />
                    <span className="text-xs font-medium flex-1 truncate" style={{ color: "var(--color-foreground)" }}>
                      {r.name}
                    </span>
                    <span className="text-xs" style={{ color: "var(--color-faint)" }}>{r.division}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Hash className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--color-muted)" }} />
                <p className="text-xs" style={{ color: "var(--color-muted)", lineHeight: 1.6 }}>
                  No rooms yet. Start a Live Session to create rooms automatically.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
