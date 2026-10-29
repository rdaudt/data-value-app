// src/views/AssetDrilldown.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useData } from "../hooks/useData";
import { piiColour } from "../utils/colours";

export default function AssetDrilldown() {
  const { id }                         = useParams<{ id: string }>();
  const { assets, assetMap, products } = useData();
  const navigate                       = useNavigate();

  const product = products.find(p => p.data_product_id === id);
  const myAssetIds = new Set(assetMap.filter(m => m.data_product_id === id).map(m => m.asset_id));
  const myAssets = assets.filter(a => myAssetIds.has(a.asset_id));

  return (
    <div>
      <h1>Assets — {product?.name}</h1>
      <p className="note">
        PII level is a static attribute in this build. Per-period tag history
        and measure detail will be added in the full build.
      </p>
      <table className="table table-striped table-hover table-sm">
        <thead><tr>
          <th>FQN</th><th>Type</th><th>Layer</th><th>Rows</th><th>PII Level</th>
        </tr></thead>
        <tbody>{myAssets.map(a => (
          <tr key={a.asset_id} onClick={() => navigate(`/assets/${a.asset_id}`)}
              style={{ cursor: "pointer" }}>
            <td>{a.fqn}</td>
            <td>{a.type}</td>
            <td>{a.layer}</td>
            <td>{Number(a.row_count).toLocaleString()}</td>
            <td style={{ color: piiColour(a.pii_level) }}>{a.pii_level}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
