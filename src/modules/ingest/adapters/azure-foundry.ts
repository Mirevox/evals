import { newId, nowIso } from "../../../lib/ids";
import type { EvalResult, MetricScore } from "../../../lib/types";
import fixture from "../fixtures/azure-foundry.json";

function normalizeLikert15(raw: number): number {
  return Math.min(1, Math.max(0, (raw - 1) / 4));
}

export function normalizeFoundryFixture(
  raw: typeof fixture = fixture,
): EvalResult {
  const metrics: MetricScore[] = raw.evaluators.map((e) => {
    const score = normalizeLikert15(e.score);
    return {
      name: e.name,
      score,
      passed: score >= 0.7,
      threshold: 0.7,
      rawScore: e.score,
      rawScale: e.scale,
      reason: e.reason,
    };
  });
  const overallScore =
    metrics.reduce((sum, m) => sum + m.score, 0) / Math.max(metrics.length, 1);
  return {
    id: newId("eval"),
    source: "hyperscaler-ingest",
    provider: "azure-foundry",
    externalEvalId: raw.runId,
    targetModel: raw.model,
    overallScore,
    passed: metrics.every((m) => m.passed),
    metrics,
    rationale: `Azure AI Foundry stub ingest for run ${raw.runId}`,
    providerMetadata: { stub: true, raw },
    evaluatedAt: nowIso(),
  };
}
