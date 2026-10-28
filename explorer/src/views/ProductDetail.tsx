// src/views/ProductDetail.tsx
import { useParams, useNavigate } from "react-router-dom";
import ReactECharts from "echarts-for-react";
import { useData }    from "../hooks/useData";
import { LABEL_COLOUR, scoreColour } from "../utils/colours";

const DIMS = ["value", "quality", "cost", "risk"] as const;

export default function ProductDetail() {
  const { id }               = useParams<{ id: string }>();
  const { scores, products } = useData();
  const navigate             = useNavigate();

  const product = products.find(p => p.data_product_id === id);
  const prodScores = scores
    .filter(s => s.data_product_id === id)
    .sort((a, b) => a.period.localeCompare(b.period));
  const latest = prodScores[prodScores.length - 1];
  if (!product || !latest) return <div>Product not found</div>;

  const periods = prodScores.map(s => s.period);
  const trendOption = {
    tooltip: { trigger: "axis" },
    legend: { data: ["Value", "Quality", "Cost", "Risk", "Composite"] },
    xAxis: { type: "category", data: periods },
    yAxis: { type: "value", min: 0, max: 100 },
    series: [
      ...DIMS.map(d => ({
        name: d[0].toUpperCase() + d.slice(1), type: "line",
        data: prodScores.map(s => s[`${d}_score`]),
      })),
      { name: "Composite", type: "line", data: prodScores.map(s => s.composite_score),
        lineStyle: { width: 3, type: "dashed" } },
    ],
  };

  return (
    <div>
      <h1>{product.name} {latest.risk_flag && <span className="risk-badge">{"⚠"} RISK</span>}</h1>
      <p>{product.domain} / {product.subdomain} | Tier: {product.tier} | Owner: {product.owner}</p>
      <div className="gauge-row">
        {DIMS.map(dim => (
          <div key={dim} className="gauge-card"
               style={{ borderTop: `4px solid ${scoreColour(latest[`${dim}_score`])}` }}>
            <div className="gauge-dim">{dim.toUpperCase()}</div>
            <div className="gauge-score" style={{ color: scoreColour(latest[`${dim}_score`]) }}>
              {latest[`${dim}_score`]}
            </div>
            <div className="gauge-label" style={{ color: LABEL_COLOUR[latest[`${dim}_label`]] }}>
              {latest[`${dim}_label`]}
            </div>
          </div>
        ))}
        <div className="gauge-card composite">
          <div className="gauge-dim">COMPOSITE</div>
          <div className="gauge-score">{latest.composite_score}</div>
          <div className="gauge-label">{latest.quadrant}</div>
        </div>
      </div>
      <ReactECharts option={trendOption} style={{ height: 320, marginTop: 24 }} />
      <div className="detail-links">
        <button onClick={() => navigate(`/products/${id}/breakdown`)}>Score Breakdown</button>{" "}
        <button onClick={() => navigate(`/products/${id}/assets`)}>Asset Drill-down</button>
      </div>
    </div>
  );
}
