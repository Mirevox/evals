---
cursor:
  subagentId: "bc-b8da1913-3ea7-5467-ab15-8f8f9990ba16"
---

# Mirevox evals: competitive landscape and market gap

_Research snapshot: 20 November 2026._

## Executive conclusion

There is no broad “eval platform” gap. LangSmith, Braintrust, Langfuse, Opik, Confident AI, Arize, and others already combine traces, datasets, LLM-as-judge, production scoring, dashboards, and alerts. Helicone and Portkey already put evaluation or guardrails on an AI gateway. LiteLLM already exposes router-layer guardrail and OpenTelemetry hooks. Promptfoo, DeepEval, Ragas, and Phoenix provide strong open-source building blocks.

### Top 4 closest alternatives (2026)

| # | Alternative | Posture | Live/router eval | Policy authoring | Native eval-job federation | Mirevox opening |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **Portkey** | MIT gateway + paid cloud | Strong (incl. blocking) | JSON / configured guardrails | Not documented | Portable English source + evidence federation |
| 2 | **Langfuse** | MIT self-host + paid cloud | Strong online rules + gateway | UI / code / judge prompts | Generic scores, not native jobs | Target compilation + source provenance |
| 3 | **Comet Opik** | Apache-2.0 + paid cloud | Strong rules + gateway integrations | UI / API / Python | Not documented | Thin interoperable layer (Opik proves “OSS dashboard” alone is not enough) |
| 4 | **LangSmith** | Proprietary SaaS | Strong run/thread evaluation | UI / code / judge prompts | Not documented | Open, provider-neutral evidence |

Portkey is the sharpest direct threat. Opik is the strongest evidence that an Apache-2.0 eval dashboard alone is not differentiated.

### v1 reality check

| Thesis claim | v1 reality |
| --- | --- |
| Pull hyperscaler evaluations | Fixture normalizers only — no live credentials, polling, or source deep links |
| Translate/propagate into provider toolsets | Dry-run mapping labels (`not_pushed`); no provider artifacts or semantic-diff report |
| English compiler | Constrained keyword/regex parser — not arbitrary NL enforcement |
| Real-time evals | Capture is immediate; judging is **on-demand** (no auto attach / queue / sampling) |
| Unified comparison | Normalized 0–1 scores; semantics are **not** equivalent across providers |

**Gap verdict:** the interoperability gap is real; v1 proves a runnable reference slice but does **not** yet close the thesis. Ship-with-caveats as a developer preview, not a production governance platform.

Mirevox is worth shipping only as a **thin, provider-neutral eval control plane for routed traffic**:

1. One portable, versioned policy source written in constrained English.
2. A compiler that shows how that policy maps into each provider/tool target—and clearly reports what cannot be represented.
3. Import of native hyperscaler evaluation jobs and scores into a normalized, cross-provider view, while preserving raw evidence.
4. Automatic attachment to Mirevox router traffic through OpenTelemetry, with no second application integration.

That combination remains uncommon. Each individual element is commoditized, so the combination and its interoperability—not a new judge metric or dashboard—is the thesis.

## Competitor map

| Segment | Players | What they already do well | Remaining opening for Mirevox |
|---|---|---|---|
| Full evaluation/observability platforms | **LangSmith**, **Braintrust**, **Confident AI**, **Arize AX** | Offline experiments, datasets, traces, production scoring, LLM judges, filters/sampling, dashboards, CI and review workflows. LangSmith supports live run and multi-turn online evaluators; Braintrust scores production traces asynchronously; Confident AI evaluates traces/spans/threads. | Cross-platform governance is not their incentive. Their best experience centers their own trace store, schemas and workflow. |
| Open-source/self-hostable platforms | **Langfuse**, **Comet Opik**, **Phoenix** | Langfuse and Opik now offer production rules and managed-style online evaluation in OSS/self-hosted products. Opik supports trace/thread/span rules with judges or Python. Phoenix is strong for OTel/OpenInference tracing, datasets, experiments and client-side evals. | Mirevox cannot win by being “OSS evals + dashboard.” It can be smaller and act above/beside these systems as a policy compiler and result federation layer. |
| Developer eval frameworks | **Promptfoo**, **DeepEval**, **Ragas**, **OpenAI Evals** | Promptfoo: mature MIT CLI, YAML assertions, broad providers and red teaming. DeepEval: local-first, pytest-style tests and many agent/RAG/judge metrics. Ragas: strong RAG metrics. OpenAI Evals: benchmark framework/registry. | Libraries do not by themselves provide a neutral, continuously attached router control plane or a unified view of native cloud eval jobs. Mirevox should integrate rather than reimplement their metrics. |
| Gateway/router products | **Helicone**, **Portkey**, **LiteLLM** | Helicone combines a multi-provider gateway, observability and online evaluators. Portkey runs async or blocking guardrails on gateway inputs/outputs and can deny, retry, fall back or annotate. LiteLLM has pre/during/post/logging-only guardrail hooks and OTel spans. | This is the sharpest competitive threat. The narrower opening is portable governance authored once, compilation to external provider toolsets, and aggregation of provider-native eval evidence—not merely checks inside Mirevox’s own gateway. |
| Hyperscaler eval suites | **Microsoft Foundry** (formerly Azure AI Foundry branding), **Amazon Bedrock Evaluations**, **Vertex AI Gen AI evaluation**, OpenAI’s hosted Evals | Deep native integration, managed judges, safety metrics, model/RAG/agent evaluation, synthetic data and enterprise identity. Bedrock also offers programmatic and human evaluation; Vertex supports adaptive rubrics and third-party models; Foundry covers model, agent, dataset and trace targets. | Their natural boundary is their cloud and control plane. A neutral evidence layer is useful to teams split across clouds and direct model APIs. However, hyperscalers can add cross-provider imports quickly. |
| Adjacent alternatives | **W&B Weave**, **Parea**, **Galileo**, **Patronus AI**, provider guardrails | Strong existing customer bases in ML operations, model monitoring, safety, experiments or enterprise governance. | Avoid competing for full lifecycle ownership. Export normalized data to these tools and make Mirevox replaceable. |

### Evidence behind the map

- [LangSmith online evaluation](https://docs.langchain.com/langsmith/evaluation) evaluates live production runs; [multi-turn evaluators](https://docs.langchain.com/langsmith/online-evaluations-multi-turn) score assembled conversations.
- [Braintrust online scoring](https://docs.braintrust.dev/evaluate/score-online) runs asynchronously over production traces.
- [Langfuse production evaluation](https://langfuse.com/docs/evaluation/get-started/online) attaches filtered/sampled evaluators to incoming observations; its self-hosted code evaluators require an execution dispatcher.
- [Opik online rules](https://www.comet.com/docs/opik/production/online-evaluation/rules) cover traces, threads and spans with LLM judges, decision models or Python.
- [Phoenix evaluation](https://arize.com/docs/phoenix/evaluation/llm-evals) supports deterministic and judge evaluators over production traces, experiments and datasets.
- [DeepEval](https://deepeval.com/docs/introduction) is a local-first, pytest-oriented OSS framework; the hosted Confident AI product supplies production workflows.
- [Ragas](https://docs.ragas.io/en/latest/concepts/metrics/overview/) is primarily a metric library; production operation normally depends on another trace/evaluation system.
- [Promptfoo](https://www.promptfoo.dev/docs/intro/) is an MIT-licensed CLI/library with declarative assertions and red teaming. Its planned [acquisition by OpenAI](https://openai.com/index/openai-to-acquire-promptfoo/) is a direct consolidation signal.
- [Helicone](https://docs.helicone.ai/getting-started/integration-method/gateway) is already a multi-provider gateway and documents online evaluator APIs.
- [Portkey guardrails](https://portkey.ai/docs/product/guardrails) evaluate gateway inputs and outputs asynchronously or synchronously.
- [LiteLLM guardrails](https://docs.litellm.ai/docs/proxy/guardrails/quick_start) and [OTel v2 tracing](https://docs.litellm.ai/docs/observability/opentelemetry_v2) expose the router-level hooks Mirevox proposes.
- [Microsoft Foundry evaluation](https://learn.microsoft.com/en-us/azure/foundry/how-to/evaluate-generative-ai-app), [Bedrock Evaluations](https://aws.amazon.com/bedrock/evaluations/), and [Vertex AI evaluation](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/run-evaluation) all provide substantial native suites.
- OpenAI’s hosted Evals product is unusually volatile: its docs say it becomes read-only on 31 October 2026 and [shuts down on 30 November 2026](https://developers.openai.com/api/docs/guides/evals). The separate [open-source OpenAI Evals repository](https://github.com/openai/evals) remains a framework and benchmark registry.

## Gap thesis

### 1. “Write once, inspect every compilation target”

Competitors let users describe judge criteria in prose, configure filters in a UI, or write YAML/Python. That is not the same as a portable governance source that compiles to multiple concrete targets. Mirevox can make each rule:

- human-readable and stored in Git;
- parsed into a small typed intermediate representation;
- rendered into provider-specific judge prompts, guardrail configs, sampling rules or local evaluators;
- accompanied by a diff, capability warnings and provenance;
- reversible enough that an auditor can connect a score to the exact rule version and generated artifact.

The English must be **constrained and previewed**, not marketed as arbitrary natural language. For example: “On support conversations, sample 10%; fail if the answer requests a password; judge resolution quality from 1–5; alert below 3.” Ambiguity should produce questions or a draft, never silently become enforcement.

### 2. Federation, not another private score silo

Hyperscaler suites already produce useful evaluation jobs, metrics and evidence. Independent tools usually want the customer to rerun evaluation in their platform. Mirevox can instead normalize imported jobs into a common envelope:

`provider, source_job_id, target/model, dataset, metric, score, threshold, rule_version, trace_id, timestamp, raw_payload_ref`.

The UI should display normalized comparisons while retaining the original provider payload and deep link. This is valuable for multi-cloud teams and avoids pretending unlike metrics are mathematically equivalent. “Faithfulness” from two providers should not be merged without metric implementation/version metadata.

### 3. Router-path capture as installation advantage

When traffic already traverses Mirevox smart-router, evals can receive conversation and routing context automatically: candidate model, selected model, fallbacks, latency/cost, tool calls and response. OTel makes the attachment replaceable and useful to external backends.

This is an integration advantage, not a unique capability. Helicone, Portkey and LiteLLM prove the pattern already exists. Mirevox’s differentiation is that router events, provider-native eval imports and portable policy versions meet in one neutral view.

### 4. Governance evidence, not “AI governance”

A thin v1 can answer:

- What rule was intended?
- What concrete evaluator/config was generated for each target?
- Which traffic or dataset version was evaluated?
- Which judge model/version produced the score?
- What was unsupported, skipped or sampled?

That is useful governance evidence. It is not compliance certification, policy management, access review, human adjudication or enterprise risk management. Avoid the larger claim.

## Why it is worth shipping—honestly

It is worth a small OSS release because:

- Multi-provider teams have real translation and evidence-fragmentation pain.
- Router placement removes a meaningful instrumentation step and supplies routing context that post-hoc eval tools may lack.
- A portable rule IR and provider adapters can complement Langfuse, Opik, Phoenix, Promptfoo and cloud suites instead of demanding migration.
- Charity-backed, permissively reusable software is credible for teams that want an exit path from hosted eval vendors.
- OpenAI’s imminent hosted Evals shutdown demonstrates that provider-native evaluation surfaces can change or disappear.

It is **not** worth building as a generic “one dashboard for evals.” Dashboards are abundant, score semantics differ, and connector maintenance is endless. It is also not worth claiming real-time protection from asynchronous LLM judges. Production judge scoring is normally **near-real-time and off-path**; synchronous blocking adds judge latency, cost and failure modes. V1 should default to observe-only.

The best initial users are platform teams already using multiple model providers or Mirevox routing, especially those that need versioned evidence but cannot justify a heavyweight evaluation platform. Single-provider teams and teams already standardized deeply on LangSmith, Braintrust, Confident AI or Portkey have little reason to switch.

## Risks of being crushed

1. **Gateway incumbents are already converging.** Portkey has enforcement and orchestration; Helicone has gateway + evaluators; LiteLLM has guardrails + OTel. Any can add an English policy editor and imports.
2. **OSS platforms are closing the online-eval gap.** Langfuse and Opik now offer production evaluation rules; “self-hosted online evals” is no longer distinctive.
3. **Hyperscalers own the native APIs and enterprise channel.** They can expose a multi-provider comparison layer or change APIs faster than Mirevox adapters can follow.
4. **Consolidation can accelerate bundling.** OpenAI’s Promptfoo acquisition puts mature cross-provider eval/red-team technology inside a hyperscaler while retaining its OSS funnel.
5. **Natural-language compilation is easy to demo and hard to trust.** Ambiguous policy, nondeterministic compilation and silent target mismatch could create false assurance and liability.
6. **Metrics are not portable by name.** Different judge prompts, models and scales make a unified dashboard misleading unless provenance is first-class.
7. **Judge cost, latency and privacy can dominate.** Live conversation scoring may expose sensitive content to another model and can cost as much as inference.
8. **The router coupling can shrink the market.** If evals only works with Mirevox router, it is an add-on rather than a standalone OSS module; if it works everywhere, its installation advantage weakens.
9. **A charity has limited connector-maintenance capacity.** Provider API drift and dashboard upkeep can consume effort without creating durable differentiation.

## Recommended v1 positioning

### Positioning statement

> **Mirevox evals is the open, router-aware control plane for portable AI evaluation rules and cross-provider evidence. Write a rule once in clear English, inspect what it becomes, score live routed traffic asynchronously, and compare native evaluation results without moving into another closed suite.**

Use “control plane” and “evidence,” not “complete eval platform,” “enterprise governance,” or “real-time safety.”

### Product boundaries

Ship:

- a small, documented rule grammar expressed as constrained English;
- a typed intermediate representation and deterministic version hash;
- compilation preview with target-specific artifacts and explicit unsupported fields;
- one genuinely working local LLM-as-judge path and one end-to-end provider connector; label the rest as stubs;
- OTel ingestion/export hooks aligned with GenAI semantic conventions;
- asynchronous sampling, retries, cost limits, redaction hooks and dead-letter visibility;
- a normalized result API and simple dashboard with raw-source provenance;
- Git-friendly import/export;
- adapters that can emit or invoke existing OSS tools rather than replace their metrics.

Do not ship in v1:

- arbitrary-English automatic enforcement;
- inline blocking on judge results;
- a novel metric catalog, benchmark registry or red-team suite;
- annotation workforces, prompt optimization, CI orchestration or full trace observability;
- claims that differently named provider scores are directly comparable;
- compliance certifications or an enterprise policy engine.

### Proof that the wedge is real

Before expanding, require three demonstrations:

1. One rule compiles into at least two materially different targets with a visible semantic-difference report.
2. One dashboard view joins a Mirevox OTel trace with a native hyperscaler evaluation result and preserves the raw source.
3. A user can remove Mirevox and retain rules, generated artifacts and OTel data in usable formats.

If those cannot be shown, Mirevox evals is effectively another judge wrapper and should remain a small router plug-in rather than a standalone module.
