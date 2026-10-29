// src/components/Shell.tsx
import { Outlet, NavLink } from "react-router-dom";
import { useFilters } from "../context/FilterContext";
import { useData }    from "../hooks/useData";
import TourPanel from "./TourPanel";
import logo from "../styles/wsbc/assets/img/worksafebc-logo.jpg";

const NAV = [
  { to:"/tour",      label:"Guided Tour" },
  { to:"/",          label:"Portfolio Overview" },
  { to:"/quadrant",  label:"Decision Quadrant" },
  { to:"/heatmap",   label:"Domain Heatmap" },
  { to:"/products",  label:"Product List" },
  { to:"/trends",    label:"Trends" },
  { to:"/compare",   label:"Compare" },
  { to:"/cost",      label:"Cost Summary" },
];

// Presentation material about the model, not part of the explorer itself
const EXTRA = { to:"/scoring-model", label:"Scoring Model" };

const QUADRANTS = ["Invest", "Optimize", "Maintain", "Retire review"];

export default function Shell() {
  const { filters, dispatch } = useFilters();
  const { periods, products, loading, error } = useData();

  const uniq = (k: "domain"|"tier"|"owner"|"steward") =>
    [...new Set(products.map(p => p[k]).filter(Boolean))].sort();
  const pick = (label: string, key: "domain"|"tier"|"owner"|"steward"|"quadrant", options: string[]) => (
    <label>{label}:
      <select className="form-select form-select-sm" value={filters[key]}
        onChange={e=>dispatch({type:"SET",payload:{[key]:e.target.value}})}>
        <option value="">all</option>
        {options.map(o=><option key={o}>{o}</option>)}
      </select>
    </label>
  );

  if (loading) return <div className="loading">Loading data...</div>;
  if (error)   return <div className="alert alert-danger m-3">Error: {error}</div>;

  return (
    <div className="shell">
      {/* WorkSafeBC compact header */}
      <header>
        <div className="header-thinline"></div>
        <div className="header-topline">
          <div className="header-curve"></div>
        </div>
        <div className="pb-2">
          <div className="container-fluid">
            <img className="img-fluid" src={logo} alt="WorkSafeBC" />{" "}
            <span className="sub-text">Data Value Explorer</span>
          </div>
        </div>
      </header>

      {/* Synthetic data notice */}
      <div className="notice">
        All data in this explorer is synthetic and for demonstration purposes only.
      </div>

      <div className="layout">
        {/* Left navigation */}
        <nav className="sidebar">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to==="/"} className={({isActive})=>
              isActive ? "nav-item active" : "nav-item"}>
              {n.label}
            </NavLink>
          ))}
          <NavLink to={EXTRA.to} className={({isActive})=>
            isActive ? "nav-item nav-extra active" : "nav-item nav-extra"}>
            {EXTRA.label}
          </NavLink>
        </nav>

        <div className="main">
          {/* Top filter bar */}
          <div className="filterbar">
            <label>Period:
              <select className="form-select form-select-sm" value={filters.period}
                onChange={e=>dispatch({type:"SET",payload:{period:e.target.value}})}>
                {periods.map(p=><option key={p}>{p}</option>)}
              </select>
            </label>
            {pick("Domain",  "domain",  uniq("domain"))}
            {pick("Tier",    "tier",    uniq("tier"))}
            {pick("Owner",   "owner",   uniq("owner"))}
            {pick("Steward", "steward", uniq("steward"))}
            {pick("Quadrant","quadrant", QUADRANTS)}
            <label>Risk flag:
              <select className="form-select form-select-sm" value={filters.riskFlag===null?"all":String(filters.riskFlag)}
                onChange={e=>dispatch({type:"SET",payload:{riskFlag:
                  e.target.value==="all"?null:e.target.value==="true"}})}>
                <option value="all">all</option>
                <option value="true">flagged</option>
                <option value="false">not flagged</option>
              </select>
            </label>
            <button className="btn btn-primary btn-sm" onClick={()=>dispatch({type:"RESET"})}>Reset</button>
          </div>

          <div className="app-content"><Outlet /></div>
          <TourPanel />
        </div>
      </div>

      <footer>
        <div className="footer-curve"><div className="footer-curve-bg"></div></div>
        <div className="footer-top py-2">
          <div className="container-fluid">
            <a target="_blank" rel="noreferrer" className="contactus"
               href="https://www.worksafebc.com/en/contact-us">Contact us</a>
          </div>
        </div>
        <div className="footer-bottom p-2">
          <div className="container-fluid text-end">
            <a target="_blank" rel="noreferrer"
               href="https://www.worksafebc.com/en/legal/copyright-and-trademark/">Copyright {new Date().getFullYear()}</a>
            {" | "}
            <a target="_blank" rel="noreferrer"
               href="https://www.worksafebc.com/en/legal/terms-of-use">Terms of use</a>
            {" | "}
            <a target="_blank" rel="noreferrer"
               href="https://www.worksafebc.com/en/about-us/fairness-privacy/protection-of-privacy">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
