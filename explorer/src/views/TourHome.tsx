// src/views/TourHome.tsx
import { useTour } from "../tour/TourContext";
import { STORIES, FULL_TOUR } from "../tour/stories";

export default function TourHome() {
  const { start } = useTour();
  return (
    <div>
      <h1>Guided Tour</h1>
      <p className="note" style={{ fontStyle: "normal", fontSize: 14, maxWidth: 760 }}>
        Each story follows one pattern in the synthetic data and shows the decision it supports.
        While a tour runs, use → / ← to move and Esc to exit. Each step ends with a question for the room.
      </p>
      <div className="kpi-row" style={{ marginTop: 16 }}>
        <div className="kpi-card story-card">
          <div className="kpi-label">All stories in order</div>
          <div className="story-title">Full tour</div>
          <div className="kpi-sub">{STORIES.length} stories, {FULL_TOUR.length} steps</div>
          <button className="btn btn-primary" onClick={() => start("all")}>Start full tour</button>
        </div>
        {STORIES.map(s => (
          <div key={s.id} className="kpi-card story-card">
            <div className="kpi-label">Decision: {s.decision}</div>
            <div className="story-title">{s.title}</div>
            <div className="kpi-sub">{s.blurb}</div>
            <div className="kpi-sub">{s.products} · {s.steps.length} steps</div>
            <button className="btn btn-primary" onClick={() => start(s.id)}>Start</button>
          </div>
        ))}
      </div>
    </div>
  );
}
