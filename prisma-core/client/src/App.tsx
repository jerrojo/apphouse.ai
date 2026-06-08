import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ProjectView from "./pages/ProjectView";
import AgentsPage from "./pages/AgentsPage";
import AgentLibrary from "./pages/AgentLibrary";
import AgentStudio from "./pages/AgentStudio";
import LiveSession from "./pages/LiveSession";
import AuditPage from "./pages/AuditPage";
import ProjectTeamPage from "./pages/ProjectTeamPage";
import AgentNew from "./pages/AgentNew";
import WeeklysPage from "./pages/WeeklysPage";
import SessionNotesPage from "./pages/SessionNotesPage";
import PrismaLayout from "./components/PrismaLayout";

// Helper: wraps a page component in PrismaLayout
function WithLayout({ children }: { children: React.ReactNode }) {
  return <PrismaLayout>{children}</PrismaLayout>;
}

function Router() {
  return (
    <Switch>
      {/* ── Public ───────────────────────────────────────────────────────── */}
      <Route path="/" component={Home} />

      {/* ── Dashboard ────────────────────────────────────────────────────── */}
      <Route path="/dashboard">
        {() => <WithLayout><Dashboard /></WithLayout>}
      </Route>

      {/* ── Project pages ────────────────────────────────────────────────── */}
      <Route path="/projects/:projectId">
        {() => <WithLayout><ProjectView /></WithLayout>}
      </Route>
      <Route path="/projects/:projectId/agents">
        {() => <WithLayout><AgentsPage /></WithLayout>}
      </Route>
      <Route path="/projects/:projectId/live">
        {() => <WithLayout><LiveSession /></WithLayout>}
      </Route>
      <Route path="/projects/:projectId/audit">
        {() => <WithLayout><AuditPage /></WithLayout>}
      </Route>
      <Route path="/projects/:projectId/team">
        {() => <WithLayout><ProjectTeamPage /></WithLayout>}
      </Route>
      {/* Tasks — placeholder until full Tasks page is built */}
      <Route path="/projects/:projectId/tasks">
        {() => (
          <WithLayout>
            <TasksPlaceholder />
          </WithLayout>
        )}
      </Route>
      {/* Rooms — redirect to agent chat for now */}
      <Route path="/projects/:projectId/rooms/:roomId">
        {() => <WithLayout><AgentsPage /></WithLayout>}
      </Route>

      {/* ── Weekly Intelligence + Session Notes ─────────────────────────── */}
      <Route path="/projects/:projectId/weeklys">
        {() => <WithLayout><WeeklysPage /></WithLayout>}
      </Route>
      <Route path="/projects/:projectId/session-notes">
        {() => <WithLayout><SessionNotesPage /></WithLayout>}
      </Route>

      {/* ── Agent pages ──────────────────────────────────────────────────── */}
      <Route path="/agents/new">
        {() => <WithLayout><AgentNew /></WithLayout>}
      </Route>
      <Route path="/agents/library">
        {() => <WithLayout><AgentLibrary /></WithLayout>}
      </Route>
      <Route path="/agents/:id/studio">
        {() => <WithLayout><AgentStudio /></WithLayout>}
      </Route>

      {/* ── Fallback ─────────────────────────────────────────────────────── */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Minimal Tasks placeholder — keeps navigation working until full page is built
function TasksPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-6">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-2xl"
        style={{ background: "var(--color-surface-elevated)" }}>
        ✅
      </div>
      <h2 className="text-lg font-bold mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--color-foreground)" }}>
        Tasks
      </h2>
      <p className="text-sm max-w-xs" style={{ color: "var(--color-muted)" }}>
        Task management is coming soon. For now, tasks are generated and reviewed inside Live Sessions.
      </p>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
