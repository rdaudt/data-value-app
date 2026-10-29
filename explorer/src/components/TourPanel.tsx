// src/components/TourPanel.tsx — presenter bar shown while a tour is running
import { useEffect } from "react";
import { useTour } from "../tour/TourContext";

export default function TourPanel() {
  const { tour, next, prev, exit } = useTour();

  // Presenter keys: → / space / PageDown = next, ← / PageUp = back, Esc = exit
  useEffect(() => {
    if (!tour) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); prev(); }
      else if (e.key === "Escape") exit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!tour) return null;
  const step = tour.steps[tour.index];
  const last = tour.index === tour.steps.length - 1;

  return (
    <div className="tour-panel">
      <div className="tour-head">
        <span className="tour-tag">{step.section ?? tour.name}</span>
        <span className="tour-count">Step {tour.index + 1} of {tour.steps.length}</span>
        <div className="tour-bar"><div style={{ width: `${((tour.index + 1) / tour.steps.length) * 100}%` }} /></div>
        <button className="btn btn-outline-light btn-sm" onClick={exit}>Exit tour (Esc)</button>
      </div>
      <div className="tour-body">
        <div className="tour-text">
          <div className="tour-title">{step.title}</div>
          <div>{step.text}</div>
        </div>
        {step.ask && <div className="tour-ask"><strong>Ask the room</strong>{step.ask}</div>}
      </div>
      <div className="tour-nav">
        <button className="btn btn-light btn-sm" onClick={prev} disabled={tour.index === 0}>← Back</button>
        <button className="btn btn-light btn-sm" onClick={last ? exit : next}>{last ? "Finish" : "Next →"}</button>
      </div>
    </div>
  );
}
