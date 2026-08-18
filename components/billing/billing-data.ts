/**
 * Real plan lineup — mirrors landing/components/pricing.tsx exactly (same
 * names, same BDT prices, same feature copy) and app/ai.py's
 * PLAN_AI_DAILY_CAP (same 4 plan ids). There is no payment gateway yet —
 * plan changes are applied manually by the team after a merchant contacts
 * sales, so nothing here simulates a purchase.
 */

export type PlanId = "demo" | "starter" | "growth" | "business";

export type Plan = {
  id: PlanId;
  name: string;
  priceMonthly: number | null;
  description: string;
  features: string[];
  popular?: boolean;
};

/** Only plans a merchant can actually be switched into. Demo is assigned by
 * the team for trial tenants — it isn't something to "switch to". */
export const SWITCHABLE_PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 1190,
    description: "Perfect for new stores and small businesses getting started.",
    features: [
      "50 products",
      "1 Courier integration",
      "Theme editor",
      "Basic analytics",
      "Media library",
      "Manual blocklist",
      "0% Transaction Fee",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    priceMonthly: 2990,
    popular: true,
    description: "Everything you need to scale your growing e-commerce brand.",
    features: [
      "500 products",
      "All courier integrations",
      "Payment gateway integrations",
      "AI Assistant Included",
      "Fraud protection",
      "Priority email support",
      "Advanced Analytics",
      "0% Transaction Fee",
    ],
  },
  {
    id: "business",
    name: "Business",
    priceMonthly: 6990,
    description: "Built for teams managing multiple client storefronts.",
    features: [
      "3 Storefronts",
      "All in Growth",
      "Unlimited products",
      "Extra AI credits",
      "Account Manager",
      "Custom tools",
      "0% Transaction Fee",
    ],
  },
];

export const DEMO_PLAN: Plan = {
  id: "demo",
  name: "Demo",
  priceMonthly: null,
  description: "Internal trial access — assigned by the Softune team, not self-serve.",
  features: [
    "50 AI requests / day",
    "Full dashboard access",
    "1 storefront site",
    "No card required",
  ],
};

export const ALL_PLANS: Plan[] = [DEMO_PLAN, ...SWITCHABLE_PLANS];

export function planById(id: string): Plan | undefined {
  return ALL_PLANS.find((p) => p.id === id);
}
