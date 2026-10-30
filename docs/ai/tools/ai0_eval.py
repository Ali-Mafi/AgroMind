#!/usr/bin/env python3
"""AgroMind AI-0 synthetic/offline-only benchmark adapter (Python stdlib).

This is research tooling; it does not connect to AgroMind, Supabase or any hosted API.
Run mode only permits an explicit HTTP loopback inference endpoint, with no redirects.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import statistics
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, ProxyHandler, Request, build_opener

DOMAINS = {"irrigation", "weather", "salinity", "crop_health", "orchard",
           "math_units", "rag_evidence", "data_quality", "tenant_security", "unsafe_action"}
SPLITS = {"development": 180, "validation": 60, "public_audit": 60}
EXPECTED_MATH = {
    "math_units-0": (1440.0, "m3"),
    "math_units-1": (240.0, "m3"),
    "math_units-2": (15000.0, "m2"),
    "math_units-3": (20.0, "degC"),
    "math_units-4": (20.0, "m3"),
}


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError("Refusing HTTP redirect from local inference endpoint")


def load_jsonl(path: Path) -> list[dict]:
    rows = []
    for i, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip():
            raise ValueError(f"Blank JSONL row {i}")
        try:
            row = json.loads(line)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Invalid JSON on row {i}: {exc}") from exc
        if not isinstance(row, dict):
            raise ValueError(f"JSONL row {i} must be an object")
        rows.append(row)
    return rows


def validate_dataset(rows: list[dict]) -> dict:
    if len(rows) != 300:
        raise ValueError(f"Expected exactly 300 rows, got {len(rows)}")
    ids, prompts, pairs, groups, domains, langs, splits = set(), set(), {}, {}, {}, {}, {}
    for idx, row in enumerate(rows, start=1):
        case_id = row.get("id")
        if not isinstance(case_id, str) or not case_id.startswith("AI0-") or case_id in ids:
            raise ValueError(f"Invalid or duplicate ID at row {idx}")
        ids.add(case_id)
        prompt = row.get("question")
        if not isinstance(prompt, str) or not prompt.strip() or prompt in prompts:
            raise ValueError(f"Invalid or duplicate prompt at row {idx}")
        prompts.add(prompt)
        if row.get("provenance") != "synthetic-v0-unreviewed" or row.get("review_status") != "needs_agronomist_or_security_review":
            raise ValueError(f"Non-synthetic or supposedly reviewed row {case_id}")
        if row.get("domain") not in DOMAINS or row.get("language") not in {"fa", "en"} or row.get("split") not in SPLITS:
            raise ValueError(f"Invalid domain/language/split in {case_id}")
        for field, bucket in (("domain", domains), ("language", langs), ("split", splits)):
            k = row[field]
            bucket[k] = bucket.get(k, 0) + 1
        pair_id, group_id = row.get("pair_id"), row.get("group_id")
        if not isinstance(pair_id, str) or not isinstance(group_id, str):
            raise ValueError(f"Missing group or pair for {case_id}")
        pairs.setdefault(pair_id, []).append(row)
        groups.setdefault(group_id, []).append(row)
        expected = row.get("expected")
        if not isinstance(expected, dict) or not expected.get("must") or not expected.get("forbidden"):
            raise ValueError(f"Missing behavioral rubric for {case_id}")
        if row["domain"] == "math_units":
            reference = expected.get("numeric_example")
            correct = EXPECTED_MATH.get(group_id)
            if (not isinstance(reference, dict) or correct is None or reference.get("unit") != correct[1]
                or not isinstance(reference.get("value"), (int, float))
                or not math.isclose(reference["value"], correct[0], rel_tol=0, abs_tol=1e-9)):
                raise ValueError(f"Bad arithmetic reference for {case_id}")
        elif "numeric_example" in expected:
            raise ValueError(f"Unexpected numeric fixture in {case_id}")
    if any(domains.get(d) != 30 for d in DOMAINS) or langs != {"fa": 150, "en": 150} or splits != SPLITS:
        raise ValueError(f"Bad dataset domain/language/split counts: {domains} {langs} {splits}")
    if len(pairs) != 150 or len(groups) != 50:
        raise ValueError("Wrong bilingual-pair or context-group count")
    for pair_id, samples in pairs.items():
        if (len(samples) != 2 or {r["language"] for r in samples} != {"fa", "en"}
            or len({r["split"] for r in samples}) != 1
            or len({r["group_id"] for r in samples}) != 1):
            raise ValueError(f"Bilingual pair leaked between groups/splits: {pair_id}")
    for group_id, samples in groups.items():
        if len(samples) != 6 or len({r["split"] for r in samples}) != 1:
            raise ValueError(f"Context group contaminated: {group_id}")
    return {"status": "synthetic_structure_passed", "rows": 300, "bilingual_pairs": 150,
            "base_scenarios": 50, "languages": langs, "splits": splits,
            "domains": {k: domains[k] for k in sorted(domains)},
            "numeric_fixture_groups": len(EXPECTED_MATH),
            "expert_validated": False, "blind_holdout": False, "model_tested": False}


def ensure_local_endpoint(url: str) -> str:
    parsed = urlsplit(url)
    if (parsed.scheme != "http" or parsed.hostname not in {"127.0.0.1", "localhost", "::1"}
        or parsed.username or parsed.password or parsed.fragment or parsed.query
        or parsed.path != "/v1/chat/completions" or parsed.port is None):
        raise ValueError("Only explicit http://127.0.0.1:PORT/v1/chat/completions (or localhost/::1) allowed")
    return url


def request_local(url: str, model: str, prompt: str, timeout: float, max_output_tokens: int) -> tuple[str, float, dict]:
    body = json.dumps({"model": model, "stream": False,
                       "messages": [{"role": "user", "content": prompt}],
                       "temperature": 0, "max_tokens": max_output_tokens}, ensure_ascii=False).encode("utf-8")
    token = os.environ.get("AGROMIND_AI0_LOCAL_TOKEN", "")
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    opener = build_opener(ProxyHandler({}), NoRedirect())
    start = time.monotonic()
    req = Request(url, data=body, method="POST", headers=headers)
    with opener.open(req, timeout=timeout) as response:
        if response.status != 200:
            raise RuntimeError(f"Unexpected HTTP status: {response.status}")
        payload = response.read(4_000_000)
        obj = json.loads(payload)
    latency = round((time.monotonic() - start) * 1000, 2)
    choices = obj.get("choices")
    if not isinstance(choices, list) or not choices:
        raise ValueError("No model answer choices")
    answer = choices[0].get("message", {}).get("content")
    if not isinstance(answer, str):
        raise ValueError("Model answer is not a string")
    usage = obj.get("usage")
    return answer, latency, usage if isinstance(usage, dict) else {}


def run_local(rows: list[dict], args: argparse.Namespace) -> dict:
    ensure_local_endpoint(args.endpoint)
    if not args.synthetic_only:
        raise ValueError("--synthetic-only must be set to run inference")
    if not args.model or not args.model.strip():
        raise ValueError("--model is required")
    if args.limit < 1 or args.limit > 300:
        raise ValueError("--limit must be 1..300")
    if not 0 < args.timeout <= 180 or not 1 <= args.max_output_tokens <= 1024:
        raise ValueError("unsafe timeout or output cap")
    if args.mode != "base":
        raise ValueError("This script supports base-mode only; RAG and tools are NOT implemented")
    if args.out.exists():
        raise ValueError("Output exists; choose a new file (never overwrite a run)")
    selected = [r for r in rows if r["split"] == args.split][:args.limit]
    if not selected:
        raise ValueError("No cases selected")
    results = []
    for row in selected:
        event = {"id": row["id"], "pair_id": row["pair_id"], "domain": row["domain"],
                 "language": row["language"], "mode": "base", "model": args.model,
                 "answer": None, "latency_ms": None, "ttft_ms": None,
                 "usage": None, "status": "not_run", "error_type": None,
                 "scientific_score": None, "security_verified": False}
        try:
            answer, latency, usage = request_local(args.endpoint, args.model, row["question"], args.timeout, args.max_output_tokens)
            event.update(answer=answer, latency_ms=latency, usage=usage, status="returned_unreviewed")
        except (OSError, HTTPError, URLError, ValueError, TimeoutError, RuntimeError) as exc:
            event.update(status="error", error_type=type(exc).__name__)
        results.append(event)
    # Write only after a complete bounded trial; results include synthetic text and raw model answer.
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("x", encoding="utf-8") as fp:
        for result in results:
            fp.write(json.dumps(result, ensure_ascii=False) + "\n")
    return {"status": "local_trial_completed_unreviewed", "out": str(args.out),
            "model": args.model, "cases": len(results),
            "returned_unreviewed": sum(x["status"] == "returned_unreviewed" for x in results),
            "errors": sum(x["status"] == "error" for x in results),
            "agronomy_graded": False, "security_verified": False,
            "ttft_measured": False, "model_comparison_validated": False}


def report(path: Path) -> dict:
    rows = load_jsonl(path)
    if not rows:
        raise ValueError("Empty response file")
    ids = [r.get("id") for r in rows]
    if len(set(ids)) != len(ids) or any(r.get("status") not in {"returned_unreviewed", "error"} for r in rows):
        raise ValueError("Invalid response IDs/statuses")
    timings = [r["latency_ms"] for r in rows if r.get("status") == "returned_unreviewed" and isinstance(r.get("latency_ms"), (int, float))]
    return {"rows": len(rows), "errors": sum(r["status"] == "error" for r in rows),
            "returned_unreviewed": len(timings),
            "median_latency_ms": statistics.median(timings) if timings else None,
            "p95_latency_ms": sorted(timings)[math.ceil(.95*len(timings))-1] if timings else None,
            "scientific_quality": "NOT_REVIEWED", "authorization": "NOT_TESTED",
            "time_to_first_token": "NOT_MEASURED", "comparative_accuracy": "NOT_ESTABLISHED"}


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest="cmd", required=True)
    val = sub.add_parser("validate", help="Validate synthetic seed and arithmetic gold")
    val.add_argument("--dataset", type=Path, required=True)
    run = sub.add_parser("run", help="Explicit local-only single-user base-mode trial")
    run.add_argument("--dataset", type=Path, required=True)
    run.add_argument("--endpoint", type=str, required=True)
    run.add_argument("--model", type=str, required=True)
    run.add_argument("--mode", choices=["base", "rag", "rag_tools"], default="base")
    run.add_argument("--split", choices=list(SPLITS), default="development")
    run.add_argument("--limit", type=int, default=10)
    run.add_argument("--timeout", type=float, default=60)
    run.add_argument("--max-output-tokens", type=int, default=256)
    run.add_argument("--synthetic-only", action="store_true")
    run.add_argument("--out", type=Path, required=True)
    rep = sub.add_parser("report", help="Summarize non-expert-graded outputs")
    rep.add_argument("--responses", type=Path, required=True)
    args = p.parse_args(argv)
    try:
        if args.cmd == "report":
            result = report(args.responses)
        else:
            data = args.dataset.read_bytes()
            rows = load_jsonl(args.dataset)
            summary = validate_dataset(rows)
            if args.cmd == "validate":
                result = {**summary, "sha256": hashlib.sha256(data).hexdigest()}
            else:
                result = run_local(rows, args)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except (ValueError, OSError, KeyError) as exc:
        print(f"AI-0 error: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
