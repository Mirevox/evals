import { jsonOk } from "@/lib/http";
import { getStore } from "@/lib/store";


export async function GET() {
  const data = await getStore().listPolicies();
  return jsonOk({ data });
}
