# AgroMind AI-0 — Provisional Confidential Holdout Candidate — 2026-10-31

**Scope:** create and deliver an **encrypted, user-only provisional synthetic candidate** while keeping public GitHub free of private test prompts and keys.

## Verified starting state
- GitHub `main` observed at `42a8eb2b54fd5852f11a2cc31e09dd7b598e4dc0`, public; Draft PR #52 remains unmerged, F01/F02 NO-GO. PR #58 head `58a28e21e37626c0b841c6acd03e2113640ab53a` open/unmerged; other documentation PRs remain separate.

## Actual work done
1. Created **40 new synthetic agricultural scenario settings**, four per ten domains, **80 question records** written as FA/EN pairs. Situations are distinct in narrative from the old 50 public settings; semantic overlap with the entire public seed and external training data **has not yet been independently evaluated**.
2. Added draft behavior anchors and draft arithmetic references only where mathematically specified; all expert-review flags `PENDING`, all model flags `NOT_RUN`. No professional signoff or evaluated candidate model.
3. Encrypted the complete local JSONL in-memory with **AES-256-GCM** and a random 256-bit key + nonce and authenticated metadata. Verified decryption, all 80 unique prompts, 40 bilingual pairs, ten 8-record domain counts, all statuses and ciphertext SHA-256 **`8800dea3da8c2d1a6925f20e487bdf547453294192769e33f7f530710bbb4faf`**.
4. Delivered encrypted file, key in a separate user-only artifact, local reader and private non-secret manifest. Key and plaintext were **NOT added to GitHub**. No live cloud secret store or independent custody has been configured; user must preserve/transfer files securely.
5. Published only [non-content integrity manifest](../ai/AI0_PROVISIONAL_HOLDOUT_PUBLIC_MANIFEST.json), [handling and professional review gates](../ai/AI0_ENCRYPTED_HOLDOUT_HANDOFF.md) and updated AI0 holdout/model-trial/master-progress status.

## Evidence limitations and release status
- This is **not a formally blind test**: the case author and user could access it, so independent custody and contamination audits are still required. Encryption protects the artifact *only when its key is kept separate and confidential*.
- FAO-56 source references support methodological irrigation distinctions; they do **not certify** case-specific agronomy answers. No other protected scientific text was republished into the repo.
- No GPU/cloud rental or API usage, no models downloaded/fine-tuned/benchmarked, no real farms/user data or production migrations, no code, Vercel or repository visibility changes, no merges or releases.
- No current pass/fail quality score claimed; only local structure/encryption checks have been performed. CI status of the new PR must be checked separately.

## Next required step
Qualified agronomy and security review of the **private** cases, independent clean holdout custody, source/translation-contamination validation, then explicit separate owner approval of any GPU benchmark budget.
