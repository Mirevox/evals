import { defaultJudgeMode, getConfig } from "@/lib/config";
import { jsonOk } from "@/lib/http";
import { getStore } from "@/lib/store";


export async function GET() {
  const config = getConfig();
  const counts = await getStore().stats();
  return jsonOk({
    status: "ok",
    version: config.version,
    port: config.port,
    store: config.storeMode,
    judge: {
      defaultMode: defaultJudgeMode(config),
      openRouterConfigured: Boolean(config.openRouterApiKey),
    },
    ingestAdapters: ["azure-foundry", "aws-bedrock", "google-vertex"],
    counts,
  });
}
