import type {
  ConversationTurn,
  EvalResult,
  PolicyDocument,
} from "../../lib/types";

export interface JudgeAdapter {
  readonly mode: "mock" | "openrouter";
  readonly model: string;
  judge(
    turn: ConversationTurn,
    policy?: PolicyDocument | null,
  ): Promise<EvalResult>;
}
