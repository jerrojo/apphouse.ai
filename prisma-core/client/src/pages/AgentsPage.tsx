import { useState, useRef, useEffect } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AGENTS, DIVISIONS, AgentDefinition } from "../../../shared/agents";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

function AgentCard({ agent, isSelected, onClick }: { agent: AgentDefinition; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 flex items-center gap-3"
      style={isSelected
        ? { background: agent.accentColor + "18", border: `1px solid ${agent.accentColor}44` }
        : { background: "transparent", border: "1px solid transparent" }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "var(--color-surface-elevated)"; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: "var(--color-surface-elevated)" }}>
        {agent.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold truncate" style={{ color: isSelected ? agent.accentColor : "var(--color-foreground)", fontFamily: "var(--font-display)" }}>{agent.name}</p>
        <p className="text-xs truncate" style={{ color: "var(--color-faint)" }}>{agent.role}</p>
      </div>
    </button>
  );
}

function AgentChat({ agent, projectId }: { agent: AgentDefinition; projectId: number }) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Use SSE streaming chat endpoint directly
  const [messages, setMessages] = useState<Array<{ id: number; role: string; content: string }>>([]);
  const [isSending, setIsSending] = useState(false);


  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    const userMsg = input.trim();
    setInput("");
    setIsSending(true);
    const userEntry = { id: Date.now(), role: "user", content: userMsg };
    setMessages(prev => [...prev, userEntry]);
    const agentEntry = { id: Date.now() + 1, role: "agent", content: "" };
    setMessages(prev => [...prev, agentEntry]);
    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, agentId: agent.id, message: userMsg, mode: "agent" }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: m.content + parsed.content } : m));
                }
              } catch {}
            }
          }
        }
      }
    } catch { toast.error("Failed to send message"); }
    setIsSending(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Agent header */}
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--color-border-subtle)", background: "oklch(0.065 0.008 264 / 0.80)", backdropFilter: "blur(12px)" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: "var(--color-surface-elevated)" }}>
          {agent.icon}
        </div>
        <div>
          <p className="font-semibold font-display text-sm">{agent.name}</p>
          <p className="text-xs" style={{ color: "var(--color-muted)" }}>{agent.role} · {agent.division}</p>
        </div>
        <div className="ml-auto">
          <div className="w-2 h-2 rounded-full status-idle" />
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-5">
        {(!messages || messages.length === 0) && (
          <div className="text-center py-12">
            <div className="text-3xl mb-3">{agent.icon}</div>
            <p className="text-sm font-semibold font-display mb-1">{agent.name}</p>
            <p className="text-xs max-w-xs mx-auto" style={{ color: "var(--color-muted)" }}>
              {agent.expertise}
            </p>
            <p className="text-xs mt-4" style={{ color: "var(--color-muted)" }}>Start a conversation to get expert guidance.</p>
          </div>
        )}
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${(msg as { role: string }).role === "user" ? "justify-end" : "justify-start"}`}>
              {(msg as { role: string }).role === "agent" && (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mr-2 mt-0.5" style={{ background: "var(--color-surface-elevated)" }}>
                  {agent.icon}
                </div>
              )}
              <div
                className="max-w-[75%] rounded-2xl px-4 py-3 text-sm"
                style={(msg as { role: string }).role === "user"
                  ? { background: "oklch(0.62 0.22 275 / 0.2)", borderRadius: "1rem 1rem 0.25rem 1rem" }
                  : { background: "var(--color-surface-elevated)", borderRadius: "0.25rem 1rem 1rem 1rem" }
                }
              >
                {(msg as { role: string }).role === "agent" ? (
                  <Streamdown>{msg.content}</Streamdown>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mr-2" style={{ background: "var(--color-surface-elevated)" }}>
                {agent.icon}
              </div>
              <div className="px-4 py-3 rounded-2xl" style={{ background: "var(--color-surface-elevated)", borderRadius: "0.25rem 1rem 1rem 1rem" }}>
                <div className="flex gap-1 items-center h-5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full waveform-bar" style={{ background: "var(--color-muted)", animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="px-4 py-3" style={{ borderTop: "1px solid var(--color-border-subtle)", background: "oklch(0.065 0.008 264 / 0.80)", backdropFilter: "blur(12px)" }}>
        <div className="flex gap-2 items-center">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={`Ask ${agent.name.split(" ")[0]}...`}
            className="flex-1 text-sm h-10 rounded-xl"
            style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}
            disabled={isSending}
          />
          <Button
            size="icon"
            className="prisma-glow-btn text-white flex-shrink-0 rounded-xl h-10 w-10"
            onClick={handleSend}
            disabled={!input.trim() || isSending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = Number(params.projectId);
  const [selectedAgent, setSelectedAgent] = useState<AgentDefinition | null>(null);

  return (
    <div className="flex h-full animate-fade-up">
      {/* Left: Agent list */}
      <div className="w-64 flex-shrink-0 overflow-y-auto" style={{ borderRight: "1px solid var(--color-border-subtle)" }}>
        <div className="px-4 py-4" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
          <h1 className="text-sm font-bold" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em", color: "var(--color-foreground)" }}>Agent Team</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>{AGENTS.length} specialists</p>
        </div>

        <div className="px-2 py-3 space-y-4">
          {DIVISIONS.map((div) => {
            const divAgents = AGENTS.filter((a) => a.division === div.name);
            return (
              <div key={div.name}>
                <div className="flex items-center gap-2 px-2 mb-1.5">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: div.color }} />
                  <p className="text-xs font-semibold" style={{ color: div.color, letterSpacing: "-0.01em" }}>{div.name.split(" & ")[0]}</p>
                </div>
                <div className="space-y-0.5">
                  {divAgents.map((agent) => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      isSelected={selectedAgent?.id === agent.id}
                      onClick={() => setSelectedAgent(agent)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Chat */}
      <div className="flex-1 flex flex-col">
        {selectedAgent ? (
          <AgentChat agent={selectedAgent} projectId={projectId} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div className="max-w-sm animate-fade-up">
              <div className="text-4xl mb-4">🎯</div>
              <h2 className="text-lg font-bold font-display mb-2">Select an Agent</h2>
              <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                Select an agent from the left panel to start a focused conversation. Each agent brings deep expertise in their domain.
              </p>
              <div className="mt-6 grid grid-cols-5 gap-2">
                {DIVISIONS.map((div) => (
                  <div key={div.name} className="text-center">
                    <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ background: div.color }} />
                    <p className="text-xs" style={{ color: "var(--color-muted)" }}>{AGENTS.filter(a => a.division === div.name).length}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
