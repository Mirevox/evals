import { newId, nowIso } from "../../lib/ids";
import type { EvalStore } from "../../lib/store";
import type { PolicyDocument } from "../../lib/types";
import { parseEnglishRules } from "./parser";
import {
  buildProviderMappings,
  detectTargetProviders,
} from "./provider-preview";

export function compileEnglishPolicy(input: {
  name?: string;
  english: string;
  existing?: PolicyDocument | null;
}): PolicyDocument {
  const english = input.english.trim();
  if (!english) {
    throw new Error("English rules text is required");
  }

  const { rules, warnings } = parseEnglishRules(english);
  const targetProviders = detectTargetProviders(english);
  const now = nowIso();
  const existing = input.existing;

  return {
    id: existing?.id ?? newId("policy"),
    name: input.name?.trim() || existing?.name || "Untitled policy",
    version: existing ? existing.version + 1 : 1,
    sourceEnglish: english,
    rules,
    targetProviders,
    providerMappings: buildProviderMappings(rules, targetProviders),
    warnings,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export async function compileAndMaybeSave(
  store: EvalStore,
  input: { name?: string; english: string; save?: boolean },
): Promise<{ policy: PolicyDocument; saved: boolean }> {
  const existingList = await store.listPolicies();
  const existing =
    input.name && input.save
      ? existingList.find(
          (p) => p.name.toLowerCase() === input.name!.trim().toLowerCase(),
        )
      : null;

  const policy = compileEnglishPolicy({
    name: input.name,
    english: input.english,
    existing: existing ?? null,
  });

  if (input.save) {
    await store.savePolicy(policy);
    return { policy, saved: true };
  }
  return { policy, saved: false };
}

export { parseEnglishRules } from "./parser";
