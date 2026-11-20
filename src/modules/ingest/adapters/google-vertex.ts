import { newId, nowIso } from "../../../lib/ids";
import type { EvalResult, MetricScore } from "../../../lib/types";
import fixture from "../fixtures/google-vertex.json";

function normalizeScore(raw: number, scale: string): number {
  if (scale === "1-5") return Math.min(1, Math.max(0, (raw - 1) / 4));
  if (scale === "0-100") return Math.min(1, Math.max(0, raw / 100));
  return Math.min(1, Math.max(0, raw));
}

export function normalizeVertexFixture(
  raw: typeof fixture = fixture,
): EvalResult {
  const metrics: MetricScore[] = raw.pointwiseMetrics.map((m) => {
    const score = normalizeScore(m.score, m.scale);
    return {
      name: m.metric,
      score,
      passed: score >= 0.7,
      threshold: 0.7,
      rawScore: m.score,
      rawScale: m.scale,
      reason: m.rationale,
    };
  });
  const overallScore =
    metrics.reduce((sum, m) => sum + m.score, 0) / Math.max(metrics.length, 1);
  return {
    id: newId("eval"),
    source: "hyperscaler-ingest",
    provider: "google-vertex",
    externalEvalId: raw.evaluationJobId,
    targetModel: raw.model,
    overallScore,
    passed: metrics.every((m) => m.passed),
    metrics,
    rationale: `Google Vertex stub ingest for ${raw.evaluationJobId}`,
    providerMetadata: { stub: true, raw },
    evaluatedAt: nowIso(),
  };
}
