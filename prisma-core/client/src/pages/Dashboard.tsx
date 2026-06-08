import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import {
  Plus, FolderOpen, Clock,
  Sparkles, ArrowRight, BookOpen, Zap,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type VerticalModuleValue =
  | "App & SaaS" | "E-commerce & Retail" | "Fashion, Luxury & Beauty"
  | "Fintech & Financial Services" | "Health & Life Sciences"
  | "Media, Content & Creator" | "Interactive Entertainment"
  | "Education & EdTech" | "Real Estate & Built Environment"
  | "Industrial, Hardware & Climate" | "Professional Services & B2B"
  | "Social Impact, Government & Web3" | "Hospitality & Food";

function toVerticalModule(v: string): VerticalModuleValue | undefined {
  return v === "none" ? undefined : v as VerticalModuleValue;
}

const VERTICAL_MODULES = [
  { value: "none",                             emoji: "🌐", label: "General",                          desc: "Generic team for any type of project" },
  { value: "App & SaaS",                       emoji: "📱", label: "App & SaaS",                       desc: "Mobile apps, SaaS, developer tools, AI products" },
  { value: "E-commerce & Retail",              emoji: "🛍️", label: "E-commerce & Retail",              desc: "Online stores, marketplaces, D2C brands" },
  { value: "Fashion, Luxury & Beauty",         emoji: "✨", label: "Fashion, Luxury & Beauty",         desc: "Clothing, accessories, cosmetics, luxury goods" },
  { value: "Fintech & Financial Services",     emoji: "🏦", label: "Fintech & Financial Services",     desc: "Payments, banking, insurance, wealth management" },
  { value: "Health & Life Sciences",           emoji: "🧬", label: "Health & Life Sciences",           desc: "Healthcare, biotech, mental health, medical devices" },
  { value: "Media, Content & Creator",         emoji: "🎬", label: "Media, Content & Creator",         desc: "Streaming, podcasts, newsletters, creator platforms" },
  { value: "Interactive Entertainment",        emoji: "🎮", label: "Interactive Entertainment",        desc: "Video games, VR/AR, esports, tabletop" },
  { value: "Education & EdTech",               emoji: "🎓", label: "Education & EdTech",               desc: "Online courses, tutoring, corporate training, LMS" },
  { value: "Real Estate & Built Environment",  emoji: "🏗️", label: "Real Estate & Built Environment",  desc: "Property, construction, architecture, PropTech" },
  { value: "Industrial, Hardware & Climate",   emoji: "⚙️", label: "Industrial, Hardware & Climate",   desc: "Manufacturing, hardware, robotics, climate tech" },
  { value: "Professional Services & B2B",      emoji: "🤝", label: "Professional Services & B2B",      desc: "Consulting, law, accounting, agencies, B2B SaaS" },
  { value: "Social Impact, Government & Web3", emoji: "🌎", label: "Social Impact, Government & Web3", desc: "NGOs, civic tech, DAOs, open source, philanthropy" },
  { value: "Hospitality & Food",               emoji: "🍽️", label: "Hospitality & Food",               desc: "Restaurants, hotels, food delivery, travel" },
];

const STATUS_CONFIG = {
  active:    { label: "Active",   dot: "oklch(0.65 0.20 140)", bg: "oklch(0.65 0.20 140 / 0.12)" },
  paused:    { label: "Paused",   dot: "oklch(0.65 0.18 55)",  bg: "oklch(0.65 0.18 55 / 0.12)"  },
  completed: { label: "Done",     dot: "oklch(0.55 0.08 264)", bg: "oklch(0.55 0.08 264 / 0.12)" },
  archived:  { label: "Archived", dot: "oklch(0.40 0.05 264)", bg: "oklch(0.40 0.05 264 / 0.10)" },
};

/* ── Greeting by time of day ── */
function getGreeting(name: string) {
  const h = new Date().getHours();
  if (h < 12) return `Good morning, ${name}`;
  if (h < 18) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newVertical, setNewVertical] = useState("none");

  const { data: projects, isLoading, refetch } = trpc.projects.list.useQuery();
  const createProject = trpc.projects.create.useMutation({
    onSuccess: (project) => {
      refetch();
      setCreateOpen(false);
      setNewName(""); setNewDesc(""); setNewVertical("none");
      toast.success("Project created!");
      if (project?.projectId) navigate(`/projects/${project.projectId}`);
    },
    onError: () => toast.error("Failed to create project"),
  });

  const firstName = user?.name?.split(" ")[0] || "Builder";
  const activeCount = projects?.filter(p => p.status === "active").length ?? 0;

  const handleCreate = () => {
    if (!newName.trim()) return;
    createProject.mutate({
      name: newName.trim(),
      description: newDesc.trim() || undefined,
      verticalModule: toVerticalModule(newVertical),
    });
  };

  return (
    <div className="relative">
      {/* Ambient top glow */}
      <div
        className="absolute top-0 left-0 right-0 h-64 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 30% 0%, oklch(0.68 0.24 292 / 0.07), transparent 70%)",
        }}
      />

      {/* ── Top bar ── */}
      <div
        className="sticky top-0 z-10 px-8 py-5 flex items-center justify-between"
        style={{
          background: "oklch(0.065 0.008 264 / 0.90)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--color-border-subtle)",
        }}
      >
        <div>
          <h1
            className="font-bold text-lg leading-tight"
            style={{ color: "var(--color-foreground)", fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}
          >
            {getGreeting(firstName)}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
            {activeCount > 0
              ? `${activeCount} active project${activeCount > 1 ? "s" : ""} · Your team is ready`
              : "Your AI team is standing by"}
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="prisma-glow-btn text-white gap-2 rounded-full"
          size="sm"
        >
          <Plus className="w-3.5 h-3.5" /> New Project
        </Button>
      </div>

      <div className="relative z-10 px-8 py-8 max-w-5xl mx-auto space-y-10">

        {/* ── Quick actions ── */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              icon: <BookOpen className="w-4 h-4" />,
              color: "oklch(0.68 0.24 292)",
              colorBg: "oklch(0.68 0.24 292 / 0.10)",
              title: "Agent Library",
              desc: "Manage your 30+ AI specialists",
              action: () => navigate("/agents/library"),
            },
            {
              icon: <Sparkles className="w-4 h-4" />,
              color: "oklch(0.68 0.22 315)",
              colorBg: "oklch(0.68 0.22 315 / 0.10)",
              title: "New Project",
              desc: "Start building with your team",
              action: () => setCreateOpen(true),
            },
          ].map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              className="group flex items-center gap-4 p-5 rounded-2xl text-left"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border-subtle)",
                transition: "border-color 180ms var(--ease-out), box-shadow 180ms var(--ease-out), transform 120ms var(--ease-out)",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget;
                el.style.borderColor = item.color;
                el.style.boxShadow = `0 4px 20px oklch(0 0 0 / 0.3), 0 0 0 1px ${item.color}`;
                el.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget;
                el.style.borderColor = "var(--color-border-subtle)";
                el.style.boxShadow = "none";
                el.style.transform = "translateY(0)";
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: item.colorBg, color: item.color }}
              >
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-display)" }}>
                  {item.title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>{item.desc}</p>
              </div>
              <ArrowRight
                className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity"
                style={{ color: item.color }}
              />
            </button>
          ))}
        </div>

        {/* ── Projects ── */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <h2
                className="font-semibold text-sm"
                style={{ color: "var(--color-foreground)", fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
              >
                Projects
              </h2>
              {(projects?.length ?? 0) > 0 && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "var(--color-surface-elevated)", color: "var(--color-muted)" }}
                >
                  {projects?.length}
                </span>
              )}
            </div>
          </div>

          {/* Loading skeletons */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl p-5 space-y-3" style={{ background: "var(--color-surface)" }}>
                  <div className="flex items-start justify-between">
                    <Skeleton className="w-10 h-10 rounded-xl" style={{ background: "var(--color-surface-elevated)" }} />
                    <Skeleton className="h-5 w-16 rounded-full" style={{ background: "var(--color-surface-elevated)" }} />
                  </div>
                  <Skeleton className="h-4 w-3/4 rounded-md" style={{ background: "var(--color-surface-elevated)" }} />
                  <Skeleton className="h-3 w-full rounded-md" style={{ background: "var(--color-surface-elevated)" }} />
                  <Skeleton className="h-3 w-2/3 rounded-md" style={{ background: "var(--color-surface-elevated)" }} />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && projects?.length === 0 && (
            <div
              className="rounded-2xl p-16 text-center"
              style={{
                background: "var(--color-surface)",
                border: "1px dashed var(--color-border)",
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                style={{ background: "var(--color-surface-elevated)" }}
              >
                <FolderOpen className="w-7 h-7" style={{ color: "var(--color-muted)" }} />
              </div>
              <h3
                className="font-semibold text-base mb-2"
                style={{ color: "var(--color-foreground)", fontFamily: "var(--font-display)" }}
              >
                No projects yet
              </h3>
              <p className="text-sm mb-8 max-w-xs mx-auto" style={{ color: "var(--color-muted)", lineHeight: 1.6 }}>
                Create your first project and your AI team will be ready to build with you.
              </p>
              <Button
                className="prisma-glow-btn text-white gap-2 rounded-full"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="w-4 h-4" /> Create First Project
              </Button>
            </div>
          )}

          {/* Project cards */}
          {!isLoading && projects && projects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => {
                const statusCfg = STATUS_CONFIG[project.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.active;
                const vm = VERTICAL_MODULES.find(m => m.value === project.verticalModule);
                return (
                  <button
                    key={project.id}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="group text-left w-full rounded-2xl p-5 relative overflow-hidden"
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border-subtle)",
                      transition: "border-color 180ms var(--ease-out), box-shadow 180ms var(--ease-out), transform 120ms var(--ease-out)",
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget;
                      el.style.borderColor = "var(--color-accent)";
                      el.style.boxShadow = "0 8px 32px oklch(0 0 0 / 0.35), 0 0 0 1px var(--color-accent)";
                      el.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget;
                      el.style.borderColor = "var(--color-border-subtle)";
                      el.style.boxShadow = "none";
                      el.style.transform = "translateY(0)";
                    }}
                  >
                    {/* Hover glow */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300"
                      style={{
                        background: "radial-gradient(ellipse at 0% 0%, oklch(0.68 0.24 292 / 0.06), transparent 70%)",
                      }}
                    />

                    <div className="relative z-10">
                      {/* Header row */}
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                          style={{ background: "var(--color-surface-elevated)" }}
                        >
                          {project.emoji ?? "🚀"}
                        </div>
                        <span
                          className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium"
                          style={{ background: statusCfg.bg, color: statusCfg.dot }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: statusCfg.dot }} />
                          {statusCfg.label}
                        </span>
                      </div>

                      {/* Name */}
                      <h3
                        className="font-semibold text-sm mb-1.5 leading-snug"
                        style={{ color: "var(--color-foreground)", fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
                      >
                        {project.name}
                      </h3>

                      {/* Description */}
                      <p className="text-xs line-clamp-2 mb-4" style={{ color: "var(--color-muted)", lineHeight: 1.6 }}>
                        {project.description || "No description provided."}
                      </p>

                      {/* Footer row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {vm && vm.value !== "none" && (
                            <span className="text-xs" style={{ color: "var(--color-faint)" }}>
                              {vm.emoji} {vm.label.split(" ")[0]}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-faint)" }}>
                            <Clock className="w-3 h-3" />
                            {new Date(project.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span
                          className="text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 font-medium"
                          style={{ color: "var(--color-accent)" }}
                        >
                          Open <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Add project card */}
              <button
                onClick={() => setCreateOpen(true)}
                className="group rounded-2xl p-5 text-center flex flex-col items-center justify-center gap-3 min-h-[160px]"
                style={{
                  background: "transparent",
                  border: "1px dashed var(--color-border)",
                  transition: "border-color 180ms var(--ease-out), background 180ms var(--ease-out)",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "var(--color-accent)";
                  e.currentTarget.style.background = "var(--color-accent-subtle)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--color-surface-elevated)" }}
                >
                  <Plus className="w-5 h-5" style={{ color: "var(--color-muted)" }} />
                </div>
                <span className="text-xs font-medium" style={{ color: "var(--color-muted)" }}>New Project</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Create project dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
              New Project
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: "var(--color-foreground)" }}>
                Project Name
              </label>
              <Input
                placeholder="e.g. Zawi App Redesign"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
                style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: "var(--color-foreground)" }}>
                Description{" "}
                <span className="font-normal" style={{ color: "var(--color-muted)" }}>(optional)</span>
              </label>
              <Textarea
                placeholder="What are you building?"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={3}
                style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: "var(--color-foreground)" }}>
                Industry{" "}
                <span className="font-normal" style={{ color: "var(--color-muted)" }}>(optional)</span>
              </label>
              <Select value={newVertical} onValueChange={setNewVertical}>
                <SelectTrigger style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                  <SelectValue placeholder="Select industry..." />
                </SelectTrigger>
                <SelectContent style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}>
                  {VERTICAL_MODULES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      <span className="flex items-center gap-2">
                        <span>{m.emoji}</span>
                        <span>{m.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCreateOpen(false)}
              style={{ color: "var(--color-muted)" }}
            >
              Cancel
            </Button>
            <Button
              className="prisma-glow-btn text-white rounded-full"
              onClick={handleCreate}
              disabled={!newName.trim() || createProject.isPending}
            >
              {createProject.isPending ? (
                <span className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 animate-pulse" /> Creating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5" /> Create Project
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
