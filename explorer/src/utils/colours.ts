export const LABEL_COLOUR: Record<string,string> = {
  // Value / Quality
  "High":        "#2E7D32",   // green
  "Medium":      "#E65100",   // amber
  "Low":         "#C62828",   // red
  // Cost
  "Efficient":   "#2E7D32",
  "Moderate":    "#E65100",
  "Expensive":   "#C62828",
  // Risk
  "Safe":        "#2E7D32",
  "Exposed":     "#C62828",
};

export function scoreColour(score: number): string {
  if (score >= 67) return "#2E7D32";
  if (score >= 34) return "#E65100";
  return "#C62828";
}

export function piiColour(level: string): string {
  if (level === "High")   return "#C62828";
  if (level === "Medium") return "#E65100";
  if (level === "Low")    return "#1565C0";
  return "#757575";
}
