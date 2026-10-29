// Status colours from the WorkSafeBC palette. Hex (not CSS vars) because
// ECharts draws to canvas and cannot resolve var(--...).
const GOOD = "#888D30";   // mossgreen
const WARN = "#ED8B00";   // orange
const BAD  = "#A4343A";   // huckleberryred
const INFO = "#6399AE";   // mountainblue
const NONE = "#776E64";   // warm grey

export const LABEL_COLOUR: Record<string,string> = {
  // Value / Quality
  "High":        GOOD,
  "Medium":      WARN,
  "Low":         BAD,
  // Cost
  "Efficient":   GOOD,
  "Moderate":    WARN,
  "Expensive":   BAD,
  // Risk
  "Safe":        GOOD,
  "Exposed":     BAD,
};

export function scoreColour(score: number): string {
  if (score >= 67) return GOOD;
  if (score >= 34) return WARN;
  return BAD;
}

export function piiColour(level: string): string {
  if (level === "High")   return BAD;
  if (level === "Medium") return WARN;
  if (level === "Low")    return INFO;
  return NONE;
}
