// Connect Point packages. One place to change prices and amounts.
export type Plan = {
  id: string;
  name: string;
  price: number; // naira
  connections: number;
  blurb: string;
  popular?: boolean;
};

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 1500,
    connections: 3,
    blurb: "For trying things out with a few strong matches.",
  },
  {
    id: "standard",
    name: "Standard",
    price: 3000,
    connections: 7,
    blurb: "Best for most people actively searching this month.",
    popular: true,
  },
  {
    id: "plus",
    name: "Plus",
    price: 5000,
    connections: 15,
    blurb: "For a thorough search with plenty of connections.",
  },
];

export function perConnection(plan: Plan) {
  return Math.round(plan.price / plan.connections);
}