# Mirevox Evals

Realtime evaluation and English governance for the [Mirevox](https://github.com/Mirevox) control plane.

**License: [Apache-2.0](LICENSE).**

## Problem

Multi-provider stacks split evaluation and policy across Foundry, Bedrock, Vertex, and local models. Rules start in English; scores and guardrails diverge by vendor; live router traffic is rarely scored in one neutral place.

Mirevox evals is a **thin OSS control-plane module**: capture routed conversations out-of-band, compile English rules into inspectable (dry-run) provider mappings, merge hyperscaler **stub** scores into one dashboard, and judge turns with MockJudge by default. It is not a full LangSmith/Braintrust replacement and does not push live policies to clouds in v1.

## One-command Docker standup

```bash
cp .env.example .env   # optional overrides; zero-key default is fine
docker compose up --build -d
curl -s http://127.0.0.1:3847/api/health
```

Open [http://127.0.0.1:3847](http://127.0.0.1:3847). Compose publishes port **3847**, mounts a durable `evals-data` volume at `/app/data`, and healthchecks `GET /api/health`.

Stop: `docker compose down` (add `-v` to wipe the data volume).

## Local (no Docker)

```bash
cp .env.example .env   # optional
npm install
npm run dev
```

```bash
npm test
npm run build && npm start
```

No API keys required. MockJudge runs offline; set `OPENROUTER_API_KEY` only if you want a live judge with automatic mock fallback.

## What ships in v1

| Module | Capability |
| --- | --- |
| `capture` | `POST /api/capture/webhook`, `POST /api/capture/otel` (optional `EVALS_CAPTURE_TOKEN`) |
| `ingest` | Stub Foundry / Bedrock / Vertex → normalized `EvalResult` (not live cloud APIs) |
| `policy` | English → `PolicyDocument` compiler; provider mappings are **dry-run** (`not_pushed`) |
| `judge` | MockJudge + optional OpenRouter |
| dashboard | Dark UI + REST API on port **3847** |

## Compose with smart-router

Capture is designed to be **fire-and-forget from the router** (do not await scoring on the serving path):

```bash
curl -X POST http://127.0.0.1:3847/api/capture/webhook \
  -H 'content-type: application/json' \
  -d '{"conversationId":"c1","model":"gpt-x","provider":"local","prompt":"...","response":"..."}'
```

OTLP/HTTP JSON: point `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` at `http://127.0.0.1:3847/api/capture/otel`.

## Configuration

See [`.env.example`](.env.example).

| Variable | Default | Notes |
| --- | --- | --- |
| `PORT` | `3847` | HTTP port |
| `EVALS_STORE` | `json-file` | `memory` for tests only |
| `EVALS_DATA_DIR` | `./data` (`/app/data` in Docker) | JSON persistence directory |
| `EVALS_CAPTURE_TOKEN` | unset | When set, capture routes require `Authorization: Bearer …` |
| `OPENROUTER_API_KEY` | unset | Enables OpenRouter judge; falls back to MockJudge |

## Production posture & gaps

Hardened in this pass: multi-stage non-root image, image + Compose healthchecks, persistent volume, timing-safe capture token compare, Apache-2.0 LICENSE + README.

Still **not** production-complete:

- No TLS termination, reverse-proxy, or rate limits (put behind your edge).
- Dashboard and most REST routes are unauthenticated (only capture token is optional).
- Single-node JSON-file store — not HA / multi-replica safe.
- Hyperscaler ingest is **fixtures/stubs**, not live SDK pulls.
- Policy provider mappings are previews only (`not_pushed`).
- DevDependency Vitest/tinypool advisories remain; they do not ship in the standalone production image.
- Docker Compose was authored for one-command standup; verify `docker compose up --build` on a host with a Docker daemon (this cloud VM has no rootful dockerd).

## Docs

- [Problem statement](docs/problem-statement.md)
- [Problem / opportunity](docs/problem-opportunity.md)
- [Requirements](docs/requirements.md)
- [Architecture](docs/architecture.md)
- [Market gap](docs/market-gap.md)
- [Devil’s advocate](docs/devils-advocate.md)

## License

Copyright contributors to Mirevox evals.

Licensed under the **Apache License, Version 2.0** — see [LICENSE](LICENSE). `package.json` `"license": "Apache-2.0"`.
