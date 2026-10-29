// src/tour/stories.ts — scripted demo paths over the synthetic scenarios
import type { Filters } from "../context/FilterContext";

export interface Step {
  path:     string;               // route, with query params the views understand
  filters?: Partial<Filters>;     // applied after a reset, so steps never inherit filters
  title:    string;
  text:     string;
  ask?:     string;               // feedback question for the room
  section?: string;               // set on the combined tour only
}

export interface Story {
  id:       string;
  title:    string;
  decision: string;               // the program decision this story supports
  blurb:    string;
  products: string;
  steps:    Step[];
}

export const STORIES: Story[] = [
  {
    id: "find", title: "Find what matters", decision: "Where to look first",
    blurb: "Filter the portfolio by tier, owner, steward, quadrant and risk flag.",
    products: "All 40 products",
    steps: [
      { path: "/", title: "The portfolio at a glance",
        text: "Six numbers summarise the month: how many products, the average composite and its change, risk flags, and how many score High on value and quality or Efficient on cost.",
        ask: "Which of these would you check first each month?" },
      { path: "/heatmap", title: "How each domain looks",
        text: "Average value, quality, cost and risk per domain. Red is weak, green is strong.",
        ask: "Is domain the right level to manage at, or do you think in other groupings?" },
      { path: "/products", filters: { tier: "Tier1" }, title: "Critical first: Tier 1",
        text: "The tier filter narrows every screen to the most business-critical products.",
        ask: "Are tiers the right way to prioritise attention?" },
      { path: "/products", filters: { owner: "Irene Gomez" }, title: "Owners see their own products",
        text: "Filter by owner to see exactly the products one person is accountable for.",
        ask: "Would owners use this to prepare for committee?" },
      { path: "/products", filters: { steward: "Diana Park" }, title: "Stewards see what they maintain",
        text: "Stewards run the day-to-day. The steward filter gives them their own worklist.",
        ask: "Is the owner / steward split the one you use?" },
      { path: "/products", filters: { quadrant: "Retire review" }, title: "Archive candidates",
        text: "Low value and low cost efficiency: products the model suggests reviewing for archive.",
        ask: "Is 'Retire review' the right trigger, or too strong?" },
      { path: "/products", filters: { riskFlag: true }, title: "Risk-flagged products",
        text: "Ten products carry the risk flag this month. Everything on this screen can be exported to CSV.",
        ask: "Who should see this list, and how often?" },
    ],
  },
  {
    id: "growth", title: "Steady growth", decision: "Which products to extend",
    blurb: "Two products whose value climbs month after month.",
    products: "DP001, DP002",
    steps: [
      { path: "/quadrant?play=1&focus=DP001,DP002", title: "Watch two products climb",
        text: "The animation plays April to September: value rises from 46 to 99 for DP001 and from 42 to 85 for DP002. DP001 crosses into Invest.",
        ask: "Is a monthly view fast enough to catch a trend like this?" },
      { path: "/products/DP001", title: "One product in detail",
        text: "Value is climbing, cost efficiency is improving, quality is steady. The dashed line is the composite." },
      { path: "/compare?ids=DP001,DP002", title: "Compare side by side",
        text: "Same growth story, different cost position: DP001 scores 65 on cost (Invest), DP002 scores 47 (Optimize).",
        ask: "Would you extend a product like DP001 on this evidence alone? What else would you need?" },
    ],
  },
  {
    id: "quality", title: "Quality degradation", decision: "Where to fund quality improvement",
    blurb: "Two products whose quality collapses from July.",
    products: "DP003, DP004",
    steps: [
      { path: "/trends?from=2026-06&to=2026-09", title: "Who changed label?",
        text: "Label transitions between June and September, per dimension. Look at the Quality card: products that dropped a band.",
        ask: "Is June to September the window you would compare?" },
      { path: "/products/DP003", title: "The collapse in one chart",
        text: "Quality falls from 71 in April to 0 in September, starting in July. Composite drops from 62 to 36." },
      { path: "/products/DP003/breakdown", title: "Why the composite fell",
        text: "Quality carries 33% of the composite. At zero it contributes nothing. This view shows the weights and the formula version.",
        ask: "Is this enough to act on, or do you need the underlying measures?" },
    ],
  },
  {
    id: "cost", title: "Cost spike", decision: "Cost management",
    blurb: "Two products whose cost score falls to zero while value stays flat.",
    products: "DP005, DP006",
    steps: [
      { path: "/cost", title: "Start at domain level",
        text: "Average cost score per domain; higher means more efficient.",
        ask: "Do you want cost in dollars here, not only a score?" },
      { path: "/quadrant?play=1&focus=DP005,DP006", title: "Cost falls, value does not",
        text: "The animation plays April to September: both products slide left as cost efficiency drops to 0, while value stays flat. That moves them into Optimize and Retire review.",
        ask: "At what cost score would you open a review?" },
      { path: "/products/DP005", title: "The detail behind the dot",
        text: "Cost goes from 46 to 0 between April and September; the other dimensions barely move." },
    ],
  },
  {
    id: "risk", title: "New PII / risk escalation", decision: "Privacy and exposure review",
    blurb: "Two products whose risk score falls to zero while the composite barely moves.",
    products: "DP007, DP008",
    steps: [
      { path: "/products", filters: { riskFlag: true }, title: "The flagged list",
        text: "DP007 and DP008 are two of the flagged products this month.",
        ask: "Who should be notified when a product becomes flagged?" },
      { path: "/products/DP007", title: "A flag the composite would hide",
        text: "Composite only moves from 56 to 49, but the risk score falls from 46 to 0 and the flag turns on in August. That is why the flag is shown separately." },
      { path: "/products/DP007/breakdown", title: "Why a separate flag",
        text: "Risk carries only 10% of the composite, so a severe risk score hardly shows. The flag fires when the risk label is Exposed.",
        ask: "Is a 10% weight plus a flag the right design for risk?" },
      { path: "/products/DP007/assets", title: "Drill down to the assets",
        text: "The assets behind the product, with their PII level. PII level is static in this build; per-month tag history comes next." },
      { path: "/assets/A0074", title: "One asset",
        text: "A single table: type, layer, row count, PII level, and every data product that uses it.",
        ask: "Is this the level of detail a privacy officer would need?" },
    ],
  },
  {
    id: "retire", title: "Retirement candidates", decision: "Archiving",
    blurb: "Two products whose value falls to zero.",
    products: "DP009, DP010",
    steps: [
      { path: "/products", filters: { quadrant: "Retire review" }, title: "The review list",
        text: "Ten products sit in Retire review this month.",
        ask: "Who decides on archiving, and what evidence would they want?" },
      { path: "/quadrant?play=1&focus=DP009,DP010", title: "Value drains away",
        text: "The animation plays April to September: both products start in Optimize and fall as value drops to zero." },
      { path: "/products/DP009", title: "The detail behind the dot",
        text: "Value falls from 57 to 0 while quality and cost hold steady: nothing is wrong with the product except that nobody uses it.",
        ask: "What would make you confident enough to archive?" },
    ],
  },
];

export const FULL_TOUR: Step[] = STORIES.flatMap(s =>
  s.steps.map(st => ({ ...st, section: s.title })));
