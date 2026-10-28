// src/views/Compare.tsx
import { useState } from "react";
import ReactECharts from "echarts-for-react";
import { useData }    from "../hooks/useData";
import { useFilters } from "../context/FilterContext";
import { scoreColour } from "../utils/colours";

const MAX = 4;

export default function Compare() {
  const { scores, products } = useData();
  const { filters }          = useFilters();
  const [selected, setSelected] = useState<string[]>([]);

  const curr = scores.filter(s => s.period === filters.period);
  const chosen = selected
    .map(id => curr.find(s => s.data_product_id === id))
    .filter((s): s is NonNullable<typeof s> => !!s);
  const nameOf = (id: string) => products.find(p => p.data_product_id === id)?.name ?? id;

  const setAt = (i: number, id: string) =>
    setSelected(sel => { const n = [...sel]; if (id) n[i] = id; else n.splice(i, 1); return n; });

  const option = {
    tooltip: {},
    legend: { data: chosen.map(s => nameOf(s.data_product_id)) },
    radar: { indicator: [{ name: "Value", max: 100 }, { name: "Quality", max: 100 },
                         { name: "Cost", max: 100 }, { name: "Risk", max: 100 }] },
    series: [{
      type: "radar",
      data: chosen.map(s => ({
        name: nameOf(s.data_product_id),
        value: [s.value_score, s.quality_score, s.cost_score, s.risk_score],
      })),
    }],
  };

  const slots = Math.min(MAX, selected.length + 1);

  return (
    <div>
      <h1>Compare Products — {filters.period}</h1>
      <div className="toolbar">
        {Array.from({ length: slots }, (_, i) => (
          <select key={i} value={selected[i] ?? ""} onChange={e => setAt(i, e.target.value)}>
            <option value="">{i < 2 ? "Select product..." : "Add product (optional)..."}</option>
            {products.map(p => (
              <option key={p.data_product_id} value={p.data_product_id}
                      disabled={selected.includes(p.data_product_id) && selected[i] !== p.data_product_id}>
                {p.name}
              </option>
            ))}
          </select>
        ))}
      </div>
      {chosen.length < 2 ? <p className="note">Select at least 2 products to compare.</p> : (
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
          <ReactECharts option={option} style={{ height: 380, flex: "1 1 380px" }} />
          <table style={{ flex: "1 1 380px" }}>
            <thead><tr>
              <th>Product</th><th>Value</th><th>Quality</th><th>Cost</th><th>Risk</th><th>Composite</th>
            </tr></thead>
            <tbody>{chosen.map(s => (
              <tr key={s.data_product_id}>
                <td>{nameOf(s.data_product_id)}</td>
                {[s.value_score, s.quality_score, s.cost_score, s.risk_score].map((v, i) => (
                  <td key={i} style={{ color: scoreColour(v) }}>{v}</td>
                ))}
                <td>{s.composite_score}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
