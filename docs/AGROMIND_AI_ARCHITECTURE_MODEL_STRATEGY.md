# AgroMind AI — Architecture & Model Strategy

**Status:** proposed engineering strategy; **NOT IMPLEMENTED**  
**Reviewed:** 2026-10-30  
**Product name:** `AgroMind AI` (working name), `AgroAI` (alternative; trademark/name clearance not performed).  
**Project state:** `main` at `42a8eb2b54fd5852f11a2cc31e09dd7b598e4dc0`; the approved seven-phase roadmap is in [unmerged PR #53](https://github.com/Ali-Mafi/AgroMind/pull/53) at `e4fe550bf3e47e1a60f4553c4e05e1c6ceff981c`. Security [PR #52](https://github.com/Ali-Mafi/AgroMind/pull/52) is **Draft / NO-GO** with unresolved F01/F02 native provider boundaries.  
**Decision:** build an AgroMind-controlled specialist agricultural **system** on an independently hosted open-weight model, curated sources, safe tools and measurable evaluation. Do not begin by pretraining a foundation LLM from scratch. **No model, GPU procurement, deployment, training or production integration is authorized by this document.**

## 1. Goal and present baseline

### Product outcome

Deliver a Persian-first, English-capable, farm-aware and science-grounded assistant that:
- understands agricultural questions in ordinary Persian, English and mixed terminology;
- safely reads the **currently authorized** user's farm/garden data, existing weather/irrigation sources and a quality-controlled reference library;
- explains recommendations with source, date, units, assumptions, limitations and confidence/uncertainty;
- uses **deterministic, tested** agricultural calculators for numerical advice instead of guessing physical quantities;
- operates without a compulsory third-party **commercial model inference API**;
- **never** independently changes irrigation, security settings, payments or IoT actuators.

Existing code inspected: `features/assistant/components/assistant-workspace.tsx` contains a draft composer with suggested questions and a **disabled Send button**. This is not an active AI. Preserve the working Next.js 16 / React 19 / TypeScript, Supabase SSR Auth/RLS, farm/garden management, WeatherAPI + Open-Meteo, irrigation, FA/EN locale and iPhone PWA foundations ([Project Rules](PROJECT_RULES.md), [Architecture](03_ARCHITECTURE.md), [Roadmap](ROADMAP.md)). No AI service, GPU inference or model training is claimed to exist.

### Why this is 'ours' without training from zero

| Route | Control | Trade-off | Decision |
| --- | --- | --- | --- |
| Hosted closed-model API | Own UI/prompts, not inference/weights | Fast prototype but vendor-dependent | Not target product architecture |
| **Self-hosted open-weight + RAG + tools** | Own inference deployment, orchestration, knowledge, tool logic, evaluations and possible adapters | GPU operations, up-front integration, upstream model license | **Recommended** |
| Training a foundation model from scratch | Own original model training and weights | Large licensed datasets, distributed GPUs and research team | Not justified for first release |

**Terminology:** Open-weight is not necessarily fully open-source; usage/redistribution conditions still apply. Fine-tuning an upstream model does **not** make AgroMind the original author of the foundation weights. Running your own inference does not remove dependency on compute providers, libraries, weather data or network infrastructure.

## 2. Architecture and trust boundaries

```text
User in AgroMind (mobile PWA/browser)
     |
     v
Next.js authenticated AI endpoint (session, origin, entitlements)
     |
     v
Permission and quota gate (user + farm + role + revocation)
     |
     v
AgroMind AI orchestrator (typed, allowlisted, READ-ONLY tools)
     +----> Supabase farm/garden read under verified authorization
     +----> existing weather and irrigation read/compute tools
     +----> curated scientific knowledge RAG + reranking
     |
     v
Minimum authorized, provenance-tagged context
     |
     v
Private AI gateway --> independent GPU model runtime (e.g. vLLM)
     |
     v
Output schema and safety validation, evidence attribution
     |
     v
Localized response (observed / forecast / calculated / unknown)
```

### Boundaries that cannot be delegated to the model

1. Browser only communicates with authenticated AgroMind APIs. No public GPU endpoint, service key, Supabase JWT, provider key, internal admin URL or private prompt in the client bundle.
2. A requested farm ID must be authorized **on the server at request time and again at each tool/retrieval execution**, with live membership/revocation checks. No bypass via alternate farm ID, team role, cross-user cache, RAG similarity or crafted tool arguments.
3. Prefer existing **user-scoped Supabase/RLS** reads. Any trusted elevated worker must use narrow authorization-enforcing RPCs; never give the LLM a service-role database key, unrestricted SQL or arbitrary data fetch. User metadata is not an authorization source.
4. Model suggests tools; **server chooses** from a strict read-only allowlist and validates typed inputs, permission, bounded dates, response sizes and timeouts. No shell, code execution, URL browsing, direct schema changes, mutation RPCs or IoT APIs.
5. Treat user text, retrieved papers, attachments and model output as **untrusted**; instruction text hidden inside a retrieved document is data, not permission. Sanitize rendering; prohibit untrusted Markdown/HTML execution.
6. Inference server is isolated behind a hardened authenticated TLS gateway/reverse proxy, separate from the Next.js deployment. **vLLM documents that `--api-key` does not protect every exposed path, notably `/invocations`; never publish its raw HTTP server as the security boundary** ([vLLM docs](https://docs.vllm.ai/en/stable/serving/online_serving/openai_compatible_server/)).
7. Every call is budgeted: token/output/context caps, per-user and per-tenant concurrency, deadlines, cancellation, rate limits, quotas, backpressure and no uncontrolled retries.
8. AI-generated advice remains **advisory**. Schedule edits need a separate validated user action. Physical irrigation controls later require independent deterministic safety interlocks, manual stop and explicit permission; model output alone is never a command.

### Proposed modules, not current filesystem

- Existing `features/assistant`: chat UI, progressive streaming, accessible source/uncertainty labels, FA/EN/RTL/iOS safe-area handling.
- Future `features/ai`: authenticated API facade, permission-gated context adapters, entitlements/quota engine, tools and response validation.
- Future `features/ai/knowledge`: source registry, ingestion, chunking, embeddings, retrieval, provenance and deletion.
- Future `features/ai/evaluations`: frozen datasets, agronomy cases, failure/safety tests, reproducibility.
- Independent Python model/embedding runtime + gateway; **concrete service layout requires a later ADR**. No parallel Supabase Auth or farm permission system.

## 3. Candidate model strategy — benchmark, do not guess a winner

| Candidate | Proposed role | License and operational note |
| --- | --- | --- |
| [Qwen3.5-9B](https://huggingface.co/Qwen/Qwen3.5-9B) | **Primary pilot candidate**, text and potential future image understanding | Official upstream card lists Apache-2.0; runtime/quantization/FA quality unmeasured |
| [gpt-oss-20b](https://developers.openai.com/api/docs/models/gpt-oss-20b) | Reasoning and typed-tool-call comparator | Apache 2.0 **with applicable usage policy**; self-hostable; text-only |
| [Gemma 3 12B](https://ai.google.dev/gemma/docs/core/model_card_3) | Multilingual/multimodal independent comparator | Subject to [Gemma Terms of Use](https://ai.google.dev/gemma/terms), **not assumed Apache** |
| [Qwen3.5-27B](https://huggingface.co/Qwen/Qwen3.5-27B) | Higher-capacity comparison if compact models fail | Apache-2.0 card; likely significantly more VRAM/cost |
| [Qwen3-8B](https://huggingface.co/Qwen/Qwen3-8B) | Simple text-only baseline | Apache-2.0 card; independent reference |

**Model selection rules:** pin upstream revision/checksum and read its actual license; record tokenizer, prompt format, quantization, context budget, compatibility, FA/EN quality, tool behavior, VRAM and serving constraints. Do not copy published benchmark scores as AgroMind results. Keep the possibility of changing models through a stable internal gateway. The first model used for experimentation is **not** automatically approved for production.

### Provisional weighted evaluation rubric

| Metric | Weight | Evaluate |
| --- | ---: | --- |
| Agricultural factual quality and reasoning | 25% | Expert-graded crop, soil, weather and irrigation scenarios |
| Persian and English usability | 20% | Agricultural vocabulary, colloquial FA, clarity, mixed language |
| RAG evidence and source correctness | 15% | Supported claims, cited passage match, uncertainty/abstention |
| Tools, numerical units, region/time | 15% | Structured tool calls, ha/acres, mm, L/s, FA dates, time zones |
| Adversarial safety and privacy behavior | 15% | Injection handling, hazardous advice, deny/abstain behavior |
| Operational performance | 10% | p50/p95 latency, tokens/s, memory, concurrent throughput, cost |

**Hard failures override any weighted score:** secret/tenant disclosure, authorization bypass, unsafe mutations, model-driven actuation and dangerously unsupported advice are **NO-GO**. Numeric acceptance thresholds are a later owner/agronomist decision; no measured performance is claimed.

**Evaluation dataset:** propose **250–400** expertly reviewed synthetic/public-data examples, divided across Persian, English, farm/garden, crops/soil, common typos, regional terms, water balance, low-confidence, conflicting/stale weather and adversarial cases. Set aside a genuinely unseen hold-out slice before prompt tuning. Compare **base model**, **same model + RAG** and **same model + RAG + deterministic scientific tools** using identical questions. Keep test data, source revision, prompts, quantization, model hash and evaluator decisions versioned. Include two isolated fake tenants (A/B), revoked users and embedded malicious retrieved text. Never use actual customer fields in initial evaluation.

## 4. Curated knowledge base (RAG)

### Information classes and ownership

- **Reviewed reference corpus:** licensed agricultural extension papers, FAO guidance, peer-reviewed results and authorized agronomic manuals; each source must have publisher, URL, publication/revision date, language, crop, climate/geography, quality review, license and attribution.
- **Private farm context:** user-specific authorized farm/crop/irrigation/weather records, queried only for that user and request; never mixed into the general global corpus or other tenants' prompts.
- **Optional user feedback:** quality signal only, **not automatic training data**. Needs privacy notice, consent where applicable, data minimization and scientific review before inclusion.
- **Scientific calculations:** software-defined input schemas, methods, assumptions, units and numerical regression cases independent of LLM weights.

**Ingestion pipeline:** review license and provenance → acquire permitted content → normalize FA/EN → meaning-preserving chunks with stable source/page IDs → embed → indexed metadata/version → human spot checks → retention/takedown and reindex plan. Do not equate a publicly readable PDF with blanket permission to redistribute or train on it.

### Retrieval mechanics

Use existing Supabase PostgreSQL with **pgvector** (when approved) plus hybrid **lexical + semantic search**, optional reranking and exact citation references ([Supabase hybrid search](https://supabase.com/docs/guides/ai/hybrid-search), [vector columns](https://supabase.com/docs/guides/ai/vector-columns)). A candidate small multilingual embedder is [Qwen3-Embedding-0.6B](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B), supporting up to 1,024 dimensions; test the related 0.6B reranker. **Do not use `to_tsvector('english',...)` as a Persian search design** merely because the generic Supabase example does; test real Persian normalization/stemming and bilingual retrieval. Never mix vector spaces from different embedding models without a reindex.

Retrieval is **permission first**: approved public corpus separate from tenant-specific data; authorized filter before text can enter model context; RLS or secure invoker enforces the same user/farm rights as ordinary features. Retrieval rank does not confer permission. Model inputs should contain only the required passages, source IDs, publication dates and authorized data snapshots; no unneeded precise GPS or personal identifiers. Expired, conflicting or missing weather observations must remain explicitly unknown.

**RAG acceptance evidence:** expert-labeled Recall@k/precision or MRR, source citation support, document freshness, Persian term coverage, multi-tenant negative tests, poisoned-document prompts, right-to-delete/takedown behavior and query latency. Set gates after measuring a baseline, not by inventing a success percentage.

## 5. Deterministic agricultural engine

AI should interpret the question and narrate the outcome, **not invent irrigation volumes or growth calculations**.

| Read-only tool (planned) | Contract |
| --- | --- |
| `get_farm_context(farm_id)` | Authorized farm/garden identity, available crop/area/soil facts, missing fields |
| `get_weather_summary(farm_id, horizon)` | Authorized location + bounded interval, source provider/time, forecast vs observation, uncertainty |
| `get_irrigation_history(farm_id, interval)` | Known schedules and recorded events, **not proof water was applied** |
| `retrieve_agronomic_references(query, crop, region)` | Licensed reviewed passages with canonical citation |
| `calculate_water_balance(validated_inputs)` | Deterministic ET₀/Kc/soil water-balance calculations, unit-normalized input, reproducible output and assumptions |

Agronomic research baseline: [FAO-56 crop evapotranspiration](https://www.fao.org/land-water/land/land-governance-and-planning/land-resources-planning-toolbox/detail/crop-evapotranspiration-%28crop-et0%29/en) gives the Penman–Monteith reference and crop-coefficient methods. For AgroMind, climate station validity, crop stage, soil salinity, irrigation method, efficiency and actual measured state require field review. Validate against published reference cases and qualified agronomists before claiming agronomic accuracy. Present ranges/limitations; avoid authoritative chemical dosage or disease identification from unverified imagery.

Data/response types must distinguish `observation`, `forecast`, `calculation`, `assumption`, `general_guidance` and `unavailable`. Cite the exact scientific reference or timestamped provider output and show relevant units/date/timezone. Advise user to verify consequential farm actions.

## 6. Privacy and security requirements

Threat model: cross-farm IDOR, compromised/revoked sessions, prompt injection from uploaded/remote documents, RAG poisoning, inference endpoint exposure, leaked service role, unrestricted agent tools, hallucinated agronomic hazards, excessive inference cost, tampered model artifacts and private chat becoming training material. Map controls to [Security First](SECURITY_FIRST.md), [Privacy Data Flow](PRIVACY_DATA_FLOW.md), [OWASP LLM Top 10 2026](https://github.com/GenAI-Security-Project/GenAI-LLM-Top10) and [NIST AI RMF Generative AI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence).

**Mandatory before any real tenant-data alpha:**
1. Independently audit authorization on every AI API/tool, RLS and corpus lookup including revoked membership, stale JWT and service-role failure modes. User-controlled metadata is not authorization.
2. Restrict gateway credentials, network/egress, GPU endpoints, model download provenance and dependency versions; never expose raw vLLM or arbitrary tools.
3. Bound context length, costs, request rate, concurrency, context cache, tool output and retries; fail closed on unknown access, gracefully on model outage. Do not store full private prompts in monitoring by default.
4. Define user-facing consent/notice, transcript storage/deletion/export and backup retention; no automatic customer-data fine-tuning; get separate approval for sensitive image/voice/location processing.
5. Strictly separate **advice** from account, payment, schedule mutation and physical actuation; server-side allowlists and future hardware safety rules cannot be overridden by generated text.
6. Test unsafe instructions, doc-embedded exfiltration requests, false citations, XSS/Markdown rendering, accidental secrets, data-export abuse, file uploads and disaster recovery.
7. **PR #52 F01 and F02 remain release blockers.** Research with synthetic/public information can proceed independently; hosted live farm-context integration cannot proceed based on architecture-only documentation or CI green.

## 7. Hosting, GPU sizing and costs

**Topology:** preserve Vercel/Next.js and Supabase; add an independently operated and access-controlled GPU inference service. Candidate runtime: Python + **vLLM** for a compatible pinned model, a separate embeddings/reranker service, and typed communication to the Next.js server. Compare serving alternatives based on exact model architecture and required quantization/image support.

**GPU planning:** a **24 GB VRAM class** GPU can be a reasonable *benchmark starting point* for some compact quantized models; it is **not a certified capacity** for all Qwen3.5-9B/gpt-oss-20b configurations, long contexts or multiple users. Weights, runtime overhead and **KV cache scale with sequence length and concurrency** ([NVIDIA memory explanation](https://developer.nvidia.com/blog/mastering-llm-techniques-inference-optimization)). Larger models may need 48–80+ GB, more GPUs or aggressive quality-reducing quantization; measure instead of promising. No hardware or host selected.

**Cost formula (quotes not yet obtained):**
```
monthly_total_cost =
  GPU hourly rate × billable GPU hours
  + CPU/RAM/storage + data transfer
  + embedding/reranking + database
  + monitoring/backups + operating labor
  + licensing or compliance costs where applicable
```

Record `cost per 1,000 successful answers`, p50/p95 time-to-first-token and total response, tokens/sec, request failure rate, peak concurrency, queue depth, memory margin, idle GPU hours and monthly budget burn. Compare burst rented GPU against always-on GPU and only then consider physical hardware. **No current price or break-even forecast is asserted**. GPU region/privacy and provider access must be verified before choosing.

## 8. Training and evaluation policy

- **Stage A — no training:** run unchanged official open weights on a versioned agronomic benchmark.
- **Stage B — retrieval/tool gains:** add trusted RAG and audited deterministic tools; compare real measured benefit against Stage A. Prefer database/source updates to retraining for factual changes.
- **Stage C — optional LoRA/QLoRA fine-tuning:** only if a reproducible gap persists (Persian terminology, stable tool-calling formats, domain explanation style), with licensed/consented expert-validated instruction examples and separate train/validation/holdout. Keep adapter artifact and base-model hash distinct.
- **Stage D — promotion:** require improvement on domain quality **and** no regression in safety, tenant access, scientific units, citations, refusal and total cost. Snapshot artifacts, approval and rollback plan. Reject live auto-training on unverified user chats.

Successful model fine-tuning is not a substitute for RLS, scientific calculators, tool validation or a correct knowledge base.

## 9. Road to production — phased deliverables

| Milestone | Deliverable | Exit evidence |
| --- | --- | --- |
| **AI-0 Discovery** | Final license review, 250–400 scenario evaluation specification, agronomist reviewer, GPU quotes and explicit spend cap | Model/host shortlist and legal/privacy notes; no private records |
| **AI-1 Offline benchmark** | Pinned candidate checkpoints and identical synthetic/public test harness | Side-by-side FA/EN quality, safety, latency, memory and cost results |
| **AI-2 RAG** | Curated licensed knowledge corpus, bilingual search, embeddings and citations | Retrieval/citation test set, poisoned-source and takedown regression |
| **AI-3 Scientific tools** | Deterministic ET/weather/irrigation APIs on synthetic farms | Golden calculations and units/timezone expert sign-off |
| **AI-4 Secure farm context** | Authenticated read-only actual-data tool gateway | Independent tenant/role/revocation/SQL and safety tests; Phase 0 gate passed |
| **AI-5 Private alpha** | Connect existing Assistant via feature flag, limits, UX and telemetry | Hosted RLS/provider, FA/EN RTL/mobile, incident and privacy acceptance |
| **AI-6 Controlled release** | Opt-in use, cost monitoring, expert review and support runbook | Explicit product/security sign-off, fallback/rollback and alerts |

**Sequence constraint:** AI-0 to AI-3 research can use **public/synthetic** inputs while PR #52 is unresolved; AI-4 onwards touching real private farm data requires closure/accepted disposition of security release gates with actual hosted verification. This plan **does not request merge/deployment** of PR #52 or #53.

## AI-0 benchmark research assets — 2026-10-30

- [300-case bilingual synthetic seed & evaluation protocol](ai/AI0_BENCHMARK_SPEC.md), with [machine-readable JSONL](ai/ai0_benchmark_seed_v0.jsonl): **150 FA / 150 EN**; 10 domains; 50 underlying synthetic settings; 180 development / 60 validation / 60 public audit examples.
- [Dated official GPU list-price and model sizing hypotheses](ai/AI0_GPU_COST_MATRIX.md) with [CSV snapshot](ai/ai0_gpu_prices_2026-10-30.csv). Prices are not a booked quote, runtime measurements or total cost.
- **Limitations:** initial seeds are **not expert-gold**, the publicly committed validation/audit splits are **not blind**, and **no candidate model was downloaded, trained or benchmarked**. A truly private, independent holdout must be created before claiming an unbiased model winner. No GPU rental or budget authorization.

## 10. Open decisions and immediate next task

- [ ] Confirm whether the public product name will be **AgroMind AI**, **AgroAI**, or another; conduct actual brand/trademark clearance before claiming exclusivity.
- [ ] Agree the initial *narrow* use case: text-only read-only agricultural knowledge + weather/irrigation **synthetic** test data is recommended.
- [ ] Choose agronomy reviewers and freeze a representative FA/EN scoring corpus.
- [ ] Set experimental GPU spend maximum and approved hosting/data-residency region before spending.
- [ ] Agree user transcript retention, export/deletion and any future training consent.
- [ ] Conduct a model/retrieval security threat-model review before implementation.
- [ ] Confirm that PR #52 and #53 stay unmerged/unchanged until separately authorized.

**Next authorized task proposal:** prepare the **AI-0 evaluation dataset specification and model/GPU cost matrix**, using public/synthetic scenarios only, without renting GPUs or modifying code.

## Primary external references — checked 2026-10-30

1. [Qwen3.5-9B](https://huggingface.co/Qwen/Qwen3.5-9B), [Qwen3.5-27B](https://huggingface.co/Qwen/Qwen3.5-27B), [Qwen3-8B](https://huggingface.co/Qwen/Qwen3-8B) official model repositories and individual licenses.
2. [OpenAI gpt-oss-20b](https://developers.openai.com/api/docs/models/gpt-oss-20b) and [open-weight FAQ](https://help.openai.com/en/articles/11870455-openai-open-weight-models-gpt-oss).
3. [Google Gemma 3 model card](https://ai.google.dev/gemma/docs/core/model_card_3) and [Gemma terms](https://ai.google.dev/gemma/terms).
4. [Qwen3-Embedding-0.6B](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B), [Supabase hybrid search](https://supabase.com/docs/guides/ai/hybrid-search), [Supabase pgvector](https://supabase.com/docs/guides/ai/vector-columns), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
5. [vLLM OpenAI-compatible server / authentication warning](https://docs.vllm.ai/en/stable/serving/online_serving/openai_compatible_server/).
6. [FAO Crop Evapotranspiration (FAO-56)](https://www.fao.org/land-water/land/land-governance-and-planning/land-resources-planning-toolbox/detail/crop-evapotranspiration-%28crop-et0%29/en).
7. [OWASP LLM Top 10 2026](https://github.com/GenAI-Security-Project/GenAI-LLM-Top10); [NIST AI RMF Generative AI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence).
8. [NVIDIA inference KV-cache/memory](https://developer.nvidia.com/blog/mastering-llm-techniques-inference-optimization).

**Evidence discipline:** external pages document upstream capability and scientific methods, **not AgroMind experiments or deployed services**. All candidate choices, scope, metrics and suggested paths are proposals pending validation and authorization.
