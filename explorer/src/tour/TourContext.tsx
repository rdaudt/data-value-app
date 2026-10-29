// src/tour/TourContext.tsx
import { createContext, useContext, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useFilters } from "../context/FilterContext";
import { STORIES, FULL_TOUR, type Step } from "./stories";

interface TourState { name: string; steps: Step[]; index: number }

interface TourApi {
  tour:  TourState | null;
  start: (storyId: string) => void;   // a story id, or "all" for the full tour
  next:  () => void;
  prev:  () => void;
  exit:  () => void;
}

const Ctx = createContext<TourApi>(null!);

export function TourProvider({ children }: { children: ReactNode }) {
  const [tour, setTour]   = useState<TourState | null>(null);
  const navigate          = useNavigate();
  const { dispatch }      = useFilters();

  // Every step starts from clean filters so nothing leaks between steps
  const go = (step: Step) => {
    dispatch({ type: "RESET" });
    if (step.filters) dispatch({ type: "SET", payload: step.filters });
    navigate(step.path);
  };

  const start = (id: string) => {
    const story = STORIES.find(s => s.id === id);
    const steps = story ? story.steps : FULL_TOUR;
    setTour({ name: story ? story.title : "Full tour", steps, index: 0 });
    go(steps[0]);
  };
  const move = (delta: number) => {
    if (!tour) return;
    const index = tour.index + delta;
    if (index < 0 || index >= tour.steps.length) return;
    setTour({ ...tour, index });
    go(tour.steps[index]);
  };
  const exit = () => {
    setTour(null);
    dispatch({ type: "RESET" });
    navigate("/tour");
  };

  return (
    <Ctx.Provider value={{ tour, start, next: () => move(1), prev: () => move(-1), exit }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTour() { return useContext(Ctx); }
