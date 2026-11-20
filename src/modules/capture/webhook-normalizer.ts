import { newId, nowIso } from "../../lib/ids";
import type { ConversationTurn, ProviderName } from "../../lib/types";
import type { WebhookTurnPayload } from "./types";

function mapProvider(raw?: string): ProviderName {
  const s = (raw ?? "").toLowerCase();
  if (!s) return "unknown";
  if (s.includes("foundry") || s.includes("azure")) return "azure-foundry";
  if (s.includes("bedrock") || s.includes("aws")) return "aws-bedrock";
  if (s.includes("vertex") || s.includes("google")) return "google-vertex";
  if (s.includes("openrouter")) return "openrouter";
  if (s.includes("local") || s.includes("ollama")) return "local";
  if (
    [
      "azure-foundry",
      "aws-bedrock",
      "google-vertex",
      "local",
      "openrouter",
      "unknown",
    ].includes(s)
  ) {
    return s as ProviderName;
  }
  return "unknown";
}

export function normalizeWebhookTurn(
  payload: WebhookTurnPayload,
): ConversationTurn {
  return {
    id: newId("turn"),
    conversationId: payload.conversationId,
    traceId: payload.traceId,
    spanId: payload.spanId,
    source: "webhook",
    provider: mapProvider(payload.provider),
    model: payload.model,
    routePolicy: payload.routePolicy,
    prompt: payload.prompt,
    response: payload.response,
    systemPrompt: payload.systemPrompt,
    contextSnippets: payload.contextSnippets,
    latencyMs: payload.latencyMs,
    usage: payload.usage,
    metadata: payload.metadata ?? {},
    capturedAt: nowIso(),
  };
}
