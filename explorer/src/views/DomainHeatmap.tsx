// src/views/DomainHeatmap.tsx
import ReactECharts from "echarts-for-react";
import { useData }    from "../hooks/useData";
import { useFilters } from "../context/FilterContext";
import { useFilteredScores } from "../hooks/useFilteredScores";

const DIMS = ["value_score", "quality_score", "cost_score", "risk_score"] as const;
const DIM_LABELS = ["Value", "Quality", "Cost", "Risk"];

export default function DomainHeatmap() {
  const { products } = useData();
  const { filters }          = useFilters();

  const curr = useFilteredScores();
  // Only domains that still have products after filtering
  const inScope = new Set(curr.map(s => s.data_product_id));
  const domains = [...new Set(products.filter(p => inScope.has(p.data_product_id)).map(p => p.domain))];

  // [dimIdx, domainIdx, avgScore] triples for the ECharts heatmap
  const heatData: [number, number, number][] = [];
  domains.forEach((dom, di) => {
    const ids = new Set(products.filter(p => p.domain === dom).map(p => p.data_product_id));
    const domScores = curr.filter(s => ids.has(s.data_product_id));
    DIMS.forEach((dim, ki) => {
      const avg = domScores.length
        ? Math.round(domScores.reduce((s, r) => s + r[dim], 0) / domScores.length)
        : 0;
      heatData.push([ki, di, avg]);
    });
  });

  const option = {
    tooltip: {
      formatter: (p: { data: [number, number, number] }) =>
        `${domains[p.data[1]]} / ${DIM_LABELS[p.data[0]]}: ${p.data[2]}`,
    },
    grid: { left: 110, bottom: 70 },
    xAxis: { type: "category", data: DIM_LABELS },
    yAxis: { type: "category", data: domains },
    visualMap: {
      min: 0, max: 100, calculable: true, orient: "horizontal", left: "center", bottom: 0,
      inRange: { color: ["#C62828", "#E65100", "#2E7D32"] },
    },
    series: [{ type: "heatmap", data: heatData, label: { show: true } }],
  };

  return (
    <div>
      <h1>Domain Heatmap — {filters.period}</h1>
      <ReactECharts option={option} style={{ height: 460 }} />
    </div>
  );
}
