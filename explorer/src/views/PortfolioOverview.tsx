// src/views/PortfolioOverview.tsx
import { useData }    from "../hooks/useData";
import { useFilters } from "../context/FilterContext";
import type { ParsedScore } from "../types";

function kpi(label: string, value: string | number, sub?: string) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

function avg(scores: ParsedScore[], key: "composite_score") {
  if (!scores.length) return 0;
  return Math.round(scores.reduce((s, r) => s + r[key], 0) / scores.length);
}

export default function PortfolioOverview() {
  const { scores, periods } = useData();
  const { filters }         = useFilters();

  const curr = scores.filter(s => s.period === filters.period);
  const prevPeriod = periods[periods.indexOf(filters.period) - 1];
  const prev = prevPeriod ? scores.filter(s => s.period === prevPeriod) : [];

  const flagged  = curr.filter(s => s.risk_flag).length;
  const avgComp  = avg(curr, "composite_score");
  const prevComp = avg(prev, "composite_score");
  const diff     = avgComp - prevComp;

  return (
    <div>
      <h1>Portfolio Overview — {filters.period}</h1>
      <div className="kpi-row">
        {kpi("Data Products", curr.length)}
        {kpi("Avg Composite", avgComp, prevPeriod ? `${diff >= 0 ? "+" : ""}${diff} vs ${prevPeriod}` : "")}
        {kpi("Risk Flagged", flagged)}
        {kpi("Value High", curr.filter(s => s.value_label === "High").length)}
        {kpi("Quality High", curr.filter(s => s.quality_label === "High").length)}
        {kpi("Cost Efficient", curr.filter(s => s.cost_label === "Efficient").length)}
      </div>
    </div>
  );
}
