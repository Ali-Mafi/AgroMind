# AgroMind AI-0 — Source-backed Preliminary Agronomy Review & Offline Trial Readiness

**Date:** 2026-10-30. **Review class:** engineering and literature-informed **screening**, **NOT** an independent qualified agronomist sign-off. **Status:** 300 synthetic prompts remain *unreviewed gold*, no model executed, no actual farm/user records. See [seed specification](AI0_BENCHMARK_SPEC.md), [strategy](../AGROMIND_AI_ARCHITECTURE_MODEL_STRATEGY.md) and [local runner](tools/README.md).

## 1. Exact source and review scope

Corpus: [`ai0_benchmark_seed_v0.jsonl`](ai0_benchmark_seed_v0.jsonl) as authored on [PR #55](https://github.com/Ali-Mafi/AgroMind/pull/55), 300 synthetic FA/EN prompts, 150 bilingual pairs, 50 underlying settings, 10 domains, 180/60/60 public development/validation/public-audit. The evaluation includes a check of domain **behavioral expectations** and known mathematical reference fixtures, **not** field-realistic ground truth for crop- or site-specific irrigation. These prompts are intentionally underspecified and generally should elicit clarification, caveats, explanation or refusal. An attractive/convincing answer does not constitute agronomic correctness.

Primary background sources:

- [FAO-56, Chapter 5](https://www.fao.org/4/x0490e/x0490e0a.htm): under standard conditions, crop evapotranspiration **ETc = Kc × ETo**. Kc and conditions, crop stage and climatic data matter; *ETc is not a ready-made irrigation date*.
- [FAO-56, Chapter 8](https://www.fao.org/4/x0490e/x0490e0e.htm): root-zone **soil-water balance** and readily available water inform irrigation timing; this requires inputs beyond a calendar record or rain probability. Field observations and recorded irrigation differ from a planned event.
- [FAO soil salinity/EC explanation](https://www.fao.org/4/t0667e/t0667e05.htm): soil salinity normally uses saturated-paste extract electrical conductivity (**ECe**), which must not be confused with EC of irrigation water (**ECw**), different extraction methods, or pH.
- [FAO effective-rainfall scheduling](https://www.fao.org/4/x5560e/x5560e04.htm): rainfall **amount** and effective contribution, root-zone water storage and the actual crop/water state are needed for scheduling. A rainfall probability is not 12 mm of usable water.

These are **interpretive references**, not quotations copied as dataset gold answers or licenses to ingest full protected publications into RAG/training.

## 2. Checked numerical fixtures — arithmetic-only

| Group | Declared assumptions | Normalized calculation | Expected value | Screening |
| --- | --- | --- | --- | --- |
| `math_units-0` | 50 L/s constant for 8 h | 50 × 8 × 3600 / 1000 | **1,440 m³** | dimensionally correct |
| `math_units-1` | 12 mm *effective* water uniformly across 2 ha | 0.012 m × 20,000 m² | **240 m³** | dimensionally correct |
| `math_units-2` | 1.5 ha | 1.5 × 10,000 | **15,000 m²** | correct |
| `math_units-3` | 68 °F | (68 − 32) × 5/9 | **20 °C** | correct |
| `math_units-4` | 5 mm uniformly across 4,000 m² | 0.005 m × 4,000 m² | **20 m³** | dimensionally correct |

**Important limitations:** volumes are *gross geometric or assumed effective quantities* and do not establish field application efficiency, infiltration, runoff, soil-water availability, root depth, irrigation timing or agronomic demand. In particular, a **12 mm *effective*** rainfall example is a mathematical assumption, not a prediction that 12 mm forecast rainfall becomes available to roots.

## 3. Review findings by domain — action required before scoring models

| Domain (30 prompts each) | Preliminary defensible expectation | Gap / risk | Action |
| --- | --- | --- | --- |
| Irrigation | Request last **confirmed** watering, root-zone water, crop growth stage and current/forecast ET/rain, not an exact invented date | Schedule is not proof of application; insufficient field conditions | Agronomist to approve location/crop-specific rubric and realistic calculator fixtures |
| Weather | Separate timestamped **forecast** vs observation, chance vs amount, stale/conflicting sources | Frost timing and mitigation depend on orchard stage, geography and actual conditions | Add dated test payloads and local threshold/alert policy before evaluating a forecast tool |
| Salinity | Distinguish **soil ECe**, **water ECw**, lab method, sampling depth, crop and water quality | Original synthetic prompts say simply “EC” without measurement method; **cannot classify salinity stress/yield from EC alone** | Add method/units to future gold or require follow-up; expert check threshold sources |
| Crop health | Differential possibilities, evidence requests, inspect distribution/photos/lab | Single symptom does not diagnose pest/disease; label use is jurisdictional | Obtain plant pathologist/agronomist review; avoid dose/chemical recipe |
| Orchard | Ask age, cultivar, stage, local climate, soil and previous management | Fixed dates and interventions could be harmful | Local agronomy reviewer to write acceptable/nonacceptable actions |
| Math/units | Exact, deterministic unit conversion without pretending crop need | Fixed arithmetic alone cannot assess agronomic quality | Five fixtures passed dimensional arithmetic screening; later implement *independently tested* calculator |
| RAG evidence | Only cite actual retrieved/source-approved passages, not synthetic `REF-*` labels | **No retrieval corpus, passages or citation truth set exists in this seed**, so true RAG attribution cannot be scored | Create authorized and licensed RAG fixtures plus passage IDs; mark RAG accuracy NOT TESTED |
| Data quality | Call out contradictory moisture values, stale weather, crop mismatch | Moisture percentages may require sensor type/calibration; dates and units missing | Build typed timestamped conflicting-value fixtures |
| Tenant security | Deny unapproved farm access in **server/RLS**, independently of chat model words | Synthetic FARM-A/B text has **no live authorization boundary** | Later test actual auth, RLS, revoked-team membership; mark security integration NOT TESTED |
| Unsafe action | No actuator, financial, account or chemical mutation from LLM | Not connected to action endpoints: refusal cannot prove application safety | Test real allowlisted tool executor separately; production actions remain prohibited |

### Methodological blocking issues

1. The *public_audit* split is **public**, not an unseen blind holdout; writing it into a report as blind accuracy is invalid.
2. 300 rows stem from only **50 settings**, three question variants and translated duplicates. This limits independence and makes standard per-row confidence claims misleading; analyze correlated settings as clusters.
3. The dataset does **not** contain independently vetted, source-traceable complete reference answers for crop health, salinity treatment, weather alarms or agricultural calculations. A 0–4 agronomy score from a model evaluator alone would be ungrounded.
4. Exact-source RAG and server-isolation tests are **not yet technically possible** on the present seed. Passing a prompt refusal is **not** evidence for Supabase RLS.
5. Case-specific weather/irrigation fields lack provider timestamp, quantity/units, stage and soil water; explicit `unknown` is often the required safe output.
6. Benchmarking must not auto-label a response correct just because it contains keywords from the `expected.must` phrases. Human/expert review and evidence are needed.

## 4. Reviewer workflow and reproducibility

- **Gate R0 (this pass):** arithmetic references verified; dataset shape/splits inspected; risk and evidence gaps recorded. **Not expert approved.**
- **Gate R1:** qualified agronomist reviews *all 50 setting groups* and a representative bilingual sample in each domain; specialist security reviewer reviews tenant/action cases. Document reviewer identity/qualification, date, cited allowed sources, severity and corrected gold text. For sampling/scoring, validate each question variant, not only the base setting.
- **Gate R2:** add **licensed, versioned source snippets** and actual tool/RAG test fixtures with provenance and permitted use. No real users or production private records.
- **Gate R3:** independently write a **non-public blind holdout** with completely novel settings, check similarity/translation leakage and keep its contents out of PRs/logs and training.
- **Gate R4:** run the [local-only runner](tools/README.md) using a separately approved *self-hosted* model on available local resources. Its output is **unreviewed response evidence** only, not a quality grade. Capture model weights/hash, engine/quantization, prompt/retrieval revision, context and hardware/VRAM settings, latency and explicit failures.
- **Gate R5:** only after review and security isolation proof, execute full retrieval/tool evaluation and expert scoring. A budgeted rented GPU or production farm integration requires separate authorization.

## 5. Checked/not-checked status

| Check | Status |
| --- | --- |
| Five numeric conversion/volume gold fixtures | **PASS, mathematical screening** |
| Structure/count/split checks | **Implemented in runner**, execute locally and report separately |
| Literature-level correctness of ETo/Kc/soil-balance distinction | **Supported by FAO references** |
| Agronomist-certified dataset answers | **NOT VERIFIED** |
| Real RAG citation truth / retrieval ranking | **NOT TESTED** |
| Live Supabase authorization / farm isolation | **NOT TESTED** |
| Local GPU model inference / fine-tuning | **NOT RUN** |
| Production deployment, purchases, external accounts | **NOT TOUCHED** |

**Security release boundary:** [PR #52](https://github.com/Ali-Mafi/AgroMind/pull/52) retains separate F01/F02 release blockers. No model, trial tool or research result in this document overrides that decision.
