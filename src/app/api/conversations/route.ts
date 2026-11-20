import { jsonOk } from "@/lib/http";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider") ?? undefined;
  const model = searchParams.get("model") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? "100");
  const data = await getStore().listTurns({ provider, model, limit });
  return jsonOk({ data, total: data.length });
}
