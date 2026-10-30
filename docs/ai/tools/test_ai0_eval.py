import tempfile
import unittest
from pathlib import Path
from argparse import Namespace
from unittest.mock import patch

import ai0_eval as a


class TestAI0(unittest.TestCase):
    def make_rows(self):
        rows = []
        seq = 0
        pair = 0
        for domain in sorted(a.DOMAINS):
            for j in range(5):
                for k in range(3):
                    pair += 1
                    for language in ("fa", "en"):
                        seq += 1
                        row = {"id": f"AI0-{seq:04d}", "question": f"{domain}:{j}:{k}:{language}",
                               "pair_id": f"AI0-P{pair:04d}", "group_id": f"{domain}-{j}",
                               "domain": domain, "language": language,
                               "split": "development" if j<3 else "validation" if j==3 else "public_audit",
                               "provenance": "synthetic-v0-unreviewed", "review_status":"needs_agronomist_or_security_review",
                               "expected": {"must": ["avoid harm"], "forbidden": ["leak data"]}}
                        if domain == "math_units":
                            v,u = a.EXPECTED_MATH[f"math_units-{j}"]
                            row["expected"]["numeric_example"]={"value":v,"unit":u}
                        rows.append(row)
        return rows

    def test_valid_seed_structure(self):
        r=a.validate_dataset(self.make_rows())
        self.assertEqual(r["rows"],300)
        self.assertEqual(r["bilingual_pairs"],150)
        self.assertFalse(r["expert_validated"])

    def test_numeric_corruption_fails(self):
        rows=self.make_rows()
        row=next(r for r in rows if r["domain"]=="math_units")
        row["expected"]["numeric_example"]["value"]=123456
        with self.assertRaises(ValueError):a.validate_dataset(rows)

    def test_group_leak_fails(self):
        rows=self.make_rows()
        rows[0]["split"]="validation"
        with self.assertRaises(ValueError):a.validate_dataset(rows)

    def test_duplicate_prompt_fails(self):
        rows=self.make_rows()
        rows[1]["question"]=rows[0]["question"]
        with self.assertRaises(ValueError):a.validate_dataset(rows)

    def test_refuse_public_and_https_endpoint(self):
        for url in ("https://127.0.0.1:8000/v1/chat/completions", "http://example.com:8000/v1/chat/completions", "http://127.0.0.1:8000/v1/chat/completions?x=1", "http://127.0.0.1:8000/invocations", "http://127.0.0.1:8000/v1/chat/completions#frag"):
            with self.assertRaises(ValueError):a.ensure_local_endpoint(url)
        self.assertEqual(a.ensure_local_endpoint("http://127.0.0.1:8000/v1/chat/completions"),"http://127.0.0.1:8000/v1/chat/completions")

    def test_no_network_without_explicit_opt_in(self):
        with tempfile.TemporaryDirectory() as root:
            args=Namespace(endpoint="http://127.0.0.1:8000/v1/chat/completions",synthetic_only=False,model="placeholder",limit=1,timeout=60,max_output_tokens=100,mode="base",split="development",out=Path(root)/"out.jsonl")
            with patch.object(a,"request_local") as req:
                with self.assertRaises(ValueError):a.run_local(self.make_rows(),args)
                req.assert_not_called()

    def test_mode_blocked_no_rag_illusion(self):
        with tempfile.TemporaryDirectory() as root:
            args=Namespace(endpoint="http://127.0.0.1:8000/v1/chat/completions",synthetic_only=True,model="placeholder",limit=1,timeout=60,max_output_tokens=100,mode="rag_tools",split="development",out=Path(root)/"out.jsonl")
            with patch.object(a,"request_local") as req:
                with self.assertRaises(ValueError):a.run_local(self.make_rows(),args)
                req.assert_not_called()

    def test_local_fake_without_network_and_report(self):
        with tempfile.TemporaryDirectory() as root:
            args=Namespace(endpoint="http://127.0.0.1:8000/v1/chat/completions",synthetic_only=True,model="synthetic-model",limit=2,timeout=20,max_output_tokens=64,mode="base",split="development",out=Path(root)/"out.jsonl")
            with patch.object(a,"request_local",return_value=("Synthetic response",25.2,{})) as req:
                result=a.run_local(self.make_rows(),args)
                self.assertEqual(req.call_count,2)
            self.assertEqual(result["returned_unreviewed"],2)
            out=a.report(args.out)
            self.assertEqual(out["scientific_quality"],"NOT_REVIEWED")
            self.assertEqual(out["authorization"],"NOT_TESTED")
            self.assertEqual(out["time_to_first_token"],"NOT_MEASURED")
            with self.assertRaises(ValueError):a.run_local(self.make_rows(),args)

if __name__ == "__main__": unittest.main()
