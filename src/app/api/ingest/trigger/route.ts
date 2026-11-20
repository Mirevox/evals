import { jsonError, jsonOk } from "@/lib/http";
import { getStore } from "@/lib/store";
import type { HyperscalerProvider } from "@/lib/types";
import { HYPERSCALER_PROVIDERS, triggerStubIngest } from "@/modules/ingest";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  providers: z
    .array(z.enum(["azure-foundry", "aws-bedrock", "google-vertex"]))
    .optional(),
  reset: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const raw = await request.json().catch(() => ({}));
    const body = bodySchema.parse(raw);
    const providers = (body.providers ?? HYPERSCALER_PROVIDERS) as HyperscalerProvider[];
    const result = await triggerStubIngest(getStore(), {
      providers,
      reset: body.reset,
    });
    return jsonOk(result, 201);
  } catch (error) {
    return jsonError("INGEST_FAILED", (error as Error).message, 400);
  }
}

export async function GET() {
  return jsonOk({
    providers: HYPERSCALER_PROVIDERS.map((provider) => ({
      provider,
      mode: "stub",
    })),
  });
}
