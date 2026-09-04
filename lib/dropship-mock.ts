/**
 * Frontend-only mock data for the Dropship feature — NO backend exists yet.
 * This file is the fake "API" every dropship view reads/writes through
 * DropshipMockProvider (components/dropship/dropship-mock-context.tsx), so
 * swapping in real endpoints later means replacing this file's shape with
 * real lib/api/dropship.ts calls, not rewriting every view.
 *
 * Money is integer cents throughout, matching CLAUDE.md rule 7 even in mock
 * data — the UI should already be built against the real shape it'll get
 * from the backend, not a shortcut that needs redoing later.
 */

export type SupplierListing = {
  id: string;
  productName: string;
  image: string | null;
  /** Optional — most of what a listing detail view needs (see
   * listing-detail-modal.tsx) beyond price/stock. Deliberately just a
   * description, not full variant/SEO complexity: the real product still
   * lives on the supplier's own Products page with all of that; a listing
   * is just "which product, at what wholesale price, how much stock." */
  description?: string;
  wholesalePriceCents: number;
  stock: number;
  supplierName: string;
  /** True only for rows this tenant itself supplies (shown in "My Listings"). */
  isMine?: boolean;
  /** Store names currently reselling this listing — only meaningful (and
   * only ever shown) on the supplier's own "My Listings" cards. A supplier
   * should always be able to see who's using their product, not just find
   * out when an order arrives — see the fulfillment-transparency design
   * discussion this feature is built from. */
  resellers?: string[];
};

export type ImportedProduct = {
  id: string;
  listingId: string;
  productName: string;
  image: string | null;
  supplierName: string;
  wholesalePriceCents: number;
  retailPriceCents: number;
  importedAt: string;
};

export type FulfillmentStatus = "pending" | "shipped" | "cancelled";

export type FulfillmentRequest = {
  id: string;
  orderNumber: string;
  resellerName: string;
  productName: string;
  quantity: number;
  wholesalePriceCents: number;
  retailPriceCents: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  status: FulfillmentStatus;
  createdAt: string;
};

export type SettlementDirection = "you_owe" | "owed_to_you";

export type SettlementEntry = {
  id: string;
  counterpartyName: string;
  direction: SettlementDirection;
  amountCents: number;
  orderCount: number;
  periodLabel: string;
  settled: boolean;
};

export const MOCK_SUPPLIER_LISTINGS: SupplierListing[] = [
  {
    id: "sl_1",
    productName: "Cotton Panjabi — Off White",
    image: null,
    wholesalePriceCents: 85000,
    stock: 42,
    supplierName: "Dhaka Fabrics Ltd.",
  },
  {
    id: "sl_2",
    productName: "Leather Wallet — Brown",
    image: null,
    wholesalePriceCents: 45000,
    stock: 120,
    supplierName: "Chattogram Leather Co.",
  },
  {
    id: "sl_3",
    productName: "Wireless Earbuds X2",
    image: null,
    wholesalePriceCents: 120000,
    stock: 8,
    supplierName: "TechBazar Wholesale",
  },
  {
    id: "sl_4",
    productName: "Ceramic Mug Set (4-piece)",
    image: null,
    wholesalePriceCents: 65000,
    stock: 0,
    supplierName: "Rivelle Home Goods",
  },
];

export const MOCK_MY_LISTINGS: SupplierListing[] = [
  {
    id: "ml_1",
    productName: "Handwoven Nakshi Kantha Shawl",
    image: null,
    description:
      "Traditional hand-embroidered Nakshi Kantha shawl, made by artisans in Jashore using " +
      "layered cotton and running-stitch patterns passed down through generations. Each piece " +
      "is one-of-a-kind — patterns vary slightly across the batch.",
    wholesalePriceCents: 95000,
    stock: 16,
    supplierName: "Your store",
    isMine: true,
    resellers: [
      "Ananya Lifestyle",
      "Nokshi Boutique",
      "Desi Threads",
      "Shaari Ghar",
      "Ethnic Attire BD",
      "Rongberonger Haat",
      "Kutir Craft Store",
      "Deshi Fashion House",
      "Nokshikatha Corner",
      "Traditional Trends",
      "Village Weaves",
      "Bangla Boutique",
      "Handloom Hub",
      "Artisan Attire",
      "Heritage Wear BD",
    ],
  },
];

export const MOCK_IMPORTED_PRODUCTS: ImportedProduct[] = [
  {
    id: "ip_1",
    listingId: "sl_2",
    productName: "Leather Wallet — Brown",
    image: null,
    supplierName: "Chattogram Leather Co.",
    wholesalePriceCents: 45000,
    retailPriceCents: 79000,
    importedAt: "2026-08-28T10:00:00Z",
  },
];

export const MOCK_FULFILLMENT_REQUESTS: FulfillmentRequest[] = [
  {
    id: "fr_1",
    orderNumber: "ORD-1042",
    resellerName: "Ananya Lifestyle",
    productName: "Handwoven Nakshi Kantha Shawl",
    quantity: 1,
    wholesalePriceCents: 95000,
    retailPriceCents: 145000,
    customerName: "Rafiq Islam",
    customerPhone: "01712345678",
    customerAddress: "House 12, Road 5, Dhanmondi, Dhaka",
    status: "pending",
    createdAt: "2026-09-03T14:20:00Z",
  },
  {
    id: "fr_2",
    orderNumber: "ORD-0997",
    resellerName: "Nokshi Boutique",
    productName: "Handwoven Nakshi Kantha Shawl",
    quantity: 2,
    wholesalePriceCents: 190000,
    retailPriceCents: 280000,
    customerName: "Mitu Akter",
    customerPhone: "01898765432",
    customerAddress: "Flat 3B, Green Road, Mohammadpur, Dhaka",
    status: "shipped",
    createdAt: "2026-08-30T09:05:00Z",
  },
];

export const MOCK_SETTLEMENTS: SettlementEntry[] = [
  {
    id: "st_1",
    counterpartyName: "Ananya Lifestyle",
    direction: "you_owe",
    amountCents: 50000,
    orderCount: 1,
    periodLabel: "Sep 2026",
    settled: false,
  },
  {
    id: "st_2",
    counterpartyName: "Nokshi Boutique",
    direction: "you_owe",
    amountCents: 90000,
    orderCount: 2,
    periodLabel: "Aug 2026",
    settled: true,
  },
  {
    id: "st_3",
    counterpartyName: "Chattogram Leather Co.",
    direction: "owed_to_you",
    amountCents: 45000,
    orderCount: 1,
    periodLabel: "Sep 2026",
    settled: false,
  },
];
