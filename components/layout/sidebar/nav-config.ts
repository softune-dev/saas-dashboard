export type NavItem = {
  label: string;
  href: string;
  /** Path under /public (e.g. /sidebar/dashboard.svg) */
  icon: string;
  tag?: string;
};

/** Own sidebar group (not under Menu). Hidden entirely when setup is complete. */
export const setupItem: NavItem = {
  label: "Setup",
  href: "/getting-started",
  icon: "/sidebar/start.svg",
};

export const menuItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "/sidebar/dashboard.svg" },
  { label: "Categories", href: "/categories", icon: "/sidebar/categories.svg" },
  { label: "Products", href: "/products", icon: "/sidebar/products.svg" },
  { label: "Orders", href: "/orders", icon: "/sidebar/orders.svg" },
  { label: "Analytics", href: "/analytics", icon: "/sidebar/analytics.svg" },
  { label: "Themes", href: "/themes", icon: "/sidebar/themes.svg", tag: "New" },
  { label: "Customers", href: "/customers", icon: "/sidebar/customers.svg" },
  { label: "Courier", href: "/courier", icon: "/sidebar/delivery.svg" },
  { label: "Payments", href: "/payments", icon: "/sidebar/wallet.svg", tag: "New" },
  { label: "Add-Ons", href: "/addons", icon: "/sidebar/add-on.svg", tag: "New" },
];

export const settingsItems: NavItem[] = [
  { label: "Site Settings", href: "/settings/site", icon: "/sidebar/settings.svg" },
  { label: "Fraud Protection", href: "/settings/fraud", icon: "/sidebar/lock.svg", tag: "New" },
  { label: "Billing", href: "/settings/billing", icon: "/sidebar/billing.svg" },
  { label: "Account", href: "/settings/account", icon: "/sidebar/account.svg" },
  { label: "Help Desk", href: "/settings/help", icon: "/sidebar/help-desk.svg" },
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
  if (href === "/getting-started") return "nav-setup";
  // Each settings route gets its own id (nav-settings-site, nav-settings-fraud,
  // …) so the tour can call each one out individually instead of one combined
  // step for the whole Settings section.
  return `nav-${href.replace(/^\//, "").replace(/\//g, "-")}`;
}
