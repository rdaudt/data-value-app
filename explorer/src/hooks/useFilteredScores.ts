// src/hooks/useFilteredScores.ts
import { useMemo } from "react";
import { useData }    from "./useData";
import { useFilters } from "../context/FilterContext";
import type { ParsedScore } from "../types";

// Ids of products matching the product-attribute filters (not period-specific)
export function useFilteredProductIds(): Set<string> {
  const { products } = useData();
  const { filters }  = useFilters();
  return useMemo(() => new Set(products
    .filter(p =>
      (!filters.domain    || p.domain    === filters.domain) &&
      (!filters.subdomain || p.subdomain === filters.subdomain) &&
      (!filters.tier      || p.tier      === filters.tier) &&
      (!filters.owner     || p.owner     === filters.owner) &&
      (!filters.steward   || p.steward   === filters.steward))
    .map(p => p.data_product_id)), [products, filters]);
}

// Scores for one period (default: the selected period) that pass every filter
export function useFilteredScores(period?: string): ParsedScore[] {
  const { scores }  = useData();
  const { filters } = useFilters();
  const ids         = useFilteredProductIds();
  const p           = period ?? filters.period;
  return useMemo(() => scores.filter(s =>
    s.period === p && ids.has(s.data_product_id) &&
    (!filters.quadrant || s.quadrant === filters.quadrant) &&
    (filters.riskFlag === null || s.risk_flag === filters.riskFlag)),
    [scores, ids, filters.quadrant, filters.riskFlag, p]);
}
