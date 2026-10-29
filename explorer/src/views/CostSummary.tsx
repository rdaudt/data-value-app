// src/views/CostSummary.tsx
import ReactECharts from "echarts-for-react";
import { useData }    from "../hooks/useData";
import { useFilters } from "../context/FilterContext";
import { useFilteredScores } from "../hooks/useFilteredScores";
import { scoreColour } from "../utils/colours";

export default function CostSummary() {
  const { products } = useData();
  const { filters }          = useFilters();

  const curr = useFilteredScores();
  const domainOf = new Map(products.map(p => [p.data_product_id, p.domain]));
  const domains = [...new Set(curr.map(s => domainOf.get(s.data_product_id)!))];

  const byDomain = domains.map(d => {
    const rows = curr.filter(s => domainOf.get(s.data_product_id) === d);
    const avgCost = rows.length ? Math.round(rows.reduce((n, s) => n + s.cost_score, 0) / rows.length) : 0;
    return { domain: d, avgCost };
  });

  const option = {
    title: { text: `Average cost score by domain — ${filters.period}` },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: byDomain.map(d => d.domain) },
    yAxis: { type: "value", min: 0, max: 100, name: "Avg Cost Score (higher = more efficient)" },
    series: [{
      type: "bar",
      label: { show: true, position: "top" },
      data: byDomain.map(d => ({ value: d.avgCost, itemStyle: { color: scoreColour(d.avgCost) } })),
    }],
  };

  return (
    <div>
      <h1>Cost Summary</h1>
      <ReactECharts option={option} style={{ height: 420 }} />
    </div>
  );
}
