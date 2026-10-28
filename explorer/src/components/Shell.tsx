// src/components/Shell.tsx
import { Outlet, NavLink } from "react-router-dom";
import { useFilters } from "../context/FilterContext";
import { useData }    from "../hooks/useData";

const NAV = [
  { to:"/",          label:"Portfolio Overview" },
  { to:"/quadrant",  label:"Decision Quadrant" },
  { to:"/heatmap",   label:"Domain Heatmap" },
  { to:"/products",  label:"Product List" },
  { to:"/trends",    label:"Trends" },
  { to:"/compare",   label:"Compare" },
  { to:"/cost",      label:"Cost Summary" },
];

export default function Shell() {
  const { filters, dispatch } = useFilters();
  const { periods, loading, error } = useData();

  if (loading) return <div className="loading">Loading data...</div>;
  if (error)   return <div className="error">Error: {error}</div>;

  return (
    <div className="shell">
      {/* Synthetic data banner */}
      <div className="banner">
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
        </nav>

        <div className="main">
          {/* Top filter bar */}
          <div className="filterbar">
            <label>Period:
              <select value={filters.period}
                onChange={e=>dispatch({type:"SET",payload:{period:e.target.value}})}>
                {periods.map(p=><option key={p}>{p}</option>)}
              </select>
            </label>
            <label>Domain:
              <input value={filters.domain}
                onChange={e=>dispatch({type:"SET",payload:{domain:e.target.value}})}
                placeholder="all" />
            </label>
            <label>Risk flag:
              <select value={filters.riskFlag===null?"all":String(filters.riskFlag)}
                onChange={e=>dispatch({type:"SET",payload:{riskFlag:
                  e.target.value==="all"?null:e.target.value==="true"}})}>
                <option value="all">all</option>
                <option value="true">flagged</option>
                <option value="false">not flagged</option>
              </select>
            </label>
            <button onClick={()=>dispatch({type:"RESET"})}>Reset</button>
          </div>

          <div className="content"><Outlet /></div>
        </div>
      </div>
    </div>
  );
}
