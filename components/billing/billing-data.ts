export type PlanId = "starter" | "growth" | "scale";

export type Plan = {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
};

export type InvoiceStatus = "Paid" | "Pending" | "Failed";

export type Invoice = {
  id: string;
  invoiceId: string;
  date: string;
  plan: string;
  amount: string;
  status: InvoiceStatus;
};

export const currentPlan = {
  id: "growth" as PlanId,
  name: "Growth",
  price: "2,490৳",
  period: "month",
  renewsOn: "Sep 8, 2026",
  seats: "1 store · Unlimited products",
  status: "Active" as const,
};

export const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: "990৳",
    period: "month",
    description: "For new stores getting started",
    features: [
      "1 storefront site",
      "Up to 100 products",
      "Basic analytics",
      "Email support",
      "Softune branding",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: "2,490৳",
    period: "month",
    description: "For growing shops that need more power",
    popular: true,
    features: [
      "1 storefront site",
      "Unlimited products",
      "Full analytics + export",
      "Social media funnels",
      "Priority support",
      "Courier Support",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    price: "4,990৳",
    period: "month",
    description: "For high-volume sellers",
    features: [
      "Everything in Growth",
      "Custom domain SSL",
      "Advanced shipping rules",
      "Dedicated success manager",
      "Custom integrations",
      "Courier Support",
      "Priority support",
    ],
  },
];

export const invoices: Invoice[] = [
  {
    id: "1",
    invoiceId: "#INV-24081",
    date: "Aug 8, 2026",
    plan: "Growth",
    amount: "2,490৳",
    status: "Paid",
  },
  {
    id: "2",
    invoiceId: "#INV-24052",
    date: "Jul 8, 2026",
    plan: "Growth",
    amount: "2,490৳",
    status: "Paid",
  },
  {
    id: "3",
    invoiceId: "#INV-24021",
    date: "Jun 8, 2026",
    plan: "Growth",
    amount: "2,490৳",
    status: "Paid",
  },
  {
    id: "4",
    invoiceId: "#INV-23990",
    date: "May 8, 2026",
    plan: "Starter",
    amount: "990৳",
    status: "Paid",
  },
  {
    id: "5",
    invoiceId: "#INV-23960",
    date: "Apr 8, 2026",
    plan: "Starter",
    amount: "990৳",
    status: "Paid",
  },
  {
    id: "6",
    invoiceId: "#INV-23930",
    date: "Mar 8, 2026",
    plan: "Starter",
    amount: "990৳",
    status: "Failed",
  },
  {
    id: "7",
    invoiceId: "#INV-23900",
    date: "Feb 8, 2026",
    plan: "Starter",
    amount: "990৳",
    status: "Paid",
  },
  {
    id: "8",
    invoiceId: "#INV-23870",
    date: "Jan 8, 2026",
    plan: "Starter",
    amount: "990৳",
    status: "Pending",
  },
];
