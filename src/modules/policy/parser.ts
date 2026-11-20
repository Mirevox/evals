import { newId } from "../../lib/ids";
import type { PolicyCategory, PolicyRule } from "../../lib/types";

function splitClauses(english: string): string[] {
  return english
    .split(/\n+|(?<=[.!;])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function classify(text: string): PolicyCategory {
  const t = text.toLowerCase();
  if (
    /pii|email|ssn|api key|secret|phone|password|credential/.test(t)
  )
    return "pii";
  if (/toxic|hate|unsafe|safety|harm|violence|jailbreak/.test(t))
    return "safety";
  if (/ground|cite|source|factual|hallucin/.test(t)) return "groundedness";
  if (/json|markdown|format|schema|structured/.test(t)) return "format";
  if (/latency|ms|second|fast|response time/.test(t)) return "latency";
  if (/cost|token|budget|expensive/.test(t)) return "cost";
  return "custom";
}

function severityOf(text: string, category: PolicyCategory): PolicyRule["severity"] {
  const t = text.toLowerCase();
  if (/must not|never|block|critical|forbidden/.test(t) || category === "pii")
    return "block";
  if (/should|prefer|warn|avoid/.test(t)) return "warn";
  return "info";
}

function parseNumber(text: string): number | null {
  const match = text.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function buildCondition(
  text: string,
  category: PolicyCategory,
): PolicyRule["condition"] {
  const t = text.toLowerCase();
  const num = parseNumber(t);

  if (category === "pii") {
    return { metric: "pii_detected", operator: "eq", value: false };
  }
  if (category === "safety") {
    return { metric: "safety", operator: "gte", value: 0.8 };
  }
  if (category === "groundedness") {
    return { metric: "groundedness", operator: "gte", value: num ?? 0.8 };
  }
  if (/under|less than|at most|max|no more than/.test(t) && /word/.test(t)) {
    return { metric: "word_count", operator: "lte", value: num ?? 200 };
  }
  if (/under|less than|at most|<|ms/.test(t) && /latency|ms|response/.test(t)) {
    return { metric: "latency_ms", operator: "lte", value: num ?? 2000 };
  }
  if (category === "format" && /json/.test(t)) {
    return { metric: "valid_json", operator: "eq", value: true };
  }
  if (/must include|must contain|always include|required/.test(t)) {
    const term =
      text.match(/include\s+["']?([^"'.,]+)["']?/i)?.[1]?.trim() ?? "citation";
    return { metric: "required_term", operator: "contains", value: term };
  }
  if (/must not|never mention|forbidden|do not/.test(t)) {
    const term =
      text.match(/(?:mention|say|use)\s+["']?([^"'.,]+)["']?/i)?.[1]?.trim() ??
      "confidential";
    return { metric: "forbidden_term", operator: "absent", value: term };
  }
  if (num !== null && />=|at least|minimum|score/.test(t)) {
    return { metric: "overall", operator: "gte", value: num > 1 ? num / 100 : num };
  }
  return { metric: "llm_rubric", operator: "gte", value: 0.7 };
}

function actionFor(severity: PolicyRule["severity"]): PolicyRule["action"] {
  if (severity === "block") return "fail_eval";
  if (severity === "warn") return "flag";
  return "log";
}

export function parseEnglishRules(english: string): {
  rules: PolicyRule[];
  warnings: string[];
} {
  const clauses = splitClauses(english);
  const warnings: string[] = [];
  if (clauses.length === 0) {
    warnings.push("No clauses found in English input.");
    return { rules: [], warnings };
  }

  const rules: PolicyRule[] = clauses.map((clause) => {
    const category = classify(clause);
    const severity = severityOf(clause, category);
    const condition = buildCondition(clause, category);
    if (condition.metric === "llm_rubric") {
      warnings.push(`Clause treated as qualitative rubric: "${clause}"`);
    }
    return {
      id: newId("rule"),
      sourceText: clause,
      category,
      severity,
      condition,
      action: actionFor(severity),
    };
  });

  return { rules, warnings };
}
