---
cursor:
  subagentId: "bc-7d636467-0961-5f7b-8b89-8740b998df3f"
  role: requirements-gatherer
  model: gemini-4-neon-high
---

# Mirevox Evals — Problem & Opportunity Brief

- **Module:** `evals` (`https://github.com/Mirevox/evals`)
- **Umbrella:** Mirevox (faceless open-source charity umbrella; modular agentic control plane)
- **License:** Apache-2.0 or MIT (Apache-2.0 recommended to match `smart-router`)
- **Status:** Requirements Gatherer draft (pre-vetting)

## 1. Problem Statement

Teams and individual builders running multi-provider AI stacks have no single, vendor-neutral way to evaluate models, express behavioral rules, and inspect live agent traffic:

1. **Fragmented evaluation silos.** Azure AI Foundry, AWS Bedrock, and Google Vertex AI each ship incompatible evaluation consoles, scoring scales (1–5 Likert, pass/fail booleans, 0–1 floats), and metric definitions. Local and self-hosted models (Ollama, vLLM, custom endpoints) have no native evaluation plane at all. Comparing a model swap across providers means exporting JSON/CSV artifacts by hand and reconciling mismatched schemas.
2. **Governance rules are trapped in provider syntax.** Operational rules start in plain English (*"never expose emails or API keys"*, *"stay under 300 words"*, *"cite sources on factual claims"*). Translating and maintaining those rules across Foundry evaluators, Bedrock guardrails/rubrics, Vertex evaluation templates, and custom test harnesses creates silent policy drift across clouds.
3. **Unvetted model onboarding.** In an automated control plane (such as Mirevox `smart-router` discovering models, MCP tools, and workflows via polling), new models can become routable before anyone executes a baseline quality or safety evaluation.
4. **Offline benchmarks diverge from live conversations.** Static prompt datasets do not reflect real user sessions, multi-turn tool calls, or regressions introduced by upstream provider updates. Because live traffic already transits the router, failing to evaluate live conversations leaves silent quality drops and policy violations undetected until users report them.

## 2. Who Hurts

- **Platform & AI Infrastructure Engineers** managing multi-cloud + local endpoints (e.g., VS Code extensions and internal/home chatbots behind one router): waste time hopping between three hyperscaler UIs and writing brittle glue scripts to answer basic questions like *"did switching from model A to model B increase policy violations?"*
- **Non-Technical Governance & Domain Owners** who know the behavioral rules an agent must follow in plain English, but cannot author provider-specific JSON/YAML schemas or Python evaluators—bottlenecking policy updates on engineering sprints.
- **Agent & Application Builders** who onboard new models, prompts, and workflows frequently and need automatic baseline scoring at onboarding time plus continuous live-traffic scoring without embedding custom eval SDKs into every client app.
- **Self-Hosted & OSS Operators** who want a lightweight, inspectable, Docker-ready evaluation service they can run locally on a cloud VM or workstation without paying for an enterprise observability SaaS or supplying cloud API keys just to verify the pipeline works.

## 3. Opportunity

Mirevox `evals` turns evaluation and governance into a small, composable, open-source control-plane module that works out-of-the-box:

- **One normalized evaluation plane.** Ingest hyperscaler evaluation results (Foundry, Bedrock, Vertex) alongside internal LLM-as-judge runs into a single canonical schema, queryable via REST API and inspectable in a lightweight dashboard.
- **English as the portable policy source.** Author rules once in plain English, compile them into a deterministic structured policy representation, and emit provider-specific target artifacts (stubbed in v1, real provider push adapters later) so governance logic has one source of truth.
- **Continuous, zero-touch evaluation on live traffic and onboarding events.** Attach directly to `smart-router` via OpenTelemetry (OTel) and lightweight event webhooks so newly onboarded models receive immediate baseline checks and live conversations are scored asynchronously without adding latency to user responses.
- **Zero-key runnable v1 core.** Ship an LLM-as-judge pipeline that supports OpenAI-compatible judge endpoints when configured and degrades transparently to a deterministic mock/heuristic fallback judge when no API keys are present. Anyone can clone, boot, and exercise the full loop (capture -> compile -> judge -> ingest -> view scores) in under a minute.
- **Built to be useful, modular, and replaceable.** Consistent with Mirevox's OSS umbrella philosophy, `evals` relies on open standards (OTel, REST/JSON, SQLite) and narrow adapter boundaries so users can run it standalone, embed it in their own stack, or swap adapters as hyperscalers evolve.

## 4. Non-Goals (Explicit Scope Boundaries)

To keep v1 focused, honest, and shippable now, `evals` explicitly will **not**:

- **Compete on foundation models or train custom judge weights.** `evals` orchestrates existing models and deterministic heuristics; it does not train LLMs.
- **Act as an inline synchronous blocking guardrail proxy in v1.** Live traffic evaluation runs asynchronously (out-of-band capture). Request interception, blocking, or inline redaction is deferred past v1 so `evals` cannot become a latency bottleneck or single point of failure on the serving path.
- **Build an enterprise cloud compliance / GRC portal.** No SOC2/HIPAA audit management, approval workflows, or Terraform/IaC provisioning portals.
- **Require live hyperscaler credentials or paid LLM APIs for v1 acceptance.** Foundry, Bedrock, and Vertex ingest and policy export ship as clean, schema-validated adapter stubs backed by realistic fixtures; live cloud SDK integration layers on afterward without changing core interfaces.
- **Require heavy distributed infrastructure.** No mandatory ClickHouse, Kafka, Kubernetes, or full Sherali homelab stack. v1 runs as a single lightweight process on a standard cloud VM (Docker-friendly packaging follows without blocking v1).
- **Include n8n or Instagram pipelines.** Strictly out of scope.

## 5. Composition with `smart-router` and the Mirevox Control Plane

`evals` is designed to run standalone (via direct API calls or fixture replay) and to compose cleanly with `smart-router` as its primary live-traffic source:

```
Clients (VS Code, Chatbot, Agents)
        |
        v  (OpenAI-compatible traffic)
+------------------+   OTel spans / async capture webhook   +-------------------+
|   smart-router   | -------------------------------------> |   mirevox/evals   |
|  (gateway +      |   model.onboarded lifecycle webhook    |  - capture hooks  |
|   discovery)     | -------------------------------------> |  - English rules  |
|                  | <------------------------------------- |  - LLM/mock judge |
+------------------+   (read-only) scorecards API (v1+)     |  - hyperscaler    |
                                                            |    ingest stubs   |
                                                            |  - API / UI       |
                                                            +-------------------+
```

### Integration Contracts

1. **Out-of-Band Conversation Capture (`smart-router` -> `evals`):**
   - `smart-router` emits OTel GenAI spans (`gen_ai.*` attributes) to `evals`'s OTLP/HTTP trace ingest endpoint, or posts normalized conversation payloads (including task-split fan-out sub-calls) to `evals`'s async capture webhook.
   - Delivery is fire-and-forget from the router's perspective; `evals` responds immediately (`202 Accepted`) and evaluates asynchronously. If `evals` is unreachable, `smart-router` continues serving uninterrupted.
2. **Real-Time Model Onboarding Trigger (`smart-router` -> `evals`):**
   - When `smart-router`'s discovery/polling registry onboards or references a new model, MCP server, or workflow, it sends a `model.onboarded` event containing `model_id`, `provider`, and optional tags/use cases.
   - `evals` matches active English-compiled policies to that model/use case and schedules an immediate baseline evaluation run.
3. **Scorecard Consumption (`evals` -> `smart-router` & Operators):**
   - `evals` exposes per-model, per-provider, and per-policy score summaries via REST API (`GET /api/v1/evals/summary`).
   - In v1, operators review these scores via the API or lightweight dashboard. In later iterations, `smart-router`'s routing policy engine can query the same endpoint to deprioritize degraded models or route sensitive activities to models meeting a minimum policy score.
4. **Loose Coupling with Sibling Mirevox Modules:**
   - `data-lineage`: shares `trace_id` and `conversation_id` correlation fields originating at `smart-router`, allowing residency traces and eval scores to be joined without tight runtime coupling.
   - `stage-gate`: can call `evals` summary/run endpoints over HTTP as an automated quality gate check before advancing a workflow stage.
