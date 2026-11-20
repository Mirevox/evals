import { jsonError, jsonOk } from "@/lib/http";
import { getStore } from "@/lib/store";
import { runJudge } from "@/modules/judge";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  turnId: z.string().optional(),
  inlineTurn: z
    .object({
      prompt: z.string(),
      response: z.string(),
      model: z.string().optional(),
      provider: z.string().optional(),
      contextSnippets: z.array(z.string()).optional(),
      conversationId: z.string().optional(),
    })
    .optional(),
  policyId: z.string().optional(),
  mode: z.enum(["auto", "mock", "openrouter"]).optional(),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const data = await runJudge(getStore(), body);
    return jsonOk({ data }, 201);
  } catch (error) {
    const code = (error as { code?: string }).code ?? "JUDGE_FAILED";
    const status =
      code === "NOT_FOUND" ? 404 : code === "JUDGE_NOT_CONFIGURED" ? 400 : 400;
    return jsonError(code, (error as Error).message, status);
  }
}
