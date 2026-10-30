# AgroMind AI — AI-0 Local-Only Pilot Runbook

**Status:** execution preparation, **not an inference trial already run**. Companion: [scientific desk screen](AI0_SCIENTIFIC_SCREEN.md), [benchmark seed](AI0_BENCHMARK_SPEC.md), [model strategy](../AGROMIND_AI_ARCHITECTURE_MODEL_STRATEGY.md) and [own vs rent decision](AI0_GPU_OWN_VS_RENT.md).

## What exists

A dependency-free Python script [tools/ai0_eval.py](tools/ai0_eval.py), with [isolated unit tests](tools/test_ai0_eval.py), validates the **300 public/synthetic-only seed questions** and optionally runs a small **BASE-MODE ONLY** chat-completion experiment on a **locally accessible** loopback endpoint.

**No** model weights, inference server, GPU, RAG retriever, farmer data pipeline, scoring model, prompt safety evaluator, agricultural expert panel or blind holdout is included. Research script is not an AgroMind production API.

## Offline-first steps

1. Run unit tests (no network, no model):
   - `python3 -m unittest discover -s docs/ai/tools -p "test_ai0_eval.py" -v`
2. Validate the actual public seed (no network, no model):
   - `python3 docs/ai/tools/ai0_eval.py validate --dataset docs/ai/ai0_benchmark_seed_v0.jsonl`
   - It checks 300 parsable records, unique IDs/prompts, 150 FA+150 EN pairs, 50 group-isolated settings, 180/60/60 public splits, and all five numeric reference groups.
   - Output explicitly retains `expert_validated: false`, `blind_holdout: false`, `model_tested: false`.
3. **Optional, only after explicit spend/host/model authorization:** install and start a compatible **approved** model server independently, bound to the local machine, using an audited configuration and a pinned model revision. Test using synthetic data only; do not supply production credentials, secrets, private user prompts or real farm locations.

## Manual opt-in local inference (NO automatic execution)

Example for an existing locally-running server compatible with `/v1/chat/completions`:

```bash
python3 docs/ai/tools/ai0_eval.py run \
  --dataset docs/ai/ai0_benchmark_seed_v0.jsonl \
  --endpoint http://127.0.0.1:8000/v1/chat/completions \
  --model REPLACE_WITH_PINNED_LOCAL_MODEL_ID \
  --mode base --split development --limit 10 \
  --timeout 60 --max-output-tokens 256 \
  --synthetic-only --out /tmp/agromind-ai0-base-run.jsonl

python3 docs/ai/tools/ai0_eval.py report \
  --responses /tmp/agromind-ai0-base-run.jsonl
```

- The script **rejects remote hosts, HTTPS URLs, query strings, redirects, non-chat endpoints, modes other than `base`, existing output files, missing `--synthetic-only`, oversized trial arguments and malformed datasets**.
- It disables HTTP proxy inheritance. Only an explicit POST to `localhost/127.0.0.1/::1` is accepted; the container/server environment must still be protected (public vLLM endpoints remain prohibited).
- HTTP usage is one synchronous request at a time; it records return/error counts and total request latency. It does **not** record time-to-first-token, concurrent throughput, GPU VRAM, model recall or scientific accuracy. Output fields for those capabilities remain **unreviewed / not measured**.
- The output file stores synthetic prompts' model answers; keep it outside the Git repository and do not commit raw outputs without review. Full request prompts are synthetic, but model answers should still be inspected for unsafe generated content.
- If the endpoint is absent or incompatible, errors are recorded; do **not** report a passing real model comparison.
- Limit default is 10, output token cap default 256 and timeout default 60 seconds; experiments are **not scheduled or automatically started**.
- Optional auth token can be supplied to the *local process* via `AGROMIND_AI0_LOCAL_TOKEN`; never put credential values in CLI history or a PR.

## What a real comparative benchmark still needs

- Pin candidates and actual licenses, revision hashes, tokenizer/chat-template compatibility, quantization and engine version.
- Add reviewed FA/EN gold/rater notes and a **separate confidential, truly unseen** holdout.
- Create dedicated RAG and deterministic tools after reviewing dataset licensing; current `--mode rag` and `rag_tools` explicitly fail, rather than pretending to call them.
- Add actual streaming TTFT and multi-user test tooling only when needed; run 1/4/8 concurrency under finite quotas with exact context/output limits and controlled repetitions.
- Compare latency and cost **with quality**; record cold starts, warmups, OOM, memory headroom, actual billed hours, interruptions and GPU electricity/TCO.
- For privacy/security, cross-farm and stale-session outcomes must be proved at app/tool/RLS level, **not** from textual refusals. Security PR #52 stays separate **NO-GO**.

## Infra and approvals

- Initial research is local/offline with no cloud; do not turn on live inference, download large model weights or rent GPUs without selected license, region, spending cap and operator approval.
- If a GPU server is approved, restrict raw vLLM behind an allowlisted firewall/reverse proxy; its `--api-key` alone does not protect all endpoints. [Official vLLM warning](https://docs.vllm.ai/en/latest/usage/security/).
- Real user farm context, image uploads, autonomous irrigation, billing or any production integration are **out of scope** and require independent security and privacy acceptance.
