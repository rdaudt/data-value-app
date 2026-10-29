// src/views/Trends.tsx
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useData } from "../hooks/useData";
import { useFilteredProductIds } from "../hooks/useFilteredScores";

const DIMS = [
  { key: "value_label",   name: "Value" },
  { key: "quality_label", name: "Quality" },
  { key: "cost_label",    name: "Cost" },
  { key: "risk_label",    name: "Risk" },
] as const;

export default function Trends() {
  const { scores, periods } = useData();
  const [sp] = useSearchParams();   // tour deep-link: ?from=2026-06&to=2026-09
  const [from, setFrom] = useState<string | null>(sp.get("from"));
  const [to, setTo]     = useState<string | null>(sp.get("to"));
  const ids = useFilteredProductIds();
  const fromPeriod = from ?? periods[0] ?? "";
  const toPeriod   = to   ?? periods[periods.length - 1] ?? "";

  const fromRows = new Map(scores.filter(s => s.period === fromPeriod && ids.has(s.data_product_id)).map(s => [s.data_product_id, s]));
  const toRows   = scores.filter(s => s.period === toPeriod && ids.has(s.data_product_id));

  // Transition counts per dimension: "High → Medium" => n
  const matrices = DIMS.map(({ key, name }) => {
    const counts = new Map<string, number>();
    let changed = 0;
    for (const t of toRows) {
      const f = fromRows.get(t.data_product_id);
      if (!f) continue;
      if (f[key] !== t[key]) changed++;
      const k = `${f[key]} → ${t[key]}`;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    return { name, rows, changed };
  });

  const select = (value: string, set: (v: string) => void) => (
    <select value={value} onChange={e => set(e.target.value)}>
      {periods.map(p => <option key={p}>{p}</option>)}
    </select>
  );

  return (
    <div>
      <h1>Label Transitions</h1>
      <div className="toolbar">
        <label>From: {select(fromPeriod, setFrom)}</label>
        <label>To: {select(toPeriod, setTo)}</label>
      </div>
      <div className="kpi-row">
        {matrices.map(m => (
          <div key={m.name} className="kpi-card" style={{ minWidth: 220 }}>
            <div className="kpi-label">{m.name} — products that changed label</div>
            <div className="kpi-value">{m.changed}</div>
            <table>
              <tbody>{m.rows.map(([k, c]) => (
                <tr key={k}><td>{k}</td><td>{c}</td></tr>
              ))}</tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
