---
cursor:
  subagentId: "bc-7d636467-0961-5f7b-8b89-8740b998df3f"
  role: requirements-final
  model: gemini-4-neon-high
---

# Mirevox Evals — Locked Requirements (v1)

Target repo: `https://github.com/Mirevox/evals`  
Runtime: Next.js (TypeScript) on port **3847** · License: Apache-2.0  
Companion docs: `docs/problem-statement.md`, `docs/problem-opportunity.md`, `docs/architecture.md`, `docs/market-gap.md`, `docs/devils-advocate.md`

## Scope locked for v1

| Keep | Notes |
| --- | --- |
| OTel / webhook conversation capture | Out-of-band; never blocks smart-router |
| Hyperscaler ingest stubs | Foundry / Bedrock / Vertex fixtures + real normalizers |
| English → policy compiler stub | Deterministic local parse; dry-run provider mappings only |
| LLM-as-judge pipeline | MockJudge default; optional OpenRouter when keyed |
| Dashboard + REST API | Single Next.js app |

| Cut / defer | Reason |
| --- | --- |
| Live hyperscaler pull/push | Credentials + API surface theater without value |
| Inline router blocking | Privacy/latency; belongs later with router policy |
| External DB / queues | JSON-file store enough for slice |
| OTLP gRPC/protobuf | HTTP JSON only |
| n8n / Instagram / Sherali full stack | Explicitly out |

## Functional requirements

### FR-1 Capture
- `POST /api/capture/webhook` accepts smart-router turn JSON (single or `{ turns: [] }`).
- `POST /api/capture/otel` accepts OTLP/HTTP JSON; persists GenAI spans only.
- Dedup on `spanId` when present.
- Optional `EVALS_CAPTURE_TOKEN` bearer auth.

### FR-2 Ingest stubs
- `POST /api/ingest/trigger` runs Foundry/Bedrock/Vertex fixture normalizers into canonical `EvalResult` (scores 0–1, retain `rawScore`/`rawScale`).
- Idempotent on `(provider, externalEvalId)`.

### FR-3 Policy compiler
- `POST /api/policies/compile` with `{ name?, english, save? }` → `PolicyDocument`.
- Deterministic categories: pii, safety, groundedness, format, latency, cost, custom.
- Provider mappings with `pushStatus: "not_pushed"` only.

### FR-4 Judge
- `POST /api/judge/run` with `turnId` or `inlineTurn`, optional `policyId`, `mode: auto|mock|openrouter`.
- MockJudge deterministic offline.
- OpenRouter only when `OPENROUTER_API_KEY` set; fallback to mock on failure.

### FR-5 API / dashboard
- `GET /api/health`, `/api/conversations`, `/api/evals`, `/api/policies` (+ detail/delete).
- Dark dashboard at `/` with conversations, scores/ingest, policy compiler tabs.

## Non-functional requirements

- **NFR-1** Zero-key runnable: `npm install && npm run dev` works without cloud credentials.
- **NFR-2** Capture is non-blocking **for the router serving path**: callers SHOULD fire-and-forget (do not await scoring). The evals server itself awaits durable persist before returning 200 (honest latency bound for the capture HTTP call, not inline judging).
- **NFR-3** Persistence behind `EvalStore` (`json-file` default, `memory` for tests).
- **NFR-4** Modules under `src/modules/{capture,ingest,policy,judge}` have no Next.js imports.
- **NFR-5** Never log API keys or Authorization headers.
- **NFR-6** Errors use `{ error: { code, message, details? } }`.
- **NFR-7** Apache-2.0 LICENSE + README composition notes for smart-router.
- **NFR-8** `npm test` passes offline.

## Acceptance exits

1. Health endpoint returns ok + store/judge/counts.
2. Webhook + OTel capture persist turns; non-GenAI spans ignored.
3. Stub ingest yields 3 normalized rows; second call dedups.
4. English sample compiles ≥3 rules with provider mapping previews.
5. MockJudge identical inputs → identical scores; PII leak fails policy.
6. Dashboard loads and can seed/ingest/compile/judge without keys.
