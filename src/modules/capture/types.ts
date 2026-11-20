import { z } from "zod";

export const webhookTurnSchema = z.object({
  conversationId: z.string().min(1),
  traceId: z.string().optional(),
  spanId: z.string().optional(),
  provider: z.string().optional(),
  model: z.string().min(1),
  routePolicy: z.string().optional(),
  prompt: z.string(),
  response: z.string(),
  systemPrompt: z.string().optional(),
  contextSnippets: z.array(z.string()).optional(),
  latencyMs: z.number().optional(),
  usage: z
    .object({
      inputTokens: z.number().optional(),
      outputTokens: z.number().optional(),
    })
    .optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const webhookPayloadSchema = z.union([
  webhookTurnSchema,
  z.object({ turns: z.array(webhookTurnSchema).min(1) }),
]);

export type WebhookTurnPayload = z.infer<typeof webhookTurnSchema>;

export interface OtlpAttribute {
  key: string;
  value?: {
    stringValue?: string;
    intValue?: number | string;
    doubleValue?: number;
    boolValue?: boolean;
  };
}

export interface OtlpSpan {
  traceId?: string;
  spanId?: string;
  name?: string;
  attributes?: OtlpAttribute[];
  events?: Array<{
    name?: string;
    attributes?: OtlpAttribute[];
  }>;
}

export interface OtlpPayload {
  resourceSpans?: Array<{
    resource?: { attributes?: OtlpAttribute[] };
    scopeSpans?: Array<{
      spans?: OtlpSpan[];
    }>;
  }>;
}
