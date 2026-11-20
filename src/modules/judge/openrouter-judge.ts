import { z } from "zod";
import type { AppConfig } from "../../lib/config";
import { newId, nowIso } from "../../lib/ids";
import type {
  ConversationTurn,
  EvalResult,
  MetricScore,
  PolicyDocument,
} from "../../lib/types";
import type { JudgeAdapter } from "./interface";
import { MockJudge } from "./mock-judge";

const judgeResponseSchema = z.object({
  overallScore: z.number().min(0).max(1),
  passed: z.boolean(),
  rationale: z.string(),
  metrics: z
    .array(
      z.object({
        name: z.string(),
        score: z.number().min(0).max(1),
        passed: z.boolean(),
        reason: z.string().optional(),
      }),
    )
    .optional(),
});

export class OpenRouterJudge implements JudgeAdapter {
  readonly mode = "openrouter" as const;
  readonly model: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fallback = new MockJudge();

  constructor(config: AppConfig) {
    if (!config.openRouterApiKey) {
      throw new Error("OPENROUTER_API_KEY is required for OpenRouterJudge");
    }
    this.apiKey = config.openRouterApiKey;
    this.baseUrl = config.openRouterBaseUrl.replace(/\/$/, "");
    this.model = config.openRouterJudgeModel;
  }

  async judge(
    turn: ConversationTurn,
    policy?: PolicyDocument | null,
  ): Promise<EvalResult> {
    const policyText = policy
      ? policy.rules.map((r) => `- ${r.sourceText}`).join("\n")
      : "(no policy; use default helpfulness/safety/groundedness)";

    const prompt = `You are an evaluation judge. Score the model response.
Return ONLY JSON: {"overallScore":0-1,"passed":boolean,"rationale":string,"metrics":[{"name":string,"score":0-1,"passed":boolean,"reason":string}]}

Policy:
${policyText}

Prompt:
${turn.prompt}

Response:
${turn.response}`;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15_000);
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://github.com/Mirevox/evals",
          "X-Title": "Mirevox Evals",
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "Return strict JSON only." },
            { role: "user", content: prompt },
          ],
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        const fallback = await this.fallback.judge(turn, policy);
        fallback.rationale = `OpenRouter HTTP ${res.status}; fell back to MockJudge. ${fallback.rationale}`;
        fallback.providerMetadata = {
          ...(fallback.providerMetadata ?? {}),
          fallbackReason: `http_${res.status}`,
        };
        return fallback;
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content ?? "{}";
      const parsed = judgeResponseSchema.parse(JSON.parse(content));
      const metrics: MetricScore[] = (parsed.metrics ?? []).map((m) => ({
        name: m.name,
        score: m.score,
        passed: m.passed,
        reason: m.reason,
      }));

      return {
        id: newId("eval"),
        source: "judge",
        provider: "mirevox-judge",
        turnId: turn.id,
        policyId: policy?.id,
        judgeMode: "openrouter",
        judgeModel: this.model,
        targetModel: turn.model,
        overallScore: parsed.overallScore,
        passed: parsed.passed,
        metrics:
          metrics.length > 0
            ? metrics
            : [
                {
                  name: "overall",
                  score: parsed.overallScore,
                  passed: parsed.passed,
                  reason: parsed.rationale,
                },
              ],
        rationale: parsed.rationale,
        evaluatedAt: nowIso(),
      };
    } catch (error) {
      const fallback = await this.fallback.judge(turn, policy);
      fallback.rationale = `OpenRouter failed (${(error as Error).message}); fell back to MockJudge. ${fallback.rationale}`;
      fallback.providerMetadata = {
        ...(fallback.providerMetadata ?? {}),
        fallbackReason: (error as Error).message,
      };
      return fallback;
    }
  }
}
