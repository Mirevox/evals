import { describe, expect, it } from "vitest";
import { compileEnglishPolicy } from "../src/modules/policy";

describe("policy compiler", () => {
  it("compiles multi-clause English into typed rules", () => {
    const policy = compileEnglishPolicy({
      name: "gov",
      english: `Responses must not contain email addresses or API keys.
Keep answers under 200 words.
Cite sources for factual claims.
Always include JSON output when requested.`,
    });
    expect(policy.rules.length).toBeGreaterThanOrEqual(3);
    const categories = new Set(policy.rules.map((r) => r.category));
    expect(categories.has("pii")).toBe(true);
    expect(
      policy.rules.some((r) => r.condition.metric === "word_count"),
    ).toBe(true);
    expect(policy.providerMappings["azure-foundry"].pushStatus).toBe(
      "not_pushed",
    );
    expect(
      policy.providerMappings["aws-bedrock"].compiledConfig,
    ).toMatchObject({
      schema: "aws.bedrock.guardrail.v1",
    });
    expect(
      policy.providerMappings["azure-foundry"].compiledConfig,
    ).toMatchObject({
      schema: "azure.ai.contentsafety.v1",
    });
    expect(
      policy.providerMappings["google-vertex"].compiledConfig,
    ).toMatchObject({
      schema: "google.vertex.safety_eval.v1",
    });
  });

  it("rejects empty english", () => {
    expect(() => compileEnglishPolicy({ english: "   " })).toThrow();
  });

  it("increments version when existing policy provided", () => {
    const v1 = compileEnglishPolicy({ name: "a", english: "Be helpful." });
    const v2 = compileEnglishPolicy({
      name: "a",
      english: "Be helpful. Never mention secrets.",
      existing: v1,
    });
    expect(v2.version).toBe(2);
    expect(v2.id).toBe(v1.id);
  });
});
