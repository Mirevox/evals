import { newId, nowIso } from "../../../lib/ids";
import type { EvalResult, MetricScore } from "../../../lib/types";
import fixture from "../fixtures/aws-bedrock.json";

function invertToxicity(score: number): number {
  // toxicity is bad; invert for "higher is better" unified score
  return Math.min(1, Math.max(0, 1 - score));
}

export function normalizeBedrockFixture(
  raw: typeof fixture = fixture,
): EvalResult {
  const metrics: MetricScore[] = raw.metrics.map((m) => {
    const isToxicity = m.metricName.toLowerCase().includes("toxic");
    const score = isToxicity ? invertToxicity(m.score) : m.score;
    return {
      name: m.metricName,
      score,
      passed: score >= 0.7,
      threshold: 0.7,
      rawScore: m.score,
      rawScale: "0-1",
      reason: m.explanation,
    };
  });
  const overallScore =
    metrics.reduce((sum, m) => sum + m.score, 0) / Math.max(metrics.length, 1);
  return {
    id: newId("eval"),
    source: "hyperscaler-ingest",
    provider: "aws-bedrock",
    externalEvalId: raw.evaluationId,
    targetModel: raw.modelId,
    overallScore,
    passed: metrics.every((m) => m.passed),
    metrics,
    rationale: `AWS Bedrock stub ingest for ${raw.evaluationId}`,
    providerMetadata: { stub: true, raw },
    evaluatedAt: nowIso(),
  };
}
