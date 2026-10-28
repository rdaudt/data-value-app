// src/views/ProductList.tsx
import { useState, useMemo } from "react";
import { useData }    from "../hooks/useData";
import { useFilters } from "../context/FilterContext";
import { useNavigate } from "react-router-dom";
import { exportCsv }  from "../utils/exportCsv";
import { LABEL_COLOUR } from "../utils/colours";
import type { DataProduct, ParsedScore } from "../types";

type Row = ParsedScore & DataProduct;

const scoreCol = (dim: "value" | "quality" | "cost" | "risk") => ({
  header: dim[0].toUpperCase() + dim.slice(1),
  key: `${dim}_score` as keyof Row,
  cell: (r: Row) => (
    <span style={{ color: LABEL_COLOUR[r[`${dim}_label`]] }}>
      {r[`${dim}_score`]} ({r[`${dim}_label`]})
    </span>
  ),
});

const COLUMNS: { header: string; key: keyof Row; cell?: (r: Row) => React.ReactNode }[] = [
  { header: "Name",   key: "name" },
  { header: "Domain", key: "domain" },
  { header: "Tier",   key: "tier" },
  scoreCol("value"), scoreCol("quality"), scoreCol("cost"), scoreCol("risk"),
  { header: "Composite", key: "composite_score" },
  { header: "Flag", key: "risk_flag", cell: r => (r.risk_flag ? "⚠ RISK" : "") },
  { header: "Quadrant", key: "quadrant" },
];

export default function ProductList() {
  const { scores, products } = useData();
  const { filters }          = useFilters();
  const navigate             = useNavigate();
  const [search, setSearch]  = useState("");
  const [sort, setSort]      = useState<{ key: keyof Row; dir: 1 | -1 } | null>(null);

  // Join scores with product metadata for the selected period
  const rows = useMemo<Row[]>(() => {
    const byId = new Map(products.map(p => [p.data_product_id, p]));
    return scores
      .filter(s => s.period === filters.period &&
        (!filters.domain || byId.get(s.data_product_id)?.domain === filters.domain) &&
        (filters.riskFlag === null || s.risk_flag === filters.riskFlag))
      .map(s => ({ ...byId.get(s.data_product_id)!, ...s }))
      .filter(r => r.data_product_id);
  }, [scores, products, filters]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = q
      ? rows.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)))
      : rows;
    if (sort) {
      const { key, dir } = sort;
      out = [...out].sort((a, b) => {
        const x = a[key], y = b[key];
        return (typeof x === "number" && typeof y === "number"
          ? x - y
          : String(x).localeCompare(String(y))) * dir;
      });
    }
    return out;
  }, [rows, search, sort]);

  const toggleSort = (key: keyof Row) =>
    setSort(s => (s?.key !== key ? { key, dir: 1 } : s.dir === 1 ? { key, dir: -1 } : null));

  return (
    <div>
      <h1>Product List — {filters.period}</h1>
      <div className="toolbar">
        <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        <button onClick={() => exportCsv(visible, "products.csv")}>Export CSV</button>
        <span className="note">{visible.length} products</span>
      </div>
      <table>
        <thead>
          <tr>{COLUMNS.map(c => (
            <th key={c.header} onClick={() => toggleSort(c.key)} style={{ cursor: "pointer" }}>
              {c.header}{sort?.key === c.key ? (sort.dir === 1 ? "▲" : "▼") : ""}
            </th>
          ))}</tr>
        </thead>
        <tbody>{visible.map(r => (
          <tr key={r.data_product_id} onClick={() => navigate(`/products/${r.data_product_id}`)}
              style={{ cursor: "pointer" }}>
            {COLUMNS.map(c => <td key={c.header}>{c.cell ? c.cell(r) : String(r[c.key])}</td>)}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
