// src/views/DecisionQuadrant.tsx
import { useState, useEffect, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { useData }    from "../hooks/useData";
import { useFilters } from "../context/FilterContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useFilteredScores } from "../hooks/useFilteredScores";
import { LABEL_COLOUR } from "../utils/colours";

// [cost, value, quality, name, id, risk_label, risk_flag]
type Point = [number, number, number, string, string, string, boolean];

// The tour deep-links with ?play=1 (start animating) and ?focus=DP001,DP002 (spotlight).
// Keying on the params remounts the view so a new tour step starts fresh.
export default function DecisionQuadrant() {
  const [sp] = useSearchParams();
  return <Quadrant key={sp.toString()} autoplay={sp.get("play") === "1"}
                   focus={sp.get("focus")?.split(",") ?? []} />;
}

function Quadrant({ autoplay, focus }: { autoplay: boolean; focus: string[] }) {
  const { products, periods }         = useData();
  const { filters }                   = useFilters();
  const navigate                      = useNavigate();
  const [animPeriod, setAnimPeriod]   = useState<string | null>(autoplay ? periods[0] : null);
  const [playing, setPlaying]         = useState(autoplay);

  // Follow the global period filter until the user starts animating
  const period = animPeriod ?? filters.period;

  // Auto-advance when playing
  useEffect(() => {
    if (!playing) return;
    const idx = periods.indexOf(period);
    const last = idx >= periods.length - 1;
    const t = setTimeout(() => {
      if (last) setPlaying(false);
      else setAnimPeriod(periods[idx + 1]);
    }, last ? 0 : 900);
    return () => clearTimeout(t);
  }, [playing, period, periods]);

  const periodScores = useFilteredScores(period);
  const data = useMemo<Point[]>(() => periodScores
    .map(s => {
      const p = products.find(p => p.data_product_id === s.data_product_id);
      return [s.cost_score, s.value_score, s.quality_score,
              p?.name || s.data_product_id, s.data_product_id,
              s.risk_label, s.risk_flag];
    }), [periodScores, products]);

  const option = {
    title: { text: `Decision Quadrant — ${period}` },
    tooltip: {
      formatter: (p: { value: Point }) => {
        const d = p.value;
        return `${d[3]}<br/>Cost: ${d[0]} Value: ${d[1]} Quality: ${d[2]}<br/>Risk: ${d[5]}${d[6] ? " ⚠" : ""}`;
      },
    },
    xAxis: { name: "Cost Score",  min: 0, max: 100, splitLine: { lineStyle: { type: "dashed" } } },
    yAxis: { name: "Value Score", min: 0, max: 100, splitLine: { lineStyle: { type: "dashed" } } },
    series: [{
      type: "scatter",
      symbolSize: (v: Point) => Math.max(8, v[2] / 5),
      itemStyle: { color: (p: { value: Point }) => LABEL_COLOUR[p.value[5]] || "#999" },
      // Risk-flagged products get a heavy black outline
      data: data.map(d => {
        const dimmed = focus.length > 0 && !focus.includes(d[4]);
        const spot   = focus.includes(d[4]);
        return {
          value: d,
          itemStyle: {
            opacity: dimmed ? 0.15 : 1,
            ...(d[6] ? { borderColor: "#000", borderWidth: 3 } : {}),
          },
          // Spotlighted products get a name label
          label: spot ? { show: true, formatter: d[3].replace(/ Data Product /, " #"), position: "right" as const,
                          fontWeight: "bold" as const } : undefined,
          symbolSize: spot ? Math.max(18, d[2] / 3) : undefined,
        };
      }),
      markLine: {
        silent: true, symbol: "none",
        lineStyle: { color: "#888", type: "solid" },
        data: [{ xAxis: 50 }, { yAxis: 50 }],
      },
    }],
  };

  return (
    <div>
      <div className="anim-controls">
        <button className="btn btn-primary btn-sm" onClick={() => { setAnimPeriod(periods[0]); setPlaying(false); }}>|&lt;</button>
        <button className="btn btn-primary btn-sm" onClick={() => {
          if (!playing && periods.indexOf(period) >= periods.length - 1) setAnimPeriod(periods[0]);
          setPlaying(p => !p);
        }}>{playing ? "Pause" : "Play"}</button>
        <span>{period}</span>
      </div>
      <ReactECharts option={option} style={{ height: 500 }}
        onEvents={{ click: (p: { value: Point }) => navigate(`/products/${p.value[4]}`) }} />
    </div>
  );
}
