import path from "node:path";
import { getConfig } from "../config";
import type { EvalStore } from "./interface";
import { JsonFileStore } from "./json-file-store";
import { MemoryStore } from "./memory-store";

type GlobalStore = typeof globalThis & {
  __mirevoxEvalsStore?: EvalStore;
};

export function getStore(): EvalStore {
  const g = globalThis as GlobalStore;
  if (g.__mirevoxEvalsStore) return g.__mirevoxEvalsStore;

  const config = getConfig();
  const store: EvalStore =
    config.storeMode === "memory"
      ? new MemoryStore()
      : new JsonFileStore(path.join(config.dataDir, "evals-store.json"));

  g.__mirevoxEvalsStore = store;
  return store;
}

export function resetStoreSingletonForTests(): void {
  const g = globalThis as GlobalStore;
  delete g.__mirevoxEvalsStore;
}

export type { EvalStore } from "./interface";
export { MemoryStore } from "./memory-store";
export { JsonFileStore } from "./json-file-store";
