import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ChevronLeft,
  FileText,
  Mic,
  Monitor,
  CheckSquare,
  Cpu,
  Clock,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Streamdown } from "streamdown";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Decision {
  decision: string;
  owner?: string;
}

interface AgentOutput {
  agentId: string;
  output: string;
}

interface SessionNote {
  id: number;
  projectId: number;
  momentId: number | null;
  title: string;
  sessionDate: Date;
  transcript: string | null;
  summary: string | null;
  decisions: string | null;
  agentOutputs: string | null;
  taskCount: number;
  createdAt: Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDecisions(raw: string | null): Decision[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Decision[];
  } catch {
    return [];
  }
}

function parseAgentOutputs(raw: string | null): AgentOutput[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as AgentOutput[];
  } catch {
    return [];
  }
}

const AGENT_DISPLAY: Record<string, { label: string; color: string }> = {
  "product-manager": { label: "PM", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  "ux-designer": { label: "UX", color: "bg-pink-500/15 text-pink-400 border-pink-500/20" },
  "frontend-engineer": { label: "FE", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20" },
  "backend-engineer": { label: "BE", color: "bg-orange-500/15 text-orange-400 border-orange-500/20" },
  "creative-director": { label: "CD", color: "bg-violet-500/15 text-violet-400 border-violet-500/20" },
  "data-analyst": { label: "DA", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  "qa-engineer": { label: "QA", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" },
};

function agentConfig(agentId: string) {
  return AGENT_DISPLAY[agentId] ?? { label: agentId.slice(0, 2).toUpperCase(), color: "bg-white/8 text-white/50 border-white/10" };
}

// ─── Collapsible Section ──────────────────────────────────────────────────────

function Section({
  icon,
  title,
  count,
  accentColor,
  children,
  defaultOpen = true,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  accentColor: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-4 hover:bg-white/3 transition-colors"
      >
        <div className={`w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 ${accentColor}`}>
          {icon}
        </div>
        <span className="text-sm font-semibold text-white flex-1 text-left">{title}</span>
        {count !== undefined && (
          <span className="text-xs text-white/30 mr-2">{count}</span>
        )}
        {open ? (
          <ChevronDown className="w-4 h-4 text-white/30" />
        ) : (
          <ChevronRight className="w-4 h-4 text-white/30" />
        )}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// ─── Session Note Detail ──────────────────────────────────────────────────────

function SessionNoteDetail({
  noteId,
  onBack,
}: {
  noteId: number;
  onBack: () => void;
}) {
  const { data: note, isLoading } = trpc.sessionNotes.get.useQuery({ id: noteId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="w-6 h-6 text-cyan-400" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-white/40">Session note not found</p>
        <Button variant="ghost" size="sm" onClick={onBack}>Go back</Button>
      </div>
    );
  }

  const decisions = parseDecisions(note.decisions);
  const agentOutputs = parseAgentOutputs(note.agentOutputs);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back + header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/8 flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-white/60" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white truncate">{note.title}</h1>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-white/40 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(new Date(note.sessionDate), "EEEE, MMM d, yyyy 'at' h:mm a")}
            </span>
            {note.taskCount > 0 && (
              <span className="text-xs text-white/40 flex items-center gap-1">
                <CheckSquare className="w-3 h-3" />
                {note.taskCount} task{note.taskCount !== 1 ? "s" : ""}
              </span>
            )}
            {note.momentId && (
              <Badge className="rounded-full bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[10px] py-0">
                <Monitor className="w-2.5 h-2.5 mr-1" />
                Live Session
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Summary */}
        {note.summary && (
          <Section
            icon={<FileText className="w-3.5 h-3.5 text-cyan-400" />}
            title="Summary"
            accentColor="bg-cyan-500/15 border-cyan-500/20"
          >
            <div className="text-xs text-white/60 leading-relaxed prose prose-invert prose-sm max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0">
              <Streamdown>{note.summary}</Streamdown>
            </div>
          </Section>
        )}

        {/* Decisions */}
        {decisions.length > 0 && (
          <Section
            icon={<CheckSquare className="w-3.5 h-3.5 text-emerald-400" />}
            title="Key Decisions"
            count={decisions.length}
            accentColor="bg-emerald-500/15 border-emerald-500/20"
          >
            <div className="space-y-2">
              {decisions.map((d, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[9px] font-bold text-emerald-400">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/70 leading-relaxed">{d.decision}</p>
                    {d.owner && (
                      <p className="text-[11px] text-white/30 mt-1">Owner: {d.owner}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Agent Outputs */}
        {agentOutputs.length > 0 && (
          <Section
            icon={<Cpu className="w-3.5 h-3.5 text-violet-400" />}
            title="Agent Outputs"
            count={agentOutputs.length}
            accentColor="bg-violet-500/15 border-violet-500/20"
          >
            <div className="space-y-3">
              {agentOutputs.map((ao, i) => {
                const config = agentConfig(ao.agentId);
                return (
                  <div key={i} className="rounded-xl border border-white/5 bg-white/2 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${config.color}`}>
                        {config.label}
                      </span>
                      <span className="text-xs text-white/40">{ao.agentId.replace(/-/g, " ")}</span>
                    </div>
                    <div className="p-3 text-xs text-white/60 leading-relaxed prose prose-invert prose-sm max-w-none [&_p]:mb-1.5 [&_p:last-child]:mb-0">
                      <Streamdown>{ao.output}</Streamdown>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Transcript */}
        {note.transcript && (
          <Section
            icon={<Mic className="w-3.5 h-3.5 text-amber-400" />}
            title="Transcript"
            accentColor="bg-amber-500/15 border-amber-500/20"
            defaultOpen={false}
          >
            <div className="rounded-xl bg-black/20 border border-white/5 p-4 max-h-96 overflow-y-auto">
              <pre className="text-xs text-white/50 leading-relaxed whitespace-pre-wrap font-mono">
                {note.transcript}
              </pre>
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

// ─── Session Note List Item ───────────────────────────────────────────────────

function SessionNoteListItem({
  note,
  onClick,
}: {
  note: SessionNote;
  onClick: () => void;
}) {
  const decisions = parseDecisions(note.decisions);
  const agentOutputs = parseAgentOutputs(note.agentOutputs);

  return (
    <button
      onClick={onClick}
      className="w-full text-left group rounded-2xl border border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5 transition-all duration-200 p-5"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
          {note.momentId ? (
            <Monitor className="w-4.5 h-4.5 text-cyan-400" />
          ) : (
            <FileText className="w-4.5 h-4.5 text-cyan-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors truncate">
              {note.title}
            </p>
            <span className="text-xs text-white/30 shrink-0">
              {format(new Date(note.sessionDate), "MMM d")}
            </span>
          </div>
          <p className="text-xs text-white/40 mt-0.5">
            {format(new Date(note.sessionDate), "EEEE 'at' h:mm a")}
          </p>
          {note.summary && (
            <p className="mt-2 text-xs text-white/40 leading-relaxed line-clamp-2">
              {note.summary.replace(/[#*_`]/g, "").slice(0, 180)}
            </p>
          )}
          {/* Metadata pills */}
          <div className="flex items-center gap-2 mt-3">
            {decisions.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/15 text-[10px] text-emerald-400">
                <CheckSquare className="w-2.5 h-2.5" />
                {decisions.length} decision{decisions.length !== 1 ? "s" : ""}
              </span>
            )}
            {agentOutputs.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/15 text-[10px] text-violet-400">
                <Cpu className="w-2.5 h-2.5" />
                {agentOutputs.length} output{agentOutputs.length !== 1 ? "s" : ""}
              </span>
            )}
            {note.taskCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/40">
                <CheckSquare className="w-2.5 h-2.5" />
                {note.taskCount} task{note.taskCount !== 1 ? "s" : ""}
              </span>
            )}
            {note.transcript && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/15 text-[10px] text-amber-400">
                <Mic className="w-2.5 h-2.5" />
                Transcript
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SessionNotesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId ?? "0");
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const { data: notes, isLoading } = trpc.sessionNotes.list.useQuery({ projectId: pid });

  const filteredNotes = (notes as SessionNote[] | undefined)?.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    (n.summary ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (selectedNoteId !== null) {
    return (
      <div className="p-6 lg:p-8">
        <SessionNoteDetail
          noteId={selectedNoteId}
          onBack={() => setSelectedNoteId(null)}
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
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
              <FileText className="w-4 h-4 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Session Notes</h1>
          </div>
          <p className="text-sm text-white/40 ml-10">
            Transcripts, decisions, and agent outputs from every session
          </p>
        </div>
        <Button
          variant="outline"
          className="rounded-full border-white/15 text-white/70 hover:text-white text-sm"
          onClick={() => toast.info("Sessions are automatically logged from Live Sessions")}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Note
        </Button>
      </div>

      {/* Search */}
      {notes && notes.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search session notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/25 focus:bg-white/8 transition-all"
          />
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Spinner className="w-6 h-6 text-cyan-400" />
        </div>
      ) : !filteredNotes || filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-2xl border border-dashed border-white/10 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <FileText className="w-6 h-6 text-cyan-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-white/60">
              {search ? "No matching notes" : "No session notes yet"}
            </p>
            <p className="text-xs text-white/30 mt-1">
              {search
                ? "Try a different search term"
                : "Session notes are automatically created from Live Sessions and Voice Moments"}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotes.map((note) => (
            <SessionNoteListItem
              key={note.id}
              note={note}
              onClick={() => setSelectedNoteId(note.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
