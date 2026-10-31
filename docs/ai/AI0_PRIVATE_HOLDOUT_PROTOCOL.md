# AgroMind AI-0 — Sealed Holdout Governance (Design Only)

**Status: NO independently blinded, expert-approved final holdout exists.** 2026-10-31. A **provisional 40-scenario bilingual candidate** has been encrypted **outside the public GitHub repo**; it has not been approved by an independent reviewer, custodian or contamination audit. See [safe handoff](AI0_ENCRYPTED_HOLDOUT_HANDOFF.md). The public starter seed and [review cards](AI0_REVIEWER_GUIDE.md) are *not* a blind holdout.

## Purpose
Measure model generalization to genuinely **unseen** agricultural situations after the scoring rubric, prompts and model shortlist are frozen; avoid training/evaluation leakage and fabricated “blind accuracy.”

## Proposal and ownership
- **Provisional sample created:** 40 new synthetic situation groups, four per each of ten domains, one bilingual FA/EN question pair per group (**80 questions**), privately delivered in AES-256-GCM encrypted form. This is **assistant-authored only** and must be independently reviewed/rewritten if required; not a model-blind certified holdout.
- A qualified independent reviewer authors and seals the holdout **after** inspecting contamination risks; no rewordings/translation of the 50 public settings. Real farm/user private data are not permitted for the first pilot.
- Assign a dataset custodian **separate from the person tuning prompts/fine-tunes**. Only the custodian can see the full holdout before a frozen candidate run.
- Version the sealed data, hash the encrypted artifact, record custody/date/license/consent (for any external materials), region/crop context, and expiry/update policy in an **access-restricted workspace**. Do not publish contents, raw prompt examples, answer keys or identifying metadata in GitHub/PRs/chat transcripts.
- Keep the holdout outside the model tuning or RAG ingestion paths, even if it uses publicly cited scientific methods. Never insert holdout cases into prompts, feedback examples, embeddings, test logs or PR descriptions.
- Test near-duplicate leakage: crop/cultivar/location/soil/weather transformations, English↔Persian translation equivalence and semantically equivalent agronomic decisions. Exact string deduplication is **insufficient**.
- Use a separate, limited-access evaluation runner that accepts input at execution time and returns **aggregated** metrics by domain/language; avoid leaking case text/answer keys to model developers.
- Require two reviewers for hazardous advice/security outcome and independent review of any newly added numeric gold. When judgment is disputed, report “unresolved,” not a guessed score.
- Publish only high-level outcomes, failure categories and denominator; keep case IDs abstract and protect high-risk test mechanics.

## Minimum sealed schema (no sample question content)
```json
{
  "holdout_id": "PRIVATE_ID",
  "custodian": "TO_BE_NAMED",
  "source_license_and_consent": "TO_BE_VERIFIED",
  "domain": "one-of-ten",
  "language": "fa-or-en",
  "scenario_group": "PRIVATE_GROUP",
  "input_text": "PRIVATE_NOT_IN_PUBLIC_REPOSITORY",
  "gold_answer": "PRIVATE_EXPERT_APPROVED",
  "expert_source_evidence": [],
  "review_status": "PENDING",
  "model_status": "NOT_RUN"
}
```

## Release blockers
- No independently authored cases or qualified reviewer signed gold yet.
- No privacy policy or safe storage/custodian selected for this dataset.
- No funded, approved GPU or pinned model run; do **not** create a resource from this document.
- [Security PR #52](https://github.com/Ali-Mafi/AgroMind/pull/52) remains Draft/NO-GO on F01/F02; cannot be bypassed by an offline study.

**Explicit rule:** This document contains **zero** holdout questions. A future holdout is only “blind” if the prompts, answers and metadata are not exposed to the model developer or tuned models before final locked evaluation.
