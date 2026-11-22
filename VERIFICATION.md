# Verification & Smoke Screen Report — `evals`

| Field | Value |
| --- | --- |
| **Module** | `Mirevox/evals` |
| **Package Version** | `0.1.0` |
| **Verification Status** | **VERIFIED** |
| **Verified At (UTC)** | `2026-11-22T21:11:27Z` |
| **Environment** | Node `v22.14.0`, Vitest `3.2.7`, Docker `linux/amd64` (`sherali` Docker Engine `29.8.1`) |

## Automated Typecheck & Test Suite

- `tsc --noEmit`: **PASS** (exit `0`)
- `vitest run`: **PASS (4/4 test files, 14/14 tests passed, 0 failed)**

```text
[2m Test Files [22m [1m[32m4 passed[39m[22m[90m (4)[39m
[2m      Tests [22m [1m[32m14 passed[39m[22m[90m (14)[39m
```

## Live Capture Webhook & Trace Correlation Smoke Test

- Verified live HTTP webhook capture (`POST /api/capture/webhook`) receiving events from `smart-router` with end-to-end `traceId` correlation:
  `HTTP 200, router.mirevox.trace_id=trace-audit-e2e-2026, lineage_edges=5, evals_turns_matching=1`

## Container & Hygiene Verification

- Standalone Linux/x64 Docker image built cleanly: `mirevox/evals:x64-verify fa5be09df0b0 335MB`
- Workspace hygiene & security scan: `repos=9, all_docs_license_compose=True, hardcoded_paths=0, secret_hits=0, src_todo_hits=0`

## Reproduce Locally

```bash
npm run typecheck && npm test
```
