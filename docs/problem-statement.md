# Problem statement — Mirevox Evals

## The problem

Teams running multi-provider AI (hyperscalers + local models behind one router) cannot answer three basic questions in one place:

1. **Did live traffic follow our rules?** Behavioral policy starts in English (“never leak emails,” “cite sources,” “stay under N words”) but enforcement and scoring live in incompatible Foundry / Bedrock / Vertex / custom harness formats.
2. **How do provider-native eval scores compare?** Each cloud ships its own evaluation console, scales, and evidence. Local models have none. Hand-exporting CSV/JSON does not scale.
3. **What happened when a new model was onboarded?** Router discovery can make a model routable before anyone runs a baseline quality or safety check, and offline benchmarks miss live multi-turn behavior.

Existing products solve pieces of this (observability suites, gateway guardrails, OSS eval libraries, hyperscaler-native evals). What remains scarce is a **thin, vendor-neutral control-plane slice**: capture routed conversations out-of-band, compile English rules into inspectable provider mappings, normalize stub/native scores into one view, and stay runnable without cloud keys.

## What Mirevox evals solves (v1)

- **Capture** smart-router turns via webhook or OTLP/HTTP JSON (GenAI spans only).
- **Compile** constrained English into a structured `PolicyDocument` with dry-run provider mappings (`pushStatus: "not_pushed"`).
- **Ingest** Foundry / Bedrock / Vertex **fixture stubs** into a normalized `EvalResult` schema.
- **Judge** turns with deterministic MockJudge by default; optional OpenRouter when keyed.
- **Dashboard + REST** on port 3847, dark UI, Apache-2.0, Docker one-command standup.

## What v1 does *not* claim

- Live hyperscaler pull/push of real evaluation jobs.
- Inline blocking / synchronous guardrails on the serving path.
- Enterprise GRC, compliance certification, or a full observability platform.
- That differently named provider metrics are mathematically equivalent.

## Who it is for

Platform engineers and governance owners who already (or will) route through Mirevox smart-router and need a local, inspectable evidence plane—not another closed eval SaaS.
