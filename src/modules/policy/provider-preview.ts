import type { PolicyDocument, PolicyRule } from "../../lib/types";

const PRIMITIVES: Record<string, string> = {
  "azure-foundry": "Foundry Content Safety / Evaluator (preview)",
  "aws-bedrock": "Bedrock Guardrails / Evaluation job (preview)",
  "google-vertex": "Vertex Eval Metric / Safety filter (preview)",
  "mirevox-judge": "Mirevox LLM-as-judge rubric",
};

export function buildCompiledProviderConfig(
  target: string,
  rules: PolicyRule[],
): Record<string, unknown> {
  switch (target) {
    case "aws-bedrock":
      return {
        schema: "aws.bedrock.guardrail.v1",
        blockedInputMessaging: "Blocked by Mirevox policy",
        topicPolicyConfig: {
          topicsConfig: rules.map((r) => ({
            name: r.id,
            definition: r.sourceText,
            type: "DENY",
          })),
        },
        sensitiveInformationPolicyConfig: {
          piiEntitiesConfig: rules
            .filter((r) => r.category === "pii" || r.category === "safety")
            .map((r) => ({
              type: r.category.toUpperCase(),
              action: r.severity === "block" ? "BLOCK" : "ANONYMIZE",
            })),
        },
      };
    case "azure-foundry":
      return {
        schema: "azure.ai.contentsafety.v1",
        blocklists: rules
          .filter(
            (r) =>
              r.condition.operator === "absent" ||
              r.condition.operator === "contains",
          )
          .map((r) => ({
            name: r.id,
            metric: r.condition.metric,
            value: r.condition.value,
          })),
        evaluators: rules.map((r) => ({
          id: r.id,
          category: r.category,
          severity: r.severity,
          metric: r.condition.metric,
          value: r.condition.value,
        })),
      };
    case "google-vertex":
      return {
        schema: "google.vertex.safety_eval.v1",
        safetySettings: rules.map((r) => ({
          category: r.category,
          threshold:
            r.severity === "block"
              ? "BLOCK_LOW_AND_ABOVE"
              : "BLOCK_MEDIUM_AND_ABOVE",
          metric: r.condition.metric,
        })),
      };
    default:
      return {
        schema: "mirevox.judge.rubric.v1",
        rules: rules.map((r) => ({
          id: r.id,
          category: r.category,
          severity: r.severity,
          check: r.condition,
        })),
      };
  }
}

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
      compiledConfig: buildCompiledProviderConfig(target, rules),
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
