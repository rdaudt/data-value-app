// src/types/index.ts
export interface Domain {
  domain: string;
  subdomains: string[];
}

export interface DataProduct {
  data_product_id: string;
  fqn: string;
  name: string;
  domain: string;
  subdomain: string;
  owner: string;
  steward: string;
  tier: string;
  description: string;
  is_master_data: string;   // "true" | "false"
  scenario: string;
}

export interface DataAsset {
  asset_id: string;
  fqn: string;
  server: string;
  database: string;
  schema: string;
  name: string;
  type: string;            // "table" | "view"
  layer: string;           // "Raw Data" | "Curated" | "BIPRSD"
  row_count: string;
  pii_level: string;       // "None" | "Low" | "Medium" | "High"
}

export interface ProductAssetMap {
  data_product_id: string;
  asset_id: string;
}

export interface PowerBIReport {
  report_id: string;
  type: string;            // "report" | "semantic_model"
  name: string;
  workspace: string;
  linked_data_product_id: string;
}

export interface ScoreRow {
  period: string;          // "2026-04" ... "2026-09"
  data_product_id: string;
  formula_version: string;
  value_score: string;
  quality_score: string;
  cost_score: string;
  risk_score: string;
  composite_score: string;
  value_label: string;
  quality_label: string;
  cost_label: string;
  risk_label: string;
  risk_flag: string;       // "true" | "false"
  quadrant: string;
}

// Parsed (numeric) scores — use these in components
export interface ParsedScore extends Omit<ScoreRow,
  "value_score"|"quality_score"|"cost_score"|"risk_score"|"composite_score"|"risk_flag"> {
  value_score: number;
  quality_score: number;
  cost_score: number;
  risk_score: number;
  composite_score: number;
  risk_flag: boolean;
}
