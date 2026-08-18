export type NavItem = {
  label: string;
  href: string;
  /** Path under /public (e.g. /sidebar/dashboard.svg) */
  icon: string;
  tag?: string;
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
];

export const settingsItems: NavItem[] = [
  { label: "Site Settings", href: "/settings/site", icon: "/sidebar/settings.svg" },
  { label: "Fraud Protection", href: "/settings/fraud", icon: "/sidebar/lock.svg", tag: "New" },
  { label: "Billing", href: "/settings/billing", icon: "/sidebar/billing.svg" },
  { label: "Account", href: "/settings/account", icon: "/sidebar/account.svg" },
  { label: "Help Desk", href: "/settings/help", icon: "/sidebar/help-desk.svg" },
];

export const logoutItem: NavItem = {
  label: "Logout",
  href: "/logout",
  icon: "/sidebar/logout.svg",
};
