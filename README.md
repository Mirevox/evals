# Mirevox Evals

Realtime evaluation and English governance for the [Mirevox](https://github.com/Mirevox) control plane.

Traffic that flows through **smart-router** can be captured here (webhook or OTLP/HTTP JSON), scored with an LLM-as-judge (MockJudge by default), merged with hyperscaler eval stubs (Foundry / Bedrock / Vertex), and governed by English rules compiled into structured policies.

## Quick start

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3847](http://127.0.0.1:3847). No API keys required.

```bash
npm test
npm run build && npm start
```

## What ships in v1

| Module | Capability |
| --- | --- |
| `capture` | `POST /api/capture/webhook`, `POST /api/capture/otel` |
| `ingest` | Stub Foundry / Bedrock / Vertex → normalized `EvalResult` |
| `policy` | English → `PolicyDocument` compiler (dry-run provider mappings) |
| `judge` | MockJudge + optional OpenRouter (`OPENROUTER_API_KEY`) |
| dashboard | Dark UI + REST API on port **3847** |

## Compose with smart-router

```bash
# After each routed completion (fire-and-forget):
curl -X POST http://127.0.0.1:3847/api/capture/webhook \
  -H 'content-type: application/json' \
  -d '{"conversationId":"c1","model":"gpt-x","provider":"local","prompt":"...","response":"..."}'

# Or OTLP/HTTP JSON:
# OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://127.0.0.1:3847/api/capture/otel
```

Optional: `EVALS_CAPTURE_TOKEN`, `EVALS_STORE=memory|json-file`, `EVALS_DATA_DIR`, `OPENROUTER_API_KEY`.

## Docs

- [Problem / opportunity](docs/problem-opportunity.md)
- [Requirements](docs/requirements.md)
- [Architecture](docs/architecture.md)
- [Market gap](docs/market-gap.md)
- [Devil’s advocate](docs/devils-advocate.md)

## License

Apache-2.0 — see [LICENSE](LICENSE).
