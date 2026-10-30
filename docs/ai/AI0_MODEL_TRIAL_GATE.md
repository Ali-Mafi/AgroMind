# AgroMind AI — Model Trial Readiness / No-Spend Decision Gate

**Status:** research-stage preflight specification, NOT a GPU experiment. **Reviewed:** 2026-10-31. See [AI model strategy](../AGROMIND_AI_ARCHITECTURE_MODEL_STRATEGY.md), [existing local pilot](AI0_LOCAL_PILOT_RUNBOOK.md), [pricing snapshot](AI0_GPU_COST_MATRIX.md), and [owned-vs-rented TCO](AI0_GPU_OWN_VS_RENT.md).

## Candidate comparison scope (no winner yet)

| Candidate | First check | Potential blocker |
| --- | --- | --- |
| Qwen3.5-9B | Exact model card, revision, Apache license conditions, 24/48GB quantized local serving | Runtime/vision/KV cache/FA quality not measured |
| Qwen3-8B | Smaller baseline with pinned revision | Persian agronomy quality unknown |
| gpt-oss-20b | Approved official weight revision, inference backend, tokenization/chat template | Supported quantization and context capacity unknown |
| Gemma 3 12B | Official Gemma Terms/license review | Different terms from Apache, runtime/vision overhead |
| Qwen3.5-27B | 48/80GB only if quality lifts justify cost | No quality evidence or GPU spend approved |

**No predicted ranking:** evaluation requires same authorized public/synthetic cases, prompt format, source coverage and paired FA/EN rating. 24GB capacity is an experiment hypothesis—not a production availability promise.

## Preflight checklist / gate outcomes

| Gate | Today | Proof to collect |
| --- | --- | --- |
| Public 300-case seed, bilingual pair mapping | **READY FOR RESEARCH** | JSONL/150 review cards and immutable version |
| Five arithmetic reference fixtures | **VERIFIED AS MATH** | Exact conversion equations with units |
| Qualified expert case-by-case scientific gold | **BLOCKED** | Signed agronomic and security review cards |
| Licensed, citable RAG source corpus | **BLOCKED** | Permission/license/provenance and test passage IDs |
| New *sealed* blind holdout | **BLOCKED** | Custodian, independent scenarios, hash and leakage checks |
| Pinned model revision/serving compatibility | **PENDING** | Exact card+hash+terms, local dry-run |
| Approved max spend and hosting region | **NOT AUTHORIZED** | Explicit owner dollar cap, GPU hours and provider terms |
| Actual trial baseline | **NOT STARTED** | Measured tokens, TTFT, total latency, VRAM/OOM/energy and errors |
| Tenant security, farm RLS, account sessions | **PR #52 RELEASE NO-GO** | Independent F01/F02 disposition and hosted negative tests |

## Practical constraints

1. Public/synthetic offline work is allowed while F01/F02 remain unresolved. No real farm/customer data, production API, device actuation or payment mutations in a model experiment.
2. No model or GPU may be selected only by parameter count or advertised performance. Pin license, tokenizer, quantization and serving version before comparing.
3. The current research runner supports **base mode only** and sequential loopback calls. It **does not** benchmark RAG, inference quality, TTFT, concurrent throughput, GPU memory or cost; do not claim those metrics.
4. Trial request must specify: **operator, approved USD cap, hours cap, GPU SKU, provider/region, model revision/hash, no-secret rules, shutdown mechanism, data handling, expected outputs**. Defer if a required property is missing.
5. Always evaluate ownership TCO separately from GPU hourly rent, including uptime/ISP, power, cooling, backup, support, model throughput and security.

## Stop conditions for any eventual experiment

Stop on unexpected external network request, appearance of real client content or secrets, budget/timeout exceedance, unapproved data-region transfer, inference server public exposure, unbounded generation, dangerous tool invocation, or material license discrepancy. Record and escalate; don't silently continue on a different GPU/provider.

## Next implementation authorization boundary

Prepare expert review, then a restricted holdout and license/cost confirmations. Only with **explicit owner approval** may a limited synthetic-only local/paid GPU benchmark be run. PR #52 F01/F02 remain a separate live-data/production blocker. This document makes no security or release certification.
