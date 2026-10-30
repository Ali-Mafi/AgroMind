# AgroMind AI-0 Scientific Screen & Local Trial Preparation — 2026-10-30

> **Documentation/research tooling only; no qualified agronomist validation, GPU benchmark, AI service activation or production deployment.**

## GitHub starting state

- `main`: `42a8eb2b54fd5852f11a2cc31e09dd7b598e4dc0` at inspection.
- [PR #52](https://github.com/Ali-Mafi/AgroMind/pull/52): open Draft/unmerged, F01/F02 remain production NO-GO. [PR #53](https://github.com/Ali-Mafi/AgroMind/pull/53), [PR #54](https://github.com/Ali-Mafi/AgroMind/pull/54), [PR #55](https://github.com/Ali-Mafi/AgroMind/pull/55): open/unmerged.
- Current task branches from **PR #55 HEAD `4d0a1d1c1f74ce14f4ffa40fdd91c25bef56c367`**; did not update, merge or rebase any existing PR.

## Completed work and evidence

1. Read the **actual** public seed `docs/ai/ai0_benchmark_seed_v0.jsonl` in GitHub, checked all 300 JSON objects, 150 language pairs, 50 six-row setting groups, 10 domains × 30, 180/60/60 splits, no pair/group split leak, and all five arithmetic example references.
2. Reviewed public FAO-56 irrigation guidance and FAO Water Quality for Agriculture documents; produced [preliminary scientific desk screen](../ai/AI0_SCIENTIFIC_SCREEN.md) with ten domain notes, five checked unit conversions and seven significant validation limitations (not an expert review).
3. Added [Python standard-library local-only runner](../ai/tools/ai0_eval.py), [test suite](../ai/tools/test_ai0_eval.py) and [pilot runbook](../ai/AI0_LOCAL_PILOT_RUNBOOK.md). Tool allows **synthetic only**, explicitly opted-in loopback chat inference **base mode only**, no redirects, remote HTTP, hidden model downloads or production connections. RAG/tools are blocked until implemented.
4. Ran **8 isolated Python 3.13 unit tests successfully** and byte-compiled the runner/tests locally. The files committed to Git have identical Git blob SHA-1 values to the tested local Python files. Test cases use constructed synthetic records; **the actual published 300-row seed was independently checked in the GitHub connector**.
5. Added [owned-versus-rented GPU planning](../ai/AI0_GPU_OWN_VS_RENT.md), source-backed A5000 and 3090 max board power, electricity formulas and full-cost break-even considerations. **No procurement or live prices confirmed**.
6. Linked new assets into [AI-0 benchmark spec](../ai/AI0_BENCHMARK_SPEC.md), [GPU matrix](../ai/AI0_GPU_COST_MATRIX.md), [Master Progress](../05_MASTER_PROGRESS.md) and [progress index](README.md).

## Files changed

- `docs/ai/AI0_SCIENTIFIC_SCREEN.md` (new)
- `docs/ai/AI0_LOCAL_PILOT_RUNBOOK.md` (new)
- `docs/ai/AI0_GPU_OWN_VS_RENT.md` (new)
- `docs/ai/tools/ai0_eval.py` (new research-only script)
- `docs/ai/tools/test_ai0_eval.py` (new script tests)
- `docs/ai/AI0_BENCHMARK_SPEC.md` (links and limitations)
- `docs/ai/AI0_GPU_COST_MATRIX.md` (owned GPU link)
- `docs/05_MASTER_PROGRESS.md` (evidence)
- `docs/progress/README.md` (session index)
- `docs/progress/2026-10-30-ai0-validation.md` (this record)

## Not tested / blocked / next

- **No actual LLM evaluation**, fine-tuning, vLLM setup, GPU provisioning, internet-connected benchmark, power measurement, farm-context integration or application/DB tests.
- Professional agronomist gold, licensed RAG source corpus, RAG/tool adapter and separately held blind evaluation set **still pending**.
- Real customer/farm inference remains gated by Phase 0 security posture (including PR #52 findings F01/F02); no production changes, Supabase credentials or migration touched.
- Next task after review: qualified expert review plus separate non-public holdout, then explicit owner approval for a capped local/self-hosted synthetic inference pilot, with an independently checked model license and GPU capacity.
