// src/views/AssetDetail.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useData } from "../hooks/useData";
import { piiColour } from "../utils/colours";

export default function AssetDetail() {
  const { id }                         = useParams<{ id: string }>();
  const { assets, assetMap, products } = useData();
  const navigate                       = useNavigate();

  const asset = assets.find(a => a.asset_id === id);
  const ownerIds = new Set(assetMap.filter(m => m.asset_id === id).map(m => m.data_product_id));
  const ownerProducts = products.filter(p => ownerIds.has(p.data_product_id));
  if (!asset) return <div>Asset not found</div>;

  return (
    <div>
      <h1>Asset: {asset.name}</h1>
      <table>
        <tbody>
          <tr><th>FQN</th><td>{asset.fqn}</td></tr>
          <tr><th>Type</th><td>{asset.type}</td></tr>
          <tr><th>Layer</th><td>{asset.layer}</td></tr>
          <tr><th>Rows</th><td>{Number(asset.row_count).toLocaleString()}</td></tr>
          <tr><th>PII Level</th>
              <td style={{ color: piiColour(asset.pii_level) }}>{asset.pii_level}</td></tr>
        </tbody>
      </table>
      <h2>Used by Data Products</h2>
      <ul>{ownerProducts.map(p => (
        <li key={p.data_product_id} onClick={() => navigate(`/products/${p.data_product_id}`)}
            style={{ cursor: "pointer", color: "#1565C0" }}>{p.name}</li>
      ))}</ul>
      <p className="note">
        Per-period measure and tag history will be shown in the full build.
      </p>
    </div>
  );
}
