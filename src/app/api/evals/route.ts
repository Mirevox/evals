import { jsonOk } from "@/lib/http";
import { getStore } from "@/lib/store";
import type { EvalResult } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source") as EvalResult["source"] | null;
  const provider = searchParams.get("provider") ?? undefined;
  const turnId = searchParams.get("turnId") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? "100");
  const data = await getStore().listEvals({
    source: source ?? undefined,
    provider,
    turnId,
    limit,
  });
  const avgScore =
    data.length === 0
      ? 0
      : data.reduce((s, e) => s + e.overallScore, 0) / data.length;
  const passRate =
    data.length === 0
      ? 0
      : data.filter((e) => e.passed).length / data.length;
  return jsonOk({
    data,
    summary: {
      total: data.length,
      avgScore,
      passRate,
    },
  });
}
