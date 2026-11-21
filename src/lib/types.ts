export type ProviderName =
  | "azure-foundry"
  | "aws-bedrock"
  | "google-vertex"
  | "local"
  | "openrouter"
  | "unknown";

export type HyperscalerProvider =
  | "azure-foundry"
  | "aws-bedrock"
  | "google-vertex";

export interface ConversationTurn {
  id: string;
  conversationId: string;
  traceId?: string;
  spanId?: string;
  source: "otel" | "webhook" | "manual";
  provider: ProviderName;
  model: string;
  routePolicy?: string;
  prompt: string;
  response: string;
  systemPrompt?: string;
  contextSnippets?: string[];
  latencyMs?: number;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
  metadata: Record<string, unknown>;
  capturedAt: string;
}

export interface MetricScore {
  name: string;
  score: number;
  passed: boolean;
  threshold?: number;
  rawScore?: number;
  rawScale?: string;
  reason?: string;
}

export interface EvalResult {
  id: string;
  source: "judge" | "hyperscaler-ingest";
  provider: ProviderName | "mirevox-judge";
  externalEvalId?: string;
  turnId?: string;
  policyId?: string;
  judgeMode?: "mock" | "openrouter";
  judgeModel?: string;
  targetModel: string;
  overallScore: number;
  passed: boolean;
  metrics: MetricScore[];
  rationale: string;
  providerMetadata?: Record<string, unknown>;
  evaluatedAt: string;
}

export type PolicyCategory =
  | "pii"
  | "safety"
  | "groundedness"
  | "format"
  | "latency"
  | "cost"
  | "custom";

export interface PolicyRule {
  id: string;
  sourceText: string;
  category: PolicyCategory;
  severity: "info" | "warn" | "block";
  condition: {
    metric: string;
    operator: "gte" | "lte" | "lt" | "gt" | "eq" | "absent" | "contains";
    value: number | string | boolean;
  };
  action: "log" | "flag" | "fail_eval" | "block_route";
}

export interface PolicyDocument {
  id: string;
  name: string;
  version: number;
  sourceEnglish: string;
  rules: PolicyRule[];
  targetProviders: Array<
    "azure-foundry" | "aws-bedrock" | "google-vertex" | "mirevox-judge"
  >;
  providerMappings: Record<
    string,
    {
      pushStatus: "not_pushed";
      targetPrimitive: string;
      ruleCount: number;
      compiledConfig?: Record<string, unknown>;
    }
  >;
  warnings: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
