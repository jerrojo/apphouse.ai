import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Users, CheckSquare, ShieldCheck,
  Plus, Sparkles, LogOut, Hash, ChevronRight, Zap, BookOpen, UserCog, ChevronDown,
  FileText, Calendar,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface PrismaLayoutProps {
  children: React.ReactNode;
}

export default function PrismaLayout({ children }: PrismaLayoutProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [location, navigate] = useLocation();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newVertical, setNewVertical] = useState("none");
  const [roomsExpanded, setRoomsExpanded] = useState(false);

  type VerticalModuleValue = "App & SaaS" | "E-commerce & Retail" | "Fashion, Luxury & Beauty" | "Fintech & Financial Services" | "Health & Life Sciences" | "Media, Content & Creator" | "Interactive Entertainment" | "Education & EdTech" | "Real Estate & Built Environment" | "Industrial, Hardware & Climate" | "Professional Services & B2B" | "Social Impact, Government & Web3" | "Hospitality & Food";
  const toVM = (v: string): VerticalModuleValue | undefined => v === "none" ? undefined : v as VerticalModuleValue;

  const { data: projects, refetch } = trpc.projects.list.useQuery(undefined, { enabled: isAuthenticated });
  const createProject = trpc.projects.create.useMutation({
    onSuccess: (project) => {
      refetch();
      setCreateOpen(false);
      setNewName("");
      setNewDesc("");
      setNewVertical("none");
      toast.success("Project created!");
      if (project?.projectId) navigate(`/projects/${project.projectId}`);
    },
    onError: () => toast.error("Failed to create project"),
  });

  // Detect current project from URL
  const projectMatch = location.match(/\/projects?\/(\d+)/);
  const currentProjectId = projectMatch ? Number(projectMatch[1]) : null;
  const currentProject = projects?.find((p) => p.id === currentProjectId);

  const { data: rooms } = trpc.rooms.list.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );

  const isActive = (path: string) => location === path || location.startsWith(path + "/");

  if (!isAuthenticated) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: "var(--color-background)" }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl prisma-glow-btn flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>Sign in to access PRISMA</p>
          <a href={getLoginUrl()} className="prisma-glow-btn inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-white text-sm font-semibold">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  const PROJECT_NAV = currentProjectId ? [
    { href: `/projects/${currentProjectId}/live`,          icon: Zap,         label: "Live Session", live: true },
    { href: `/projects/${currentProjectId}/agents`,        icon: Users,       label: "Agent Chat" },
    { href: `/projects/${currentProjectId}/team`,          icon: UserCog,     label: "Team" },
    { href: `/projects/${currentProjectId}/tasks`,         icon: CheckSquare, label: "Tasks" },
    { href: `/projects/${currentProjectId}/audit`,         icon: ShieldCheck, label: "Audit" },
    { href: `/projects/${currentProjectId}/weeklys`,       icon: Calendar,    label: "Weekly's" },
    { href: `/projects/${currentProjectId}/session-notes`, icon: FileText,    label: "Session Notes" },
  ] : [];

  return (
    <div className="flex h-dvh overflow-hidden" style={{ background: "var(--color-background)" }}>
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        className="flex-shrink-0 flex flex-col overflow-y-auto"
        style={{ borderRight: "1px solid var(--color-border-subtle)", background: "oklch(0.075 0.009 264)", width: 220 }}
      >
        {/* Logo — clickable, goes to dashboard */}
        <Link href="/dashboard">
          <div className="flex items-center gap-2.5 px-4 py-4 cursor-pointer select-none"
            style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
            <div className="w-7 h-7 rounded-lg prisma-glow-btn flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm prisma-gradient tracking-wide"
              style={{ fontFamily: "var(--font-display)" }}>
              PRISMA
            </span>
          </div>
        </Link>

        {/* ── Main nav ────────────────────────────────────────────────────── */}
        <div className="px-2 py-3 space-y-0.5">
          <Link href="/dashboard">
            <span className={`prisma-nav-item ${isActive("/dashboard") ? "active" : ""}`}>
              <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
              Dashboard
            </span>
          </Link>
          <Link href="/agents/library">
            <span className={`prisma-nav-item ${isActive("/agents") ? "active" : ""}`}>
              <BookOpen className="w-4 h-4 flex-shrink-0" />
              Agent Library
            </span>
          </Link>
        </div>

        {/* ── Projects section ────────────────────────────────────────────── */}
        <div className="px-2 flex-1 pb-2">
          <div className="flex items-center justify-between px-2 py-1.5 mb-1">
            <span className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--color-faint)", letterSpacing: "0.08em" }}>
              Projects
            </span>
            <button
              onClick={() => setCreateOpen(true)}
              className="w-5 h-5 rounded flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity"
              style={{ color: "var(--color-muted)" }}
              title="New project"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {projects?.map((project) => {
              const isCurrentProject = currentProjectId === project.id;
              return (
                <div key={project.id}>
                  <Link href={`/projects/${project.id}`}>
                    <span className={`prisma-nav-item ${isCurrentProject ? "active" : ""}`}>
                      <span className="text-sm leading-none flex-shrink-0">{project.emoji}</span>
                      <span className="truncate text-xs">{project.name}</span>
                      {project.verticalModule && (
                        <span className="ml-auto flex-shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ background: "oklch(0.65 0.22 290 / 0.18)", color: "oklch(0.75 0.22 290)" }}>
                          {project.verticalModule.split(" ")[0]}
                        </span>
                      )}
                    </span>
                  </Link>

                  {/* Project sub-nav — only for current project */}
                  {isCurrentProject && (
                    <div className="ml-3 pl-3 border-l mt-0.5 mb-1 space-y-0.5"
                      style={{ borderColor: "var(--color-border-subtle)" }}>

                      {PROJECT_NAV.map(({ href, icon: Icon, label, live }) => (
                        <Link key={href} href={href}>
                          <span
                            className={`prisma-nav-item text-xs ${isActive(href) ? "active" : ""}`}
                            style={live && !isActive(href) ? { color: "oklch(0.65 0.22 140)" } : {}}
                          >
                            {live ? (
                              <span className="live-dot flex-shrink-0" style={{ width: 7, height: 7 }} />
                            ) : (
                              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                            )}
                            {label}
                          </span>
                        </Link>
                      ))}

                      {/* Rooms — collapsible, only shown if rooms exist */}
                      {rooms && rooms.length > 0 && (
                        <>
                          <button
                            className="prisma-nav-item text-xs w-full"
                            onClick={() => setRoomsExpanded(v => !v)}
                          >
                            {roomsExpanded
                              ? <ChevronDown className="w-3 h-3 flex-shrink-0" />
                              : <ChevronRight className="w-3 h-3 flex-shrink-0" />
                            }
                            <span>Rooms ({rooms.length})</span>
                          </button>

                          {roomsExpanded && rooms.map(room => (
                            <Link key={room.id} href={`/projects/${project.id}/rooms/${room.id}`}>
                              <span className={`prisma-nav-item text-xs ${isActive(`/projects/${project.id}/rooms/${room.id}`) ? "active" : ""}`}>
                                <Hash className="w-3 h-3 flex-shrink-0" style={{ color: "var(--color-accent)" }} />
                                <span className="truncate">{room.name}</span>
                              </span>
                            </Link>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {(!projects || projects.length === 0) && (
              <div className="px-2 py-4 text-center">
                <p className="text-xs mb-3" style={{ color: "var(--color-muted)" }}>No projects yet</p>
                <button
                  onClick={() => setCreateOpen(true)}
                  className="prisma-glow-btn inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-white text-xs font-semibold"
                >
                  <Plus className="w-3 h-3" /> New Project
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── User footer ─────────────────────────────────────────────────── */}
        <div className="p-3" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl"
            style={{ background: "var(--color-surface-elevated)" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: "var(--color-accent-subtle)", color: "var(--color-accent)" }}>
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: "var(--color-foreground)" }}>
                {user?.name ?? "User"}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--color-muted)" }}>{user?.email ?? ""}</p>
            </div>
            <button onClick={logout} className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity" title="Sign out">
              <LogOut className="w-3.5 h-3.5" style={{ color: "var(--color-muted)" }} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* ── Create project dialog ────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)" }}>New Project</DialogTitle>
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
                onKeyDown={(e) => e.key === "Enter" && newName.trim() && createProject.mutate({ name: newName.trim(), description: newDesc.trim() || undefined, verticalModule: toVM(newVertical) })}
                autoFocus
                style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: "var(--color-foreground)" }}>
                Description <span className="font-normal" style={{ color: "var(--color-muted)" }}>(optional)</span>
              </label>
              <Textarea
                placeholder="What are you building?"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={2}
                style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: "var(--color-foreground)" }}>
                Industry <span className="font-normal" style={{ color: "var(--color-muted)" }}>(optional)</span>
              </label>
              <Select value={newVertical} onValueChange={setNewVertical}>
                <SelectTrigger style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                  <SelectValue placeholder="Select industry..." />
                </SelectTrigger>
                <SelectContent style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}>
                  {[
                    { value: "none", emoji: "🌐", label: "General" },
                    { value: "App & SaaS", emoji: "📱", label: "App & SaaS" },
                    { value: "E-commerce & Retail", emoji: "🛍️", label: "E-commerce & Retail" },
                    { value: "Fashion, Luxury & Beauty", emoji: "✨", label: "Fashion, Luxury & Beauty" },
                    { value: "Fintech & Financial Services", emoji: "🏦", label: "Fintech & Financial Services" },
                    { value: "Health & Life Sciences", emoji: "🦠", label: "Health & Life Sciences" },
                    { value: "Media, Content & Creator", emoji: "🎬", label: "Media, Content & Creator" },
                    { value: "Interactive Entertainment", emoji: "🎮", label: "Interactive Entertainment" },
                    { value: "Education & EdTech", emoji: "🎓", label: "Education & EdTech" },
                    { value: "Real Estate & Built Environment", emoji: "🏗️", label: "Real Estate & Built Environment" },
                    { value: "Industrial, Hardware & Climate", emoji: "⚙️", label: "Industrial, Hardware & Climate" },
                    { value: "Professional Services & B2B", emoji: "🤝", label: "Professional Services & B2B" },
                    { value: "Social Impact, Government & Web3", emoji: "🌎", label: "Social Impact, Government & Web3" },
                    { value: "Hospitality & Food", emoji: "🍽️", label: "Hospitality & Food" },
                  ].map(v => (
                    <SelectItem key={v.value} value={v.value}>
                      <span className="flex items-center gap-2">{v.emoji} {v.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              className="prisma-glow-btn text-white"
              disabled={!newName.trim() || createProject.isPending}
              onClick={() => createProject.mutate({ name: newName.trim(), description: newDesc.trim() || undefined, verticalModule: toVM(newVertical) })}
            >
              {createProject.isPending ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
