export type PaymentProvider =
  | "cod"
  | "manual"
  | "bkash"
  | "nagad"
  | "sslcommerz";

export type PaymentCatalogEntry = {
  provider: PaymentProvider;
  name: string;
  description: string;
  /**
   * Brand logo under /public/payments
   * (e.g. /payments/bkash.svg). Wide wordmarks (~2.3:1) and square icons both fit.
   */
  logoSrc: string;
  /** First-wave methods can enable; gateways are disabled UI until accounts exist. */
  available: boolean;
};

/** Static catalog of storefront payment methods. Connection state is
 * component memory for now — real rows later via a payments API. */
export const PAYMENT_CATALOG: PaymentCatalogEntry[] = [
  {
    provider: "cod",
    name: "Cash on Delivery",
    description:
      "Customer pays cash when the order arrives. Already works on Aurora and Bazaar checkouts.",
    logoSrc: "/payments/cod.svg",
    available: true,
  },
  {
    provider: "manual",
    name: "Manual Payment",
    description:
      "Customer pays your bKash/Nagad number, then submits a transaction ID and/or screenshot for you to verify — no gateway account needed.",
    logoSrc: "/payments/manual.svg",
    available: true,
  },
  {
    provider: "bkash",
    name: "bKash",
    description:
      "Official bKash merchant checkout — mobile payments at scale once merchant credentials are ready.",
    logoSrc: "/payments/bkash.svg",
    available: false,
  },
  {
    provider: "nagad",
    name: "Nagad",
    description:
      "Nagad merchant API for online payments once your merchant account is approved.",
    logoSrc: "/payments/nagad.svg",
    available: false,
  },
  {
    provider: "sslcommerz",
    name: "SSLCommerz",
    description:
      "Aggregator gateway covering cards, mobile banking, and netbanking in one integration.",
    logoSrc: "/payments/sslcommerz.svg",
    available: false,
  },
];
