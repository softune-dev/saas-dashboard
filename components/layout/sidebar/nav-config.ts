import { MOCK_FULFILLMENT_REQUESTS } from "@/lib/dropship-mock";

export type NavItem = {
  label: string;
  href: string;
  /** Path under /public (e.g. /sidebar/dashboard.svg) */
  icon: string;
  tag?: string;
  /** Numeric ping badge (e.g. unread orders). Static per item — dynamic
   * counts (like the main Orders unread count) are still computed and
   * passed in by SidebarNavContent, which takes priority over this. */
  badge?: number;
  /** Sub-pages nested under this item — renders as an expand/collapse
   * group instead of a direct link. Only one level deep. */
  children?: NavItem[];
};

export type NavCategory = {
  id: string;
  label: string;
  items: NavItem[];
};

/** Guided store setup wizard under Getting Started. */
export const setupItem: NavItem = {
  label: "Setup",
  href: "/onboarding",
  icon: "/sidebar/start.svg",
};

/** Placeholder pending-order count for the mock-only Dropship Orders page —
 * there's no real backend yet (see lib/dropship-mock.ts), so this reads the
 * same mock array the page itself renders rather than being a fabricated
 * number. Swap for a real unread/pending count once Dropship has an API. */
const dropshipPendingOrderCount = MOCK_FULFILLMENT_REQUESTS.filter(
  (r) => r.status === "pending",
).length;

/** Categorized menu — consolidated into 4 primary sections: Overview, Catalog,
 * Sales, and Storefront. Dropship lives under Sales, Analytics under Overview,
 * and Add-Ons under Storefront. */
export const menuCategories: NavCategory[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/", icon: "/sidebar/dashboard.svg" },
      { label: "Analytics", href: "/analytics", icon: "/sidebar/analytics.svg" },
    ],
  },
  {
    id: "catalog",
    label: "Catalog",
    items: [
      { label: "Categories", href: "/categories", icon: "/sidebar/categories.svg" },
      { label: "Products", href: "/products", icon: "/sidebar/products.svg" },
      { label: "Events", href: "/events", icon: "/sidebar/events.svg", tag: "New" },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    items: [
      { label: "Orders", href: "/orders", icon: "/sidebar/orders.svg" },
      { label: "Store Sale", href: "/pos", icon: "/sidebar/shop-bag.svg", tag: "New" },
      { label: "Customers", href: "/customers", icon: "/sidebar/customers.svg" },
      {
        label: "Dropship",
        href: "/dropship",
        icon: "/sidebar/dropship.svg",
        tag: "Soon",
        children: [
          { label: "Browse Products", href: "/dropship/browse", icon: "/sidebar/dropship.svg" },
          {
            label: "My Listings",
            href: "/dropship/listings",
            icon: "/sidebar/dropship-listing.svg",
          },
          {
            label: "Suppliers",
            href: "/dropship/suppliers",
            icon: "/sidebar/dropship-supplier.svg",
          },
          {
            label: "Imported Products",
            href: "/dropship/imported",
            icon: "/sidebar/products.svg",
          },
          {
            label: "Orders",
            href: "/dropship/fulfillment",
            icon: "/sidebar/orders.svg",
            badge: dropshipPendingOrderCount,
          },
          { label: "Settlements", href: "/dropship/settlements", icon: "/sidebar/wallet.svg" },
        ],
      },
    ],
  },
  {
    id: "storefront",
    label: "Storefront",
    items: [
      { label: "Themes", href: "/themes", icon: "/sidebar/themes.svg" },
      { label: "Courier", href: "/courier", icon: "/sidebar/delivery.svg" },
      { label: "Payments", href: "/payments", icon: "/sidebar/wallet.svg" },
      { label: "Add-Ons", href: "/addons", icon: "/sidebar/add-on.svg" },
    ],
  },
];

/** Flat view of every top-level menu item (Dropship's own sub-items
 * excluded) — kept for call sites like the header's quick-links pill that
 * just need to look one up by href, not render the categorized tree. */
export const menuItems: NavItem[] = menuCategories.flatMap((category) => category.items);

export const settingsItems: NavItem[] = [
  {
    label: "Site Settings",
    href: "/settings/site",
    icon: "/sidebar/settings.svg",
    children: [
      { label: "Domains", href: "/settings/site/domains", icon: "/sidebar/brand.svg" },
      { label: "SEO", href: "/settings/site/seo", icon: "/sidebar/filter.svg" },
      { label: "Shipping", href: "/settings/site/shipping", icon: "/sidebar/delivery.svg" },
      { label: "Contact Info", href: "/settings/site/contact", icon: "/sidebar/note.svg" },
      { label: "About Us", href: "/settings/site/about", icon: "/sidebar/page.svg" },
      { label: "FAQs", href: "/settings/site/faqs", icon: "/sidebar/empty.svg" },
      { label: "Privacy Policy", href: "/settings/site/privacy", icon: "/sidebar/note.svg" },
      { label: "Terms", href: "/settings/site/terms", icon: "/sidebar/note.svg" },
      { label: "Gallery", href: "/settings/site/media", icon: "/sidebar/media.svg" },
    ],
  },
  { label: "Fraud Protection", href: "/settings/fraud", icon: "/sidebar/lock.svg" },
  { label: "Billing", href: "/settings/billing", icon: "/sidebar/billing.svg" },
  { label: "Account", href: "/settings/account", icon: "/sidebar/account.svg" },
  { label: "Help Desk", href: "/settings/help", icon: "/sidebar/help-desk.svg" },
];

/** Rendered only when me.user.is_superadmin — see SidebarNavContent. */
export const superadminItems: NavItem[] = [
  { label: "Overview", href: "/superadmin", icon: "/sidebar/dashboard.svg" },
  { label: "Tenants", href: "/superadmin/tenants", icon: "/sidebar/customers.svg" },
  { label: "Users", href: "/superadmin/users", icon: "/sidebar/user.svg" },
  { label: "Demos", href: "/superadmin/demo-requests", icon: "/sidebar/chat.svg" },
  { label: "Tickets", href: "/superadmin/tickets", icon: "/sidebar/help-desk.svg" },
  { label: "Vercel Cleanup", href: "/superadmin/vercel-cleanup", icon: "/sidebar/settings.svg" },
];

export const tourItem: NavItem = {
  label: "Take a Tour",
  href: "#tour",
  icon: "/sidebar/tour.svg",
};

export const logoutItem: NavItem = {
  label: "Logout",
  href: "/logout",
  icon: "/sidebar/logout.svg",
};

/** Map a nav href to a stable data-tour id for the product tour. */
export function tourIdForHref(href: string): string {
  if (href === "/") return "nav-dashboard";
  if (href === "/onboarding") return "nav-setup";
  // Each settings route gets its own id (nav-settings-site, nav-settings-fraud,
  // etc.) so the tour can call each one out individually instead of one combined
  // step for the whole Settings section.
  return `nav-${href.replace(/^\//, "").replace(/\//g, "-")}`;
}
