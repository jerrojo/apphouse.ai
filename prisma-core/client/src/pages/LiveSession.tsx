import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AGENTS, AgentDefinition } from "../../../shared/agents";
import {
  Monitor, Mic, MicOff, Video, VideoOff, Users, X,
  CheckCircle2, XCircle, Edit3, Play, ChevronRight,
  AlertTriangle, Wrench, Sparkles, MessageSquare, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { format } from "date-fns";

// ─── Task Types ───────────────────────────────────────────────────────────────
type TaskType = "Bug" | "Tweak" | "Feature";
type TaskStatus = "pending" | "accepted" | "rejected";

interface LiveTask {
  id: string;
  location: string;      // e.g. "Home > Hero Section > CTA Button"
  type: TaskType;
  task: string;          // e.g. "Ajustar el color a gradiente #FF6B6B a #4ECDC4 en ángulo 135°"
  status: TaskStatus;
  editing: boolean;
  agentNote?: string;
}

interface PointerPosition {
  x: number;   // percentage 0-100
  y: number;
  agentId?: string;
  label?: string;
  timestamp: number;
}

interface SessionMessage {
  id: string;
  role: "user" | "agent" | "system";
  agentId?: string;
  content: string;
  timestamp: Date;
  isQuestion?: boolean;
}

const TASK_ICONS: Record<TaskType, React.ReactNode> = {
  Bug: <AlertTriangle className="w-3.5 h-3.5" />,
  Tweak: <Wrench className="w-3.5 h-3.5" />,
  Feature: <Sparkles className="w-3.5 h-3.5" />,
};

const TASK_COLORS: Record<TaskType, string> = {
  Bug: "oklch(0.65 0.22 25)",
  Tweak: "oklch(0.72 0.18 60)",
  Feature: "oklch(0.72 0.18 275)",
};

const TASK_BG: Record<TaskType, string> = {
  Bug: "oklch(0.65 0.22 25 / 0.12)",
  Tweak: "oklch(0.72 0.18 60 / 0.12)",
  Feature: "oklch(0.72 0.18 275 / 0.12)",
};

export default function LiveSession() {
  const params = useParams<{ projectId: string }>();
  const projectId = Number(params.projectId);
  const [sessionActive, setSessionActive] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [tasks, setTasks] = useState<LiveTask[]>([]);
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [pointers, setPointers] = useState<PointerPosition[]>([]);
  const [userPointer, setUserPointer] = useState<{ x: number; y: number } | null>(null);
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "tasks">("chat");
  const [invitedAgents, setInvitedAgents] = useState<string[]>(["product-manager", "ops-coordinator"]);
  const [showAgentPicker, setShowAgentPicker] = useState(false);

  const screenRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pointerTimeoutRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const abortRef = useRef<AbortController | null>(null);

  const { data: project } = trpc.projects.get.useQuery({ id: projectId });
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Screen Share ──────────────────────────────────────────────────────────
  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: false,
      });
      streamRef.current = stream;
      if (screenRef.current) {
        screenRef.current.srcObject = stream;
        screenRef.current.play();
      }
      setScreenSharing(true);
      stream.getVideoTracks()[0].addEventListener("ended", stopScreenShare);
      toast.success("Screen sharing started");
    } catch (err) {
      if ((err as Error).name !== "NotAllowedError") {
        toast.error("Could not start screen share");
      }
    }
  };

  const stopScreenShare = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (screenRef.current) screenRef.current.srcObject = null;
    setScreenSharing(false);
  };

  // ── Microphone ────────────────────────────────────────────────────────────
  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.start(1000);
      setMicActive(true);
    } catch {
      toast.error("Could not access microphone");
    }
  };

  const stopMicAndTranscribe = async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    return new Promise<string>((resolve) => {
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = async () => {
          // Upload audio blob to storage then transcribe via session endpoint
          // For live sessions, we send the transcript directly to PM via text
          resolve("[Voice transcription — type your message instead]");
        };
        reader.readAsDataURL(blob);
        recorder.stream.getTracks().forEach((t) => t.stop());
      };
      recorder.stop();
      setMicActive(false);
    });
  };

  // ── Mouse pointer tracking on canvas ─────────────────────────────────────
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!sessionActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setUserPointer({ x, y });
  }, [sessionActive]);

  const handleCanvasMouseLeave = useCallback(() => {
    setUserPointer(null);
  }, []);

  // Simulate agent pointer appearing when they "comment" on a location
  const simulateAgentPointer = useCallback((agentId: string, x: number, y: number, label: string) => {
    const ptr: PointerPosition = { x, y, agentId, label, timestamp: Date.now() };
    setPointers((prev) => [...prev.filter((p) => p.agentId !== agentId), ptr]);
    const existing = pointerTimeoutRef.current.get(agentId);
    if (existing) clearTimeout(existing);
    const timeout = setTimeout(() => {
      setPointers((prev) => prev.filter((p) => p.agentId !== agentId));
      pointerTimeoutRef.current.delete(agentId);
    }, 4000);
    pointerTimeoutRef.current.set(agentId, timeout);
  }, []);

  // ── Send message to PM + invited agents ──────────────────────────────────
  const sendToSession = useCallback(async (text: string, fromVoice = false) => {
    if (!text.trim() || isProcessing) return;
    setIsProcessing(true);

    const userMsg: SessionMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Build context for PM
    const taskContext = tasks.length > 0
      ? `\n\nCurrent task list:\n${tasks.map((t) => `- [${t.status}] ${t.location} > ${t.type} > ${t.task}`).join("\n")}`
      : "";

    const pointerContext = userPointer
      ? `\n\nThe user's mouse is currently pointing at approximately (${userPointer.x.toFixed(0)}%, ${userPointer.y.toFixed(0)}%) on the screen.`
      : "";

    abortRef.current = new AbortController();

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: "agent",
          agentId: "product-manager",
          message: text + taskContext + pointerContext,
          projectId,
          history: messages.slice(-10).map((m) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content,
          })),
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok || !response.body) throw new Error("Stream failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let pmMsgId: string | null = null;
      let pmFullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "agent_start") {
              pmMsgId = `pm-${Date.now()}`;
              setMessages((prev) => [...prev, {
                id: pmMsgId!,
                role: "agent",
                agentId: "product-manager",
                content: "",
                timestamp: new Date(),
              }]);
            } else if (event.type === "chunk" && pmMsgId) {
              pmFullContent += event.delta;
              setMessages((prev) => prev.map((m) =>
                m.id === pmMsgId ? { ...m, content: pmFullContent } : m
              ));
            } else if (event.type === "agent_done" && pmMsgId) {
              pmFullContent = event.fullContent || pmFullContent;
              setMessages((prev) => prev.map((m) =>
                m.id === pmMsgId ? { ...m, content: pmFullContent } : m
              ));
              // Parse tasks from PM response
              parsePMResponseForTasks(pmFullContent);
            }
          } catch { /* skip */ }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        toast.error("Session error");
      }
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, messages, projectId, tasks, userPointer]);

  // ── Parse PM response for structured tasks ────────────────────────────────
  const parsePMResponseForTasks = useCallback(async (pmResponse: string) => {
    if (!pmResponse.includes("Bug") && !pmResponse.includes("Tweak") && !pmResponse.includes("Feature")) return;

    try {
      const parseResponse = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: "agent",
          agentId: "product-manager",
          message: `Based on this conversation, extract any actionable tasks and format them as a JSON array. Each task must have:
- location: string (e.g. "Home > Hero Section > CTA Button")
- type: "Bug" | "Tweak" | "Feature"
- task: string (specific, actionable description)

PM response to parse: "${pmResponse}"

Return ONLY a JSON array like: [{"location":"...","type":"Bug","task":"..."}]
If no clear tasks, return [].`,
          projectId,
          history: [],
        }),
      });

      if (!parseResponse.ok || !parseResponse.body) return;

      const reader = parseResponse.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "agent_done") fullContent = event.fullContent || fullContent;
            else if (event.type === "chunk") fullContent += event.delta;
          } catch { /* skip */ }
        }
      }

      // Extract JSON from response
      const jsonMatch = fullContent.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return;
      const parsed = JSON.parse(jsonMatch[0]) as { location: string; type: TaskType; task: string }[];
      if (!Array.isArray(parsed) || parsed.length === 0) return;

      const newTasks: LiveTask[] = parsed.map((t) => ({
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        location: t.location || "General",
        type: (["Bug", "Tweak", "Feature"].includes(t.type) ? t.type : "Tweak") as TaskType,
        task: t.task || "",
        status: "pending",
        editing: false,
      }));

      setTasks((prev) => {
        const existingTasks = new Set(prev.map((t) => t.task.toLowerCase().trim()));
        const unique = newTasks.filter((t) => !existingTasks.has(t.task.toLowerCase().trim()));
        return [...prev, ...unique];
      });

      if (newTasks.length > 0) {
        setActiveTab("tasks");
        toast.success(`PM added ${newTasks.length} task${newTasks.length > 1 ? "s" : ""} to the list`);
      }
    } catch { /* silent */ }
  }, [projectId]);

  const handleTaskAccept = (id: string) => setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: "accepted" } : t));
  const handleTaskReject = (id: string) => setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: "rejected" } : t));
  const handleTaskEdit = (id: string, newText: string) => setTasks((prev) => prev.map((t) => t.id === id ? { ...t, task: newText, editing: false } : t));
  const handleTaskStartEdit = (id: string) => setTasks((prev) => prev.map((t) => ({ ...t, editing: t.id === id })));

  const executeApprovedTasks = async () => {
    const accepted = tasks.filter((t) => t.status === "accepted");
    if (accepted.length === 0) { toast.error("No accepted tasks to execute"); return; }
    const taskList = accepted.map((t, i) => `${i + 1}. ${t.location} > ${t.type} > ${t.task}`).join("\n");
    await sendToSession(`Execute the following approved tasks:\n${taskList}`);
    toast.success(`Executing ${accepted.length} approved task${accepted.length > 1 ? "s" : ""}`);
  };

  const pmAgent = AGENTS.find((a) => a.id === "product-manager");
  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const acceptedCount = tasks.filter((t) => t.status === "accepted").length;

  return (
    <div className="flex h-full animate-fade-up">
      {/* ── Left: Screen Share Canvas ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Session toolbar */}
        <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--color-border-subtle)", background: "oklch(0.065 0.008 264 / 0.90)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${sessionActive ? "bg-red-500 animate-pulse" : "bg-gray-500"}`} />
            <span className="text-sm font-semibold font-display">
              {sessionActive ? "Live Session" : "Session Ready"}
            </span>
            {sessionActive && (
              <Badge variant="outline" className="text-xs" style={{ borderColor: "oklch(0.65 0.22 25 / 0.4)", color: "oklch(0.65 0.22 25)" }}>
                LIVE
              </Badge>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs rounded-full"
              onClick={screenSharing ? stopScreenShare : startScreenShare}
              style={screenSharing
                ? { borderColor: "oklch(0.72 0.18 142 / 0.5)", color: "oklch(0.72 0.18 142)" }
                : { borderColor: "var(--color-border-subtle)" }
              }
            >
              {screenSharing ? <VideoOff className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
              {screenSharing ? "Stop Share" : "Share Screen"}
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs rounded-full"
              onClick={micActive ? () => stopMicAndTranscribe() : startMic}
              style={micActive
                ? { borderColor: "oklch(0.65 0.22 25 / 0.5)", color: "oklch(0.65 0.22 25)" }
                : { borderColor: "var(--color-border-subtle)" }
              }
            >
              {micActive ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              {micActive ? "Stop Mic" : "Start Mic"}
            </Button>

            {!sessionActive ? (
              <Button
                size="sm"
                className="prisma-glow-btn text-white gap-1.5 text-xs rounded-full"
                onClick={() => {
                  setSessionActive(true);
                  setMessages([{
                    id: "sys-start",
                    role: "system",
                    content: `Live session started for **${project?.name || "this project"}**. The PM is present and ready. Share your screen and describe what you'd like to change.`,
                    timestamp: new Date(),
                  }]);
                  toast.success("Live session started!");
                }}
              >
                <Play className="w-3.5 h-3.5" />
                Start Session
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                style={{ borderColor: "oklch(0.65 0.22 25 / 0.4)", color: "oklch(0.65 0.22 25)" }}
                onClick={() => {
                  setSessionActive(false);
                  stopScreenShare();
                  toast.info("Session ended");
                }}
              >
                <X className="w-3.5 h-3.5" />
                End Session
              </Button>
            )}
          </div>
        </div>

        {/* Screen preview canvas */}
        <div
          ref={canvasRef}
          className="relative flex-1 overflow-hidden cursor-crosshair"
          style={{ background: "var(--color-surface-elevated)" }}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
        >
          {screenSharing ? (
            <video
              ref={screenRef}
              className="w-full h-full object-contain"
              muted
              playsInline
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
              <Monitor className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-bold font-display mb-2 opacity-60">No Screen Shared</p>
              <p className="text-sm max-w-sm opacity-40">
                Click "Share Screen" to share your app or design. The PM and invited agents will see your screen and you can point to specific elements while talking.
              </p>
              {sessionActive && (
                <Button
                  className="mt-6 prisma-glow-btn text-white gap-2"
                  onClick={startScreenShare}
                >
                  <Monitor className="w-4 h-4" />
                  Share Screen Now
                </Button>
              )}
            </div>
          )}

          {/* User pointer */}
          {sessionActive && userPointer && (
            <div
              className="absolute pointer-events-none z-20 transition-all duration-75"
              style={{ left: `${userPointer.x}%`, top: `${userPointer.y}%`, transform: "translate(-2px, -2px)" }}
            >
              <div className="relative">
                <svg width="20" height="20" viewBox="0 0 20 20" className="drop-shadow-lg">
                  <path d="M2 2 L2 16 L6 12 L10 18 L12 17 L8 11 L14 11 Z"
                    fill="oklch(0.78 0.18 275)" stroke="white" strokeWidth="1.5" />
                </svg>
                <div className="absolute left-5 top-0 px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap"
                  style={{ background: "oklch(0.62 0.22 275)", color: "white" }}>
                  You
                </div>
              </div>
            </div>
          )}

          {/* Agent pointers */}
          {pointers.map((ptr) => {
            const agent = AGENTS.find((a) => a.id === ptr.agentId);
            return (
              <div
                key={ptr.agentId}
                className="absolute pointer-events-none z-20 transition-all duration-200"
                style={{ left: `${ptr.x}%`, top: `${ptr.y}%`, transform: "translate(-2px, -2px)" }}
              >
                <div className="relative">
                  <svg width="20" height="20" viewBox="0 0 20 20" className="drop-shadow-lg">
                    <path d="M2 2 L2 16 L6 12 L10 18 L12 17 L8 11 L14 11 Z"
                      fill={agent?.accentColor || "var(--color-accent)"} stroke="white" strokeWidth="1.5" />
                  </svg>
                  <div className="absolute left-5 top-0 flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap"
                    style={{ background: agent?.accentColor || "var(--color-accent)", color: "white" }}>
                    <span>{agent?.icon}</span>
                    <span>{agent?.name.split(" ")[0]}</span>
                    {ptr.label && <span className="font-normal opacity-80">· {ptr.label}</span>}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Invited agents overlay */}
          {sessionActive && (
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <div className="flex -space-x-2">
                {invitedAgents.slice(0, 5).map((id) => {
                  const agent = AGENTS.find((a) => a.id === id);
                  return (
                    <div key={id}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 border-black"
                      style={{ background: "var(--color-surface-elevated)" }}
                      title={agent?.name}
                    >
                      {agent?.icon}
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => setShowAgentPicker(!showAgentPicker)}
                className="px-2 py-1 rounded-lg text-xs font-semibold transition-colors hover:bg-white/10"
                style={{ background: "var(--color-surface-elevated)", color: "var(--color-muted)" }}
              >
                <Users className="w-3 h-3 inline mr-1" />
                {invitedAgents.length} invited
              </button>
            </div>
          )}

          {/* Agent picker */}
          {showAgentPicker && (
            <div className="absolute bottom-16 left-4 rounded-xl border p-3 shadow-2xl z-30 w-64"
              style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border-subtle)" }}>
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-muted)" }}>Invite to session</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {AGENTS.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => setInvitedAgents((prev) =>
                      prev.includes(agent.id) ? prev.filter((id) => id !== agent.id) : [...prev, agent.id]
                    )}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors hover:bg-white/5"
                  >
                    <span>{agent.icon}</span>
                    <span className="flex-1 text-left">{agent.name}</span>
                    {invitedAgents.includes(agent.id) && (
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "oklch(0.72 0.18 142)" }} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel: Chat + Tasks ── */}
      <div className="w-80 flex-shrink-0 border-l flex flex-col" style={{ borderColor: "var(--color-border-subtle)" }}>
        {/* Tabs */}
        <div className="flex border-b flex-shrink-0" style={{ borderColor: "var(--color-border-subtle)" }}>
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors ${activeTab === "chat" ? "border-b-2" : "opacity-60 hover:opacity-80"}`}
            style={activeTab === "chat" ? { borderBottomColor: "var(--color-accent)", color: "var(--color-accent)" } : {}}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Session Chat
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors ${activeTab === "tasks" ? "border-b-2" : "opacity-60 hover:opacity-80"}`}
            style={activeTab === "tasks" ? { borderBottomColor: "var(--color-accent)", color: "var(--color-accent)" } : {}}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Task List
            {pendingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold"
                style={{ background: "oklch(0.62 0.22 275 / 0.25)", color: "oklch(0.78 0.18 275)" }}>
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {activeTab === "chat" ? (
          <>
            {/* Chat messages */}
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3">
                {messages.map((msg) => {
                  const agent = msg.agentId ? AGENTS.find((a) => a.id === msg.agentId) : null;
                  if (msg.role === "system") {
                    return (
                      <div key={msg.id} className="text-center">
                        <span className="text-xs px-3 py-1 rounded-full" style={{ background: "var(--color-surface-elevated)", color: "var(--color-muted)" }}>
                          {msg.content}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                      {msg.role === "agent" && (
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                          style={{ background: "var(--color-surface-elevated)" }}>
                          {agent?.icon || "🤖"}
                        </div>
                      )}
                      <div className={`flex flex-col gap-0.5 min-w-0 flex-1 ${msg.role === "user" ? "items-end" : ""}`}>
                        {msg.role === "agent" && (
                          <span className="text-xs font-semibold" style={{ color: agent?.accentColor || "var(--color-foreground)" }}>
                            {agent?.name}
                          </span>
                        )}
                        <div
                          className="max-w-full rounded-xl px-3 py-2 text-xs leading-relaxed"
                          style={msg.role === "user"
                            ? { background: "oklch(0.62 0.22 275 / 0.18)", borderRadius: "0.75rem 0.75rem 0.25rem 0.75rem" }
                            : { background: "var(--color-surface-elevated)", borderRadius: "0.25rem 0.75rem 0.75rem 0.75rem" }
                          }
                        >
                          {msg.role === "agent" ? (
                            <Streamdown>{msg.content || "…"}</Streamdown>
                          ) : (
                            <p>{msg.content}</p>
                          )}
                        </div>
                        <span className="text-xs opacity-50" style={{ color: "var(--color-muted)" }}>
                          {format(msg.timestamp, "h:mm a")}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {isProcessing && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                      style={{ background: "var(--color-surface-elevated)" }}>
                      {pmAgent?.icon}
                    </div>
                    <div className="px-3 py-2 rounded-xl" style={{ background: "var(--color-surface-elevated)" }}>
                      <div className="flex gap-1 items-center h-4">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full waveform-bar"
                            style={{ background: "var(--color-muted)", animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            {/* Chat input */}
            <div className="p-3 border-t flex-shrink-0" style={{ borderColor: "var(--color-border-subtle)" }}>
              <div className="flex gap-2">
                <input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendToSession(inputText); setInputText(""); } }}
                  placeholder={sessionActive ? "Tell the PM what you see…" : "Start a session first"}
                  disabled={!sessionActive || isProcessing}
                  className="flex-1 bg-transparent text-xs outline-none px-3 py-2 rounded-lg border"
                  style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border-subtle)", color: "var(--color-foreground)" }}
                />
                <Button
                  size="icon"
                  className="prisma-glow-btn text-white w-8 h-8 flex-shrink-0"
                  disabled={!inputText.trim() || !sessionActive || isProcessing}
                  onClick={() => { sendToSession(inputText); setInputText(""); }}
                >
                  {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Task list */}
            <ScrollArea className="flex-1 p-3">
              {tasks.length === 0 ? (
                <div className="text-center py-12">
                  <Edit3 className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-semibold opacity-60">No tasks yet</p>
                  <p className="text-xs mt-1 opacity-40">The PM will generate tasks as you discuss changes during the session.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(["Bug", "Tweak", "Feature"] as TaskType[]).map((type) => {
                    const typeTasks = tasks.filter((t) => t.type === type);
                    if (typeTasks.length === 0) return null;
                    return (
                      <div key={type}>
                        <div className="flex items-center gap-1.5 mb-1.5 px-1">
                          <span style={{ color: TASK_COLORS[type] }}>{TASK_ICONS[type]}</span>
                          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: TASK_COLORS[type] }}>
                            {type}s ({typeTasks.length})
                          </span>
                        </div>
                        {typeTasks.map((task) => (
                          <div
                            key={task.id}
                            className={`rounded-xl border p-3 mb-2 transition-all ${task.status === "rejected" ? "opacity-40" : ""}`}
                            style={{
                              background: task.status === "accepted" ? "oklch(0.72 0.18 142 / 0.08)" : "var(--color-surface-elevated)",
                              borderColor: task.status === "accepted" ? "oklch(0.72 0.18 142 / 0.3)" : task.status === "rejected" ? "oklch(0.65 0.22 25 / 0.2)" : "var(--color-border-subtle)",
                            }}
                          >
                            {/* Location breadcrumb */}
                            <div className="flex items-center gap-1 mb-1.5 flex-wrap">
                              {task.location.split(" > ").map((part, i, arr) => (
                                <span key={i} className="flex items-center gap-1">
                                  <span className="text-xs px-1.5 py-0.5 rounded"
                                    style={{ background: TASK_BG[task.type], color: TASK_COLORS[task.type], fontSize: "10px" }}>
                                    {part}
                                  </span>
                                  {i < arr.length - 1 && (
                                    <ChevronRight className="w-2.5 h-2.5 flex-shrink-0" style={{ color: "var(--color-muted)" }} />
                                  )}
                                </span>
                              ))}
                            </div>

                            {/* Task text — editable */}
                            {task.editing ? (
                              <input
                                autoFocus
                                defaultValue={task.task}
                                className="w-full bg-transparent text-xs outline-none border-b pb-1 mb-2"
                                style={{ borderColor: "var(--color-accent)", color: "var(--color-foreground)" }}
                                onBlur={(e) => handleTaskEdit(task.id, e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleTaskEdit(task.id, (e.target as HTMLInputElement).value); }}
                              />
                            ) : (
                              <p
                                className="text-xs leading-relaxed mb-2 cursor-pointer hover:opacity-80 transition-opacity"
                                style={{ color: "var(--color-foreground)" }}
                                onClick={() => handleTaskStartEdit(task.id)}
                                title="Click to edit"
                              >
                                {task.task}
                              </p>
                            )}

                            {/* Accept / Reject */}
                            {task.status === "pending" && (
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleTaskAccept(task.id)}
                                  className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-semibold transition-colors hover:bg-white/10"
                                  style={{ background: "oklch(0.72 0.18 142 / 0.12)", color: "oklch(0.72 0.18 142)" }}
                                >
                                  <CheckCircle2 className="w-3 h-3" /> Accept
                                </button>
                                <button
                                  onClick={() => handleTaskReject(task.id)}
                                  className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-semibold transition-colors hover:bg-white/10"
                                  style={{ background: "oklch(0.65 0.22 25 / 0.12)", color: "oklch(0.65 0.22 25)" }}
                                >
                                  <XCircle className="w-3 h-3" /> Reject
                                </button>
                              </div>
                            )}
                            {task.status === "accepted" && (
                              <div className="flex items-center gap-1 text-xs" style={{ color: "oklch(0.72 0.18 142)" }}>
                                <CheckCircle2 className="w-3 h-3" /> Accepted
                              </div>
                            )}
                            {task.status === "rejected" && (
                              <div className="flex items-center gap-1 text-xs" style={{ color: "oklch(0.65 0.22 25)" }}>
                                <XCircle className="w-3 h-3" /> Rejected
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Execute button */}
            {acceptedCount > 0 && (
              <div className="p-3 border-t flex-shrink-0" style={{ borderColor: "var(--color-border-subtle)" }}>
                <Button
                  className="w-full prisma-glow-btn text-white gap-2 text-sm"
                  onClick={executeApprovedTasks}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Execute {acceptedCount} Approved Task{acceptedCount > 1 ? "s" : ""}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
