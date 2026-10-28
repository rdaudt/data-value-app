// src/hooks/useData.ts
import { useState, useEffect } from "react";
import Papa from "papaparse";
import type { DataProduct, DataAsset, ProductAssetMap,
              PowerBIReport, ScoreRow, ParsedScore, Domain } from "../types";

export interface AppData {
  domains:    Domain[];
  products:   DataProduct[];
  assets:     DataAsset[];
  assetMap:   ProductAssetMap[];
  pbiReports: PowerBIReport[];
  scores:     ParsedScore[];
  periods:    string[];
  loading:    boolean;
  error:      string | null;
}

function parseNum(v: string): number { return Number(v) || 0; }

export function useData(): AppData {
  const [data, setData] = useState<AppData>({
    domains:[], products:[], assets:[], assetMap:[],
    pbiReports:[], scores:[], periods:[], loading:true, error:null
  });

  useEffect(() => {
    const base = "/data/";
    const csv  = (f: string) => new Promise<any[]>((res, rej) =>
      Papa.parse(base+f, { header:true, download:true,
        complete: r => res(r.data as any[]),
        error:    e => rej(e) }));

    Promise.all([
      fetch(base+"domains.json").then(r=>r.json()),
      csv("data_products.csv"),
      csv("data_assets.csv"),
      csv("product_asset_map.csv"),
      csv("powerbi_reports.csv"),
      csv("scores.csv"),
    ]).then(([domains, products, assets, assetMap, pbiReports, rawScores]) => {
      const scores: ParsedScore[] = (rawScores as ScoreRow[]).map(r => ({
        ...r,
        value_score:     parseNum(r.value_score as any),
        quality_score:   parseNum(r.quality_score as any),
        cost_score:      parseNum(r.cost_score as any),
        risk_score:      parseNum(r.risk_score as any),
        composite_score: parseNum(r.composite_score as any),
        risk_flag:       r.risk_flag === "true",
      }));
      const periods = [...new Set(scores.map(s=>s.period))].sort();
      setData({domains,products,assets,assetMap,pbiReports,scores,periods,loading:false,error:null});
    }).catch(e => setData(d=>({...d,loading:false,error:String(e)})));
  }, []);

  return data;
}
