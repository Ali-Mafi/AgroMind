# AgroMind AI-0 — Encrypted Provisional Holdout Handoff

**Recorded:** 2026-10-31. **Status: NEW PROVISIONAL RESEARCH CANDIDATE, NOT A FORMALLY BLIND, EXPERT-VALIDATED TEST.** Companion: [independent holdout governance](AI0_PRIVATE_HOLDOUT_PROTOCOL.md), [reviewer guide](AI0_REVIEWER_GUIDE.md), [no-spend model gates](AI0_MODEL_TRIAL_GATE.md).

## What was actually prepared

- **40 manually constructed, synthetic, newly authored situation groups** (four per each of the 10 AI-0 domains), each written as FA and EN questions; **80 private question records** total.
- Synthetic situations cover field-water scheduling, greenhouse conditions, meteorological forecast confidence, soil and irrigation EC measurement differences, crop symptom uncertainty, orchard diagnosis, unit calculations, source provenance, inconsistent telemetry, tenant access and unsafe commands.
- Each record has explicit **provisional engineering behavior expectations**, disallowed unsupported claims, a blank `expert_review.status=PENDING` field and `model_test_status=NOT_RUN`.
- Five mathematical-only patterns include deterministic water-volume, unit-conversion or hypothetical ETc calculations; no crop-specific expert advice, diagnosed pest or treatment dose is claimed verified. FAO-56 supports ETc and root-zone methods in principle; precise local irrigation is **not** derived from a simple geometric or ETc formula. [FAO-56 irrigation balance](https://www.fao.org/4/x0490e/x0490e0e.htm).
- **Separate encrypted artifact** was created in a user-specific conversation delivery environment and is **not checked into the public GitHub repository**. AES-256-GCM ciphertext was decrypted and structure-tested locally, without publishing the plaintext or key. This document references **only non-sensitive aggregate metadata and encrypted-file hash**.

## Public integrity manifest

See [public non-content manifest](AI0_PROVISIONAL_HOLDOUT_PUBLIC_MANIFEST.json) for SHA-256 of **ciphertext only** and count/approval flags. It is safe to include in Git, because no case text, test answers or key are present. The private handoff contains its own complete manifest, AES-GCM encrypted bundle, a separately delivered 32-byte key file and a local-only inspection/decryption script. They are **not GitHub assets**; ephemeral conversation files are not a durable vault and must be transferred to approved restricted storage.

## Independent blind-test and custody limitations

The assistant authored these cases and the user can access the research handoff and key. This does **not meet the strongest standard** of an independent blind benchmark whose custodian is separate from model development. Generated cases might share broad problem concepts with public seed examples; no claim of statistically or semantically independent distribution is made without a documented similarity/translation-contamination audit.

Before describing any future test as **blind**:
1. Appoint an independent qualified agronomy/security **test author/reviewer** and custodian separate from prompt/model tuning.
2. Review/refine every new case, verify scientific claims and practical/region-specific constraints; never automatically promote `draft_expected` to expert-gold.
3. Perform **semantic and bilingual contamination checks** against all existing 300 public seed questions and any proposed training corpus, not merely string dedup.
4. Retain the validated encrypted corpus under **separately controlled encrypted storage** and a different key custodian. Rotate keys if anyone involved in model tuning may have obtained them.
5. Use an evaluator who reports **aggregated** domain/FA/EN scores only, keeps exact prompts/gold private and provides traceable signed approval decisions. Treat model-readable outputs, logs and screenshots as potential leakage.
6. Publish model performance only after model version/prompt/retrieval configuration and scoring rubric are frozen **before** the independent held-out run. Reference [NIST AITE sequestered evaluations](https://pages.nist.gov/ai-technology-evaluation/) for the motivation for independent sealed assessment.

## Security and release gate

- Source/private data in PR: **ZERO**; no key in GitHub, no password, model or real farm records.
- No paid GPU, serving infrastructure, network model calls, Vercel change, production migration, or Merge was authorized.
- Security [PR #52](https://github.com/Ali-Mafi/AgroMind/pull/52) F01/F02 remains separately unresolved and **NO-GO** for private farm-context deployment.
- This work is **research only**, not proof of agronomic accuracy or tenant authorization.

**Next human requirement:** appoint qualified reviewers and independent custodian; verify actual custody, scientific gold and overlap before any model performance claims. Authorizing cloud GPU spend is a later separate decision.
