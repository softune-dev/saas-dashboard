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
  /** False = locked behind a plan (Unlock CTA). Gateways are connectable. */
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
    logoSrc: "/payments/cod.webp",
    available: true,
  },
  {
    provider: "manual",
    name: "Manual Payment",
    description:
      "Customer pays your bKash/Nagad number, then submits a transaction ID and/or screenshot for you to verify — no gateway account needed.",
    logoSrc: "/payments/manual.webp",
    available: true,
  },
  {
    provider: "bkash",
    name: "bKash",
    description:
      "Official bKash merchant checkout — mobile payments at scale once merchant credentials are ready.",
    logoSrc: "/payments/bkash.webp",
    available: true,
  },
  {
    provider: "nagad",
    name: "Nagad",
    description:
      "Nagad merchant API for online payments once your merchant account is approved.",
    logoSrc: "/payments/nagad.webp",
    available: true,
  },
  {
    provider: "sslcommerz",
    name: "SSLCommerz",
    description:
      "Aggregator gateway covering cards, mobile banking, and netbanking in one integration.",
    logoSrc: "/payments/sslcommerz.webp",
    available: true,
  },
];
