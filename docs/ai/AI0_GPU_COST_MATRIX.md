# AgroMind AI — AI-0 Model/GPU Feasibility & Public Price Snapshot

**As of 2026-10-30.** Dated online **list prices only**, not a vendor offer, reservation, total bill or availability guarantee. No GPU has been rented. See [CSV price snapshot](ai0_gpu_prices_2026-10-30.csv), [benchmark protocol](AI0_BENCHMARK_SPEC.md) and [model strategy](../AGROMIND_AI_ARCHITECTURE_MODEL_STRATEGY.md).

## Candidate fit hypotheses — NOT measurements
| Candidate | Initial benchmark hardware | Important caveats |
| --- | --- | --- |
| [Qwen3.5-9B](https://huggingface.co/Qwen/Qwen3.5-9B) | 24 GB quantized trial → 48 GB fallback | Dense BF16 weights ~18 GB before runtime/KV; vision and concurrent context may exceed 24 GB |
| [Qwen3-8B](https://huggingface.co/Qwen/Qwen3-8B) | 24 GB quantized baseline | Confirm FA quality/tool schema and actual quantization serving |
| [gpt-oss-20b](https://developers.openai.com/api/docs/models/gpt-oss-20b) | 24 GB MXFP4 trial → 48 GB fallback | Nominal edge-model memory is not production concurrency capacity |
| [Gemma 3 12B](https://ai.google.dev/gemma/docs/core/model_card_3) | 24 GB quantized trial → 48 GB | [Gemma terms](https://ai.google.dev/gemma/terms) must be reviewed; image mode changes memory |
| [Qwen3.5-27B](https://huggingface.co/Qwen/Qwen3.5-27B) | 48/80 GB exploration | Exact weights/quantization/engine support may change real requirement |

Weights alone do not include KV cache, context length, runtimes, batch concurrency or supporting embedding services. **No model-to-GPU fit is certified.** See [NVIDIA inference memory discussion](https://developer.nvidia.com/blog/mastering-llm-techniques-inference-optimization).

## Official provider price references — USD
Rates below were observed from [Runpod pricing](https://www.runpod.io/pricing) (page says last updated **Oct 8, 2026**) and [Lambda instances](https://lambda.ai/instances), checked **Oct 30, 2026**. Runpod's price view includes different Community/Secure Cloud selections; its displayed rate here is NOT the lowest possible marketplace rate, and the [GPU Models page](https://www.runpod.io/gpu-models) shows different figures under other selections. Verify exact tier/region and price on the actual account *before* spending. Lambda sample rates refer to the public single-GPU on-demand list and may have VAT/tax or region restrictions.

| Provider | GPU | VRAM GB | $/h | 20h | 80h | 160h | 730h |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Runpod | RTX A5000 | 24 | $0.27 | $5.40 | $21.60 | $43.20 | $197.10 |
| Runpod | RTX 4090 | 24 | $0.89 | $17.80 | $71.20 | $142.40 | $649.70 |
| Runpod | L4 | 24 | $0.59 | $11.80 | $47.20 | $94.40 | $430.70 |
| Runpod | L40S | 48 | $1.09 | $21.80 | $87.20 | $174.40 | $795.70 |
| Runpod | RTX 6000 Ada | 48 | $0.99 | $19.80 | $79.20 | $158.40 | $722.70 |
| Runpod | A100 PCIe | 80 | $1.79 | $35.80 | $143.20 | $286.40 | $1306.70 |
| Runpod | H100 PCIe | 80 | $2.89 | $57.80 | $231.20 | $462.40 | $2109.70 |
| Lambda | A6000 | 48 | $1.09 | $21.80 | $87.20 | $174.40 | $795.70 |
| Lambda | H100 PCIe | 80 | $3.29 | $65.80 | $263.20 | $526.40 | $2401.70 |

**Simple multiplication only:** 20/80/160/730 billed GPU-hour scenarios (730h roughly always-on month), **not forecasts of utilization**. Storage, start/stop costs, standby, tax, egress, database, embedding/rerank, operator labor, unavailable regions, retry costs and model training are excluded. True `cost/1000 successful answers = 1000 * total actual cost / counted successful answers` cannot be calculated without serving benchmark data. Do not compare model value purely from GPU hourly price.

[Vast.ai](https://vast.ai/pricing) uses dynamic marketplace offers; no fixed market-wide rate is invented here. Compare actual dated region/tier offers instead, with interruption and privacy implications documented.

## Owned-hardware comparison

See [Owned GPU vs rented GPU TCO and energy assumptions](AI0_GPU_OWN_VS_RENT.md). RTX A5000/3090 24 GB VRAM does **not** guarantee a specific model capacity or safe production availability; comparison includes full server costs and observed workload, not just rented hours.

## Decision and safety gate
1. Confirm the exact model revision, license/usage policy, quantization and runtime compatibility.
2. Confirm GPU provider access, acceptable region, data residency, disk/egress billing, security and exact rate *at time of rental*.
3. Obtain explicit **owner-approved USD cap and maximum billable hours** before provisioning even a trial; use only public/synthetic prompts, no production JWT/farm data.
4. Automate idle timeout, spending stop, single-GPU quota, checkpoint/cleanup and measured cost logging. Avoid physical hardware purchase before live evidence.
5. Benchmark candidate models with fixed 2k/8k context, 1/4/8 concurrent synthetic requests and comparable output lengths. Track measured quality, time-to-first-token, p95 full latency, VRAM peak, OOM and $/1000 successful answers.
6. Treat private farm-context or autonomous controls as separate security-gated phases: F01/F02 unresolved, **NO-GO for production**.

**No final hardware winner, runtime availability, live pricing contract, trained model or tested latency is claimed.**
