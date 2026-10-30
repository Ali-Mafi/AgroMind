# AgroMind AI-0 — Expert Review Prep & No-Spend Trial Gate — 2026-10-31

**Starting state:** GitHub `main` at `42a8eb2b54fd5852f11a2cc31e09dd7b598e4dc0`, still Public; Draft [PR #52](https://github.com/Ali-Mafi/AgroMind/pull/52) open at `565db25a72df30ba70dd54cfd1aa3bfa65ec8689` with F01/F02 release NO-GO. Separate roadmap/research PR #53/#54/#55/#56 remain unmerged. No visibility, merge, hosting, database or security changes authorized.

## Changes made
1. From existing [public 300-case AI-0 seed](../ai/ai0_benchmark_seed_v0.jsonl), generated [150 paired reviewer cards](../ai/ai0_reviewer_cards_v1.jsonl) matching original FA/EN question IDs, domain, context setting and split. Wrote **30 question-variant-specific engineering anchor sets** (10 domains × 3 question variants), separate from unreviewed final gold.
2. Added [specialist review guide](../ai/AI0_REVIEWER_GUIDE.md) clarifying where agronomist/plant pathologist/security expert judgment is essential and how to cite source evidence.
3. Added [holdout governance protocol](../ai/AI0_PRIVATE_HOLDOUT_PROTOCOL.md), explicitly **without** publishing or inventing private unseen test inputs.
4. Added [model/GPU no-spend decision gate](../ai/AI0_MODEL_TRIAL_GATE.md); no commercial model inference, GPU rental or private farm data permitted without separate review/approval.
5. Linked artifacts in benchmark protocol, Master Progress and progress index.

## Research structure checked
- 300 input rows map to 150 distinct bilingual pairs and 50 groups; 90 paired development, 30 validation, 30 public-audit cards; 15 paired cards per domain, exactly three variants per group.
- Every expert approval field remains null/`PENDING_INDEPENDENT_REVIEW`; every model outcome remains `NOT_RUN`. Public fixtures are not a blind holdout or certified training/evaluation gold.
- Relative links and Git diff should be verified against final branch/commit after publication.

## No changes / limitations
- No model downloaded, trained, benchmarked or served; no actual agronomy expert contracted or falsely credited; no independent scientific truth dataset or locked blind holdout; no GPUs purchased/rented; no code, RLS, provider, PR #52 release action, `main` merge, repo visibility or production deployment modified.
- Next **gated** action: source-qualified review and new independent holdout; only then propose a bounded, owner-approved synthetic-only real GPU trial.
