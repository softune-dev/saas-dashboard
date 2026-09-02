export type NavItem = {
  label: string;
  href: string;
  /** Path under /public (e.g. /sidebar/dashboard.svg) */
  icon: string;
  tag?: string;
};

/** Guided store setup wizard under Getting Started. */
export const setupItem: NavItem = {
  label: "Setup",
  href: "/onboarding",
  icon: "/sidebar/start.svg",
};

export const menuItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "/sidebar/dashboard.svg" },
  { label: "Categories", href: "/categories", icon: "/sidebar/categories.svg" },
  { label: "Events", href: "/events", icon: "/sidebar/events.svg", tag: "New" },
  { label: "Products", href: "/products", icon: "/sidebar/products.svg" },
  { label: "Orders", href: "/orders", icon: "/sidebar/orders.svg" },
  { label: "Store Sale", href: "/pos", icon: "/sidebar/shop-bag.svg", tag: "New" },
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

/** Rendered only when me.user.is_superadmin — see SidebarNavContent. */
export const superadminItems: NavItem[] = [
  { label: "Overview", href: "/superadmin", icon: "/sidebar/dashboard.svg" },
  { label: "Tenants", href: "/superadmin/tenants", icon: "/sidebar/customers.svg" },
  { label: "Users", href: "/superadmin/users", icon: "/sidebar/user.svg" },
  { label: "Leads", href: "/superadmin/leads", icon: "/sidebar/inbox.svg" },
  { label: "Demos", href: "/superadmin/demo-requests", icon: "/sidebar/chat.svg" },
  { label: "Tickets", href: "/superadmin/tickets", icon: "/sidebar/help-desk.svg" },
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
