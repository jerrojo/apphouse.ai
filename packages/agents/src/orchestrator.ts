// =============================================================================
// packages/agents/src/orchestrator.ts
// pipeline orchestrator — runs agents in sequence, tracks progress
// =============================================================================

import { AGENTS, PIPELINE_ORDER, type AgentName } from './config';

export interface PipelineContext {
  appId: string;
  orderId: string;
  pipelineId: string;
  intake: Record<string, unknown>;
  agentOutputs: Partial<Record<AgentName, unknown>>;
}

export interface PipelineCallbacks {
  onAgentStart: (agent: AgentName, context: PipelineContext) => Promise<void>;
  onAgentComplete: (agent: AgentName, output: unknown, context: PipelineContext) => Promise<void>;
  onAgentError: (agent: AgentName, error: Error, context: PipelineContext) => Promise<void>;
  onProgress: (agent: AgentName, progress: number, context: PipelineContext) => Promise<void>;
  executeAgent: (agent: AgentName, input: unknown, context: PipelineContext) => Promise<unknown>;
}

export class PipelineOrchestrator {
  private callbacks: PipelineCallbacks;

  constructor(callbacks: PipelineCallbacks) {
    this.callbacks = callbacks;
  }

  async run(context: PipelineContext): Promise<PipelineContext> {
    const totalAgents = PIPELINE_ORDER.length;

    for (let i = 0; i < totalAgents; i++) {
      const agentName = PIPELINE_ORDER[i];
      const progress = Math.round(((i + 1) / totalAgents) * 100);

      try {
        await this.callbacks.onAgentStart(agentName, context);

        const input = this.buildAgentInput(agentName, context);
        const output = await this.callbacks.executeAgent(agentName, input, context);

        context.agentOutputs[agentName] = output;

        await this.callbacks.onAgentComplete(agentName, output, context);
        await this.callbacks.onProgress(agentName, progress, context);
      } catch (error) {
        await this.callbacks.onAgentError(agentName, error as Error, context);
        throw error;
      }
    }

    return context;
  }

  private buildAgentInput(agent: AgentName, context: PipelineContext): unknown {
    return {
      intake: context.intake,
      previousOutputs: context.agentOutputs,
      agentConfig: AGENTS[agent],
    };
  }
}

export function createOrchestrator(callbacks: PipelineCallbacks): PipelineOrchestrator {
  return new PipelineOrchestrator(callbacks);
}

export async function runPipeline(
  context: PipelineContext,
  callbacks: PipelineCallbacks
): Promise<PipelineContext> {
  const orchestrator = new PipelineOrchestrator(callbacks);
  return orchestrator.run(context);
}
