// src/router.tsx
import { createBrowserRouter } from "react-router-dom";
import Shell from "./components/Shell";
// Views — create empty placeholder files first, fill in during Phases 5-6
import PortfolioOverview  from "./views/PortfolioOverview";
import DecisionQuadrant   from "./views/DecisionQuadrant";
import DomainHeatmap      from "./views/DomainHeatmap";
import ProductList        from "./views/ProductList";
import Trends             from "./views/Trends";
import Compare            from "./views/Compare";
import CostSummary        from "./views/CostSummary";
import ProductDetail      from "./views/ProductDetail";
import ScoreBreakdown     from "./views/ScoreBreakdown";
import AssetDrilldown     from "./views/AssetDrilldown";
import AssetDetail        from "./views/AssetDetail";

export const router = createBrowserRouter([{
  path: "/", element: <Shell />, children: [
    { index: true,                  element: <PortfolioOverview /> },
    { path: "quadrant",             element: <DecisionQuadrant /> },
    { path: "heatmap",              element: <DomainHeatmap /> },
    { path: "products",             element: <ProductList /> },
    { path: "products/:id",         element: <ProductDetail /> },
    { path: "products/:id/breakdown",element: <ScoreBreakdown /> },
    { path: "products/:id/assets",  element: <AssetDrilldown /> },
    { path: "assets/:id",           element: <AssetDetail /> },
    { path: "trends",               element: <Trends /> },
    { path: "compare",              element: <Compare /> },
    { path: "cost",                 element: <CostSummary /> },
  ]
}]);
