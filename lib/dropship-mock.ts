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

/** Delivery coverage a supplier can actually fulfill to — same "Inside
 * Dhaka / Outside Dhaka" split the storefront checkout itself already asks
 * customers for (see templates/*'s delivery_location), not a new
 * vocabulary invented just for this feature. */
export const DELIVERY_LOCATIONS = ["Inside Dhaka", "Outside Dhaka"] as const;
export type DeliveryLocation = (typeof DELIVERY_LOCATIONS)[number];

/** A reseller's own storefront category, assigned when importing — mocked
 * here; a real implementation reads this from the reseller's actual
 * Categories page. */
export const MOCK_CATEGORIES = [
  "Fashion",
  "Electronics",
  "Home & Living",
  "Beauty & Personal Care",
  "Accessories",
  "Books & Stationery",
  "Toys & Kids",
  "Other",
] as const;

export type SupplierListing = {
  id: string;
  productName: string;
  image: string | null;
  /** One-line summary — shown on the card and in Browse Suppliers before a
   * reseller opens the detail view. */
  shortDescription?: string;
  /** Longer write-up, shown only in the detail view. */
  description?: string;
  /** Simple color tags, not full per-color stock/pricing variants — a
   * listing tells a reseller "colors we can send," it isn't the real
   * variant system (that stays on the supplier's own Products page). */
  colors?: string[];
  deliveryLocations?: DeliveryLocation[];
  wholesalePriceCents: number;
  stock: number;
  supplierName: string;
  /** Public contact number from the supplier's profile (SupplierProfile.
   * publicPhone) — what "Contact Supplier" opens a WhatsApp chat to. */
  supplierContact?: string;
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
  /** Which of the reseller's OWN storefront categories this lands in —
   * required at import time, same as any other product they add manually. */
  category: string;
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

export type SettlementMethod = "bkash" | "nagad" | "bank";

/** What a tenant has to provide before they can turn on Supplier mode —
 * previously this was just a toggle, no information collected at all.
 * Split into three groups matching how real B2B marketplaces (and BD's
 * own wholesale networks) onboard a seller: what resellers see before
 * they'll trust and buy from you, what the platform needs to hold someone
 * accountable, and where settlement money actually goes. */
export type SupplierProfile = {
  // Public — shown to resellers browsing the marketplace.
  businessName: string;
  description: string;
  publicPhone: string;
  city: string;

  // Verification — never shown publicly. This is what makes "anyone can
  // flip a switch and start shipping other stores' orders" not true.
  legalBusinessName: string;
  ownerName: string;
  nidOrTradeLicense: string;
  verificationPhone: string;
  fullAddress: string;

  // Settlement — where a reseller sends money when paying this supplier
  // (see Settlements). Private, only visible to a reseller once they
  // actually need to pay this specific supplier.
  paymentMethod: SettlementMethod;
  paymentAccountNumber: string;
  paymentAccountName: string;
};

export type SettlementEntry = {
  id: string;
  counterpartyName: string;
  direction: SettlementDirection;
  amountCents: number;
  orderCount: number;
  periodLabel: string;
  settled: boolean;
};

/** Bangladeshi mobile number -> wa.me's expected digits-only format
 * ("8801XXXXXXXXX"). Same acceptance rule as the backend's
 * app/whatsapp.py::to_whatsapp_number. Returns null for anything that
 * doesn't look like a real BD mobile number. */
export function toWhatsAppNumber(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  const normalized = digits.startsWith("880") ? "0" + digits.slice(3) : digits;
  if (!/^01[3-9]\d{8}$/.test(normalized)) return null;
  return "880" + normalized.slice(1);
}

export type SupplierDirectoryEntry = {
  name: string;
  city: string;
  contact: string;
  description: string;
};

/** One row per real-world supplier — MOCK_SUPPLIER_LISTINGS only carries
 * supplierName/supplierContact per listing (denormalized, like a real
 * catalog table would be), so the Suppliers directory page groups listings
 * by this instead of duplicating profile info onto every listing row. */
export const MOCK_SUPPLIERS_DIRECTORY: SupplierDirectoryEntry[] = [
  {
    name: "Dhaka Fabrics Ltd.",
    city: "Dhaka",
    contact: "01711000001",
    description: "Wholesale cotton wear and handloom textiles.",
  },
  {
    name: "Chattogram Leather Co.",
    city: "Chattogram",
    contact: "01711000002",
    description: "Genuine leather goods — wallets, shoes, belts.",
  },
  {
    name: "TechBazar Wholesale",
    city: "Dhaka",
    contact: "01711000003",
    description: "Consumer electronics and gadgets at wholesale rates.",
  },
  {
    name: "Rivelle Home Goods",
    city: "Gazipur",
    contact: "01711000004",
    description: "Home decor and kitchenware.",
  },
  {
    name: "Sonar Bangla Handicrafts",
    city: "Rajshahi",
    contact: "01711000005",
    description: "Handmade jute and terracotta crafts.",
  },
];

export function buildSupplierContactLink(phone: string, supplierName: string): string | null {
  const number = toWhatsAppNumber(phone);
  if (!number) return null;
  const message = `Hi ${supplierName}, I found your product on Softunebd and wanted to ask about wholesaling it.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export const MOCK_SUPPLIER_LISTINGS: SupplierListing[] = [
  {
    id: "sl_1",
    productName: "Cotton Panjabi — Off White",
    image: null,
    shortDescription: "Breathable cotton panjabi, everyday wear.",
    description:
      "100% cotton panjabi in off-white, tailored for daily wear and light occasions. " +
      "Machine washable, pre-shrunk fabric.",
    colors: ["Off White", "Sky Blue", "Charcoal"],
    deliveryLocations: ["Inside Dhaka", "Outside Dhaka"],
    wholesalePriceCents: 85000,
    stock: 42,
    supplierName: "Dhaka Fabrics Ltd.",
    supplierContact: "01711000001",
  },
  {
    id: "sl_2",
    productName: "Leather Wallet — Brown",
    image: null,
    wholesalePriceCents: 45000,
    stock: 120,
    supplierName: "Chattogram Leather Co.",
    supplierContact: "01711000002",
  },
  {
    id: "sl_3",
    productName: "Wireless Earbuds X2",
    image: null,
    wholesalePriceCents: 120000,
    stock: 8,
    supplierName: "TechBazar Wholesale",
    supplierContact: "01711000003",
  },
  {
    id: "sl_4",
    productName: "Ceramic Mug Set (4-piece)",
    image: null,
    wholesalePriceCents: 65000,
    stock: 0,
    supplierName: "Rivelle Home Goods",
    supplierContact: "01711000004",
  },
  {
    id: "sl_5",
    productName: "Jute Tote Bag — Natural",
    image: null,
    wholesalePriceCents: 32000,
    stock: 85,
    supplierName: "Sonar Bangla Handicrafts",
    supplierContact: "01711000005",
  },
  {
    id: "sl_6",
    productName: "Stainless Steel Water Bottle 1L",
    image: null,
    wholesalePriceCents: 38000,
    stock: 60,
    supplierName: "TechBazar Wholesale",
    supplierContact: "01711000003",
  },
  {
    id: "sl_7",
    productName: "Embroidered Cushion Cover Set",
    image: null,
    wholesalePriceCents: 55000,
    stock: 30,
    supplierName: "Rivelle Home Goods",
    supplierContact: "01711000004",
  },
  {
    id: "sl_8",
    productName: "Men's Formal Leather Shoes",
    image: null,
    wholesalePriceCents: 145000,
    stock: 22,
    supplierName: "Chattogram Leather Co.",
    supplierContact: "01711000002",
  },
  {
    id: "sl_9",
    productName: "Bluetooth Speaker Mini",
    image: null,
    wholesalePriceCents: 98000,
    stock: 14,
    supplierName: "TechBazar Wholesale",
    supplierContact: "01711000003",
  },
  {
    id: "sl_10",
    productName: "Hand-painted Terracotta Vase",
    image: null,
    wholesalePriceCents: 42000,
    stock: 18,
    supplierName: "Sonar Bangla Handicrafts",
    supplierContact: "01711000005",
  },
  {
    id: "sl_11",
    productName: "Cotton Saree — Handloom",
    image: null,
    wholesalePriceCents: 175000,
    stock: 25,
    supplierName: "Dhaka Fabrics Ltd.",
    supplierContact: "01711000001",
  },
  {
    id: "sl_12",
    productName: "Kids Puzzle Toy Set",
    image: null,
    wholesalePriceCents: 28000,
    stock: 50,
    supplierName: "TechBazar Wholesale",
    supplierContact: "01711000003",
  },
];

export const MOCK_MY_LISTINGS: SupplierListing[] = [
  {
    id: "ml_1",
    productName: "Handwoven Nakshi Kantha Shawl",
    image: null,
    shortDescription: "Hand-embroidered shawl from Jashore artisans.",
    description:
      "Traditional hand-embroidered Nakshi Kantha shawl, made by artisans in Jashore using " +
      "layered cotton and running-stitch patterns passed down through generations. Each piece " +
      "is one-of-a-kind — patterns vary slightly across the batch.",
    colors: ["Maroon", "Indigo", "Natural"],
    deliveryLocations: ["Inside Dhaka", "Outside Dhaka"],
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
    category: "Accessories",
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
  {
    id: "fr_3",
    orderNumber: "ORD-1051",
    resellerName: "Village Weaves",
    productName: "Handwoven Nakshi Kantha Shawl",
    quantity: 1,
    wholesalePriceCents: 95000,
    retailPriceCents: 150000,
    customerName: "Farhana Yasmin",
    customerPhone: "01911223344",
    customerAddress: "House 7, Sector 11, Uttara, Dhaka",
    status: "pending",
    createdAt: "2026-09-04T11:10:00Z",
  },
  {
    id: "fr_4",
    orderNumber: "ORD-1049",
    resellerName: "Bangla Boutique",
    productName: "Handwoven Nakshi Kantha Shawl",
    quantity: 3,
    wholesalePriceCents: 285000,
    retailPriceCents: 435000,
    customerName: "Shakil Ahmed",
    customerPhone: "01722334455",
    customerAddress: "Road 9, Banani, Dhaka",
    status: "cancelled",
    createdAt: "2026-09-02T16:40:00Z",
  },
  {
    id: "fr_5",
    orderNumber: "ORD-1038",
    resellerName: "Handloom Hub",
    productName: "Handwoven Nakshi Kantha Shawl",
    quantity: 1,
    wholesalePriceCents: 95000,
    retailPriceCents: 149000,
    customerName: "Tania Rahman",
    customerPhone: "01633445566",
    customerAddress: "Flat 2A, Bashundhara R/A, Dhaka",
    status: "shipped",
    createdAt: "2026-08-29T08:15:00Z",
  },
  {
    id: "fr_6",
    orderNumber: "ORD-1029",
    resellerName: "Artisan Attire",
    productName: "Handwoven Nakshi Kantha Shawl",
    quantity: 2,
    wholesalePriceCents: 190000,
    retailPriceCents: 290000,
    customerName: "Imran Kabir",
    customerPhone: "01544556677",
    customerAddress: "Sector 4, Uttara, Dhaka",
    status: "pending",
    createdAt: "2026-08-26T13:50:00Z",
  },
  {
    id: "fr_7",
    orderNumber: "ORD-1015",
    resellerName: "Heritage Wear BD",
    productName: "Handwoven Nakshi Kantha Shawl",
    quantity: 1,
    wholesalePriceCents: 95000,
    retailPriceCents: 152000,
    customerName: "Nusrat Jahan",
    customerPhone: "01455667788",
    customerAddress: "House 20, Road 2, Baridhara, Dhaka",
    status: "shipped",
    createdAt: "2026-08-20T10:00:00Z",
  },
  {
    id: "fr_8",
    orderNumber: "ORD-0988",
    resellerName: "Ananya Lifestyle",
    productName: "Handwoven Nakshi Kantha Shawl",
    quantity: 2,
    wholesalePriceCents: 190000,
    retailPriceCents: 285000,
    customerName: "Kamrul Hasan",
    customerPhone: "01366778899",
    customerAddress: "Flat 5C, Mirpur DOHS, Dhaka",
    status: "shipped",
    createdAt: "2026-08-18T09:30:00Z",
  },
  {
    id: "fr_9",
    orderNumber: "ORD-0970",
    resellerName: "Nokshi Boutique",
    productName: "Handwoven Nakshi Kantha Shawl",
    quantity: 1,
    wholesalePriceCents: 95000,
    retailPriceCents: 148000,
    customerName: "Rumana Sultana",
    customerPhone: "01277889900",
    customerAddress: "House 33, Road 6, Gulshan, Dhaka",
    status: "cancelled",
    createdAt: "2026-08-15T15:00:00Z",
  },
  {
    id: "fr_10",
    orderNumber: "ORD-0955",
    resellerName: "Village Weaves",
    productName: "Handwoven Nakshi Kantha Shawl",
    quantity: 4,
    wholesalePriceCents: 380000,
    retailPriceCents: 590000,
    customerName: "Jahid Hossain",
    customerPhone: "01188990011",
    customerAddress: "Sector 7, Uttara, Dhaka",
    status: "shipped",
    createdAt: "2026-08-10T12:20:00Z",
  },
  {
    id: "fr_11",
    orderNumber: "ORD-0940",
    resellerName: "Bangla Boutique",
    productName: "Handwoven Nakshi Kantha Shawl",
    quantity: 1,
    wholesalePriceCents: 95000,
    retailPriceCents: 151000,
    customerName: "Sabrina Akter",
    customerPhone: "01099001122",
    customerAddress: "House 14, Road 3, Dhanmondi, Dhaka",
    status: "pending",
    createdAt: "2026-08-05T09:00:00Z",
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
  {
    id: "st_4",
    counterpartyName: "Village Weaves",
    direction: "you_owe",
    amountCents: 95000,
    orderCount: 1,
    periodLabel: "Sep 2026",
    settled: false,
  },
  {
    id: "st_5",
    counterpartyName: "Bangla Boutique",
    direction: "you_owe",
    amountCents: 285000,
    orderCount: 3,
    periodLabel: "Sep 2026",
    settled: false,
  },
  {
    id: "st_6",
    counterpartyName: "Handloom Hub",
    direction: "you_owe",
    amountCents: 95000,
    orderCount: 1,
    periodLabel: "Aug 2026",
    settled: false,
  },
  {
    id: "st_7",
    counterpartyName: "Artisan Attire",
    direction: "you_owe",
    amountCents: 190000,
    orderCount: 2,
    periodLabel: "Aug 2026",
    settled: false,
  },
  {
    id: "st_8",
    counterpartyName: "Heritage Wear BD",
    direction: "you_owe",
    amountCents: 95000,
    orderCount: 1,
    periodLabel: "Aug 2026",
    settled: false,
  },
  {
    id: "st_9",
    counterpartyName: "Ananya Lifestyle",
    direction: "owed_to_you",
    amountCents: 190000,
    orderCount: 2,
    periodLabel: "Aug 2026",
    settled: false,
  },
  {
    id: "st_10",
    counterpartyName: "Nokshi Boutique",
    direction: "you_owe",
    amountCents: 95000,
    orderCount: 1,
    periodLabel: "Jul 2026",
    settled: true,
  },
  {
    id: "st_11",
    counterpartyName: "Village Weaves",
    direction: "you_owe",
    amountCents: 380000,
    orderCount: 4,
    periodLabel: "Jul 2026",
    settled: true,
  },
  {
    id: "st_12",
    counterpartyName: "Chattogram Leather Co.",
    direction: "owed_to_you",
    amountCents: 45000,
    orderCount: 1,
    periodLabel: "Jul 2026",
    settled: true,
  },
];
