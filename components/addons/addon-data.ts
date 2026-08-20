import type { LucideIcon } from "lucide-react";

export type AddonCategory =
  | "Customer Engagement"
  | "Marketing & Sales"
  | "AI Automation"
  | "Operations & Insights";

export type AddonCatalogEntry = {
  id: string;
  /** Max two words. */
  name: string;
  category: AddonCategory;
  /** One short sentence for the card. */
  description: string;
  /** Longer copy for the Learn More modal. */
  longDescription: string;
  /** Lucide fallback. Prefer `logoSrc` when a public asset exists. */
  icon?: LucideIcon;
  /** Add-on art under /public/addon/*.webp. */
  logoSrc?: string;
  /** Connected / enabled state — UI-only until enablement is wired. */
  active: boolean;
  /** Optional manage link for built-in features (unused in the request catalog). */
  href?: string;
};

export const ADDON_CATEGORIES: AddonCategory[] = [
  "Customer Engagement",
  "Marketing & Sales",
  "AI Automation",
  "Operations & Insights",
];

/** Static Softune add-on catalog. Request state is UI-only for now. */
export const ADDON_CATALOG: AddonCatalogEntry[] = [
  // —— Customer Engagement ——
  {
    id: "live-chat",
    name: "Live Chat",
    category: "Customer Engagement",
    description: "Chat with shoppers on your storefront in real time.",
    longDescription:
      "Add a live chat widget to your store so customers can ask questions while browsing. Your team replies from the dashboard, and conversations stay tied to each shopper.",
    logoSrc: "/addon/live.webp",
    active: false,
  },
  {
    id: "whatsapp-alerts",
    name: "WhatsApp Alerts",
    category: "Customer Engagement",
    description: "Send order updates to customers on WhatsApp.",
    longDescription:
      "Notify buyers on WhatsApp when an order is confirmed, shipped, or delivered. Keep them informed without relying only on email or SMS.",
    logoSrc: "/addon/whatsapp.webp",
    active: false,
  },
  {
    id: "sms-updates",
    name: "SMS Updates",
    category: "Customer Engagement",
    description: "Text customers key order and delivery updates.",
    longDescription:
      "Send SMS for order confirmation, shipping, and delivery. Useful for buyers who miss email and expect phone alerts.",
    logoSrc: "/addon/sms.webp",
    active: false,
  },
  {
    id: "product-reviews",
    name: "Product Reviews",
    category: "Customer Engagement",
    description: "Collect and show star ratings on product pages.",
    longDescription:
      "Let customers leave ratings and short reviews after purchase. Display them on product pages to build trust and help new shoppers decide.",
    logoSrc: "/addon/reviews.webp",
    active: false,
  },
  {
    id: "loyalty-points",
    name: "Loyalty Points",
    category: "Customer Engagement",
    description: "Reward repeat buyers with points they can redeem.",
    longDescription:
      "Give points for purchases and let customers redeem them on future orders. Encourage return visits without complicated campaigns.",
    logoSrc: "/addon/loyalty.webp",
    active: false,
  },
  {
    id: "recently-viewed",
    name: "Recently Viewed",
    category: "Customer Engagement",
    description: "Show shoppers the products they recently browsed.",
    longDescription:
      "Display a Recently Viewed strip so returning visitors can pick up where they left off. Helps shoppers find products again without searching.",
    logoSrc: "/addon/recent.webp",
    active: false,
  },
  {
    id: "quick-view",
    name: "Quick View",
    category: "Customer Engagement",
    description: "Preview a product in a modal without leaving the listing.",
    longDescription:
      "Let shoppers open a quick product preview from category and search grids. They can check details and add to cart without leaving the page.",
    logoSrc: "/addon/view.webp",
    active: false,
  },
  {
    id: "product-enquiry",
    name: "Product Enquiry",
    category: "Customer Engagement",
    description: "Add an Ask a question form on the product page.",
    longDescription:
      "Give shoppers an enquiry option beside Buy Now or Add to Cart when they need help before purchasing. Messages land in your dashboard for follow-up.",
    logoSrc: "/addon/enquiry.webp",
    active: false,
  },
  {
    id: "product-compare",
    name: "Product Compare",
    category: "Customer Engagement",
    description: "Compare 2–3 products side by side before buying.",
    longDescription:
      "Let shoppers select a few products and view specs, price, and variants together. Makes it easier to choose between similar items.",
    logoSrc: "/addon/compare.webp",
    active: false,
  },
  {
    id: "size-guide",
    name: "Size Guide",
    category: "Customer Engagement",
    description: "Show a measurement chart next to the size picker.",
    longDescription:
      "Attach a per-product size chart beside the existing size-variant selector. Shoppers get clear measurements without leaving the product page.",
    logoSrc: "/addon/size.webp",
    active: false,
  },

  // —— Marketing & Sales ——
  {
    id: "discount-codes",
    name: "Discount Codes",
    category: "Marketing & Sales",
    description: "Create promo codes for sales and campaigns.",
    longDescription:
      "Build percentage or fixed discounts, set limits and dates, and share codes with customers. Track redemptions from the dashboard.",
    logoSrc: "/addon/discount.webp",
    active: false,
  },
  {
    id: "email-marketing",
    name: "Email Marketing",
    category: "Marketing & Sales",
    description: "Send newsletters and offers to your customer list.",
    longDescription:
      "Email past buyers and subscribers with product launches, offers, and announcements. Keep campaigns simple and on-brand.",
    logoSrc: "/addon/e-marketing.webp",
    active: false,
  },
  {
    id: "referral-program",
    name: "Referral Program",
    category: "Marketing & Sales",
    description: "Let happy customers invite friends for rewards.",
    longDescription:
      "Give shoppers a shareable referral link. When friends buy, both sides can earn a discount or credit you define.",
    logoSrc: "/addon/referral.webp",
    active: false,
  },
  {
    id: "purchase-notification",
    name: "Purchase Notification",
    category: "Marketing & Sales",
    description:
      "Show storefront popups like “Someone in Dhaka just bought this.”",
    longDescription:
      "A visitor-facing social-proof popup on your storefront — not the merchant dashboard push notifications. Briefly show recent purchases to build trust while shoppers browse.",
    logoSrc: "/addon/notification.webp",
    active: false,
  },
  {
    id: "wholesale-pricing",
    name: "Wholesale Pricing",
    category: "Marketing & Sales",
    description: "Offer lower per-unit prices when buyers purchase in bulk.",
    longDescription:
      "Set tiered quantity breaks (for example buy 10+ for a lower unit price). Ideal for wholesale and bulk shoppers without a separate price list.",
    logoSrc: "/addon/wholesaler.webp",
    active: false,
  },
  {
    id: "frequently-bought",
    name: "Frequently Bought",
    category: "Marketing & Sales",
    description: "Suggest cross-sell bundles on product and checkout pages.",
    longDescription:
      "Surface frequently bought-together items so shoppers can add complementary products in one step. Boosts average order value with relevant suggestions.",
    logoSrc: "/addon/frequently.webp",
    active: false,
  },
  {
    id: "review-reminder",
    name: "Review Reminder",
    category: "Marketing & Sales",
    description: "Auto-ask for a review a few days after delivery.",
    longDescription:
      "Send an email or SMS a few days after delivery inviting the customer to leave a review. Collect more ratings without manual follow-up.",
    logoSrc: "/addon/reminder.webp",
    active: false,
  },

  // —— AI Automation ——
  {
    id: "ai-chatbot",
    name: "AI Chatbot",
    category: "AI Automation",
    description: "Answer common questions on your store automatically.",
    longDescription:
      "An AI assistant on your storefront handles FAQs, shipping basics, and product questions so your team focuses on harder conversations.",
    logoSrc: "/addon/chat.webp",
    active: false,
  },
  {
    id: "ai-auto-reply",
    name: "AI Auto-Reply",
    category: "AI Automation",
    description: "Suggest replies to customer messages instantly.",
    longDescription:
      "When a message comes in, AI drafts a helpful reply you can send or tweak. Speed up support without sounding robotic.",
    logoSrc: "/addon/reply.webp",
    active: false,
  },
  {
    id: "ai-ad-copy",
    name: "AI Ad Copy",
    category: "AI Automation",
    description: "Generate short ads for social and campaigns.",
    longDescription:
      "Create headlines and short ad text from a product or offer. Useful for Facebook, Instagram, and other paid posts.",
    logoSrc: "/addon/ai-ad.webp",
    active: false,
  },
  {
    id: "ai-forecasting",
    name: "AI Forecasting",
    category: "AI Automation",
    description: "Predict demand trends from your sales history.",
    longDescription:
      "Get simple forecasts of what may sell next so you can plan stock and promotions with less guesswork.",
    logoSrc: "/addon/forecast.webp",
    active: false,
  },

  // —— Operations & Insights ——
  {
    id: "staff-roles",
    name: "Staff Roles",
    category: "Operations & Insights",
    description: "Give teammates limited access with clear roles.",
    longDescription:
      "Invite staff and assign roles so each person only sees what they need — orders, products, or full admin — without sharing one login.",
    logoSrc: "/addon/staff.webp",
    active: false,
  },
  {
    id: "stock-alerts",
    name: "Stock Alerts",
    category: "Operations & Insights",
    description: "Get notified when inventory runs low.",
    longDescription:
      "Set low-stock thresholds and receive alerts before you sell out. Restock in time and avoid disappointed customers.",
    logoSrc: "/addon/stock-alart.webp",
    active: false,
  },
  {
    id: "spam-prevention",
    name: "Spam Prevention",
    category: "Operations & Insights",
    description: "Add captcha and bot protection on storefront forms.",
    longDescription:
      "Protect contact and enquiry forms from spam and bots with captcha-style checks. Keeps fake submissions out of your inbox.",
    logoSrc: "/addon/spam.webp",
    active: false,
  },
  {
    id: "catalog-export",
    name: "Catalog Export",
    category: "Operations & Insights",
    description: "Download your full product catalog as PDF or CSV.",
    longDescription:
      "Export products for wholesale buyers or offline sales reps. Share a clean PDF or CSV without copying data by hand.",
    logoSrc: "/addon/export.webp",
    active: false,
  },
  {
    id: "product-badges",
    name: "Product Badges",
    category: "Operations & Insights",
    description: "Manage New, Bestseller, and Low Stock badges on cards.",
    longDescription:
      "Control which badges appear on product cards across your store. Highlight new arrivals, bestsellers, and low-stock items consistently.",
    logoSrc: "/addon/badges.webp",
    active: false,
  },
];
