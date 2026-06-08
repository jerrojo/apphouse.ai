import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  CheckCircle2,
  XCircle,
  Pencil,
  ChevronLeft,
  Zap,
  Sparkles,
  Calendar,
  Play,
  Check,
  X,
  RotateCcw,
  FileText,
  TrendingUp,
  Lightbulb,
  AlertCircle,
  Wrench,
  Star,
  Target,
} from "lucide-react";
import { Streamdown } from "streamdown";

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskType = "Bug" | "Tweak" | "Feature" | "Strategy";
type TaskStatus = "pending" | "accepted" | "rejected";
type Priority = "critical" | "high" | "medium" | "low";

interface WeeklyTask {
  id: number;
  taskType: TaskType;
  title: string;
  description: string | null;
  rationale: string | null;
  proposedByAgent: string | null;
  priority: Priority;
  status: TaskStatus;
  editedTitle: string | null;
  editedDescription: string | null;
  position: number;
}

interface Weekly {
  id: number;
  projectId: number;
  weekStart: Date;
  weekEnd: Date;
  status: "pending" | "generating" | "ready" | "executed";
  executiveSummary: string | null;
  creativeBrief: string | null;
  generatedByAgents: string | null;
  executedAt: Date | null;
  createdAt: Date;
  tasks?: WeeklyTask[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TASK_TYPE_CONFIG: Record<TaskType, { label: string; color: string; icon: React.ReactNode }> = {
  Bug: { label: "Bug", color: "text-red-400 bg-red-400/10 border-red-400/20", icon: <AlertCircle className="w-3 h-3" /> },
  Tweak: { label: "Tweak", color: "text-amber-400 bg-amber-400/10 border-amber-400/20", icon: <Wrench className="w-3 h-3" /> },
  Feature: { label: "Feature", color: "text-violet-400 bg-violet-400/10 border-violet-400/20", icon: <Star className="w-3 h-3" /> },
  Strategy: { label: "Strategy", color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20", icon: <Target className="w-3 h-3" /> },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; dot: string }> = {
  critical: { label: "Critical", dot: "bg-red-500" },
  high: { label: "High", dot: "bg-orange-400" },
  medium: { label: "Medium", dot: "bg-yellow-400" },
  low: { label: "Low", dot: "bg-slate-400" },
};

const AGENT_DISPLAY: Record<string, string> = {
  "product-manager": "PM",
  "ux-designer": "UX",
  "frontend-engineer": "FE",
  "backend-engineer": "BE",
  "creative-director": "CD",
  "data-analyst": "DA",
  "qa-engineer": "QA",
  "marketing-strategist": "MK",
};

function agentLabel(agentId: string | null): string {
  if (!agentId) return "AI";
  return AGENT_DISPLAY[agentId] ?? agentId.slice(0, 2).toUpperCase();
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onAccept,
  onReject,
  onEdit,
}: {
  task: WeeklyTask;
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
  onEdit: (id: number, title: string, description: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.editedTitle ?? task.title);
  const [editDesc, setEditDesc] = useState(task.editedDescription ?? task.description ?? "");
  const typeConfig = TASK_TYPE_CONFIG[task.taskType];
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const displayTitle = task.editedTitle ?? task.title;
  const displayDesc = task.editedDescription ?? task.description;

  const handleSaveEdit = () => {
    onEdit(task.id, editTitle, editDesc);
    setEditing(false);
  };

  return (
    <div
      className={[
        "group relative rounded-2xl border transition-all duration-200",
        task.status === "accepted"
          ? "border-emerald-500/30 bg-emerald-500/5"
          : task.status === "rejected"
          ? "border-red-500/20 bg-red-500/5 opacity-50"
          : "border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5",
      ].join(" ")}
    >
      {/* Status indicator strip */}
      {task.status !== "pending" && (
        <div
          className={[
            "absolute left-0 top-0 bottom-0 w-0.5 rounded-l-2xl",
            task.status === "accepted" ? "bg-emerald-500" : "bg-red-500",
          ].join(" ")}
        />
      )}

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          {/* Agent avatar */}
          <div className="shrink-0 w-7 h-7 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/60">
            {agentLabel(task.proposedByAgent)}
          </div>

          <div className="flex-1 min-w-0">
            {/* Type + Priority badges */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${typeConfig.color}`}>
                {typeConfig.icon}
                {typeConfig.label}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] text-white/40">
                <span className={`w-1.5 h-1.5 rounded-full ${priorityConfig.dot}`} />
                {priorityConfig.label}
              </span>
            </div>

            {/* Title — click to edit */}
            {editing ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="mb-2 bg-white/5 border-white/15 text-white text-sm font-medium h-8"
                autoFocus
              />
            ) : (
              <p
                className="text-sm font-semibold text-white leading-snug mb-1 cursor-text hover:text-violet-300 transition-colors"
                onClick={() => task.status === "pending" && setEditing(true)}
                title={task.status === "pending" ? "Click to edit" : undefined}
              >
                {displayTitle}
              </p>
            )}

            {/* Description — click to edit */}
            {editing ? (
              <Textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="bg-white/5 border-white/15 text-white/70 text-xs resize-none min-h-[60px]"
                rows={2}
              />
            ) : displayDesc ? (
              <p
                className="text-xs text-white/50 leading-relaxed cursor-text hover:text-white/70 transition-colors"
                onClick={() => task.status === "pending" && setEditing(true)}
                title={task.status === "pending" ? "Click to edit" : undefined}
              >
                {displayDesc}
              </p>
            ) : task.status === "pending" ? (
              <p
                className="text-xs text-white/20 italic cursor-text hover:text-white/40 transition-colors"
                onClick={() => setEditing(true)}
              >
                Click to add description…
              </p>
            ) : null}

            {/* Rationale */}
            {!editing && task.rationale && (
              <p className="mt-2 text-[11px] text-white/30 italic leading-relaxed border-t border-white/5 pt-2">
                💡 {task.rationale}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="shrink-0 flex items-center gap-1">
            {editing ? (
              <>
                <button
                  onClick={handleSaveEdit}
                  className="w-7 h-7 rounded-full bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 flex items-center justify-center transition-colors"
                >
                  <Check className="w-3.5 h-3.5 text-violet-400" />
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-white/40" />
                </button>
              </>
            ) : task.status === "pending" ? (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 border border-white/8 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                  title="Edit"
                >
                  <Pencil className="w-3 h-3 text-white/50" />
                </button>
                <button
                  onClick={() => onReject(task.id)}
                  className="w-7 h-7 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center transition-colors"
                  title="Reject"
                >
                  <X className="w-3.5 h-3.5 text-red-400" />
                </button>
                <button
                  onClick={() => onAccept(task.id)}
                  className="w-7 h-7 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center transition-colors"
                  title="Accept"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              </>
            ) : task.status === "accepted" ? (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <button
                  onClick={() => onReject(task.id)}
                  className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 border border-white/8 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                  title="Undo"
                >
                  <RotateCcw className="w-2.5 h-2.5 text-white/40" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <XCircle className="w-4 h-4 text-red-400/60" />
                <button
                  onClick={() => onAccept(task.id)}
                  className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 border border-white/8 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                  title="Undo"
                >
                  <RotateCcw className="w-2.5 h-2.5 text-white/40" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Weekly Detail View ───────────────────────────────────────────────────────

function WeeklyDetail({
  weeklyId,
  projectId,
  onBack,
}: {
  weeklyId: number;
  projectId: number;
  onBack: () => void;
}) {
  const utils = trpc.useUtils();
  const { data: weekly, isLoading } = trpc.weeklys.get.useQuery({ id: weeklyId });

  const updateTask = trpc.weeklys.updateTask.useMutation({
    onSuccess: () => utils.weeklys.get.invalidate({ id: weeklyId }),
  });
  const acceptAll = trpc.weeklys.acceptAll.useMutation({
    onSuccess: () => {
      utils.weeklys.get.invalidate({ id: weeklyId });
      toast.success("All pending tasks accepted");
    },
  });
  const execute = trpc.weeklys.execute.useMutation({
    onSuccess: () => {
      utils.weeklys.get.invalidate({ id: weeklyId });
      utils.weeklys.list.invalidate({ projectId });
      toast.success("Weekly executed — tasks pushed to project board");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="w-6 h-6 text-violet-400" />
      </div>
    );
  }

  if (!weekly) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-white/40">Weekly not found</p>
        <Button variant="ghost" size="sm" onClick={onBack}>Go back</Button>
      </div>
    );
  }

  const tasks = (weekly.tasks ?? []) as WeeklyTask[];
  const acceptedCount = tasks.filter((t) => t.status === "accepted").length;
  const rejectedCount = tasks.filter((t) => t.status === "rejected").length;
  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const canExecute = weekly.status === "ready" && acceptedCount > 0;

  const handleAccept = (id: number) => updateTask.mutate({ id, status: "accepted" });
  const handleReject = (id: number) => updateTask.mutate({ id, status: "rejected" });
  const handleEdit = (id: number, editedTitle: string, editedDescription: string) =>
    updateTask.mutate({ id, editedTitle, editedDescription });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back + header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/8 flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-white/60" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">
            Week of {format(new Date(weekly.weekStart), "MMM d")} –{" "}
            {format(new Date(weekly.weekEnd), "MMM d, yyyy")}
          </h1>
          <p className="text-sm text-white/40 mt-0.5">
            {weekly.status === "executed"
              ? `Executed ${weekly.executedAt ? format(new Date(weekly.executedAt), "MMM d 'at' h:mm a") : ""}`
              : weekly.status === "generating"
              ? "Generating…"
              : `${tasks.length} tasks proposed by the AI team`}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {weekly.status === "ready" && pendingCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-white/15 text-white/70 hover:text-white text-xs"
              onClick={() => acceptAll.mutate({ weeklyId })}
              disabled={acceptAll.isPending}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Accept All
            </Button>
          )}
          {canExecute && (
            <Button
              size="sm"
              className="rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-4"
              onClick={() => execute.mutate({ weeklyId })}
              disabled={execute.isPending}
            >
              {execute.isPending ? (
                <Spinner className="w-3.5 h-3.5 mr-1.5" />
              ) : (
                <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
              )}
              Execute {acceptedCount} Task{acceptedCount !== 1 ? "s" : ""}
            </Button>
          )}
          {weekly.status === "executed" && (
            <Badge className="rounded-full bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-xs">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Executed
            </Badge>
          )}
        </div>
      </div>

      {/* Stats bar */}
      {tasks.length > 0 && (
        <div className="flex items-center gap-4 mb-8 p-4 rounded-2xl bg-white/3 border border-white/8">
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-white/50">{pendingCount} pending</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-white/70">{acceptedCount} accepted</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-white/50">{rejectedCount} rejected</span>
          </div>
          {/* Progress bar */}
          <div className="flex-1 ml-2">
            <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-violet-500 transition-all duration-500"
                style={{ width: `${tasks.length > 0 ? ((acceptedCount + rejectedCount) / tasks.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: summaries */}
        <div className="lg:col-span-2 space-y-4">
          {/* Executive Summary */}
          {weekly.executiveSummary && (
            <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-xl bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">Executive Summary</h3>
              </div>
              <div className="text-xs text-white/60 leading-relaxed prose prose-invert prose-sm max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0">
                <Streamdown>{weekly.executiveSummary}</Streamdown>
              </div>
            </div>
          )}

          {/* Creative Brief */}
          {weekly.creativeBrief && (
            <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
                  <Lightbulb className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">Creative Brief</h3>
              </div>
              <div className="text-xs text-white/60 leading-relaxed prose prose-invert prose-sm max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0">
                <Streamdown>{weekly.creativeBrief}</Streamdown>
              </div>
            </div>
          )}

          {/* Agents */}
          {weekly.generatedByAgents && (
            <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
              <p className="text-[11px] text-white/30 mb-2 font-medium uppercase tracking-wider">Team present</p>
              <div className="flex flex-wrap gap-1.5">
                {(JSON.parse(weekly.generatedByAgents) as string[]).map((a) => (
                  <span
                    key={a}
                    className="px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-[10px] text-white/50"
                  >
                    {a.replace(/-/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: task list */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Proposed Tasks</h3>
            <span className="text-xs text-white/30">{tasks.length} total</span>
          </div>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 rounded-2xl border border-dashed border-white/10 gap-3">
              <Sparkles className="w-8 h-8 text-white/20" />
              <p className="text-sm text-white/30">No tasks yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Weekly List ──────────────────────────────────────────────────────────────

function WeeklyListItem({
  weekly,
  onClick,
}: {
  weekly: Weekly;
  onClick: () => void;
}) {
  const statusConfig = {
    pending: { label: "Pending", color: "text-white/40 bg-white/5 border-white/10" },
    generating: { label: "Generating…", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
    ready: { label: "Ready for review", color: "text-violet-400 bg-violet-400/10 border-violet-400/20" },
    executed: { label: "Executed", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  };
  const s = statusConfig[weekly.status];

  return (
    <button
      onClick={onClick}
      className="w-full text-left group rounded-2xl border border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5 transition-all duration-200 p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
            <Calendar className="w-4.5 h-4.5 text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors">
              Week of {format(new Date(weekly.weekStart), "MMM d")} –{" "}
              {format(new Date(weekly.weekEnd), "MMM d, yyyy")}
            </p>
            <p className="text-xs text-white/40 mt-0.5">
              Generated {format(new Date(weekly.createdAt), "MMM d 'at' h:mm a")}
            </p>
          </div>
        </div>
        <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border ${s.color}`}>
          {s.label}
        </span>
      </div>
      {weekly.executiveSummary && (
        <p className="mt-3 text-xs text-white/40 leading-relaxed line-clamp-2 ml-13">
          {weekly.executiveSummary.replace(/[#*_`]/g, "").slice(0, 200)}…
        </p>
      )}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WeeklysPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId ?? "0");
  const [selectedWeeklyId, setSelectedWeeklyId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const { data: weeklys, isLoading } = trpc.weeklys.list.useQuery({ projectId: pid });

  const generate = trpc.weeklys.generate.useMutation({
    onSuccess: (data) => {
      utils.weeklys.list.invalidate({ projectId: pid });
      toast.success(`Weekly generated — ${data.taskCount} tasks proposed`);
      setSelectedWeeklyId(data.weeklyId);
    },
    onError: (err) => toast.error(`Generation failed: ${err.message}`),
  });

  if (selectedWeeklyId !== null) {
    return (
      <div className="p-6 lg:p-8">
        <WeeklyDetail
          weeklyId={selectedWeeklyId}
          projectId={pid}
          onBack={() => setSelectedWeeklyId(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
              <Zap className="w-4 h-4 text-violet-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Weekly Intelligence</h1>
          </div>
          <p className="text-sm text-white/40 ml-10">
            Monday AI team meetings — executive summary + creative task plan
          </p>
        </div>
        <Button
          className="rounded-full bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-5"
          onClick={() => generate.mutate({ projectId: pid })}
          disabled={generate.isPending}
        >
          {generate.isPending ? (
            <>
              <Spinner className="w-4 h-4 mr-2" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Weekly
            </>
          )}
        </Button>
      </div>

      {/* Automated schedule notice */}
      <div className="mb-6 p-4 rounded-2xl border border-white/8 bg-white/3 flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <Calendar className="w-3.5 h-3.5 text-violet-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-white/80">Automated every Monday at 4:00 AM</p>
          <p className="text-xs text-white/40 mt-0.5">
            Your AI team gathers automatically each week to review progress and propose the best path forward.
            You can also trigger a manual generation at any time.
          </p>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Spinner className="w-6 h-6 text-violet-400" />
        </div>
      ) : !weeklys || weeklys.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-2xl border border-dashed border-white/10 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <FileText className="w-6 h-6 text-violet-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-white/60">No weeklys yet</p>
            <p className="text-xs text-white/30 mt-1">
              Generate your first Weekly Intelligence report to get started
            </p>
          </div>
          <Button
            className="rounded-full bg-violet-600 hover:bg-violet-500 text-white text-sm mt-2"
            onClick={() => generate.mutate({ projectId: pid })}
            disabled={generate.isPending}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate First Weekly
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {(weeklys as Weekly[]).map((w) => (
            <WeeklyListItem
              key={w.id}
              weekly={w}
              onClick={() => setSelectedWeeklyId(w.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
