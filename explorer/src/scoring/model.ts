// src/scoring/model.ts
// Scoring model catalogue, transcribed from the MVP PRD v0.3, section 5.
// Pure data with no imports, so the PDF builder (scripts/build-scoring-pdf.mjs)
// can load it too. Composite weights, label thresholds and the quadrant split
// are NOT here: the pages read them from /data/scoring_config.json.

export const MODEL_SOURCE = "MVP PRD v0.3, section 5";

export type Status = "planned";   // every measure-level input is still to be collected

export interface Measure {
  name: string;
  level: "A" | "U" | "P" | "W";
  unit: string;
  aggregation: string;
  normalization: string;
  status: Status;
}
export interface Criterion { name: string; weight: number; measures: Measure[] }
export interface Dimension {
  key: "value" | "quality" | "cost" | "risk";
  name: string;
  question: string;
  direction: string;
  criteria: Criterion[];
}

export const LEVELS: Record<Measure["level"], string> = {
  A: "Data asset", U: "Upstream object", P: "Data product", W: "CDW (whole warehouse)",
};

const m = (name: string, level: Measure["level"], unit: string, aggregation: string,
           normalization: string): Measure =>
  ({ name, level, unit, aggregation, normalization, status: "planned" });

const ATTEST = (n: string) => m(`Owner attestation: ${n}`, "P", "int, 1-5", "n/a", "lookup");

export const DIMENSIONS: Dimension[] = [
  {
    key: "value", name: "Value",
    question: "Is the data product used, and does its owner say it matters?",
    direction: "High score = High value",
    criteria: [
      { name: "Analytics consumption", weight: 35, measures: [
        m("Power BI semantic models using assets", "A", "count", "distinct count", "log band"),
        m("Power BI reports using assets", "A", "count", "distinct count", "log band"),
        m("Monthly report views", "A", "count", "sum", "log band"),
        m("Direct distinct users", "A", "count", "distinct count", "log band"),
        m("Direct queries per month", "A", "count", "sum", "log band"),
        m("Consuming data products (reuse count)", "P", "count", "distinct count of products with is_reuse = true", "log band"),
      ] },
      { name: "ML/AI consumption", weight: 15, measures: [
        m("ML training jobs reading assets", "A", "count", "distinct count", "log band"),
        m("AI agents / agentic workflows reading assets", "A", "count", "distinct count", "log band"),
        m("ML/AI read operations per month", "A", "count", "sum", "log band"),
      ] },
      { name: "Perceived value: decisions", weight: 25, measures: [ATTEST("decisions")] },
      { name: "Perceived value: operations", weight: 25, measures: [ATTEST("operations")] },
    ],
  },
  {
    key: "quality", name: "Quality",
    question: "Can people trust the data, and is it documented?",
    direction: "High score = High quality",
    criteria: [
      { name: "Profiling and tests", weight: 30, measures: [
        m("Completeness", "A", "%", "size-weighted mean", "linear"),
        m("Validity", "A", "%", "size-weighted mean", "linear"),
        m("Quality test pass rate", "A", "%", "tests-weighted mean", "linear"),
      ] },
      { name: "Reliability", weight: 25, measures: [
        m("ADF ETL success rate", "U", "%", "runs-weighted mean (rule R1)", "linear"),
        m("On-time arrival rate", "U", "%", "runs-weighted mean (rule R1)", "linear"),
      ] },
      { name: "Metadata maturity", weight: 20, measures: [
        m("has_description, has_owner, has_steward, has_lineage, has_glossary_link", "A",
          "bool (5 monthly measures)", "share of assets = true, then mean of 5", "linear"),
      ] },
      { name: "Attestation: decisions", weight: 12.5, measures: [ATTEST("decisions")] },
      { name: "Attestation: operations", weight: 12.5, measures: [ATTEST("operations")] },
    ],
  },
  {
    key: "cost", name: "Cost",
    question: "What does it cost to keep, and how much of that is avoidable?",
    direction: "High score = Efficient (low cost)",
    criteria: [
      { name: "Storage", weight: 35, measures: [
        m("Allocated size, all layers (Raw Data, Curated, BIPRSD)", "A", "GB", "allocated sum", "log band, inverse"),
      ] },
      { name: "Compute", weight: 30, measures: [
        m("Stored procedure CPU time", "U", "CPU-hours", "allocated sum", "log band, inverse"),
        m("Stored procedure duration", "U", "hours", "allocated sum", "log band, inverse"),
        m("ADF run cost", "U", "CAD", "allocated sum", "log band, inverse"),
      ] },
      { name: "Duplication", weight: 10, measures: [
        m("is_duplicate (asset overlaps or is a near-copy)", "A", "bool", "share of assets = true (rule R2)", "linear, inverse"),
      ] },
      { name: "Time tax", weight: 25, measures: [
        m("Hours for changes, reconciliation, incidents (3 measures)", "P", "hours", "sum", "log band, inverse"),
      ] },
    ],
  },
  {
    key: "risk", name: "Risk",
    question: "What happens if the data is leaked, misused or wrong?",
    direction: "High score = Safe (low risk)",
    criteria: [
      { name: "Privacy sensitivity", weight: 40, measures: [
        m("PII level and Privacy-confirmed, derived from tag history", "A", "string; bool",
          "max of effective level (rule R3)", "lookup (table L1)"),
      ] },
      { name: "Exposure", weight: 35, measures: [
        m("External reporting, ML use, automated decisions (3 flags)", "A", "bool", "any", "lookup (table L2)"),
        m("Access breadth (distinct principals)", "A", "count", "distinct count", "log band, inverse"),
      ] },
      { name: "Decision and reputation", weight: 25, measures: [
        m("Owner attestation of impact if wrong or leaked", "P", "int, 1-5", "n/a", "lookup, inverse"),
      ] },
    ],
  },
];

// Score given to each of the 7 bands. Edges e1..e6 are per-measure (table B1).
export const BAND_SCORES = {
  inverse:    [100, 85, 70, 55, 40, 20, 5],
  nonInverse: [5, 20, 40, 55, 70, 85, 100],
};

export interface BandRow {
  measure: string; unit: string; dir: "inverse" | "non-inverse"; edges: number[];
}
export const BANDS: BandRow[] = [
  { measure: "Power BI semantic models",       unit: "count", dir: "non-inverse", edges: [1, 2, 4, 8, 15, 30] },
  { measure: "Power BI reports",               unit: "count", dir: "non-inverse", edges: [1, 3, 10, 25, 60, 150] },
  { measure: "Monthly report views",           unit: "count", dir: "non-inverse", edges: [10, 100, 500, 2000, 10000, 50000] },
  { measure: "Direct distinct users",          unit: "count", dir: "non-inverse", edges: [1, 3, 10, 25, 60, 150] },
  { measure: "Direct queries",                 unit: "count", dir: "non-inverse", edges: [10, 100, 1000, 5000, 25000, 100000] },
  { measure: "Consuming data products (reuse)",unit: "count", dir: "non-inverse", edges: [1, 2, 3, 5, 10, 20] },
  { measure: "ML training jobs",               unit: "count", dir: "non-inverse", edges: [1, 2, 3, 5, 10, 20] },
  { measure: "AI agents / agentic workflows",  unit: "count", dir: "non-inverse", edges: [1, 2, 3, 5, 10, 20] },
  { measure: "ML/AI read operations",          unit: "count", dir: "non-inverse", edges: [10, 100, 1000, 10000, 100000, 1000000] },
  { measure: "Allocated storage",              unit: "GB",    dir: "inverse",     edges: [20, 60, 200, 600, 2000, 6000] },
  { measure: "Stored procedure CPU time",      unit: "CPU-hours", dir: "inverse", edges: [1, 5, 20, 60, 200, 600] },
  { measure: "Stored procedure duration",      unit: "hours", dir: "inverse",     edges: [2, 10, 40, 120, 400, 1200] },
  { measure: "ADF run cost",                   unit: "CAD",   dir: "inverse",     edges: [10, 50, 200, 600, 2000, 6000] },
  { measure: "Time tax (sum of 3 measures)",   unit: "hours", dir: "inverse",     edges: [2, 5, 10, 20, 40, 80] },
  { measure: "Access breadth",                 unit: "distinct principals", dir: "inverse", edges: [5, 15, 40, 100, 250, 600] },
];

export const STORAGE_BANDS = [
  { share: "< 0.1%",    gb: "< 20",            score: 100 },
  { share: "0.1% - 0.3%", gb: "20 - 60",       score: 85 },
  { share: "0.3% - 1%", gb: "60 - 200",        score: 70 },
  { share: "1% - 3%",   gb: "200 - 600",       score: 55 },
  { share: "3% - 10%",  gb: "600 - 2,000",     score: 40 },
  { share: "10% - 30%", gb: "2,000 - 6,000",   score: 20 },
  { share: ">= 30%",    gb: ">= 6,000",        score: 5 },
];

export const ATTESTATION = [
  { answer: 1, normal: 0,   inverse: 100 },
  { answer: 2, normal: 25,  inverse: 75 },
  { answer: 3, normal: 50,  inverse: 50 },
  { answer: 4, normal: 75,  inverse: 25 },
  { answer: 5, normal: 100, inverse: 0 },
];

export const L1_PRIVACY = [
  { level: "None", score: 100 }, { level: "Low", score: 70 },
  { level: "Medium", score: 40 }, { level: "High", score: 0 },
];
export const L2_EXPOSURE = [
  { rule: "No flag set", score: "100" },
  { rule: "Deduct for external reporting", score: "-40" },
  { rule: "Deduct for ML use", score: "-30" },
  { rule: "Deduct for automated decisions", score: "-30" },
  { rule: "Minimum", score: "0" },
];

export const RULES = [
  { id: "R1", name: "Reliability", text: "A data product uses all ADF pipelines that feed its assets. Rates are weighted by each pipeline's run count. Rates are not allocated: a shared pipeline counts in full for each product." },
  { id: "R2", name: "Duplication", text: "Product measure = number of assets with is_duplicate = true divided by number of assets in the product." },
  { id: "R3", name: "Privacy", text: "An asset's effective level is its PII level. If the PII level is Low or higher and the asset has no PrivacyReview.Confirmed tag, the effective level is one level higher (maximum High). The product level is the highest effective level of its assets." },
];

export const COST_ALLOCATION = [
  "Master data products (Employer, Worker, Provider) carry 100% of their asset and upstream costs.",
  "A consuming product that uses a master data asset records a reuse link (allocation factor 0). The reuse adds to the master data product's reuse count.",
  "Any other asset in more than one data product: cost divided equally (1/n).",
  "Upstream objects (stored procedures, ADF pipelines, Raw Data tables) that feed assets in more than one product: equal split.",
  "Control: allocated storage for all products plus unassigned CDW storage equals total CDW storage, per period, within 0.01 GB.",
];

export const DECISIONS = [
  { id: "D06", text: "Scores are 0 to 100. Higher is better in every dimension (high cost score = efficient; high risk score = safe)." },
  { id: "D07", text: "Composite score = weighted sum of dimension scores, with explicit, versioned weights." },
  { id: "D08", text: "Risk gate: a product with risk label Exposed is flagged. The composite is not capped." },
  { id: "D11", text: "Quantitative measures use fixed log-scale bands, frozen as absolute units at calibration time. No percentiles." },
  { id: "D21", text: "Default weights, label thresholds and quadrant split are accepted for the MVP. They are placeholders until calibration with real data." },
  { id: "D22", text: "Log-band reference values are absolute monthly values at data product level, set for the synthetic data. They are recalibrated with real data in the target solution." },
];

// Likely challenges, with an honest answer for each. Drafted from the PRD
// decision log; the presenter should adjust wording to taste.
export const LIKELY_QUESTIONS = [
  { q: "Why these weights (34 / 33 / 23 / 10)?",
    a: "They are proposed defaults that keep the ratio of the original 10/10/7/3 maximums (D21). They are placeholders until calibration with real data, and the weights are explicit and versioned so any change is traceable." },
  { q: "Why log-scale bands instead of a straight scale or percentiles?",
    a: "Usage, size and cost span orders of magnitude, so equal-width bands would put almost every product in the bottom band. Bands are frozen as absolute units rather than percentiles (D11), so a product's score does not change just because other products changed." },
  { q: "Isn't owner attestation subjective?",
    a: "Yes. It is used where no system can measure the answer (perceived value, impact if wrong or leaked), on a 1-5 scale with a fixed lookup, and it is only part of each dimension. Value and Quality use 50% and 25% attestation respectively. The roadmap includes a plan for collecting attestations from data owners." },
  { q: "A product with a terrible Risk score can still have a high composite. Why?",
    a: "Risk carries 10% of the composite on purpose, and the composite is not capped (D08). Instead, any product whose Risk label is Exposed is flagged wherever the composite is shown, so the risk cannot be hidden by good scores elsewhere." },
  { q: "Why is Cost (and not Risk or Quality) one of the two quadrant axes?",
    a: "The quadrant answers a portfolio question: is this worth what it costs? Value against Cost gives four actions (keep and extend, reduce cost, monitor and promote use, review for archive). Quality is shown as point size and risk as point colour (D09)." },
  { q: "Are these numbers real?",
    a: "No. All data in this explorer is synthetic, and this MVP generates dimension scores directly instead of computing them from measures. The measure-level model on these pages is the design that real data collection will feed." },
];

export const WHATS_NEXT = [
  "Review the functionality of the Data Value Explorer.",
  "Implement the ability to capture user feedback.",
  "Review and refine the scoring model.",
  "Implement configurable scoring methods.",
  "Define the measures to be collected and their sources.",
  "Develop a roadmap for the collection of measures and data owner attestation over the data products.",
];

export const PDF_FILE = "Data_Value_Explorer_Scoring_Model.pdf";
export const PDF_URL  = `/docs/${PDF_FILE}`;
