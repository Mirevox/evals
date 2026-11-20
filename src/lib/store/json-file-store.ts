import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  ConversationTurn,
  EvalResult,
  PolicyDocument,
} from "../types";
import type { EvalFilter, EvalStore, TurnFilter } from "./interface";
import { MemoryStore } from "./memory-store";

interface FileSnapshot {
  version: 1;
  turns: ConversationTurn[];
  evals: EvalResult[];
  policies: PolicyDocument[];
}

export class JsonFileStore implements EvalStore {
  private readonly memory = new MemoryStore();
  private readonly filePath: string;
  private chain: Promise<void> = Promise.resolve();
  private loaded = false;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  private enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.chain.then(fn, fn);
    this.chain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    await mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as FileSnapshot;
      this.memory.load({
        turns: parsed.turns ?? [],
        evals: parsed.evals ?? [],
        policies: parsed.policies ?? [],
      });
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") {
        throw error;
      }
    }
    this.loaded = true;
  }

  private async persist(): Promise<void> {
    const snap = this.memory.snapshot();
    const payload: FileSnapshot = {
      version: 1,
      turns: snap.turns,
      evals: snap.evals,
      policies: snap.policies,
    };
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.tmp`;
    await writeFile(tmp, JSON.stringify(payload, null, 2), "utf8");
    await rename(tmp, this.filePath);
  }

  async saveTurns(
    turns: ConversationTurn[],
  ): Promise<{ inserted: ConversationTurn[]; skipped: number }> {
    return this.enqueue(async () => {
      await this.ensureLoaded();
      const result = await this.memory.saveTurns(turns);
      if (result.inserted.length > 0) await this.persist();
      return result;
    });
  }

  async listTurns(filter?: TurnFilter): Promise<ConversationTurn[]> {
    return this.enqueue(async () => {
      await this.ensureLoaded();
      return this.memory.listTurns(filter);
    });
  }

  async getTurn(id: string): Promise<ConversationTurn | null> {
    return this.enqueue(async () => {
      await this.ensureLoaded();
      return this.memory.getTurn(id);
    });
  }

  async saveEvals(
    results: EvalResult[],
  ): Promise<{ inserted: EvalResult[]; skipped: number }> {
    return this.enqueue(async () => {
      await this.ensureLoaded();
      const result = await this.memory.saveEvals(results);
      if (result.inserted.length > 0) await this.persist();
      return result;
    });
  }

  async listEvals(filter?: EvalFilter): Promise<EvalResult[]> {
    return this.enqueue(async () => {
      await this.ensureLoaded();
      return this.memory.listEvals(filter);
    });
  }

  async getEval(id: string): Promise<EvalResult | null> {
    return this.enqueue(async () => {
      await this.ensureLoaded();
      return this.memory.getEval(id);
    });
  }

  async savePolicy(policy: PolicyDocument): Promise<PolicyDocument> {
    return this.enqueue(async () => {
      await this.ensureLoaded();
      const saved = await this.memory.savePolicy(policy);
      await this.persist();
      return saved;
    });
  }

  async listPolicies(): Promise<PolicyDocument[]> {
    return this.enqueue(async () => {
      await this.ensureLoaded();
      return this.memory.listPolicies();
    });
  }

  async getPolicy(id: string): Promise<PolicyDocument | null> {
    return this.enqueue(async () => {
      await this.ensureLoaded();
      return this.memory.getPolicy(id);
    });
  }

  async deletePolicy(id: string): Promise<boolean> {
    return this.enqueue(async () => {
      await this.ensureLoaded();
      const deleted = await this.memory.deletePolicy(id);
      if (deleted) await this.persist();
      return deleted;
    });
  }

  async stats(): Promise<{ turns: number; evals: number; policies: number }> {
    return this.enqueue(async () => {
      await this.ensureLoaded();
      return this.memory.stats();
    });
  }

  async reset(): Promise<void> {
    return this.enqueue(async () => {
      await this.ensureLoaded();
      await this.memory.reset();
      await this.persist();
    });
  }
}
