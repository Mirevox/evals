import { getConfig, type AppConfig } from "../../lib/config";
import { newId, nowIso } from "../../lib/ids";
import type { EvalStore } from "../../lib/store";
import type {
  ConversationTurn,
  EvalResult,
  PolicyDocument,
  ProviderName,
} from "../../lib/types";
import type { JudgeAdapter } from "./interface";
import { MockJudge } from "./mock-judge";
import { OpenRouterJudge } from "./openrouter-judge";

export type JudgeModeRequest = "auto" | "mock" | "openrouter";

export function resolveJudge(
  mode: JudgeModeRequest = "auto",
  config: AppConfig = getConfig(),
): JudgeAdapter {
  if (mode === "mock") return new MockJudge();
  if (mode === "openrouter") {
    if (!config.openRouterApiKey) {
      throw Object.assign(new Error("OPENROUTER_API_KEY is not configured"), {
        code: "JUDGE_NOT_CONFIGURED",
      });
    }
    return new OpenRouterJudge(config);
  }
  if (config.openRouterApiKey) return new OpenRouterJudge(config);
  return new MockJudge();
}

export async function runJudge(
  store: EvalStore,
  input: {
    turnId?: string;
    inlineTurn?: {
      prompt: string;
      response: string;
      model?: string;
      provider?: string;
      contextSnippets?: string[];
      conversationId?: string;
    };
    policyId?: string;
    mode?: JudgeModeRequest;
  },
): Promise<EvalResult> {
  let turn: ConversationTurn | null = null;
  if (input.turnId) {
    turn = await store.getTurn(input.turnId);
    if (!turn) {
      throw Object.assign(new Error(`Turn not found: ${input.turnId}`), {
        code: "NOT_FOUND",
      });
    }
  } else if (input.inlineTurn) {
    turn = {
      id: newId("turn"),
      conversationId: input.inlineTurn.conversationId ?? newId("conv"),
      source: "manual",
      provider: (input.inlineTurn.provider as ProviderName) || "local",
      model: input.inlineTurn.model || "inline",
      prompt: input.inlineTurn.prompt,
      response: input.inlineTurn.response,
      contextSnippets: input.inlineTurn.contextSnippets,
      metadata: { inline: true },
      capturedAt: nowIso(),
    };
    await store.saveTurns([turn]);
  } else {
    throw Object.assign(new Error("turnId or inlineTurn is required"), {
      code: "INVALID_PAYLOAD",
    });
  }

  let policy: PolicyDocument | null = null;
  if (input.policyId) {
    policy = await store.getPolicy(input.policyId);
    if (!policy) {
      throw Object.assign(new Error(`Policy not found: ${input.policyId}`), {
        code: "NOT_FOUND",
      });
    }
  }

  const judge = resolveJudge(input.mode ?? "auto");
  const result = await judge.judge(turn, policy);
  await store.saveEvals([result]);
  return result;
}

export { MockJudge } from "./mock-judge";
export { OpenRouterJudge } from "./openrouter-judge";
