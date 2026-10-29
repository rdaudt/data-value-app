// Builds public/docs/Data_Value_Explorer_Scoring_Model.pdf from the same model
// data the in-app walkthrough uses (src/scoring/model.ts) and the live
// scoring_config.json. Needs Node 22.18+ (imports .ts) and Microsoft Edge.
//   node scripts/build-scoring-pdf.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import * as M from "../src/scoring/model.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cfg  = JSON.parse(readFileSync(resolve(root, "public/data/scoring_config.json"), "utf8"));
const outDir = resolve(root, "public/docs");
const out  = resolve(outDir, M.PDF_FILE);

const EDGE = [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
].find(existsSync);
if (!EDGE) throw new Error("Microsoft Edge not found");

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const cap = s => s[0].toUpperCase() + s.slice(1);
const pct = w => `${Math.round(w * 100)}%`;
const table = (head, rows) =>
  `<table><thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${
    rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;

const w = cfg.composite_weights, { high, low } = cfg.label_thresholds, split = cfg.quadrant_split;
const DIMS = ["value", "quality", "cost", "risk"];

// Illustrative example (not a product from the demo data)
const ex = { value: 72, quality: 58, cost: 41, risk: 80 };
const exSum = DIMS.reduce((n, d) => n + ex[d] * w[d], 0);
const lab = (d, s) => cfg.dimension_labels[d][s >= high ? 0 : s > low ? 1 : 2];

const catalogue = M.DIMENSIONS.map(d => `
  <h3>${d.name} <span class="muted">(${pct(w[d.key])} of composite)</span></h3>
  <p>${esc(d.question)} ${esc(d.direction)}.</p>
  ${table(["Criterion (weight)", "Measure", "Lvl", "Unit", "Aggregation", "Normalisation", "Status"],
    d.criteria.flatMap(c => c.measures.map((m, i) => [
      i === 0 ? `<b>${esc(c.name)} (${c.weight}%)</b>` : "",
      esc(m.name), m.level, esc(m.unit), esc(m.aggregation), esc(m.normalization), "Planned"])))}
`).join("");

const html = `<!doctype html><html><head><meta charset="utf-8"><title>Data Value Explorer: Scoring Model</title>
<style>
  @page { size: Letter; margin: 18mm 16mm 18mm 16mm; }
  body { font: 10pt/1.45 "Segoe UI", Arial, sans-serif; color: #453F39; }
  h1 { font-size: 24pt; margin: 0 0 4pt; } h2 { font-size: 15pt; margin: 20pt 0 6pt; border-bottom: 3px solid #ED8B00; padding-bottom: 2pt; break-after: avoid; }
  h3 { font-size: 11.5pt; margin: 12pt 0 4pt; break-after: avoid; }
  .muted { color: #776E64; font-weight: normal; } .cover { padding: 40pt 0 10pt; border-bottom: 6px solid #ED8B00; margin-bottom: 14pt; }
  table { border-collapse: collapse; width: 100%; margin: 6pt 0 10pt; font-size: 8.5pt; break-inside: auto; }
  tr { break-inside: avoid; } th { background: #47423C; color: #fff; text-align: left; padding: 3pt 5pt; }
  td { border-bottom: 1px solid #E4E2E0; padding: 3pt 5pt; vertical-align: top; }
  .box { background: #F9E0A0; border-left: 4px solid #ED8B00; padding: 6pt 10pt; margin: 8pt 0; }
  .blue { background: #E0EBEF; border-left-color: #6399AE; }
  .formula { background: #F1F0EF; font-family: Consolas, monospace; padding: 6pt 10pt; margin: 6pt 0; }
  .qa b { display: block; margin-top: 6pt; } li { margin-bottom: 3pt; }
  .toc li { margin-bottom: 1pt; }
</style></head><body>

<div class="cover">
  <h1>Data Value Explorer</h1>
  <div style="font-size:16pt">Scoring Model: draft for review</div>
  <p class="muted">Formula version ${esc(cfg.formula_version)} · Source: ${esc(M.MODEL_SOURCE)} · Companion to the Scoring Model walkthrough in the explorer</p>
</div>

<div class="box"><b>Status of this document.</b> This is a draft proposal. The weights, band edges, label thresholds and quadrant split are
proposed defaults, accepted for the MVP as placeholders until calibration with real data. <b>Configurable scoring methods are planned for a future iteration.</b>
All data in the explorer is synthetic, and the MVP generates the four dimension scores directly rather than computing them from measures.
Sections 3 and 4 describe the measure-level design that real data collection will feed.</div>

<h2>Contents</h2>
<ol class="toc">
  <li>Purpose and overview</li><li>The four dimensions</li><li>Measures and criteria</li>
  <li>Turning measures into 0-100</li><li>Rolling up to the composite</li><li>Labels, risk flag and decision quadrant</li>
  <li>Worked example</li><li>Rules, cost allocation and design decisions</li><li>Questions to expect</li><li>Limitations and what's next</li>
</ol>

<h2>1. Purpose and overview</h2>
<p>The scoring model gives every data product one score per dimension each month, so the organisation can compare products, see
change over time and decide what to keep, optimise, maintain or review for retirement. The unit of scoring is the <b>data product</b>: a logical set
of data assets with one owner.</p>
<p>Scores are 0 to 100 and <b>higher is always better</b> in every dimension: a high Cost score means efficient, a high Risk score means safe (D06).
Every score record stores the formula version used to compute it.</p>
<ol>
  <li><b>Measures</b> are collected for each data asset, upstream object, data product or the whole warehouse.</li>
  <li>Tag-based measures (PII level, privacy confirmed) are derived from the asset tag history.</li>
  <li>Asset and upstream costs are <b>allocated</b> to data products (section 8).</li>
  <li>Measures are <b>aggregated</b> to the data product with the rule in each measure definition.</li>
  <li>Each measure is <b>normalised</b> to 0-100 (log band, linear or lookup).</li>
  <li><b>Criterion score</b> = weighted mean of its normalised measures (equal weights unless configured).</li>
  <li><b>Dimension score</b> = weighted sum of its criterion scores.</li>
  <li>A <b>label</b> is mapped from each dimension score.</li>
  <li><b>Composite</b> = weighted sum of the four dimension scores; the risk flag and quadrant are derived.</li>
</ol>

<h2>2. The four dimensions</h2>
${table(["Dimension", "Question it answers", "Direction", "Weight in composite", "Labels (high / mid / low)"],
  M.DIMENSIONS.map(d => [`<b>${d.name}</b>`, esc(d.question), esc(d.direction), pct(w[d.key]), cfg.dimension_labels[d.key].join(" / ")]))}

<h2>3. Measures and criteria</h2>
<p>Criterion weights sum to 100% within each dimension. Level: ${Object.entries(M.LEVELS).map(([k, v]) => `${k} = ${v}`).join("; ")}.
<b>Planned</b> means no data is collected for the measure yet.</p>
${catalogue}

<h2>4. Turning measures into 0-100</h2>
<ul>
  <li><b>Log bands</b> (counts, sizes, costs): seven bands whose edges roughly multiply, because these quantities span orders of magnitude. Edges are fixed absolute values, not percentiles (D11).</li>
  <li><b>Linear</b> (percentages and shares): the value is the score; an inverse measure scores 100 minus the value.</li>
  <li><b>Lookup</b> (owner attestations, privacy and exposure flags): a fixed table.</li>
</ul>
<h3>Score per band</h3>
${table(["Band", "Inverse measures (cost, risk)", "Non-inverse measures (value)"],
  M.BAND_SCORES.inverse.map((s, i) => [i === 0 ? "below e1" : i === 6 ? "e6 and above" : `e${i} to e${i + 1}`, s, M.BAND_SCORES.nonInverse[i]]))}
<p>Zero rule: a non-inverse count measure with value 0 scores 0. No consumption means no value from that measure.</p>
<h3>Worked example: storage (inverse)</h3>
<p>Bands are defined as a share of total CDW size at calibration, then frozen as absolute GB (synthetic calibration total: 20,000 GB).</p>
${table(["Share of CDW", "Frozen band (GB)", "Storage score"], M.STORAGE_BANDS.map(b => [b.share, b.gb, `<b>${b.score}</b>`]))}
<p>A product using 15% of the CDW (3,000 GB) falls in the 2,000 to 6,000 GB band and scores 20.</p>
<h3>Band edges for every log-band measure (monthly, data product level)</h3>
${table(["Measure", "Unit", "Direction", "e1", "e2", "e3", "e4", "e5", "e6"],
  M.BANDS.map(b => [esc(b.measure), esc(b.unit), b.dir, ...b.edges.map(e => e.toLocaleString("en-CA"))]))}
<p>A value x is in band k when e(k-1) ≤ x &lt; e(k). Edges are calibrated to the synthetic data and will be recalibrated with real data (D22).</p>
<h3>Owner attestation (1-5)</h3>
${table(["Owner's answer", "Score", "Score if inverse"], M.ATTESTATION.map(a => [a.answer, a.normal, a.inverse]))}

<h2>5. Rolling up to the composite</h2>
<div class="formula">Composite = ${w.value} × Value + ${w.quality} × Quality + ${w.cost} × Cost + ${w.risk} × Risk</div>
<p>The defaults keep the ratio of the original 10/10/7/3 maximums. They are placeholders until calibration with real data (D21).</p>
<p><b>Rounding.</b> Intermediate values (normalised measures, criterion scores) are stored with 2 decimals. Only dimension and composite scores are rounded to whole numbers (half up).
Labels, the risk flag and the quadrant all use the rounded dimension scores.</p>

<h2>6. Labels, risk flag and decision quadrant</h2>
<h3>Labels</h3>
${table(["Dimension", `Score ≥ ${high}`, `Score ${low + 1} - ${high - 1}`, `Score ≤ ${low}`],
  DIMS.map(d => [cap(d), ...cfg.dimension_labels[d]]))}
<h3>Risk flag</h3>
<p>A product whose Risk label is <b>Exposed</b> is flagged next to its composite everywhere in the explorer. The composite is not capped (D08).</p>
<h3>Decision quadrant</h3>
<p>X axis = Cost score (right = efficient), Y axis = Value score, split at ${split} on both axes. Quality is point size and risk is point colour (D09).</p>
${table(["Quadrant", "Condition", "Suggested action"], [
  ["Invest", `Value ≥ ${split}, Cost ≥ ${split}`, cfg.quadrants.invest.action],
  ["Optimize", `Value ≥ ${split}, Cost < ${split}`, cfg.quadrants.optimize.action],
  ["Maintain", `Value < ${split}, Cost ≥ ${split}`, cfg.quadrants.maintain.action],
  ["Retire review", `Value < ${split}, Cost < ${split}`, cfg.quadrants.retire_review.action]])}

<h2>7. Worked example</h2>
<p class="muted">Illustrative numbers, not a product from the demo data.</p>
${table(["Dimension", "Score", "Label", "Weight", "Score × weight"], DIMS.map(d =>
  [cap(d), `<b>${ex[d]}</b>`, lab(d, ex[d]), pct(w[d]), (ex[d] * w[d]).toFixed(2)]))}
<div class="formula">Composite = ${exSum.toFixed(2)} → rounds to ${Math.round(exSum)}</div>
<p>Value ${ex.value} is ≥ ${split} and Cost ${ex.cost} is &lt; ${split}, so the quadrant is <b>Optimize</b> (${esc(cfg.quadrants.optimize.action)}).
Risk is ${lab("risk", ex.risk)}, so there is no risk flag.</p>

<h2>8. Rules, cost allocation and design decisions</h2>
<h3>Calculation rules</h3>
<ul>${M.RULES.map(r => `<li><b>${r.id} ${r.name}.</b> ${esc(r.text)}</li>`).join("")}</ul>
<h3>Privacy lookup (L1) and exposure flags (L2)</h3>
${table(["Effective PII level", "Privacy score"], M.L1_PRIVACY.map(l => [l.level, l.score]))}
${table(["Any asset in the product", "Exposure flag score"], M.L2_EXPOSURE.map(l => [l.rule, l.score]))}
<p>Exposure criterion = mean of the exposure flag score and the access breadth score.</p>
<h3>Cost allocation</h3>
<ul>${M.COST_ALLOCATION.map(t => `<li>${esc(t)}</li>`).join("")}</ul>
<h3>Design decisions behind the numbers</h3>
<ul>${M.DECISIONS.map(d => `<li><b>${d.id}</b> ${esc(d.text)}</li>`).join("")}</ul>

<h2>9. Questions to expect</h2>
<div class="qa">${M.LIKELY_QUESTIONS.map(x => `<b>${esc(x.q)}</b>${esc(x.a)}`).join("")}</div>

<h2>10. Limitations and what's next</h2>
<div class="box blue"><b>Limitations of this MVP.</b> All data is synthetic. Dimension scores are generated directly, not computed from measures.
Weights, band edges and thresholds are uncalibrated placeholders and cannot yet be changed without editing the configuration file.</div>
<h3>Next steps</h3>
<ol>${M.WHATS_NEXT.map(t => `<li>${esc(t)}</li>`).join("")}</ol>
<div class="box"><b>Configurable scoring methods.</b> A future iteration will make the weights, bands, thresholds and quadrant split configurable instead of fixed defaults.</div>
</body></html>`;

const tmp = resolve(tmpdir(), "dve-scoring-model.html");
writeFileSync(tmp, html, "utf8");
mkdirSync(outDir, { recursive: true });
if (existsSync(out)) rmSync(out);
execFileSync(EDGE, ["--headless=new", "--disable-gpu", "--no-pdf-header-footer",
  `--print-to-pdf=${out}`, pathToFileURL(tmp).href], { stdio: "inherit", timeout: 60000 });
console.log("Wrote", out);
