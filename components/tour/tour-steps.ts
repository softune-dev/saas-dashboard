export type TourStep = {
  id: string;
  /** CSS selector for the spotlight target. Missing targets are skipped. */
  selector: string;
  title: string;
  body: string;
  /** Preferred tooltip side relative to the target. */
  placement?: "right" | "left" | "bottom" | "top";
};

/**
 * Single continuous dashboard tour. Runs on "/" for the dashboard-chrome
 * steps, then — when it reaches Themes — navigates into that tenant's real
 * theme editor to walk through EDITOR_STEPS in place, then navigates back to
 * "/" to finish the remaining POST_EDITOR_STEPS. TourProvider stitches these
 * three lists together at runtime (see tour-context.tsx); route-switching
 * lives there because the editor's path is a per-tenant template key that
 * isn't known statically.
 */
export const PRE_EDITOR_STEPS: TourStep[] = [
  {
    id: "sidebar",
    selector: '[data-tour="sidebar"]',
    title: "Your main navigation",
    body: "This sidebar is how you move around Softune — products, orders, themes, settings, and more. Everything for running your shop lives here.",
    placement: "right",
  },
  {
    id: "setup",
    selector: '[data-tour="nav-setup"]',
    title: "Setup checklist",
    body: "Getting Started walks you through the launch checklist — products, payments, courier, and publishing — so you always know what’s left before going live.",
    placement: "right",
  },
  {
    id: "dashboard",
    selector: '[data-tour="nav-dashboard"]',
    title: "Dashboard",
    body: "Your home overview: sales, recent orders, and a quick snapshot of how the shop is doing today.",
    placement: "right",
  },
  {
    id: "categories",
    selector: '[data-tour="nav-categories"]',
    title: "Categories",
    body: "Organize products into categories so shoppers can browse by type — sarees, sweets, electronics, and whatever you sell.",
    placement: "right",
  },
  {
    id: "products",
    selector: '[data-tour="nav-products"]',
    title: "Products",
    body: "Add and edit everything you sell — photos, prices, variants, and feature highlights that show on your storefront.",
    placement: "right",
  },
  {
    id: "orders",
    selector: '[data-tour="nav-orders"]',
    title: "Orders",
    body: "Track every purchase from pending to fulfilled. Open an order to print slips, update status, and see customer details.",
    placement: "right",
  },
  {
    id: "analytics",
    selector: '[data-tour="nav-analytics"]',
    title: "Analytics",
    body: "See revenue trends, bestsellers, and category performance so you know what’s working.",
    placement: "right",
  },
  {
    id: "themes",
    selector: '[data-tour="nav-themes"]',
    title: "Themes",
    body: "Pick a storefront design and open the editor to customize colors, sections, and branding — then publish when you’re ready. Let's take a quick look inside.",
    placement: "right",
  },
];

/** Runs in place once TourProvider has navigated into /themes/editor/[key]. */
export const EDITOR_STEPS: TourStep[] = [
  {
    id: "editor-sidebar",
    selector: '[data-tour="editor-sidebar"]',
    title: "Theme editor",
    body: "This panel is where you customize your storefront — brand, colors, pages, and sections — while the live preview updates beside it.",
    placement: "right",
  },
  {
    id: "editor-tools",
    selector: '[data-tour="editor-tools"]',
    title: "Editor tools",
    body: "Switch between Brand, Colors, Header, Pages, and Sections from this rail. Numbered buttons jump to individual homepage sections.",
    placement: "right",
  },
  {
    id: "editor-tool-brand",
    selector: '[data-tour="editor-tool-brand"]',
    title: "Brand",
    body: "Your name, logo, tagline, and font pairing. Ask AI right here to suggest a full brand direction — describe a vibe and apply what it proposes in one tap.",
    placement: "right",
  },
  {
    id: "editor-tool-colors",
    selector: '[data-tour="editor-tool-colors"]',
    title: "Colors",
    body: "Set your storefront's color palette. AI Suggest lives here too, for when you'd rather describe a mood than pick hex codes.",
    placement: "right",
  },
  {
    id: "editor-tool-header",
    selector: '[data-tour="editor-tool-header"]',
    title: "Header",
    body: "Customize the navigation bar shoppers see on every page — layout, links, and announcement bar.",
    placement: "right",
  },
  {
    id: "editor-pages",
    selector: '[data-tour="editor-tool-pages"]',
    title: "Pages",
    body: "Open Pages to turn storefront pages on or off and choose what you’re previewing. Home is always available; others are optional.",
    placement: "right",
  },
  {
    id: "editor-sections",
    selector: '[data-tour="editor-tool-sections"]',
    title: "Sections",
    body: "Open Sections to reorder homepage blocks by dragging, edit each one from the numbered rail, and add new sections when you need them.",
    placement: "right",
  },
  {
    id: "editor-section-rail",
    selector: '[data-tour="editor-section-rail"]',
    title: "Jump to a section",
    body: "1, 2, 3… each number is one homepage block in order — Hero, Banner, Categories, and so on. Click a number to edit that section directly instead of scrolling to find it.",
    placement: "right",
  },
  {
    id: "editor-device-toolbar",
    selector: '[data-tour="editor-device-toolbar"]',
    title: "Device preview",
    body: "Flip between desktop and mobile widths to check how your store looks on each screen size.",
    placement: "bottom",
  },
  {
    id: "editor-preview",
    selector: '[data-tour="editor-preview"]',
    title: "Live preview",
    body: "Your real storefront template renders here with draft changes — navigate pages inside the frame to review before publishing.",
    placement: "left",
  },
  {
    id: "editor-publish",
    selector: '[data-tour="editor-publish"]',
    title: "Publish",
    body: "When you’re happy with the draft, Publish pushes it live to your customers. Unsaved edits can still be saved locally anytime. Let's head back and finish the rest of the tour.",
    placement: "bottom",
  },
];

/** Resumes on "/" after TourProvider navigates back out of the editor. */
export const POST_EDITOR_STEPS: TourStep[] = [
  {
    id: "customers",
    selector: '[data-tour="nav-customers"]',
    title: "Customers",
    body: "A list of people who’ve ordered from you — handy for support and repeat outreach.",
    placement: "right",
  },
  {
    id: "courier",
    selector: '[data-tour="nav-courier"]',
    title: "Courier",
    body: "Connect delivery partners like Steadfast so orders can be handed off for nationwide shipping.",
    placement: "right",
  },
  {
    id: "payments",
    selector: '[data-tour="nav-payments"]',
    title: "Payments",
    body: "Turn on Cash on Delivery, manual wallets, or gateways so customers can pay the way they prefer.",
    placement: "right",
  },
  {
    id: "addons",
    selector: '[data-tour="nav-addons"]',
    title: "Add-Ons",
    body: "Browse optional features — chat, reviews, AI tools, and more — and request what you need for your store.",
    placement: "right",
  },
  {
    id: "settings-site",
    selector: '[data-tour="nav-settings-site"]',
    title: "Site Settings",
    body: "Business info, FAQs, legal pages, custom domain, media library, and shipping locations — the core setup for your storefront.",
    placement: "right",
  },
  {
    id: "settings-fraud",
    selector: '[data-tour="nav-settings-fraud"]',
    title: "Fraud Protection",
    body: "Catch risky orders before they ship — rules and signals that flag suspicious checkouts for review.",
    placement: "right",
  },
  {
    id: "settings-billing",
    selector: '[data-tour="nav-settings-billing"]',
    title: "Billing",
    body: "Your plan, AI credit usage, and payment history for your Softune subscription live here.",
    placement: "right",
  },
  {
    id: "settings-account",
    selector: '[data-tour="nav-settings-account"]',
    title: "Account",
    body: "Your profile — name, email, phone, timezone, and profile picture.",
    placement: "right",
  },
  {
    id: "settings-help",
    selector: '[data-tour="nav-settings-help"]',
    title: "Help Desk",
    body: "Questions or issues? Reach the Softune team from here without leaving the dashboard.",
    placement: "right",
  },
  {
    id: "header",
    selector: '[data-tour="header"]',
    title: "Top bar",
    body: "Search, AI credits, notifications, dark mode, and your shop account menu live up here — always within reach.",
    placement: "bottom",
  },
  {
    id: "ai-chat",
    selector: '[data-tour="ai-chat"]',
    title: "AI Assistant",
    body: "Ask Softune AI for help writing products, adjusting themes, looking up orders, and more — without leaving the dashboard.",
    placement: "bottom",
  },
  {
    id: "finish",
    selector: '[data-tour="sidebar"]',
    title: "You’re ready to explore",
    body: "That’s the Softune dashboard tour. Open Setup anytime for the launch checklist, or jump into Products and start selling.",
    placement: "right",
  },
];

export const TOUR_SEEN_KEY = "softune-tour-seen";
/** Set before a redirect to "/" is needed to *start* the tour (from any page). */
export const TOUR_PENDING_KEY = "softune-tour-pending";
/** Set before a mid-tour navigation (into or out of the editor) so the tour
 * resumes at the right combined-step index once the new route has mounted,
 * instead of restarting from step 0. */
export const TOUR_RESUME_INDEX_KEY = "softune-tour-resume-index";
