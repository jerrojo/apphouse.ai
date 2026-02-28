// =============================================================================
// packages/agents/src/index.ts
// agent registry + orchestrator
// =============================================================================

export { PipelineOrchestrator, createOrchestrator, runPipeline } from './orchestrator';
export type { PipelineContext, PipelineCallbacks } from './orchestrator';
export { AGENTS, PIPELINE_ORDER } from './config';
export type { AgentName, AgentConfig } from './config';
