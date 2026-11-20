import type { EvalStore } from "../../lib/store";
import type { ConversationTurn } from "../../lib/types";
import { normalizeOtelPayload } from "./otel-normalizer";
import {
  webhookPayloadSchema,
  type OtlpPayload,
  type WebhookTurnPayload,
} from "./types";
import { normalizeWebhookTurn } from "./webhook-normalizer";

export async function captureWebhook(
  store: EvalStore,
  body: unknown,
): Promise<{ accepted: number; skipped: number; turnIds: string[]; turns: ConversationTurn[] }> {
  const parsed = webhookPayloadSchema.parse(body);
  const payloads: WebhookTurnPayload[] =
    "turns" in parsed ? parsed.turns : [parsed];
  const turns = payloads.map(normalizeWebhookTurn);
  const result = await store.saveTurns(turns);
  return {
    accepted: result.inserted.length,
    skipped: result.skipped,
    turnIds: result.inserted.map((t) => t.id),
    turns: result.inserted,
  };
}

export async function captureOtel(
  store: EvalStore,
  body: unknown,
): Promise<{ accepted: number; skipped: number; turnIds: string[]; turns: ConversationTurn[] }> {
  const turns = normalizeOtelPayload(body as OtlpPayload);
  const result = await store.saveTurns(turns);
  return {
    accepted: result.inserted.length,
    skipped: result.skipped,
    turnIds: result.inserted.map((t) => t.id),
    turns: result.inserted,
  };
}

export { normalizeOtelPayload } from "./otel-normalizer";
export { normalizeWebhookTurn } from "./webhook-normalizer";
export {
  webhookPayloadSchema,
  webhookTurnSchema,
  type WebhookTurnPayload,
  type OtlpPayload,
} from "./types";
