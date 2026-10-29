// src/views/ScoringModel.tsx
// Presenter-led walkthrough of the draft scoring model. Static pages, except
// step 7 which runs real scores from the app through the formula.
import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { useData }    from "../hooks/useData";
import { useFilters } from "../context/FilterContext";
import { useTour }    from "../tour/TourContext";
import { LABEL_COLOUR, scoreColour } from "../utils/colours";
import {
  DIMENSIONS, LEVELS, BANDS, BAND_SCORES, STORAGE_BANDS, ATTESTATION, L1_PRIVACY, L2_EXPOSURE,
  RULES, COST_ALLOCATION, DECISIONS, LIKELY_QUESTIONS, WHATS_NEXT, MODEL_SOURCE, PDF_URL,
} from "../scoring/model";

interface Config {
  formula_version: string;
  composite_weights: Record<"value"|"quality"|"cost"|"risk", number>;
  label_thresholds: { high: number; low: number };
  dimension_labels: Record<"value"|"quality"|"cost"|"risk", string[]>;
  quadrant_split: number;
  quadrants: Record<string, { action: string }>;
}

const DIMS = ["value", "quality", "cost", "risk"] as const;
const pct = (w: number) => `${Math.round(w * 100)}%`;
const fmt = (n: number) => n.toLocaleString("en-CA");

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <table className="table table-striped table-sm sm-table">
      <thead><tr>{head.map(h => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
    </table>
  );
}

/* ── 1. Big picture ─────────────────────────────────────────────── */
function BigPicture({ cfg }: { cfg: Config }) {
  const w = cfg.composite_weights;
  const chain = [
    ["Measures", "Collected values for each asset, upstream object or data product, every month"],
    ["Normalised", "Each measure converted to 0-100 (bands, linear or lookup)"],
    ["Criteria", "Weighted mean of a criterion's normalised measures"],
    ["Dimensions", "Weighted sum of criteria: Value, Quality, Cost, Risk (0-100)"],
    ["Composite", `${pct(w.value)} Value + ${pct(w.quality)} Quality + ${pct(w.cost)} Cost + ${pct(w.risk)} Risk`],
    ["Outputs", "Labels, risk flag and decision quadrant"],
  ];
  return (
    <>
      <p>Every data product gets one score per dimension each month. The scores are built bottom-up, in steps that can each be shown and checked.</p>
      <div className="sm-chain">
        {chain.map(([t, d], i) => (
          <div key={t} className="sm-chain-step">
            <div className="sm-chain-n">{i + 1}</div>
            <div><strong>{t}</strong><div className="sm-small">{d}</div></div>
          </div>
        ))}
      </div>
      <ul>
        <li>The unit of scoring is the <strong>data product</strong>: a set of data assets with one owner.</li>
        <li>Scores are <strong>0 to 100, and higher is always better</strong> for the organisation, in every dimension.</li>
        <li>Every score record stores the <strong>formula version</strong> ({cfg.formula_version}) it was computed with.</li>
      </ul>
      <div className="sm-callout">
        <strong>What this build does.</strong> This MVP generates the four dimension scores directly. It does not yet compute them from measures,
        because the measures are not collected yet. Steps 1 to 4 of the chain are the design that data collection will feed.
      </div>
    </>
  );
}

/* ── 2. Four dimensions ─────────────────────────────────────────── */
function Dimensions({ cfg }: { cfg: Config }) {
  return (
    <>
      <p>Each dimension answers one question about a data product. They are all scored so that high is good.</p>
      <div className="kpi-row">
        {DIMENSIONS.map(d => {
          const [hi, md, lo] = cfg.dimension_labels[d.key];
          return (
            <div key={d.key} className="kpi-card sm-dim-card">
              <div className="kpi-label">{pct(cfg.composite_weights[d.key])} of composite</div>
              <div className="story-title">{d.name}</div>
              <div className="kpi-sub" style={{ fontSize: ".9rem" }}>{d.question}</div>
              <div className="sm-small">
                <span style={{ color: LABEL_COLOUR[hi] }}>{hi}</span> · <span style={{ color: LABEL_COLOUR[md] }}>{md}</span> · <span style={{ color: LABEL_COLOUR[lo] }}>{lo}</span>
              </div>
              <div className="sm-small">{d.criteria.length} criteria · {d.criteria.reduce((n, c) => n + c.measures.length, 0)} measures</div>
            </div>
          );
        })}
      </div>
      <p className="sm-small">Cost and Risk are inverted on purpose: a high Cost score means efficient (cheap), and a high Risk score means safe. That keeps one rule for the whole model: higher is better.</p>
    </>
  );
}

/* ── 3. Measures and criteria ───────────────────────────────────── */
function Catalogue() {
  const [open, setOpen] = useState<string>("value");
  const dim = DIMENSIONS.find(d => d.key === open)!;
  return (
    <>
      <p>Each dimension is split into criteria with their own weights (they sum to 100% within the dimension). A criterion's measures have equal weight unless the configuration says otherwise.</p>
      <div className="sm-tabs">
        {DIMENSIONS.map(d => (
          <button key={d.key} className={d.key === open ? "btn btn-primary btn-sm" : "btn btn-outline-secondary btn-sm"}
                  onClick={() => setOpen(d.key)}>{d.name}</button>
        ))}
      </div>
      <Table
        head={["Criterion (weight)", "Measure", "Level", "Unit", "Aggregation", "Normalisation", "Status"]}
        rows={dim.criteria.flatMap(c => c.measures.map((m, i) => [
          i === 0 ? <strong>{c.name} ({c.weight}%)</strong> : "",
          m.name, m.level, m.unit, m.aggregation, m.normalization,
          <span className="sm-badge">Planned</span>,
        ]))}
      />
      <p className="sm-small">Level: {Object.entries(LEVELS).map(([k, v]) => `${k} = ${v}`).join(" · ")}.
        &nbsp;<strong>Planned</strong> means no data is collected for this measure yet and the demo data does not include it.</p>
    </>
  );
}

/* ── 4. Turning measures into 0-100 ─────────────────────────────── */
function Normalising() {
  const [all, setAll] = useState(false);
  return (
    <>
      <p>Three methods turn a raw measure into a 0-100 score.</p>
      <ul>
        <li><strong>Log bands</strong> for counts, sizes and costs: seven bands whose edges roughly multiply, because these quantities span orders of magnitude. Edges are fixed absolute values, not percentiles.</li>
        <li><strong>Linear</strong> for percentages and shares: the value is the score (an inverse measure is 100 minus the value).</li>
        <li><strong>Lookup</strong> for owner attestations and privacy or exposure flags: a fixed table.</li>
      </ul>
      <div className="sm-cols">
        <div>
          <h3>Worked example: storage (inverse)</h3>
          <p className="sm-small">Bands are set as a share of total warehouse size, then frozen in GB (here, a 20,000 GB calibration total).</p>
          <Table head={["Share of CDW", "Frozen band (GB)", "Storage score"]}
                 rows={STORAGE_BANDS.map(b => [b.share, b.gb, <strong>{b.score}</strong>])} />
          <p className="sm-small">A product using 15% of the CDW (3,000 GB) falls in the 2,000 to 6,000 GB band and scores 20.</p>
        </div>
        <div>
          <h3>Band scores</h3>
          <Table head={["Band", "Inverse (cost, risk)", "Non-inverse (value)"]}
                 rows={BAND_SCORES.inverse.map((s, i) => [
                   i === 0 ? "below e1" : i === 6 ? "e6 and above" : `e${i} to e${i + 1}`, s, BAND_SCORES.nonInverse[i]])} />
          <p className="sm-small">Zero rule: a non-inverse count measure with value 0 scores 0. No consumption means no value from that measure.</p>
          <h3>Owner attestation (1-5)</h3>
          <Table head={["Answer", "Score", "Inverse score"]}
                 rows={ATTESTATION.map(a => [a.answer, a.normal, a.inverse])} />
        </div>
      </div>
      <button className="btn btn-outline-secondary btn-sm" onClick={() => setAll(!all)}>
        {all ? "Hide" : "Show"} edges for every log-band measure
      </button>
      {all && (
        <Table head={["Measure", "Unit / month", "Direction", "e1", "e2", "e3", "e4", "e5", "e6"]}
               rows={BANDS.map(b => [b.measure, b.unit, b.dir, ...b.edges.map(fmt)])} />
      )}
      <p className="sm-small">Edges are calibrated to the synthetic data and will be recalibrated with real data (decision D22).</p>
    </>
  );
}

/* ── 5. Rolling up ──────────────────────────────────────────────── */
function RollUp({ cfg }: { cfg: Config }) {
  const w = cfg.composite_weights;
  return (
    <>
      <ol>
        <li><strong>Criterion score</strong> = weighted mean of its normalised measures.</li>
        <li><strong>Dimension score</strong> = weighted sum of its criterion scores.</li>
        <li><strong>Composite</strong> = weighted sum of the four dimension scores.</li>
      </ol>
      <div className="sm-formula">
        Composite = {w.value} × Value + {w.quality} × Quality + {w.cost} × Cost + {w.risk} × Risk
      </div>
      <div className="sm-bars">
        {DIMS.map(d => (
          <div key={d} className="sm-bar-row">
            <span className="sm-bar-label">{d[0].toUpperCase() + d.slice(1)}</span>
            <div className="sm-bar"><div style={{ width: pct(w[d]) }} /></div>
            <span className="sm-bar-val">{pct(w[d])}</span>
          </div>
        ))}
      </div>
      <h3>Rounding</h3>
      <p>Intermediate values (normalised measures, criterion scores) are kept with 2 decimals. Only dimension and composite scores are rounded to whole numbers (half up). Labels, the risk flag and the quadrant all use the rounded dimension scores.</p>
      <h3>Why these weights</h3>
      <p>The defaults keep the ratio of the original 10/10/7/3 maximums. They are proposed placeholders until calibration with real data.</p>
    </>
  );
}

/* ── 6. Labels, flag, quadrant ──────────────────────────────────── */
function Outputs({ cfg }: { cfg: Config }) {
  const { high, low } = cfg.label_thresholds;
  const split = cfg.quadrant_split;
  const q = cfg.quadrants;
  const cells: [string, string, string][] = [
    ["Optimize", "Value ≥ " + split + ", Cost < " + split, q.optimize.action],
    ["Invest", "Value ≥ " + split + ", Cost ≥ " + split, q.invest.action],
    ["Retire review", "Value < " + split + ", Cost < " + split, q.retire_review.action],
    ["Maintain", "Value < " + split + ", Cost ≥ " + split, q.maintain.action],
  ];
  return (
    <>
      <div className="sm-cols">
        <div>
          <h3>Labels</h3>
          <p className="sm-small">Each dimension score maps to a label. Score ≥ {high}: top label. {low + 1} to {high - 1}: middle. ≤ {low}: bottom.</p>
          <Table head={["Dimension", `≥ ${high}`, `${low + 1} - ${high - 1}`, `≤ ${low}`]}
                 rows={DIMS.map(d => [d[0].toUpperCase() + d.slice(1),
                   ...cfg.dimension_labels[d].map(l => <span style={{ color: LABEL_COLOUR[l], fontWeight: 700 }}>{l}</span>)])} />
          <h3>Risk flag</h3>
          <p>A product whose Risk label is <strong style={{ color: LABEL_COLOUR.Exposed }}>Exposed</strong> is flagged next to its composite everywhere. The composite is <em>not</em> capped (decision D08).</p>
        </div>
        <div>
          <h3>Decision quadrant</h3>
          <p className="sm-small">Value (vertical) against Cost score (horizontal, right = efficient), split at {split} on both axes. Quality is point size and risk is point colour.</p>
          <div className="sm-quad">
            {cells.map(([name, cond, action]) => (
              <div key={name} className="sm-quad-cell">
                <strong>{name}</strong>
                <div className="sm-small">{cond}</div>
                <div>{action}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── 7. Live worked example ─────────────────────────────────────── */
function LiveExample({ cfg }: { cfg: Config }) {
  const { scores, products } = useData();
  const { filters }          = useFilters();
  const [pid, setPid]        = useState("");
  const rows = scores.filter(s => s.period === filters.period);
  const id   = pid || rows[0]?.data_product_id;
  const row  = rows.find(s => s.data_product_id === id);
  const product = products.find(p => p.data_product_id === id);
  if (!row || !product) return <p>No data for {filters.period}.</p>;

  const w = cfg.composite_weights;
  const parts = DIMS.map(d => ({ d, score: row[`${d}_score`] as number, label: row[`${d}_label`] as string }));
  const sum   = parts.reduce((n, p) => n + p.score * w[p.d], 0);
  const split = cfg.quadrant_split;
  return (
    <>
      <div className="toolbar">
        <label>Data product:&nbsp;
          <select className="form-select form-select-sm" style={{ width: 360 }} value={id}
                  onChange={e => setPid(e.target.value)}>
            {rows.map(r => {
              const p = products.find(x => x.data_product_id === r.data_product_id);
              return <option key={r.data_product_id} value={r.data_product_id}>{p?.name ?? r.data_product_id}</option>;
            })}
          </select>
        </label>
        <span className="sm-small">Period: {filters.period} (change it in the filter bar)</span>
      </div>
      <h3>{product.name}</h3>
      <Table head={["Dimension", "Score", "Label", "Weight", "Score × weight"]}
             rows={parts.map(p => [
               p.d[0].toUpperCase() + p.d.slice(1),
               <strong style={{ color: scoreColour(p.score) }}>{p.score}</strong>,
               <span style={{ color: LABEL_COLOUR[p.label], fontWeight: 700 }}>{p.label}</span>,
               pct(w[p.d]), (p.score * w[p.d]).toFixed(2)])} />
      <div className="sm-formula">
        Composite = {sum.toFixed(2)} → rounds to <strong>{Math.round(sum)}</strong>
        {Math.round(sum) !== row.composite_score && <> (stored: {row.composite_score})</>}
        {row.risk_flag && <span style={{ color: LABEL_COLOUR.Exposed }}> &nbsp;⚠ Risk flag: Exposed</span>}
      </div>
      <p>
        <strong>Quadrant: {row.quadrant}.</strong> Value {row.value_score} is {row.value_score >= split ? "≥" : "<"} {split} and
        Cost {row.cost_score} is {row.cost_score >= split ? "≥" : "<"} {split}, so the action is
        “{cfg.quadrants[row.quadrant.toLowerCase().replace(" ", "_")]?.action}”.
      </p>
      <p className="sm-small">Scores here are the synthetic dimension scores from the demo data. The measures and criteria behind them are not collected yet (see step 3).</p>
    </>
  );
}

/* ── 8. Rules and decisions ─────────────────────────────────────── */
function Rules() {
  return (
    <>
      <div className="sm-cols">
        <div>
          <h3>Calculation rules</h3>
          {RULES.map(r => <p key={r.id}><strong>{r.id} {r.name}.</strong> {r.text}</p>)}
          <h3>Privacy lookup (L1)</h3>
          <Table head={["Effective PII level", "Privacy score"]} rows={L1_PRIVACY.map(l => [l.level, l.score])} />
          <h3>Exposure flags (L2)</h3>
          <Table head={["Any asset in the product", "Exposure flag score"]} rows={L2_EXPOSURE.map(l => [l.rule, l.score])} />
          <p className="sm-small">Exposure criterion = mean of the exposure flag score and the access breadth score.</p>
        </div>
        <div>
          <h3>Cost allocation</h3>
          <ul>{COST_ALLOCATION.map(t => <li key={t}>{t}</li>)}</ul>
          <h3>Design decisions behind the numbers</h3>
          <ul>{DECISIONS.map(d => <li key={d.id}><strong>{d.id}</strong> {d.text}</li>)}</ul>
        </div>
      </div>
      <h3>Questions to expect</h3>
      <div className="sm-qa">
        {LIKELY_QUESTIONS.map(x => (
          <details key={x.q}><summary>{x.q}</summary><p>{x.a}</p></details>
        ))}
      </div>
    </>
  );
}

/* ── 9. What's next ─────────────────────────────────────────────── */
function Next() {
  return (
    <>
      <ol className="sm-next">
        {WHATS_NEXT.map(t => <li key={t}>{t}</li>)}
      </ol>
      <div className="sm-callout">
        <strong>Configurable scoring methods.</strong> In this version the weights, band edges, label thresholds and quadrant split are fixed defaults
        ({MODEL_SOURCE}). A future iteration will make the scoring methods configurable.
      </div>
      <p><a className="btn btn-primary" href={PDF_URL} download>Download the full scoring model (PDF)</a></p>
    </>
  );
}

/* ── Shell of the walkthrough ───────────────────────────────────── */
const STEPS: { title: string; render: (cfg: Config) => ReactNode }[] = [
  { title: "The big picture",                 render: cfg => <BigPicture cfg={cfg} /> },
  { title: "Four dimensions",                 render: cfg => <Dimensions cfg={cfg} /> },
  { title: "Measures and criteria",           render: () => <Catalogue /> },
  { title: "Turning measures into 0-100",     render: () => <Normalising /> },
  { title: "Rolling up to the composite",     render: cfg => <RollUp cfg={cfg} /> },
  { title: "Labels, risk flag, quadrant",     render: cfg => <Outputs cfg={cfg} /> },
  { title: "Live worked example",             render: cfg => <LiveExample cfg={cfg} /> },
  { title: "Rules, decisions, likely questions", render: () => <Rules /> },
  { title: "What's next",                     render: () => <Next /> },
];

export default function ScoringModel() {
  const [params, setParams] = useSearchParams();
  const { tour }            = useTour();
  const [cfg, setCfg]       = useState<Config | null>(null);

  useEffect(() => {
    fetch("/data/scoring_config.json").then(r => r.json()).then(setCfg).catch(() => setCfg(null));
  }, []);

  const step = Math.min(STEPS.length, Math.max(1, Number(params.get("step")) || 1));
  const go = (n: number) => {
    if (n >= 1 && n <= STEPS.length) setParams({ step: String(n) }, { replace: true });
  };

  // Arrow keys move between steps, unless a guided tour owns them or a field has focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tour || tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") go(step + 1);
      if (e.key === "ArrowLeft")  go(step - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!cfg) return <div className="loading">Loading scoring configuration...</div>;

  return (
    <div>
      <h1>Scoring Model</h1>
      <div className="sm-banner">
        Draft scoring model, formula {cfg.formula_version}. Weights, bands and thresholds are fixed defaults in this version;
        configurable scoring methods are planned for a future iteration.
      </div>
      <div className="sm-layout">
        <ol className="sm-steps">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <button className={i + 1 === step ? "sm-step active" : "sm-step"} onClick={() => go(i + 1)}>
                <span className="sm-step-n">{i + 1}</span>{s.title}
              </button>
            </li>
          ))}
        </ol>
        <div className="sm-page">
          <h2 style={{ marginTop: 0 }}>{step}. {STEPS[step - 1].title}</h2>
          {STEPS[step - 1].render(cfg)}
          <div className="sm-nav">
            <button className="btn btn-outline-secondary" disabled={step === 1} onClick={() => go(step - 1)}>◀ Back</button>
            <span className="sm-small">Step {step} of {STEPS.length} · use ← / → to move</span>
            <button className="btn btn-primary" disabled={step === STEPS.length} onClick={() => go(step + 1)}>Next ▶</button>
          </div>
          <div className="sm-foot">
            <a href={PDF_URL} download>⬇ Download the full scoring model (PDF)</a>
          </div>
        </div>
      </div>
    </div>
  );
}
