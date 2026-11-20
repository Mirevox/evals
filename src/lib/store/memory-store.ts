import type {
  ConversationTurn,
  EvalResult,
  PolicyDocument,
} from "../types";
import type { EvalFilter, EvalStore, TurnFilter } from "./interface";

interface Snapshot {
  turns: ConversationTurn[];
  evals: EvalResult[];
  policies: PolicyDocument[];
}

export class MemoryStore implements EvalStore {
  private turns: ConversationTurn[] = [];
  private evals: EvalResult[] = [];
  private policies: PolicyDocument[] = [];

  async saveTurns(
    turns: ConversationTurn[],
  ): Promise<{ inserted: ConversationTurn[]; skipped: number }> {
    const inserted: ConversationTurn[] = [];
    let skipped = 0;
    for (const turn of turns) {
      if (turn.spanId && this.turns.some((t) => t.spanId === turn.spanId)) {
        skipped += 1;
        continue;
      }
      if (this.turns.some((t) => t.id === turn.id)) {
        skipped += 1;
        continue;
      }
      this.turns.unshift(turn);
      inserted.push(turn);
    }
    return { inserted, skipped };
  }

  async listTurns(filter: TurnFilter = {}): Promise<ConversationTurn[]> {
    let rows = [...this.turns];
    if (filter.provider) {
      rows = rows.filter((t) => t.provider === filter.provider);
    }
    if (filter.model) {
      rows = rows.filter((t) => t.model === filter.model);
    }
    const limit = filter.limit ?? 100;
    return rows.slice(0, limit);
  }

  async getTurn(id: string): Promise<ConversationTurn | null> {
    return this.turns.find((t) => t.id === id) ?? null;
  }

  async saveEvals(
    results: EvalResult[],
  ): Promise<{ inserted: EvalResult[]; skipped: number }> {
    const inserted: EvalResult[] = [];
    let skipped = 0;
    for (const result of results) {
      if (
        result.externalEvalId &&
        this.evals.some(
          (e) =>
            e.provider === result.provider &&
            e.externalEvalId === result.externalEvalId,
        )
      ) {
        skipped += 1;
        continue;
      }
      if (this.evals.some((e) => e.id === result.id)) {
        skipped += 1;
        continue;
      }
      this.evals.unshift(result);
      inserted.push(result);
    }
    return { inserted, skipped };
  }

  async listEvals(filter: EvalFilter = {}): Promise<EvalResult[]> {
    let rows = [...this.evals];
    if (filter.source) rows = rows.filter((e) => e.source === filter.source);
    if (filter.provider)
      rows = rows.filter((e) => e.provider === filter.provider);
    if (filter.turnId) rows = rows.filter((e) => e.turnId === filter.turnId);
    const limit = filter.limit ?? 100;
    return rows.slice(0, limit);
  }

  async getEval(id: string): Promise<EvalResult | null> {
    return this.evals.find((e) => e.id === id) ?? null;
  }

  async savePolicy(policy: PolicyDocument): Promise<PolicyDocument> {
    const idx = this.policies.findIndex((p) => p.id === policy.id);
    if (idx >= 0) {
      this.policies[idx] = policy;
    } else {
      this.policies.unshift(policy);
    }
    return policy;
  }

  async listPolicies(): Promise<PolicyDocument[]> {
    return [...this.policies];
  }

  async getPolicy(id: string): Promise<PolicyDocument | null> {
    return this.policies.find((p) => p.id === id) ?? null;
  }

  async deletePolicy(id: string): Promise<boolean> {
    const before = this.policies.length;
    this.policies = this.policies.filter((p) => p.id !== id);
    return this.policies.length < before;
  }

  async stats(): Promise<{ turns: number; evals: number; policies: number }> {
    return {
      turns: this.turns.length,
      evals: this.evals.length,
      policies: this.policies.length,
    };
  }

  async reset(): Promise<void> {
    this.turns = [];
    this.evals = [];
    this.policies = [];
  }

  snapshot(): Snapshot {
    return {
      turns: structuredClone(this.turns),
      evals: structuredClone(this.evals),
      policies: structuredClone(this.policies),
    };
  }

  load(snapshot: Snapshot): void {
    this.turns = structuredClone(snapshot.turns);
    this.evals = structuredClone(snapshot.evals);
    this.policies = structuredClone(snapshot.policies);
  }
}
