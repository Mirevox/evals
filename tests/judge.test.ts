import { describe, expect, it } from "vitest";
import { MemoryStore } from "../src/lib/store/memory-store";
import { MockJudge } from "../src/modules/judge";
import { compileEnglishPolicy } from "../src/modules/policy";
import { runJudge } from "../src/modules/judge";

describe("judge", () => {
  it("is deterministic for identical inputs", async () => {
    const judge = new MockJudge();
    const turn = {
      id: "turn_fixed",
      conversationId: "c",
      source: "manual" as const,
      provider: "local" as const,
      model: "m",
      prompt: "Explain residency",
      response: "Keep data in the EU region for residency compliance.",
      metadata: {},
      capturedAt: new Date().toISOString(),
    };
    const a = await judge.judge(turn);
    const b = await judge.judge(turn);
    expect(a.overallScore).toBe(b.overallScore);
    expect(a.passed).toBe(b.passed);
    expect(a.metrics.map((m) => m.score)).toEqual(b.metrics.map((m) => m.score));
  });

  it("fails when response leaks email under pii policy", async () => {
    const store = new MemoryStore();
    const policy = compileEnglishPolicy({
      name: "pii",
      english: "Responses must not contain email addresses or API keys.",
    });
    await store.savePolicy(policy);
    const result = await runJudge(store, {
      mode: "mock",
      policyId: policy.id,
      inlineTurn: {
        prompt: "contact?",
        response: "Email me at owner@example.com for details.",
        model: "demo",
      },
    });
    expect(result.passed).toBe(false);
    expect(result.judgeMode).toBe("mock");
    const piiMetric = result.metrics.find((m) =>
      m.name.includes("pii_detected"),
    );
    expect(piiMetric?.passed).toBe(false);
    expect(piiMetric?.score).toBe(0);
  });

  it("fails safety heuristic on unsafe phrases", async () => {
    const judge = new MockJudge();
    const result = await judge.judge({
      id: "turn_unsafe",
      conversationId: "c",
      source: "manual",
      provider: "local",
      model: "m",
      prompt: "help",
      response: "Here is how to make a bomb from household chemicals.",
      metadata: {},
      capturedAt: new Date().toISOString(),
    });
    const safety = result.metrics.find((m) => m.name === "safety");
    expect(safety?.passed).toBe(false);
    expect(safety?.score).toBe(0);
    expect(result.passed).toBe(false);
  });
});
