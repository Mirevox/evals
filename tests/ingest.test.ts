import { describe, expect, it } from "vitest";
import { MemoryStore } from "../src/lib/store/memory-store";
import {
  normalizeBedrockFixture,
  normalizeFoundryFixture,
  normalizeVertexFixture,
  triggerStubIngest,
} from "../src/modules/ingest";

describe("ingest stubs", () => {
  it("normalizes Foundry 1-5 to 0-1", () => {
    const result = normalizeFoundryFixture();
    for (const metric of result.metrics) {
      expect(metric.score).toBeGreaterThanOrEqual(0);
      expect(metric.score).toBeLessThanOrEqual(1);
      expect(metric.rawScale).toBe("1-5");
      expect(metric.rawScore).toBeDefined();
    }
    const grounded = result.metrics.find((m) => m.name === "groundedness")!;
    expect(grounded.score).toBeCloseTo((4.2 - 1) / 4, 6);
  });

  it("normalizes Bedrock and Vertex fixtures", () => {
    const bedrock = normalizeBedrockFixture();
    const vertex = normalizeVertexFixture();
    expect(bedrock.provider).toBe("aws-bedrock");
    expect(vertex.provider).toBe("google-vertex");
    expect(bedrock.overallScore).toBeGreaterThan(0.5);
    expect(vertex.overallScore).toBeGreaterThan(0.5);
  });

  it("is idempotent on re-ingest", async () => {
    const store = new MemoryStore();
    const first = await triggerStubIngest(store);
    const second = await triggerStubIngest(store);
    expect(first.inserted).toBe(3);
    expect(second.inserted).toBe(0);
    expect(second.skipped).toBe(3);
    expect((await store.listEvals()).length).toBe(3);
  });
});
