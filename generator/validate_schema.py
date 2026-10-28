#!/usr/bin/env python3
"""Schema validator — checks all 7 output files."""
import csv, json, sys
from pathlib import Path

REQUIRED = {
    "domains.json":          None,  # JSON array
    "data_products.csv":     ["data_product_id","fqn","domain","subdomain",
                              "owner","tier","scenario"],
    "data_assets.csv":       ["asset_id","fqn","layer","pii_level"],
    "product_asset_map.csv": ["data_product_id","asset_id"],
    "powerbi_reports.csv":   ["report_id","type","linked_data_product_id"],
    "scores.csv":            ["period","data_product_id","formula_version",
                              "value_score","quality_score","cost_score","risk_score",
                              "composite_score","value_label","quality_label",
                              "cost_label","risk_label","risk_flag","quadrant"],
    "scoring_config.json":   None,  # JSON object
}

def validate(out_dir):
    errors = []
    for fname, cols in REQUIRED.items():
        path = Path(out_dir) / fname
        if not path.exists():
            errors.append(f"MISSING: {fname}")
            continue
        if fname.endswith(".csv") and cols:
            with open(path, encoding="utf-8") as f:
                header = next(csv.reader(f))
            missing = [c for c in cols if c not in header]
            if missing: errors.append(f"{fname}: missing columns {missing}")
            else: print(f"  OK  {fname}")
        else:
            print(f"  OK  {fname}")
    if errors:
        for e in errors: print(f"  ERR {e}")
        sys.exit(1)
    print("\nAll schema checks passed.")

if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("--out", default="data")
    validate(p.parse_args().out)
