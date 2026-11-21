import { getConfig } from "@/lib/config";
import { jsonError, jsonOk, requireCaptureAuth } from "@/lib/http";
import { getStore } from "@/lib/store";
import { captureWebhook } from "@/modules/capture";
import { ZodError } from "zod";


export async function POST(request: Request) {
  const authError = requireCaptureAuth(request, getConfig().captureToken);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const autoJudge = url.searchParams.get("autoJudge") === "true" ? true : undefined;
    const policyId = url.searchParams.get("policyId") ?? undefined;
    const body = await request.json();
    const result = await captureWebhook(getStore(), body, {
      autoJudge,
      policyId,
    });
    return jsonOk(
      {
        accepted: result.accepted,
        skipped: result.skipped,
        turnIds: result.turnIds,
        evalIds: result.evalIds,
      },
      201,
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError("INVALID_PAYLOAD", "Invalid webhook payload", 400, error.issues);
    }
    return jsonError("CAPTURE_FAILED", (error as Error).message, 400);
  }
}
