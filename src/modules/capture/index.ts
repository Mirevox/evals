import type { EvalStore } from "../../lib/store";
import type { ConversationTurn } from "../../lib/types";
import { runJudge } from "../judge";
import { normalizeOtelPayload } from "./otel-normalizer";
import {
  webhookPayloadSchema,
  type OtlpPayload,
  type WebhookTurnPayload,
} from "./types";
import { normalizeWebhookTurn } from "./webhook-normalizer";

export interface CaptureOptions {
  autoJudge?: boolean;
  policyId?: string;
}

export interface CaptureResult {
  accepted: number;
  skipped: number;
  turnIds: string[];
  turns: ConversationTurn[];
  evalIds: string[];
}

function readBodyCaptureFlags(body: unknown): CaptureOptions {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {};
  }
  const obj = body as Record<string, unknown>;
  return {
    autoJudge: obj.autoJudge === true,
    policyId: typeof obj.policyId === "string" ? obj.policyId : undefined,
  };
}

async function maybeAutoJudge(
  store: EvalStore,
  turns: ConversationTurn[],
  flags: CaptureOptions,
): Promise<string[]> {
  if (!flags.autoJudge || turns.length === 0) return [];
  const evalIds: string[] = [];
  for (const turn of turns) {
    const evalResult = await runJudge(store, {
      turnId: turn.id,
      policyId: flags.policyId,
      mode: "auto",
    });
    evalIds.push(evalResult.id);
  }
  return evalIds;
}

export async function captureWebhook(
  store: EvalStore,
  body: unknown,
  options?: CaptureOptions,
): Promise<CaptureResult> {
  const bodyFlags = readBodyCaptureFlags(body);
  const parsed = webhookPayloadSchema.parse(body);
  const payloads: WebhookTurnPayload[] =
    "turns" in parsed ? parsed.turns : [parsed];
  const turns = payloads.map(normalizeWebhookTurn);
  const result = await store.saveTurns(turns);
  const evalIds = await maybeAutoJudge(store, result.inserted, {
    autoJudge: options?.autoJudge ?? bodyFlags.autoJudge,
    policyId: options?.policyId ?? bodyFlags.policyId,
  });
  return {
    accepted: result.inserted.length,
    skipped: result.skipped,
    turnIds: result.inserted.map((t) => t.id),
    turns: result.inserted,
    evalIds,
  };
}

export async function captureOtel(
  store: EvalStore,
  body: unknown,
  options?: CaptureOptions,
): Promise<CaptureResult> {
  const bodyFlags = readBodyCaptureFlags(body);
  const turns = normalizeOtelPayload(body as OtlpPayload);
  const result = await store.saveTurns(turns);
  const evalIds = await maybeAutoJudge(store, result.inserted, {
    autoJudge: options?.autoJudge ?? bodyFlags.autoJudge,
    policyId: options?.policyId ?? bodyFlags.policyId,
  });
  return {
    accepted: result.inserted.length,
    skipped: result.skipped,
    turnIds: result.inserted.map((t) => t.id),
    turns: result.inserted,
    evalIds,
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
