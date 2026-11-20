import type { PolicyDocument, PolicyRule } from "../../lib/types";

const PRIMITIVES: Record<string, string> = {
  "azure-foundry": "Foundry Content Safety / Evaluator (preview)",
  "aws-bedrock": "Bedrock Guardrails / Evaluation job (preview)",
  "google-vertex": "Vertex Eval Metric / Safety filter (preview)",
  "mirevox-judge": "Mirevox LLM-as-judge rubric",
};

export function buildProviderMappings(
  rules: PolicyRule[],
  targets: PolicyDocument["targetProviders"],
): PolicyDocument["providerMappings"] {
  const mappings: PolicyDocument["providerMappings"] = {};
  for (const target of targets) {
    mappings[target] = {
      pushStatus: "not_pushed",
      targetPrimitive: PRIMITIVES[target] ?? target,
      ruleCount: rules.length,
    };
  }
  return mappings;
}

export function detectTargetProviders(
  english: string,
): PolicyDocument["targetProviders"] {
  const t = english.toLowerCase();
  const found: PolicyDocument["targetProviders"] = [];
  if (/foundry|azure/.test(t)) found.push("azure-foundry");
  if (/bedrock|aws/.test(t)) found.push("aws-bedrock");
  if (/vertex|google|gemini/.test(t)) found.push("google-vertex");
  if (found.length === 0) {
    return [
      "azure-foundry",
      "aws-bedrock",
      "google-vertex",
      "mirevox-judge",
    ];
  }
  if (!found.includes("mirevox-judge")) found.push("mirevox-judge");
  return found;
}
