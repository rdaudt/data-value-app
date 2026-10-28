#!/usr/bin/env python3
"""Data Value Explorer MVP - Rapid UX Build - Synthetic Generator"""
import argparse, csv, json, os, random
from pathlib import Path

# ── Constants ──────────────────────────────────────────────────────
DOMAINS = {
    "Claims":      ["Claim Intake","Claim Management","Wage Loss Benefits","Health Care Benefits"],
    "Assessments": ["Employer Registration","Classification and Rates","Payroll and Premium","Collections"],
    "Prevention":  ["Inspections","Orders and Penalties","Incident Investigation"],
    "Finance":     ["General Ledger","Payments","Actuarial","Budget and Forecast"],
    "Employer":    ["Employer Master","Employer Accounts","Employer Relationships"],
    "Worker":      ["Worker Master","Worker Contacts","Worker Employment History"],
    "Provider":    ["Provider Master","Provider Billing","Provider Contracts"],
}
LAYERS = ["Raw Data","Curated","BIPRSD"]
PII_LEVELS = ["None","None","None","Low","Low","Medium","High"]
OWNERS = [
    "Alice Chen","Bob Tran","Carlos Mejia","Diana Park","Eric Johansson",
    "Fatima Al-Rashid","Grace Liu","Hiro Nakamura","Irene Gomez","James Wu"
]
TIERS = ["Tier1","Tier2","Tier3","Tier4","Tier5"]
WORKSPACES = ["Analytics Hub","Operations BI","Finance Reporting",
              "Executive Dashboard","Claims Intelligence"]

# ── Scoring helpers ────────────────────────────────────────────────
def label(score, dim):
    hi = {"value":"High","quality":"High","cost":"Efficient","risk":"Safe"}
    md = {"value":"Medium","quality":"Medium","cost":"Moderate","risk":"Moderate"}
    lo = {"value":"Low","quality":"Low","cost":"Expensive","risk":"Exposed"}
    if score >= 67: return hi[dim]
    if score >= 34: return md[dim]
    return lo[dim]

def composite(s):
    return round(0.34*s["value"] + 0.33*s["quality"] + 0.23*s["cost"] + 0.10*s["risk"])

def quadrant(s):
    v, c = s["value"] >= 50, s["cost"] >= 50
    if v and c:      return "Invest"
    if v and not c:  return "Optimize"
    if not v and c:  return "Maintain"
    return "Retire review"

def clamp(x): return max(0, min(100, int(round(x))))

# ── Score trajectory ───────────────────────────────────────────────
def next_scores(prev, scenario, month_idx, rng):
    """Apply scenario deltas + noise to produce month_idx scores."""
    noise = lambda: rng.uniform(-4, 4)
    s = {d: prev[d] + noise() for d in prev}
    mi = month_idx  # 0=first month, 5=last month
    if scenario == "Steady Growth":
        s["value"] += rng.uniform(4.5, 7) * (mi + 1) * 0.45
    elif scenario == "Quality Degradation" and mi >= 2:
        s["quality"] -= rng.uniform(7, 10) * (mi - 1)
    elif scenario == "Cost Spike" and mi >= 2:
        s["cost"] -= rng.uniform(13, 20)
    elif scenario == "New PII / Risk Escalation":
        if mi >= 3: s["risk"] -= rng.uniform(10, 15)
        if mi >= 4: s["risk"] -= rng.uniform(6, 10)
    elif scenario == "Retirement Candidate" and mi >= 1:
        s["value"] -= rng.uniform(9, 14) * mi * 0.45
    return {d: clamp(s[d]) for d in s}

# ── Main generator ─────────────────────────────────────────────────
def generate(seed, config_path, out_dir):
    rng = random.Random(seed)
    cfg = json.loads(Path(config_path).read_text())
    periods = cfg["periods"]
    starts  = cfg["scenario_starts"]
    Path(out_dir).mkdir(parents=True, exist_ok=True)

    # 1. domains.json
    domains_data = [{"domain":d,"subdomains":s} for d,s in DOMAINS.items()]
    Path(f"{out_dir}/domains.json").write_text(json.dumps(domains_data, indent=2))

    # 2. data_products.csv
    NON_STABLE = (["Steady Growth"]*2 + ["Quality Degradation"]*2 +
                  ["Cost Spike"]*2 + ["New PII / Risk Escalation"]*2 +
                  ["Retirement Candidate"]*2)
    products, pid = [], 1
    for domain, subs in DOMAINS.items():
        n = rng.randint(*cfg["products_per_domain"])
        for i in range(n):
            sub = subs[i % len(subs)]
            is_master = domain in ["Employer","Worker","Provider"] and i == 0
            scenario = NON_STABLE.pop(0) if NON_STABLE else "Stable"
            products.append({
                "data_product_id": f"DP{pid:03d}",
                "fqn": f"wsbc.cdw.{domain.lower()}.{sub.lower().replace(chr(32),chr(95))}_dp{i+1}",
                "name": f"{sub} Data Product {i+1}",
                "domain": domain, "subdomain": sub,
                "owner": rng.choice(OWNERS),
                "steward": rng.choice(OWNERS),
                "tier": rng.choice(TIERS),
                "description": f"Synthetic data product for {sub} in {domain}.",
                "is_master_data": str(is_master).lower(),
                "scenario": scenario,
            })
            pid += 1
    _write_csv(f"{out_dir}/data_products.csv", products)

    # 3. data_assets.csv + product_asset_map.csv
    assets, asset_map, aid = [], [], 1
    for prod in products:
        n = rng.randint(*cfg["assets_per_product"])
        for j in range(n):
            layer = rng.choice(LAYERS)
            assets.append({
                "asset_id": f"A{aid:04d}",
                "fqn": f"cdw.wsbc.{layer.lower().replace(chr(32),chr(95))}.tbl_{prod[chr(100)+chr(97)+chr(116)+chr(97)+chr(95)+chr(112)+chr(114)+chr(111)+chr(100)+chr(117)+chr(99)+chr(116)+chr(95)+chr(105)+chr(100)].lower()}_{j+1:02d}",
                "server": "sql-mi-prod.database.windows.net",
                "database": f"wsbc_{prod['domain'].lower()}",
                "schema": layer.lower().replace(" ","_"),
                "name": f"tbl_{prod['data_product_id'].lower()}_{j+1:02d}",
                "type": "table" if j < n-2 else "view",
                "layer": layer,
                "row_count": rng.randint(1000, 5_000_000),
                "pii_level": rng.choice(PII_LEVELS),
            })
            asset_map.append({"data_product_id": prod["data_product_id"],
                              "asset_id": f"A{aid:04d}"})
            aid += 1
    _write_csv(f"{out_dir}/data_assets.csv", assets)
    _write_csv(f"{out_dir}/product_asset_map.csv", asset_map)

    # 4. powerbi_reports.csv
    reports = []
    total_pbi = cfg["pbi_reports"] + cfg["pbi_models"]
    for rid in range(1, total_pbi + 1):
        prod = rng.choice(products)
        is_model = rid <= cfg["pbi_models"]
        reports.append({
            "report_id": f"PBI{rid:04d}",
            "type": "semantic_model" if is_model else "report",
            "name": f"{"Model" if is_model else "Report"} {rid}: {prod['domain']} {rng.randint(1,99)}",
            "workspace": rng.choice(WORKSPACES),
            "linked_data_product_id": prod["data_product_id"],
        })
    _write_csv(f"{out_dir}/powerbi_reports.csv", reports)

    # 5. scores.csv — direct score generation
    score_rows, effects = [], {}
    for prod in products:
        sc = prod["scenario"]
        sr = starts[sc]
        base = {d: rng.randint(sr[d][0], sr[d][1]) for d in ["value","quality","cost","risk"]}
        product_scores = []
        for mi, period in enumerate(periods):
            s = base if mi == 0 else next_scores(base, sc, mi, rng)
            base = s
            comp = composite(s)
            risk_exp = label(s["risk"],"risk") == "Exposed"
            score_rows.append({
                "period":          period,
                "data_product_id": prod["data_product_id"],
                "formula_version": "MVP-v2.0",
                "value_score":     s["value"],
                "quality_score":   s["quality"],
                "cost_score":      s["cost"],
                "risk_score":      s["risk"],
                "composite_score": comp,
                "value_label":     label(s["value"],  "value"),
                "quality_label":   label(s["quality"],"quality"),
                "cost_label":      label(s["cost"],   "cost"),
                "risk_label":      label(s["risk"],   "risk"),
                "risk_flag":       str(risk_exp).lower(),
                "quadrant":        quadrant(s),
            })
            product_scores.append(s)
        # Scenario effect check
        first, last = product_scores[0], product_scores[-1]
        if sc == "Steady Growth":
            effects[prod["data_product_id"]] = (sc, last["value"] > first["value"] + 10)
        elif sc == "Quality Degradation":
            effects[prod["data_product_id"]] = (sc, last["quality"] < first["quality"] - 15)
        elif sc == "Cost Spike":
            effects[prod["data_product_id"]] = (sc, label(last["cost"],"cost") == "Expensive")
        elif sc == "New PII / Risk Escalation":
            effects[prod["data_product_id"]] = (sc, label(last["risk"],"risk") == "Exposed")
        elif sc == "Retirement Candidate":
            effects[prod["data_product_id"]] = (sc, quadrant(last) == "Retire review")
    _write_csv(f"{out_dir}/scores.csv", score_rows)

    # 6. Print summary
    print("\n=== Files written to", out_dir, "===")
    for f in sorted(Path(out_dir).iterdir()): print(f"  {f.name}")
    print(f"\nProducts: {len(products)}  Assets: {len(assets)}  Score rows: {len(score_rows)}")
    print("\n=== Scenario effect check ===")
    all_ok = True
    for pid, (sc, met) in effects.items():
        tag = "OK  " if met else "WARN"
        if not met: all_ok = False
        print(f"  [{tag}] {pid}  ({sc})")
    if not all_ok:
        print("\nWARN: Adjust start positions in generator_config.json for failed products.")

# ── Utility ─────────────────────────────────────────────────────────
def _write_csv(path, rows):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader(); w.writerows(rows)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Data Value Explorer Generator")
    parser.add_argument("--seed",   type=int, default=42)
    parser.add_argument("--out",    default="data")
    parser.add_argument("--config", default="generator/generator_config.json")
    args = parser.parse_args()
    print(f"seed={args.seed}  out={args.out}  config={args.config}")
    generate(seed=args.seed, config_path=args.config, out_dir=args.out)
