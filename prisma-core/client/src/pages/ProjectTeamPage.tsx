import { useState, useMemo } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Users, Plus, UserMinus, UserCheck, MoreHorizontal,
  ArrowLeft, Sparkles, RefreshCw, BookOpen, FlaskConical,
  ChevronRight, Archive, RotateCcw,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const DIVISION_COLORS: Record<string, string> = {
  "Strategy & Leadership":       "oklch(0.65 0.18 250)",
  "Design & Creative":           "oklch(0.65 0.20 310)",
  "Engineering & Architecture":  "oklch(0.65 0.18 165)",
  "Data, AI & Analytics":        "oklch(0.65 0.20 55)",
  "Content & Community":         "oklch(0.65 0.20 30)",
  "Marketing & Growth":          "oklch(0.65 0.22 15)",
  "Customer Success & Support":  "oklch(0.65 0.18 140)",
  "Operations, Finance & Legal": "oklch(0.65 0.18 200)",
  "Vertical Module":             "oklch(0.65 0.22 290)",
  "Custom":                      "oklch(0.65 0.22 270)",
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "oklch(0.7 0.2 140)", bg: "oklch(0.7 0.2 140 / 0.15)" },
  benched: { label: "Benched", color: "oklch(0.65 0.18 55)", bg: "oklch(0.65 0.18 55 / 0.15)" },
  retired: { label: "Retired", color: "var(--color-muted)", bg: "var(--color-surface)" },
};

type ProjectAgent = {
  id: number;
  projectId: number;
  agentId: number;
  roleOverride: string | null;
  status: "active" | "benched" | "retired";
  joinedAt: Date;
  agentName: string;
  agentRole: string;
  agentDivision: string;
  agentAvatar: string | null;
};

type AgentDef = {
  id: number;
  agentKey: string;
  name: string;
  role: string;
  division: string;
  avatar: string | null;
  isActive: boolean;
};

function TeamMemberCard({ member, onStatusChange, onRemove }: {
  member: ProjectAgent;
  onStatusChange: (id: number, status: "active" | "benched" | "retired") => void;
  onRemove: (id: number) => void;
}) {
  const divColor = DIVISION_COLORS[member.agentDivision] ?? "var(--color-accent)";
  const statusMeta = STATUS_META[member.status];

  return (
    <div
      className="group relative rounded-2xl border transition-all duration-200"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
        opacity: member.status === "retired" ? 0.5 : 1,
      }}
    >
      <div className="absolute top-0 left-4 right-4 h-px rounded-full opacity-40"
        style={{ background: `linear-gradient(90deg, transparent, ${divColor}, transparent)` }} />

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: "var(--color-surface-elevated)" }}>
              {member.agentAvatar ?? "🤖"}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate" style={{ color: "var(--color-foreground)" }}>
                {member.agentName}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--color-muted)" }}>
                {member.roleOverride ?? member.agentRole}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded-lg hover:bg-white/5 transition-colors" aria-label="Member actions">
                <MoreHorizontal className="w-4 h-4" style={{ color: "var(--color-muted)" }} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}>
              {member.status !== "active" && (
                <DropdownMenuItem onClick={() => onStatusChange(member.id, "active")} className="gap-2 text-xs cursor-pointer">
                  <UserCheck className="w-3.5 h-3.5" style={{ color: "oklch(0.7 0.2 140)" }} /> Activate
                </DropdownMenuItem>
              )}
              {member.status !== "benched" && (
                <DropdownMenuItem onClick={() => onStatusChange(member.id, "benched")} className="gap-2 text-xs cursor-pointer">
                  <Archive className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.18 55)" }} /> Bench
                </DropdownMenuItem>
              )}
              {member.status !== "retired" && (
                <DropdownMenuItem onClick={() => onStatusChange(member.id, "retired")} className="gap-2 text-xs cursor-pointer"
                  style={{ color: "oklch(0.65 0.18 25)" }}>
                  <RotateCcw className="w-3.5 h-3.5" /> Retire from Project
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onRemove(member.id)} className="gap-2 text-xs cursor-pointer"
                style={{ color: "oklch(0.65 0.18 25)" }}>
                <UserMinus className="w-3.5 h-3.5" /> Remove from Team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: divColor }} />
            <span className="text-xs" style={{ color: "var(--color-muted)" }}>
              {member.agentDivision.split(" & ")[0]}
            </span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: statusMeta.bg, color: statusMeta.color }}>
            {statusMeta.label}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ProjectTeamPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = Number(projectId);
  const { isAuthenticated } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [roleOverride, setRoleOverride] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "benched" | "retired">("all");

  const { data: project } = trpc.projects.get.useQuery({ id: pid }, { enabled: isAuthenticated && !!pid });
  const { data: teamMembers = [], refetch } = trpc.projectAgents.list.useQuery(
    { projectId: pid },
    { enabled: isAuthenticated && !!pid }
  );
  const { data: allAgents = [] } = trpc.agents.list.useQuery(undefined, { enabled: isAuthenticated });

  const assignAgent = trpc.projectAgents.assign.useMutation({
    onSuccess: () => { toast.success("Agent added to team"); refetch(); setAddOpen(false); setSelectedAgentId(""); setRoleOverride(""); },
    onError: () => toast.error("Failed to add agent"),
  });

  const updateStatus = trpc.projectAgents.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status updated"); refetch(); },
    onError: () => toast.error("Failed to update status"),
  });

  const removeAgent = trpc.projectAgents.remove.useMutation({
    onSuccess: () => { toast.success("Agent removed from team"); refetch(); },
    onError: () => toast.error("Failed to remove agent"),
  });

  // Agents not yet in the team
  const teamAgentIds = new Set(teamMembers.map(m => m.agentId));
  const availableAgents = allAgents.filter(a => !teamAgentIds.has(a.id) && a.isActive);

  const filtered = useMemo(() => {
    if (filterStatus === "all") return teamMembers;
    return teamMembers.filter(m => m.status === filterStatus);
  }, [teamMembers, filterStatus]);

  const activeCount = teamMembers.filter(m => m.status === "active").length;
  const benchedCount = teamMembers.filter(m => m.status === "benched").length;

  // Group by division
  const grouped = useMemo(() => {
    const map: Record<string, typeof filtered> = {};
    for (const m of filtered) {
      const div = m.agentDivision ?? "Custom";
      if (!map[div]) map[div] = [];
      map[div].push(m);
    }
    return map;
  }, [filtered]);

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 py-4"
        style={{ background: "oklch(0.065 0.008 264 / 0.90)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid var(--color-border-subtle)" }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href={`/projects/${pid}`}>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8 px-2">
                <ArrowLeft className="w-3.5 h-3.5" />
                {project?.name ?? "Project"}
              </Button>
            </Link>
            <div className="w-px h-5" style={{ background: "var(--color-border-subtle)" }} />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "var(--color-accent-subtle)" }}>
                <Users className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
              </div>
              <div>
                <h1 className="font-bold text-sm" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-display)" }}>
                  Team Assembly
                </h1>
                <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                  {activeCount} active · {benchedCount} benched
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/agents/library">
              <Button size="sm" variant="outline" className="gap-2 text-xs h-8">
                <BookOpen className="w-3.5 h-3.5" /> Agent Library
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={() => setAddOpen(true)}
              disabled={availableAgents.length === 0}
              className="gap-2 text-xs prisma-glow-btn text-white rounded-full"
            >
              <Plus className="w-3.5 h-3.5" /> Add Agent
            </Button>
          </div>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1.5 mt-3">
          {(["all", "active", "benched", "retired"] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="px-3 py-1 rounded-full text-xs font-medium capitalize transition-all duration-150"
              style={filterStatus === s
                ? { background: "var(--color-accent)", color: "white" }
                : { color: "var(--color-muted)", background: "var(--color-surface)", border: "1px solid var(--color-border-subtle)" }}
            >
              {s === "all" ? `All (${teamMembers.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${teamMembers.filter(m => m.status === s).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {teamMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "var(--color-surface)" }}>
              <Users className="w-8 h-8" style={{ color: "var(--color-muted)" }} />
            </div>
            <h3 className="font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>No team assembled yet</h3>
            <p className="text-sm mb-6 max-w-sm" style={{ color: "var(--color-muted)" }}>
              Add agents from your Agent Library to assemble the perfect team for this project.
            </p>
            {allAgents.length === 0 ? (
              <Link href="/agents/library">
                <Button className="gap-2 prisma-glow-btn text-white">
                  <BookOpen className="w-4 h-4" /> Go to Agent Library
                </Button>
              </Link>
            ) : (
              <Button onClick={() => setAddOpen(true)} className="gap-2 prisma-glow-btn text-white">
                <Plus className="w-4 h-4" /> Add First Agent
              </Button>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>No {filterStatus} agents</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([division, members]) => {
              if (members.length === 0) return null;
              const divColor = DIVISION_COLORS[division] ?? "var(--color-accent)";
              return (
                <div key={division}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: divColor }} />
                    <h2 className="font-semibold text-sm" style={{ color: "var(--color-foreground)" }}>{division}</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: divColor + "22", color: divColor }}>
                      {members.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {members.map(member => (
                      <TeamMemberCard
                        key={member.id}
                        member={member}
                        onStatusChange={(id, status) => updateStatus.mutate({ id, status })}
                        onRemove={(id) => removeAgent.mutate({ id })}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Agent Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "var(--color-foreground)" }}>Add Agent to Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>
                Select Agent
              </label>
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger className="h-9 text-sm" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                  <SelectValue placeholder="Choose an agent..." />
                </SelectTrigger>
                <SelectContent style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}>
                  {availableAgents.length === 0 ? (
                    <SelectItem value="none" disabled>All agents already in team</SelectItem>
                  ) : (
                    availableAgents.map(a => (
                      <SelectItem key={a.id} value={String(a.id)} className="text-sm">
                        <div className="flex items-center gap-2">
                          <span>{a.avatar ?? "🤖"}</span>
                          <span>{a.name}</span>
                          <span className="text-xs opacity-60">— {a.role}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>
                Role Override <span className="opacity-50">(optional)</span>
              </label>
              <Input
                value={roleOverride}
                onChange={e => setRoleOverride(e.target.value)}
                placeholder="e.g. Lead Designer for this project"
                className="h-9 text-sm"
                style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={() => {
                if (!selectedAgentId || selectedAgentId === "none") return;
                assignAgent.mutate({
                  projectId: pid,
                  agentId: Number(selectedAgentId),
                  roleOverride: roleOverride || undefined,
                });
              }}
              disabled={!selectedAgentId || selectedAgentId === "none" || assignAgent.isPending}
              className="gap-2 prisma-glow-btn text-white"
            >
              {assignAgent.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Add to Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
