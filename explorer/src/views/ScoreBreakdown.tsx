// src/views/ScoreBreakdown.tsx
import { useParams } from "react-router-dom";
import { useData }    from "../hooks/useData";
import { useFilters } from "../context/FilterContext";
import { LABEL_COLOUR, scoreColour } from "../utils/colours";

export default function ScoreBreakdown() {
  const { id }               = useParams<{ id: string }>();
  const { scores, products } = useData();
  const { filters }          = useFilters();

  const row = scores.find(s => s.data_product_id === id && s.period === filters.period);
  const product = products.find(p => p.data_product_id === id);
  if (!row || !product) return <div>No data found</div>;

  const WEIGHTS = [
    { dim: "Value",   w: 0.34, score: row.value_score,   label: row.value_label },
    { dim: "Quality", w: 0.33, score: row.quality_score, label: row.quality_label },
    { dim: "Cost",    w: 0.23, score: row.cost_score,    label: row.cost_label },
    { dim: "Risk",    w: 0.10, score: row.risk_score,    label: row.risk_label },
  ];
  const total = WEIGHTS.reduce((n, d) => n + d.score * d.w, 0);

  return (
    <div>
      <h1>Score Breakdown — {product.name} — {filters.period}</h1>
      <p>Formula version: {row.formula_version}
         &nbsp;|&nbsp; Composite = 0.34×Value + 0.33×Quality + 0.23×Cost + 0.10×Risk
         &nbsp;= <strong>{row.composite_score}</strong></p>
      <table className="table table-striped table-sm breakdown-table">
        <thead><tr>
          <th>Dimension</th><th>Weight</th><th>Score</th><th>Label</th>
          <th>Contribution</th><th>Risk Flag</th>
        </tr></thead>
        <tbody>{WEIGHTS.map(({ dim, w, score, label }) => (
          <tr key={dim}>
            <td><strong>{dim}</strong></td>
            <td>{Math.round(w * 100)}%</td>
            <td style={{ color: scoreColour(score) }}><strong>{score}</strong></td>
            <td style={{ color: LABEL_COLOUR[label] }}>{label}</td>
            <td>{(score * w).toFixed(1)}</td>
            <td>{dim === "Risk" && row.risk_flag ? "⚠ Exposed" : ""}</td>
          </tr>
        ))}</tbody>
        <tfoot><tr>
          <td colSpan={4}><strong>Composite Score</strong></td>
          <td><strong>{row.composite_score}</strong> <span className="note">(Σ {total.toFixed(1)})</span></td>
          <td>{row.quadrant}</td>
        </tr></tfoot>
      </table>
      <p className="note">
        Note: this build generates scores directly. A future build will show the full
        measure-level breakdown (criteria, weights, normalised values).
      </p>
    </div>
  );
}
