import { jsonError, jsonOk } from "@/lib/http";
import { getStore } from "@/lib/store";


export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const policy = await getStore().getPolicy(id);
  if (!policy) return jsonError("NOT_FOUND", `Policy ${id} not found`, 404);
  return jsonOk({ data: policy });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const deleted = await getStore().deletePolicy(id);
  if (!deleted) return jsonError("NOT_FOUND", `Policy ${id} not found`, 404);
  return jsonOk({ deleted: true, id });
}
