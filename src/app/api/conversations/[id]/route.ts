import { jsonError, jsonOk } from "@/lib/http";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const store = getStore();
  const turn = await store.getTurn(id);
  if (!turn) return jsonError("NOT_FOUND", `Conversation turn ${id} not found`, 404);
  const evals = await store.listEvals({ turnId: id, limit: 100 });
  return jsonOk({ data: turn, evals });
}
