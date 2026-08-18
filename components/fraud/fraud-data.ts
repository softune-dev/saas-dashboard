/** Checkout rules that evaluate the CURRENT order only — no history needed. */
export type FraudRuleId =
  | "hold_first_high_value"
  | "flag_burst_orders"
  | "block_blocklist";

export type FraudRuleDef = {
  id: FraudRuleId;
  name: string;
  description: string;
  /** Path under /public/sidebar — primary circle in the rules list. */
  icon: string;
  /** When set, the rule has a numeric threshold the merchant configures. */
  threshold?: {
    key: "minOrderTaka" | "windowMinutes";
    label: string;
    suffix: string;
    min: number;
    max: number;
    defaultValue: number;
  };
};

export type BlocklistEntry = {
  id: string;
  phone: string;
  note: string;
  addedAt: string; // ISO date
};

export type FraudRuleState = {
  enabled: boolean;
  /** Threshold when the rule has one (taka or minutes). */
  value?: number;
};

export const FRAUD_RULES: FraudRuleDef[] = [
  {
    id: "hold_first_high_value",
    name: "Hold first-time high-value orders",
    description:
      "First-time customers with an order over this amount wait for your review.",
    icon: "/sidebar/orders.svg",
    threshold: {
      key: "minOrderTaka",
      label: "Order value over",
      suffix: "৳",
      min: 500,
      max: 500000,
      defaultValue: 3000,
    },
  },
  {
    id: "flag_burst_orders",
    name: "Flag burst orders from one phone",
    description:
      "If the same phone places 2+ orders inside this window, flag for review.",
    icon: "/sidebar/analytics.svg",
    threshold: {
      key: "windowMinutes",
      label: "Within",
      suffix: "min",
      min: 5,
      max: 1440,
      defaultValue: 30,
    },
  },
  {
    id: "block_blocklist",
    name: "Block blocklisted numbers",
    description:
      "Reject checkout from any phone on your blocklist below.",
    icon: "/sidebar/lock.svg",
  },
];

export function defaultRuleState(): Record<FraudRuleId, FraudRuleState> {
  return {
    hold_first_high_value: {
      enabled: false,
      value: 3000,
    },
    flag_burst_orders: {
      enabled: false,
      value: 30,
    },
    block_blocklist: {
      enabled: true,
    },
  };
}
