import { jsonOk } from "@/lib/http";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getStore().listPolicies();
  return jsonOk({ data });
}
