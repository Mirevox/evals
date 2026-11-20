import type { EvalStore } from "../../lib/store";
import type { EvalResult, HyperscalerProvider } from "../../lib/types";
import { normalizeFoundryFixture } from "./adapters/azure-foundry";
import { normalizeBedrockFixture } from "./adapters/aws-bedrock";
import { normalizeVertexFixture } from "./adapters/google-vertex";

export const HYPERSCALER_PROVIDERS: HyperscalerProvider[] = [
  "azure-foundry",
  "aws-bedrock",
  "google-vertex",
];

export function listIngestProviders(): Array<{
  provider: HyperscalerProvider;
  mode: "stub";
}> {
  return HYPERSCALER_PROVIDERS.map((provider) => ({
    provider,
    mode: "stub" as const,
  }));
}

function buildStub(provider: HyperscalerProvider): EvalResult {
  switch (provider) {
    case "azure-foundry":
      return normalizeFoundryFixture();
    case "aws-bedrock":
      return normalizeBedrockFixture();
    case "google-vertex":
      return normalizeVertexFixture();
  }
}

export async function triggerStubIngest(
  store: EvalStore,
  options: {
    providers?: HyperscalerProvider[];
    reset?: boolean;
  } = {},
): Promise<{
  providers: HyperscalerProvider[];
  inserted: number;
  skipped: number;
  results: EvalResult[];
}> {
  const providers = options.providers?.length
    ? options.providers
    : HYPERSCALER_PROVIDERS;

  const results = providers.map((provider) => {
    const result = buildStub(provider);
    if (options.reset) {
      result.externalEvalId = `${result.externalEvalId}-r${Date.now()}`;
    }
    return result;
  });
  const saved = await store.saveEvals(results);
  return {
    providers,
    inserted: saved.inserted.length,
    skipped: saved.skipped,
    results: saved.inserted.length > 0 ? saved.inserted : results,
  };
}

export {
  normalizeFoundryFixture,
  normalizeBedrockFixture,
  normalizeVertexFixture,
};
