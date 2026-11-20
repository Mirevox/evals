export type StoreMode = "json-file" | "memory";

export interface AppConfig {
  port: number;
  storeMode: StoreMode;
  dataDir: string;
  captureToken: string | null;
  openRouterApiKey: string | null;
  openRouterBaseUrl: string;
  openRouterJudgeModel: string;
  version: string;
}

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") return undefined;
  return value.trim();
}

export function getConfig(): AppConfig {
  const storeRaw = (readEnv("EVALS_STORE") ?? "json-file").toLowerCase();
  const storeMode: StoreMode =
    storeRaw === "memory" ? "memory" : "json-file";

  return {
    port: Number(readEnv("PORT") ?? "3847"),
    storeMode,
    dataDir: readEnv("EVALS_DATA_DIR") ?? "./data",
    captureToken: readEnv("EVALS_CAPTURE_TOKEN") ?? null,
    openRouterApiKey: readEnv("OPENROUTER_API_KEY") ?? null,
    openRouterBaseUrl:
      readEnv("OPENROUTER_BASE_URL") ?? "https://openrouter.ai/api/v1",
    openRouterJudgeModel:
      readEnv("OPENROUTER_JUDGE_MODEL") ?? "openai/gpt-4o-mini",
    version: "0.1.0",
  };
}

export function defaultJudgeMode(
  config: AppConfig = getConfig(),
): "mock" | "openrouter" {
  return config.openRouterApiKey ? "openrouter" : "mock";
}
