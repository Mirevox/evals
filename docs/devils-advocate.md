---
cursor:
  subagentId: "bc-7d636467-0961-5f7b-8b89-8740b998df3f"
  role: devils-advocate
  model: grok-4.7-high
---

# Evals — devil’s advocate

Date: 2026-11-20. Target of the attack: product-synthesis module 2 (“Evals & English governance”) and the build-plan line “realtime evals, English rules, hyperscaler ingest.” This is a scope verdict, not a build spec.

## Verdict

The pitched module is a thin aggregator plus two pieces of theater, aimed at a category that already has funded OSS platforms and native cloud eval products. The only honest v1 is a small, default-off, on-prem sidecar: accept sampled spans, run one async judge against a rubric a human wrote, expose a small API. If the council will not lock that cut, do not open the repo. A stub-filled “unified eval dashboard” occupies the Mirevox name and teaches users to trust empty connectors.

Charity is not a strategy here. “Ship it until a hyperscaler obsoletes it” is an admission that the aggregator has no durability. Several hyperscalers and OSS maintainers are already on the other side of that sentence.

## One dashboard for all hyperscaler evals

That is a thin aggregator. It is not a moat.

Foundry, Bedrock, and Vertex each already run eval jobs inside the account that holds the model, the dataset, and the IAM boundary. Bedrock judge jobs score with built-in metrics or up to ten custom judge prompts and write the report to S3 and the Bedrock console ([Bedrock judge evals](https://docs.aws.amazon.com/bedrock/latest/userguide/evaluation-judge.html)). Microsoft Foundry ships built-in quality, safety, RAG, and agent evaluators, plus rubric judges over natural-language criteria ([Foundry custom evaluators](https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/custom-evaluators)). Vertex already has a managed Gen AI evaluation service (autoraters, custom metrics) in the same project as the model. The number the user cares about is born next to the console that can explain it. A third-party dashboard that pulls “the score” arrives late, missing the dataset, the judge prompt, the model version, and the safety model you are not allowed to rehost.

The three products are not comparable without a metric crosswalk nobody has:

- Scales differ (1–5, 0–1, pass/fail, histograms, safety-model violations).
- A Foundry groundedness score, a Bedrock faithfulness score, and a Vertex autorater score are different instruments. Plotting them on one axis is a chart of apples.
- Jobs are regional and permissioned. Azure AD, AWS SigV4, and GCP ADC are three products. A charity module with no cloud accounts in CI will test the mock and ship the gap.
- Each console adds metrics on its own clock. Foundry’s rubric evaluators were posted on 2026-11-18, two days before this note ([Foundry rubric evaluators](https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/evaluate-ai-agents-in-microsoft-foundry-with-quality-safety-and-task-level-rubri/4572665)). An ingest layer is permanently behind, and a stale row looks like a current verdict.

What would be a moat is a normalized ontology plus durable export contracts from all three clouds. You do not have those contracts. They will not grant them so a faceless OSS project can become the system of record for their evals. Data gravity stays in the cloud that ran the job.

The only comparison a hyperscaler cannot draw is the one you already paid for: the same request, sent through your router to two backends, scored with one rubric you control. That is a feature of a proxy log. It is not “a dashboard for all hyperscaler evals,” and it does not require reading their eval jobs at all.

Ingest stubs are worse than omission. A function that returns fixture scores, or an empty list, lets the UI and the tests go green. Users will treat the green as coverage. Schema drift then shows wrong numbers with a confident layout. Absence is honest. A stub is a lie with a roadmap attached.

## English → policy compiler

A compiler stub is theater.

A compiler has a grammar, a target language, and a test that the target means the source. This proposal has an English sentence and a wish to “propagate into provider toolsets.” Those toolsets are not one language:

- Bedrock Guardrails: denied topics, content filters, PII, word filters, grounding checks.
- Foundry / Azure Content Safety: category thresholds and safety models, plus the new rubric judges.
- Vertex safety settings: probability thresholds per harm category.

They do not share semantics. “Be careful with medical advice” does not lower to one guardrail, one content-filter threshold, and one Vertex category. The intersection of the three is weaker than configuring any one of them natively. A compiler that emits all three either drops most of the sentence or pretends the drop did not happen.

The stub people will actually write is `compile(english) -> JSON` via an LLM call. That is an unversioned prompt. It is also injectable: the “policy” text can instruct the compiler model to emit allow-all. There is no round-trip, no diff a reviewer can sign, and no acceptance test that fails when the English and the JSON diverge. Shipping that and calling it a compiler trains the council to write FRs that cannot be met.

You are not early on the English part. Foundry rubric evaluators already score natural-language criteria and can draft a rubric from agent context inside Azure. Bedrock custom metrics are judge prompts the user writes. Promptfoo already runs model-graded assertions (`llm-rubric` and the rest of its assertion library) from a file, locally, in CI. The incremental object is a rubric file a human accepts: id, criteria, pass rule, judge prompt, output schema, hash. Calling the file a compiler does not make a language.

Write-back is the dangerous half. Propagating a compiled policy into a provider safety control can loosen a guardrail in production. That is not a v1 toy. A bad compile is an incident. Cut write-back entirely. Do not leave a stub “for later” on that path.

If a sentence is useful, a later release may draft a rubric and stop for a human diff. That is a suggestion box. It is out of v1, and it must not be named a compiler in the requirements.

## Live conversation evals through the router

“Because traffic goes through the router, evaluate live conversations” treats a proxy hop as consent, a budget, and a latency budget. It is none of those.

**There is no live traffic.** Smart-router v1, per the council brief, is an OpenAI-compatible gateway stub: file/env keys, a routing policy, fan-out, and discovery stubs. Evaluating its conversations evaluates fixtures. Automatic eval “as models are onboarded” is worse: discovery polling would mint judge calls for registries, not for users. That is a cost bomb wired to the router’s noisiest loop.

**Consent.** The router operator is not the data subject. A single endpoint for VS Code and a home chatbot covers the operator’s own prompts. The moment a workflow behind that endpoint serves someone else — a teammate, a customer, a patient — their text is in the span. Routing it does not authorize a second model to read it, store it, and score it. Say the v1 persona out loud: the operator judging their own opted-in traffic. Delete “any conversation” and “any use case” from the requirements.

**Privacy.** Chat transcripts hold secrets, customer data, and credentials pasted into the editor. Persisting them for a judge is a second processing purpose. Sending them to a judge model is egress. The data-lineage module exists to trace that egress; an evals module that ignores it makes the control plane incoherent. v1 rules, if capture exists at all:

- Default off. No capture without an explicit enable.
- Sample rate required, and a hard cap on judge calls per day.
- Redact secrets before anything is stored and before anything is sent to a judge.
- TTL on stored text. Store the minimum: route, model id, token counts, latency, redacted excerpt, rubric hash, score.
- Tool outputs stay off by default. They are the data-rich part.
- Operator attestation on the config: they are allowed to reprocess this text.
- Judge model may be local. A cloud judge is a choice the config shows, not a default hidden in a client.

**Cost.** A judge call can cost more than the call it grades, and several rubrics multiply that. Langfuse’s own online-eval setup shows sampling plus a cost preview before a rule is attached ([Langfuse online evals](https://langfuse.com/docs/evaluation/get-started/online)). Copy the restraint. Do not copy the platform. 100% online judging is how this module bankrupts the router it depends on.

**Latency.** A judge on the request path adds a full model round-trip and fails the chat when the judge fails. Online evals in the tools that already work are asynchronous. Ban the word “realtime” in FRs. The permitted phrase is “online, sampled, asynchronous,” with a lag target measured in seconds or minutes, off the user path.

**Judge quality.** An LLM judge prefers long, confident answers and agrees with itself. Without a frozen gold set and a published agreement figure, the score is an unlabeled opinion. v1 may emit the opinion. It may not label it “quality,” “safety,” or “governance.” Persist judge model id, judge prompt hash, and rubric hash on every score so a later reader can see it was one model’s word.

**Coupling.** If the only emitter is the Mirevox router, the module has no users until the router wins against LiteLLM and the native gateways, and it dies if the router slips. Accept generic OTel GenAI spans or a dumb webhook. The router is one client.

## Competitors

You are late, and the OSS seats are taken by people who can maintain them.

| Incumbent | What they already are | What that does to this module |
| --- | --- | --- |
| Langfuse | MIT core (enterprise admin extras aside). Tracing, datasets, experiments, LLM-as-judge, code evaluators, annotation, online rules with filters, sampling, and cost preview. Self-host is a real stack (web, worker, Postgres, ClickHouse, Redis, object storage). | The “OSS dashboard + online judge” product. Cloning it as a charity is a maintenance loss. |
| Promptfoo | MIT. Now part of OpenAI, still MIT ([repo](https://github.com/promptfoo/promptfoo/)). CLI evals, multi-provider comparison, red team, CI, model-graded rubrics. Local by default. | Owns “english-ish rubric in a file, run in CI, compare providers.” A compiler stub does not pass them. |
| Arize Phoenix | OTel tracing, datasets, experiments, server-side LLM judges. Elastic License 2.0: self-host is allowed, offering it as a hosted service is not. | Closest OTel-shaped tool. License is the one real wedge, and Langfuse/MLflow/Opik already close it with permissive licenses. |
| MLflow, Opik | Apache-2.0 eval/trace platforms with companies or a foundation behind them. | “We are the permissive OSS option” is false. |
| LangSmith, Braintrust | Funded. Datasets, experiments, online/async scoring, annotation, CI. Braintrust’s self-host keeps a vendor control plane. | They will out-ship a volunteer dashboard on UX, stats, and regression diffs. Do not fight them feature for feature. |
| Foundry, Bedrock, Vertex | Native judges, safety models, agent/RAG metrics, consoles, dataset gravity. Foundry rubric judges landed 2026-11-18. | The ingest target is moving and does not want you as the system of record. |

Promptfoo being inside OpenAI matters. The default OSS eval CLI now has a lab behind it. A faceless charity will not out-maintain that, or Langfuse, on trace UI, dataset management, annotation queues, or red team.

The synthesis already deprioritized “betting the umbrella on a full cloud compliance product vs hyperscalers.” A unified hyperscaler eval dashboard is that bet in a smaller costume. Keep the deprioritization. Apply it here.

## Charity OSS vs the maintenance bill

The brand line — tools people can use or commercialize until a hyperscaler obsoletes them — fits a small library. It does not fit an integration product.

- Three ingest clients are a permanent tax: auth, pagination, quotas, breaking JSON, and regional endpoints. The commercializer who forks you inherits that tax with no SLA from the charity. They will not thank you.
- Stubs invert the charity. They cost little to merge and a lot to explain once someone points a real tenant at them. Rotten stubs produce confident wrong scores. That is the failure mode that hurts users, not the empty repo.
- A dashboard people can commercialize needs on-call for every cloud change. This org does not have that on-call. Scope to something that still runs if the maintainer disappears for a year: one ingest format, one rubric file, one async worker, one query API.
- License positioning is already spent. MIT and Apache-2.0 eval tools exist, with maintainers. Phoenix’s ELv2 is a narrow opening (“you may commercialize a hosted service”), and it is not an opening to rebuild Phoenix.
- Composition cuts both ways. A module that only works with the Mirevox router, and a router that must carry eval capture to justify this module, couples two weak v1s. Either side can sink the other.

Honest public sentence, if you ship anything: “On-prem scorer for spans you opt in. One rubric. Your judge model. We do not import Foundry, Bedrock, or Vertex eval jobs, and we do not write rules back into their safety products.”

## What v1 is not

Leave all of this out. Do not smuggle it back in as a stub, a mock, a fixture endpoint, or a “coming soon” UI tab.

- Hyperscaler eval ingest, including non-working connectors and fixture providers.
- A metric crosswalk across Foundry, Bedrock, and Vertex.
- English-to-policy compiler, provider policy emit, guardrail/content-filter/safety-setting write-back.
- Inline or synchronous judging on the request path.
- Default-on capture, full-fidelity transcript retention, judging tool outputs by default.
- Eval-on-discovery, eval-on-every-onboard, “any model,” “any use case.”
- Annotation queues, human rating products, dataset/experiment platforms, prompt registries, playgrounds.
- Built-in safety, groundedness, or red-team suites that impersonate the cloud safety models.
- Multi-tenant auth, SSO, team RBAC.
- A second tracing backend. Consume OTel or a webhook. Do not invent one.
- The words “realtime,” “unified hyperscaler dashboard,” “governance compiler,” and “policy propagation” anywhere in requirements or the README.

## What a non-embarrassing v1 actually is

A single process a home-lab operator can run beside the router, or without it:

1. Capture hook, off unless enabled. OTel GenAI spans or a small JSON webhook. Sample rate. Secret redaction. TTL. Daily cap.
2. One rubric document the operator wrote and hashed. No generation step.
3. One async worker. One configured judge model (local allowed). Score object: sample id, rubric hash, judge model id, pass/fail or a single number, short rationale, token cost.
4. A small read API: list samples, list scores, show the cap and the sample rate. A single plain page is optional. Curl is enough to accept the release.
5. Tests that use a fake judge and a fixture span. No test that claims a cloud console was read.
6. README that states the non-goals in the list above, in the same blunt form.

That module is allowed to be boring. Boring is the scope that survives contact with Langfuse, Promptfoo, and Foundry.

## Requirement traps

Reject these if they show up in the FR draft:

- “Dashboard shows Foundry, Bedrock, and Vertex evaluations.” Untestable without three tenants, and a mock makes it falsely true.
- “Compiler translates English into provider toolsets.” No grammar, no fidelity test, write-back can weaken safety controls.
- “Realtime evals on live router traffic.” Router v1 has no live traffic; inline judging breaks latency; the phrase smuggles consent.
- “Any model / any use case.” Slogan. Not a test.
- “LLM-as-judge quality score.” Rename to “judge output.” Quality is a claim you have not earned.

Acceptance for the keep-scope is mechanical: a posted fixture span is stored redacted, a fake judge writes one score tied to a rubric hash, the API returns it, and nothing in the repo imports a cloud eval API.

## Keep / cut / defer

| v1 item | Verdict | Why |
| --- | --- | --- |
| OTel / conversation capture hooks | **Keep**, narrow | Only legitimate input. Default off, sampled, redacted, TTL, daily cap, generic OTel or webhook so the router is optional. Operator-owned traffic only. Not a tracing product. |
| Hyperscaler ingest stubs | **Cut** | Thin aggregator, no crosswalk, mocks become lies. Do not defer the stubs; deferred stubs still get built. Real ingest stays out until a crosswalk exists, which is not this module’s v1 and may never be worth it. |
| English → policy compiler stub | **Cut** | No grammar, targets are not isomorphic, LLM “compile” is injectable theater, write-back can loosen guardrails. Foundry and Promptfoo already cover natural-language rubrics. A human-written rubric file replaces it. A “draft a rubric, human accepts the diff” helper is out of v1. |
| LLM-as-judge pipeline | **Keep**, one rubric, async | The only behavior that makes the sidecar worth a repo. Off the request path. One judge model. Cost cap. Persist model id and rubric hash. Label the output as a judge opinion. No metric pack, no safety-model cosplay. |
| Simple dashboard / API | **Keep** the API; page is optional | List samples and scores, show sample rate and cap. A unified hyperscaler dashboard is cut with the ingest. Do not block the release on a UI. |

If keep-scope feels too small for a council and a GitHub product page, that feeling is correct, and the right response is a smaller repo, not a larger claim.
