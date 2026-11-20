import type {
  ConversationTurn,
  EvalResult,
  PolicyDocument,
} from "../types";

export interface TurnFilter {
  provider?: string;
  model?: string;
  limit?: number;
}

export interface EvalFilter {
  source?: EvalResult["source"];
  provider?: string;
  turnId?: string;
  limit?: number;
}

export interface EvalStore {
  saveTurns(
    turns: ConversationTurn[],
  ): Promise<{ inserted: ConversationTurn[]; skipped: number }>;
  listTurns(filter?: TurnFilter): Promise<ConversationTurn[]>;
  getTurn(id: string): Promise<ConversationTurn | null>;

  saveEvals(
    results: EvalResult[],
  ): Promise<{ inserted: EvalResult[]; skipped: number }>;
  listEvals(filter?: EvalFilter): Promise<EvalResult[]>;
  getEval(id: string): Promise<EvalResult | null>;

  savePolicy(policy: PolicyDocument): Promise<PolicyDocument>;
  listPolicies(): Promise<PolicyDocument[]>;
  getPolicy(id: string): Promise<PolicyDocument | null>;
  deletePolicy(id: string): Promise<boolean>;

  stats(): Promise<{ turns: number; evals: number; policies: number }>;
  reset(): Promise<void>;
}
