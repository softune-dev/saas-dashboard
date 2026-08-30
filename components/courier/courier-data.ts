import type { CourierProvider } from "@/lib/api/courier";

export type CourierCatalogEntry = {
  provider: CourierProvider;
  name: string;
  description: string;
  /**
   * Brand logo under /public/couriers (e.g. /couriers/pathao.png).
   * Prefer official / high-quality assets over generic icons.
   */
  logoSrc: string;
  /** First-wave providers can connect; others are disabled UI. */
  available: boolean;
};

/** Static catalog of BD couriers. Connection state is separate (component
 * memory for now; real rows later via courier.ts). */
export const COURIER_CATALOG: CourierCatalogEntry[] = [
  {
    provider: "steadfast",
    name: "Steadfast",
    description:
      "Popular ecommerce courier nationwide. Connect with your API Key and Secret Key.",
    logoSrc: "/couriers/steadfast.png",
    available: true,
  },
  {
    provider: "pathao",
    name: "Pathao Courier",
    description:
      "Pathao Parcel merchant API — same-city and nationwide home delivery.",
    logoSrc: "/couriers/pathao.png",
    available: true,
  },
  {
    provider: "redx",
    name: "RedX",
    description: "REDX tech-first logistics for online and offline businesses.",
    logoSrc: "/couriers/redx.svg",
    available: true,
  },
  {
    provider: "paperfly",
    name: "Paperfly",
    description:
      "Union-level doorstep delivery, warehousing, and fulfillment across Bangladesh.",
    logoSrc: "/couriers/paperfly.png",
    available: false,
  },
  {
    provider: "ecourier",
    name: "eCourier",
    description:
      "Ecommerce-focused courier with merchant panel and API for consignments.",
    logoSrc: "/couriers/ecourier.png",
    available: true,
  },
  {
    provider: "sundarban",
    name: "Sundarban Courier",
    description:
      "Long-standing nationwide courier network — document and parcel delivery.",
    logoSrc: "/couriers/sundarban.png",
    available: false,
  },
  {
    provider: "carrybee",
    name: "Carrybee",
    description:
      "Modern ecommerce logistics with merchant tools for online sellers.",
    logoSrc: "/couriers/carrybee.png",
    available: false,
  },
  {
    provider: "sa_paribahan",
    name: "SA Paribahan",
    description:
      "SA Paribahan logistics and parcel services across Bangladesh.",
    logoSrc: "/couriers/sa-paribahan.png",
    available: false,
  },
  {
    provider: "pandago",
    name: "PandaGo",
    description:
      "foodpanda’s B2B delivery (PandaGo) for restaurant and retail merchants.",
    logoSrc: "/couriers/pandago.png",
    available: false,
  },
];

