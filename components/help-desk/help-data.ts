export const ticketCategories = [
  { value: "Billing", label: "Billing" },
  { value: "Technical", label: "Technical" },
  { value: "Domain", label: "Domain" },
  { value: "Shipping", label: "Shipping" },
  { value: "Account", label: "Account" },
  { value: "Other", label: "Other" },
];

export const priorityOptions = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
];

export type HelpTopic = {
  id: string;
  title: string;
  description: string;
  icon: string;
  /** Slug in landing/lib/documentation-data.ts's DOC_CATEGORIES — resolved
   * to a full landing-site URL via NEXT_PUBLIC_LANDING_URL at render time. */
  docSlug: string;
};

/** Every entry here must be a real slug that exists in the landing site's
 * documentation-data.ts — this is a deep link, not a description, so a
 * fake slug would just 404. */
export const helpTopics: HelpTopic[] = [
  {
    id: "1",
    title: "Connect a custom domain",
    description: "Point DNS and issue SSL for your store.",
    icon: "/sidebar/domain.svg",
    docSlug: "custom-domain",
  },
  {
    id: "2",
    title: "Shipping locations",
    description: "Zones, rates, and where you deliver.",
    icon: "/sidebar/delivery.svg",
    docSlug: "shipping-locations",
  },
  {
    id: "3",
    title: "Adding and editing products",
    description: "Photos, prices, variants, and more.",
    icon: "/sidebar/products.svg",
    docSlug: "adding-editing-products",
  },
  {
    id: "4",
    title: "Using the theme editor",
    description: "Brand, colors, pages, and sections.",
    icon: "/sidebar/themes.svg",
    docSlug: "using-theme-editor",
  },
  {
    id: "5",
    title: "Reading store analytics",
    description: "Sales trends, bestsellers, and exports.",
    icon: "/sidebar/analytics.svg",
    docSlug: "reading-store-analytics",
  },
  {
    id: "6",
    title: "Managing orders end to end",
    description: "Statuses, packing, and customer updates.",
    icon: "/sidebar/orders.svg",
    docSlug: "managing-orders",
  },
];
