"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

type Tab = "conversations" | "scores" | "policy";

interface Health {
  status: string;
  version: string;
  store: string;
  judge: { defaultMode: string; openRouterConfigured: boolean };
  counts: { turns: number; evals: number; policies: number };
}

interface Turn {
  id: string;
  conversationId: string;
  provider: string;
  model: string;
  routePolicy?: string;
  prompt: string;
  response: string;
  latencyMs?: number;
  source: string;
  capturedAt: string;
}

interface Metric {
  name: string;
  score: number;
  passed: boolean;
  reason?: string;
}

interface EvalRow {
  id: string;
  source: string;
  provider: string;
  targetModel: string;
  overallScore: number;
  passed: boolean;
  rationale: string;
  metrics: Metric[];
  turnId?: string;
  evaluatedAt: string;
  judgeMode?: string;
}

interface Policy {
  id: string;
  name: string;
  version: number;
  sourceEnglish: string;
  rules: Array<{ id: string; category: string; sourceText: string; severity: string }>;
  warnings: string[];
  providerMappings: Record<
    string,
    { pushStatus: string; targetPrimitive: string; ruleCount: number }
  >;
}

const PRESET = `Responses must not contain email addresses or API keys.
Keep answers under 200 words.
Cite sources for factual claims.
Prefer JSON when the user asks for structured output.`;

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error?.message ?? `Request failed (${res.status})`);
  }
  return body as T;
}

export function Dashboard() {
  const [tab, setTab] = useState<Tab>("conversations");
  const [health, setHealth] = useState<Health | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [evals, setEvals] = useState<EvalRow[]>([]);
  const [summary, setSummary] = useState({ total: 0, avgScore: 0, passRate: 0 });
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedTurn, setSelectedTurn] = useState<Turn | null>(null);
  const [english, setEnglish] = useState(PRESET);
  const [policyName, setPolicyName] = useState("Default governance");
  const [compiled, setCompiled] = useState<Policy | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [judgeMode, setJudgeMode] = useState<"auto" | "mock" | "openrouter">(
    "mock",
  );
  const [policyId, setPolicyId] = useState<string>("");
  const [, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const [h, c, e, p] = await Promise.all([
      api<Health>("/api/health"),
      api<{ data: Turn[] }>("/api/conversations?limit=50"),
      api<{ data: EvalRow[]; summary: typeof summary }>("/api/evals?limit=100"),
      api<{ data: Policy[] }>("/api/policies"),
    ]);
    setHealth(h);
    setTurns(c.data);
    setEvals(e.data);
    setSummary(e.summary);
    setPolicies(p.data);
    setPolicyId((current) => current || p.data[0]?.id || "");
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      startTransition(() => {
        void refresh().catch((err: Error) => setError(err.message));
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh, startTransition]);

  const latestByTurn = useMemo(() => {
    const map = new Map<string, EvalRow>();
    for (const row of evals) {
      if (row.turnId && !map.has(row.turnId)) map.set(row.turnId, row);
    }
    return map;
  }, [evals]);

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(label);
    setError(null);
    setNotice(null);
    try {
      await fn();
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
      <header className="flex flex-col gap-4 border-b border-[var(--line)] pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-sm tracking-[0.2em] text-[var(--neon)] uppercase">
            Mirevox
          </p>
          <h1
            className="text-4xl font-semibold tracking-tight md:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Evals
          </h1>
          <p className="mt-2 max-w-xl text-[var(--muted)]">
            Capture router traffic, compile English rules, ingest hyperscaler
            stubs, and judge live turns — all in one local control surface.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Badge>
            store: {health?.store ?? "…"}
          </Badge>
          <Badge>
            judge: {health?.judge.defaultMode ?? "…"}
          </Badge>
          <Badge>
            {health?.counts.turns ?? 0} turns · {health?.counts.evals ?? 0} evals
          </Badge>
        </div>
      </header>

      <section className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--bg-panel)]/80 p-4 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-sm text-[var(--muted)]">Capture endpoints</p>
          <code className="mt-1 block break-all text-[var(--neon)]">
            POST /api/capture/webhook · POST /api/capture/otel
          </code>
        </div>
        <div className="flex flex-wrap gap-2">
          <Action
            disabled={Boolean(busy)}
            onClick={() =>
              run("seed", async () => {
                await api("/api/capture/webhook", {
                  method: "POST",
                  body: JSON.stringify({
                    conversationId: "demo-conv-1",
                    provider: "local",
                    model: "demo-model",
                    routePolicy: "on-prem",
                    prompt: "Summarize residency requirements for EU customer data.",
                    response:
                      "Keep EU customer personal data in the eu-west region and avoid transferring identifiers outside the residency boundary without a documented exception.",
                    latencyMs: 420,
                    usage: { inputTokens: 80, outputTokens: 60 },
                  }),
                });
                setNotice("Seeded a demo conversation turn.");
                setTab("conversations");
              })
            }
          >
            {busy === "seed" ? "Seeding…" : "Seed demo turn"}
          </Action>
          <Action
            disabled={Boolean(busy)}
            onClick={() =>
              run("ingest", async () => {
                await api("/api/ingest/trigger", {
                  method: "POST",
                  body: JSON.stringify({}),
                });
                setNotice("Triggered Foundry / Bedrock / Vertex stub ingest.");
                setTab("scores");
              })
            }
          >
            {busy === "ingest" ? "Ingesting…" : "Stub ingest all"}
          </Action>
        </div>
      </section>

      {(error || notice) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-[var(--bad)]/40 bg-[var(--bad)]/10 text-[var(--bad)]"
              : "border-[var(--ok)]/40 bg-[var(--ok)]/10 text-[var(--ok)]"
          }`}
        >
          {error ?? notice}
        </div>
      )}

      <nav className="flex gap-2">
        {(
          [
            ["conversations", "Conversations"],
            ["scores", "Scores & ingest"],
            ["policy", "Policy compiler"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-2 text-sm transition ${
              tab === id
                ? "bg-[var(--purple)] text-white"
                : "border border-[var(--line)] text-[var(--muted)] hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "conversations" && (
        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/70">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--line)] text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Model</th>
                  <th className="px-4 py-3 font-medium">Provider</th>
                  <th className="px-4 py-3 font-medium">Latency</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                </tr>
              </thead>
              <tbody>
                {turns.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-[var(--muted)]">
                      No conversations yet. Seed a demo turn or POST to the capture webhook.
                    </td>
                  </tr>
                )}
                {turns.map((turn) => {
                  const score = latestByTurn.get(turn.id);
                  return (
                    <tr
                      key={turn.id}
                      className="cursor-pointer border-b border-[var(--line)]/60 hover:bg-white/5"
                      onClick={() => setSelectedTurn(turn)}
                    >
                      <td className="px-4 py-3">{turn.model}</td>
                      <td className="px-4 py-3">{turn.provider}</td>
                      <td className="px-4 py-3">
                        {turn.latencyMs != null ? `${turn.latencyMs} ms` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {score ? (
                          <ScorePill score={score.overallScore} passed={score.passed} />
                        ) : (
                          <span className="text-[var(--muted)]">unevaluated</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <aside className="rounded-2xl border border-[var(--line)] bg-[var(--bg-panel)] p-4">
            {selectedTurn ? (
              <div className="space-y-3 text-sm">
                <h2 className="text-lg font-medium">{selectedTurn.model}</h2>
                <Meta label="Conversation" value={selectedTurn.conversationId} />
                <Meta label="Source" value={selectedTurn.source} />
                <Meta label="Route" value={selectedTurn.routePolicy ?? "—"} />
                <div>
                  <p className="mb-1 text-[var(--muted)]">Prompt</p>
                  <pre className="whitespace-pre-wrap rounded-lg bg-black/30 p-3 text-xs">
                    {selectedTurn.prompt}
                  </pre>
                </div>
                <div>
                  <p className="mb-1 text-[var(--muted)]">Response</p>
                  <pre className="whitespace-pre-wrap rounded-lg bg-black/30 p-3 text-xs">
                    {selectedTurn.response}
                  </pre>
                </div>
                <label className="block text-sm text-[var(--muted)]">
                  Policy
                  <select
                    className="mt-1 w-full rounded-lg border border-[var(--line)] bg-black/30 px-3 py-2 text-[var(--fg)]"
                    value={policyId}
                    onChange={(e) => setPolicyId(e.target.value)}
                  >
                    <option value="">None</option>
                    {policies.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (v{p.version})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm text-[var(--muted)]">
                  Judge mode
                  <select
                    className="mt-1 w-full rounded-lg border border-[var(--line)] bg-black/30 px-3 py-2 text-[var(--fg)]"
                    value={judgeMode}
                    onChange={(e) =>
                      setJudgeMode(
                        e.target.value as "auto" | "mock" | "openrouter",
                      )
                    }
                  >
                    <option value="mock">mock (heuristic offline)</option>
                    <option value="auto">auto</option>
                    <option value="openrouter">openrouter</option>
                  </select>
                </label>
                <Action
                  disabled={Boolean(busy)}
                  onClick={() =>
                    run("judge", async () => {
                      await api("/api/judge/run", {
                        method: "POST",
                        body: JSON.stringify({
                          turnId: selectedTurn.id,
                          mode: judgeMode,
                          ...(policyId ? { policyId } : {}),
                        }),
                      });
                      setNotice(
                        `Judge run complete (${judgeMode}${policyId ? "" : ", no policy"}).`,
                      );
                      setTab("scores");
                    })
                  }
                >
                  {busy === "judge" ? "Judging…" : "Run judge"}
                </Action>
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">
                Select a conversation to inspect prompt/response and run a judge.
              </p>
            )}
          </aside>
        </section>
      )}

      {tab === "scores" && (
        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Eval rows" value={String(summary.total)} />
            <Stat label="Avg score" value={summary.avgScore.toFixed(3)} />
            <Stat
              label="Pass rate"
              value={`${Math.round(summary.passRate * 100)}%`}
            />
          </div>
          <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/70">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--line)] text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Provider</th>
                  <th className="px-4 py-3 font-medium">Model</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Rationale</th>
                </tr>
              </thead>
              <tbody>
                {evals.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-[var(--muted)]">
                      No eval results yet. Trigger stub ingest or run a judge.
                    </td>
                  </tr>
                )}
                {evals.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--line)]/60 align-top">
                    <td className="px-4 py-3">{row.source}</td>
                    <td className="px-4 py-3">{row.provider}</td>
                    <td className="px-4 py-3">{row.targetModel}</td>
                    <td className="px-4 py-3">
                      <ScorePill score={row.overallScore} passed={row.passed} />
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {row.rationale}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {row.metrics.slice(0, 4).map((m, idx) => (
                          <span
                            key={`${row.id}-${idx}-${m.name}`}
                            className="rounded-md border border-[var(--line)] px-2 py-1 text-xs"
                          >
                            {m.name}: {m.score.toFixed(2)}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "policy" && (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--bg-panel)] p-4">
            <label className="block text-sm text-[var(--muted)]">
              Policy name
              <input
                className="mt-1 w-full rounded-lg border border-[var(--line)] bg-black/30 px-3 py-2 text-[var(--fg)]"
                value={policyName}
                onChange={(e) => setPolicyName(e.target.value)}
              />
            </label>
            <label className="block text-sm text-[var(--muted)]">
              English rules
              <textarea
                className="mt-1 min-h-48 w-full rounded-lg border border-[var(--line)] bg-black/30 px-3 py-2 text-[var(--fg)]"
                value={english}
                onChange={(e) => setEnglish(e.target.value)}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Action
                disabled={Boolean(busy)}
                onClick={() =>
                  run("compile", async () => {
                    const res = await api<{ data: Policy; saved: boolean }>(
                      "/api/policies/compile",
                      {
                        method: "POST",
                        body: JSON.stringify({
                          name: policyName,
                          english,
                          save: false,
                        }),
                      },
                    );
                    setCompiled(res.data);
                    setNotice("Compiled policy (not saved).");
                  })
                }
              >
                Compile
              </Action>
              <Action
                disabled={Boolean(busy)}
                onClick={() =>
                  run("save-policy", async () => {
                    const res = await api<{ data: Policy; saved: boolean }>(
                      "/api/policies/compile",
                      {
                        method: "POST",
                        body: JSON.stringify({
                          name: policyName,
                          english,
                          save: true,
                        }),
                      },
                    );
                    setCompiled(res.data);
                    setNotice(`Saved policy v${res.data.version}.`);
                  })
                }
              >
                Compile & save
              </Action>
            </div>
            {compiled && (
              <div className="space-y-2 text-sm">
                <p className="text-[var(--muted)]">
                  {compiled.rules.length} rules · {compiled.warnings.length} warnings
                </p>
                <pre className="max-h-80 overflow-auto rounded-lg bg-black/40 p-3 text-xs">
                  {JSON.stringify(compiled, null, 2)}
                </pre>
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/70 p-4">
            <h2 className="mb-3 text-lg font-medium">Saved policies</h2>
            {policies.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No saved policies yet.</p>
            ) : (
              <ul className="space-y-3">
                {policies.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-xl border border-[var(--line)] bg-black/20 p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <strong>{p.name}</strong>
                      <span className="text-[var(--muted)]">v{p.version}</span>
                    </div>
                    <p className="mt-1 text-[var(--muted)]">
                      {p.rules.length} rules · targets{" "}
                      {Object.keys(p.providerMappings).join(", ")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      <footer className="mt-auto border-t border-[var(--line)] pt-4 text-xs text-[var(--muted)]">
        Mirevox evals v{health?.version ?? "0.1.0"} · Apache-2.0 · composes with
        smart-router via capture webhook / OTLP HTTP JSON
      </footer>
    </main>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[var(--line)] bg-black/20 px-3 py-1 text-[var(--muted)]">
      {children}
    </span>
  );
}

function Action({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg bg-[var(--neon)] px-3 py-2 text-sm font-medium text-[#041018] disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-panel)] p-4">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="text-right break-all">{value}</span>
    </div>
  );
}

function ScorePill({ score, passed }: { score: number; passed: boolean }) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${
        passed
          ? "bg-[var(--ok)]/15 text-[var(--ok)]"
          : "bg-[var(--bad)]/15 text-[var(--bad)]"
      }`}
    >
      {score.toFixed(2)} {passed ? "pass" : "fail"}
    </span>
  );
}
