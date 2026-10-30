# AgroMind AI-0 — Local-only Evaluation Runner

**Experimental tooling:** `ai0_eval.py` uses **Python standard library only**. It does **not** run in production, deploy a model, connect to Supabase, use Vercel, rent GPU resources, implement RAG/tools or validate scientific answer correctness. The benchmark corpus is synthetic/public; keep private customer data out of it.

## Validating the JSONL seed (no network)

From the repository root:

```bash
python3 docs/ai/tools/ai0_eval.py validate --dataset docs/ai/ai0_benchmark_seed_v0.jsonl
python3 -m unittest discover -s docs/ai/tools -p 'test_ai0_eval.py' -v
```

The `validate` command enforces 300 JSON lines, unique IDs/prompts, domain/language/split counts, 150 translation pairs in 50 whole-context groups, no split leakage, expected behavior fields and the five fixed mathematical reference values. Output includes the seed SHA256 and explicitly marks `expert_validated=false`, `blind_holdout=false` and `model_tested=false`.

## Optional private local inference — requires deliberate opt-in

Start an independently selected/authorized **loopback-bound** self-hosted OpenAI-compatible model server *yourself*. **This tool does not start/download/host a model** and does not install dependencies or purchase compute. It connects only to `http://127.0.0.1:PORT/v1/chat/completions` (also localhost or `::1`), with redirects and proxy use disabled. A local HTTP endpoint still requires operator control over what service listens there; never send real secrets. No remote URLs or hosted inference APIs are allowed.

```bash
python3 docs/ai/tools/ai0_eval.py run \
  --dataset docs/ai/ai0_benchmark_seed_v0.jsonl \
  --synthetic-only \
  --endpoint http://127.0.0.1:8000/v1/chat/completions \
  --model YOUR_LOCAL_MODEL_ID \
  --mode base --split development --limit 10 \
  --timeout 60 --max-output-tokens 256 \
  --out /tmp/agromind-ai0-responses-001.jsonl

python3 docs/ai/tools/ai0_eval.py report --responses /tmp/agromind-ai0-responses-001.jsonl
```

Do not put real farm/user records in the dataset, prompts or output files. Use only `development` for tuning. Choose a new output path each run; existing files will not be overwritten. Raw outputs contain model-generated text, so handle as potentially unsafe text and do not execute it.

### Limits and honest reporting

- **Only `base` inference is implemented**. RAG and deterministic tools must be implemented and verified in a *future* separate test harness; `--mode rag` or `rag_tools` is actively rejected.
- Strictly sequential bounded local requests; no concurrency throughput or multi-GPU benchmarking is claimed.
- Latency is **end-to-end non-streaming** request time, *not* time-to-first-token. VRAM/GPU-hours/energy/cost/quality are **not measured** here.
- `scientific_score=null`, `security_verified=false`; a returned answer is `returned_unreviewed`, not a pass.
- Per-case failures are recorded as `error`; report counts and investigate them. A completed run may include failures and must not be represented as CI/evaluation success.
- A locally reachable inference service could log synthetic prompts; inspect its privacy/security settings and keep the port on loopback only.
- **No GPU rental, deployment or customer data use is authorized by this tooling.**

Review [source-backed screening and blockers](../AI0_SCIENCE_SCREENING.md) before using results to guide model choice.
