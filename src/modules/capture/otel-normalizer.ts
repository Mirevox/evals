import { newId, nowIso } from "../../lib/ids";
import type { ConversationTurn, ProviderName } from "../../lib/types";
import type { OtlpAttribute, OtlpPayload, OtlpSpan } from "./types";

function attrMap(attrs: OtlpAttribute[] | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const attr of attrs ?? []) {
    const v = attr.value;
    if (!v) continue;
    if (v.stringValue !== undefined) out[attr.key] = v.stringValue;
    else if (v.intValue !== undefined) out[attr.key] = String(v.intValue);
    else if (v.doubleValue !== undefined) out[attr.key] = String(v.doubleValue);
    else if (v.boolValue !== undefined) out[attr.key] = String(v.boolValue);
  }
  return out;
}

function mapProvider(system?: string): ProviderName {
  const s = (system ?? "").toLowerCase();
  if (s.includes("azure") || s.includes("foundry")) return "azure-foundry";
  if (s.includes("bedrock") || s.includes("aws")) return "aws-bedrock";
  if (s.includes("vertex") || s.includes("google") || s.includes("gemini"))
    return "google-vertex";
  if (s.includes("openrouter")) return "openrouter";
  if (s.includes("ollama") || s.includes("local")) return "local";
  // Direct OpenAI / Anthropic APIs are not hyperscaler labels — keep unknown.
  return "unknown";
}

function contentFromEventAttrs(ea: Record<string, string>): string {
  return (
    ea["gen_ai.content.prompt"] ||
    ea["gen_ai.content.completion"] ||
    ea["gen_ai.prompt"] ||
    ea["gen_ai.completion"] ||
    ea["content"] ||
    ""
  );
}

function extractFromSpan(span: OtlpSpan): ConversationTurn | null {
  const attrs = attrMap(span.attributes);
  let eventPrompt = "";
  let eventCompletion = "";
  for (const event of span.events ?? []) {
    const ea = attrMap(event.attributes);
    const name = (event.name ?? "").toLowerCase();
    const content = contentFromEventAttrs(ea);
    if (!content) continue;
    if (
      name.includes("prompt") ||
      name.includes(".user") ||
      name.includes("input")
    ) {
      eventPrompt = content;
    } else if (
      name.includes("completion") ||
      name.includes("output") ||
      name.includes("response") ||
      name.includes("assistant")
    ) {
      eventCompletion = content;
    } else if (ea["gen_ai.content.prompt"]) {
      eventPrompt = ea["gen_ai.content.prompt"];
    } else if (ea["gen_ai.content.completion"]) {
      eventCompletion = ea["gen_ai.content.completion"];
    }
  }

  const model =
    attrs["gen_ai.request.model"] ||
    attrs["gen_ai.response.model"] ||
    attrs["llm.model"] ||
    "";
  const prompt =
    attrs["gen_ai.prompt"] ||
    attrs["gen_ai.input"] ||
    eventPrompt ||
    "";
  const response =
    attrs["gen_ai.completion"] ||
    attrs["gen_ai.output"] ||
    eventCompletion ||
    "";
  const isGenAi =
    Boolean(attrs["gen_ai.system"]) ||
    Boolean(model) ||
    Boolean(prompt) ||
    Boolean(response) ||
    (span.name ?? "").toLowerCase().includes("chat") ||
    (span.name ?? "").toLowerCase().includes("gen_ai");

  if (!isGenAi || (!prompt && !response && !model)) return null;

  const conversationId =
    attrs["mirevox.conversation_id"] ||
    attrs["gen_ai.conversation.id"] ||
    span.traceId ||
    newId("conv");

  return {
    id: newId("turn"),
    conversationId,
    traceId: span.traceId,
    spanId: span.spanId,
    source: "otel",
    provider: mapProvider(attrs["gen_ai.system"]),
    model: model || "unknown",
    routePolicy: attrs["mirevox.route_policy"],
    prompt,
    response,
    systemPrompt: attrs["gen_ai.system_instructions"],
    latencyMs: attrs["gen_ai.server.time"]
      ? Number(attrs["gen_ai.server.time"])
      : undefined,
    usage: {
      inputTokens: attrs["gen_ai.usage.input_tokens"]
        ? Number(attrs["gen_ai.usage.input_tokens"])
        : undefined,
      outputTokens: attrs["gen_ai.usage.output_tokens"]
        ? Number(attrs["gen_ai.usage.output_tokens"])
        : undefined,
    },
    metadata: { spanName: span.name ?? null, attributes: attrs },
    capturedAt: nowIso(),
  };
}

export function normalizeOtelPayload(payload: OtlpPayload): ConversationTurn[] {
  const turns: ConversationTurn[] = [];
  for (const rs of payload.resourceSpans ?? []) {
    for (const ss of rs.scopeSpans ?? []) {
      for (const span of ss.spans ?? []) {
        const turn = extractFromSpan(span);
        if (turn) turns.push(turn);
      }
    }
  }
  return turns;
}
