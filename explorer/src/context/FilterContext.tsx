// src/context/FilterContext.tsx
import { createContext, useContext, useReducer, type ReactNode } from "react";

export interface Filters {
  period:   string;   // e.g. "2026-09"
  domain:   string;   // "" = all
  subdomain:string;
  tier:     string;
  owner:    string;
  steward:  string;
  quadrant: string;
  riskFlag: boolean | null;  // null = all
}

const DEFAULT: Filters = {
  period:"2026-09", domain:"", subdomain:"", tier:"",
  owner:"", steward:"", quadrant:"", riskFlag:null
};

type Action = { type:"SET"; payload: Partial<Filters> } | { type:"RESET" };

function reducer(state: Filters, action: Action): Filters {
  if(action.type==="SET")   return {...state,...action.payload};
  if(action.type==="RESET") return DEFAULT;
  return state;
}

const Ctx = createContext<{filters:Filters; dispatch:React.Dispatch<Action>}>(null!);

export function FilterProvider({children}:{children:ReactNode}) {
  const [filters,dispatch]=useReducer(reducer,DEFAULT);
  return <Ctx.Provider value={{filters,dispatch}}>{children}</Ctx.Provider>;
}

export function useFilters() { return useContext(Ctx); }
