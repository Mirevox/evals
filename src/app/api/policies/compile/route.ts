import { jsonError, jsonOk } from "@/lib/http";
import { getStore } from "@/lib/store";
import { compileAndMaybeSave } from "@/modules/policy";
import { z } from "zod";


const bodySchema = z.object({
  name: z.string().optional(),
  english: z.string().min(1),
  save: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const { policy, saved } = await compileAndMaybeSave(getStore(), body);
    return jsonOk({ data: policy, saved }, saved ? 201 : 200);
  } catch (error) {
    return jsonError("COMPILE_FAILED", (error as Error).message, 400);
  }
}
