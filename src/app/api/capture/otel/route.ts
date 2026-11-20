import { getConfig } from "@/lib/config";
import { jsonError, jsonOk, requireCaptureAuth } from "@/lib/http";
import { getStore } from "@/lib/store";
import { captureOtel } from "@/modules/capture";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authError = requireCaptureAuth(request, getConfig().captureToken);
  if (authError) return authError;

  try {
    const body = await request.json();
    const result = await captureOtel(getStore(), body);
    return jsonOk(
      {
        accepted: result.accepted,
        skipped: result.skipped,
        turnIds: result.turnIds,
      },
      201,
    );
  } catch (error) {
    return jsonError("CAPTURE_FAILED", (error as Error).message, 400);
  }
}
