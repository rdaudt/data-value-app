// src/main.tsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router-dom"
import { FilterProvider } from "./context/FilterContext"
import { router } from "./router"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FilterProvider>
      <RouterProvider router={router} />
    </FilterProvider>
  </StrictMode>
)
