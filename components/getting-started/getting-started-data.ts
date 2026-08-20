export type GettingStartedStepId =
  | "product"
  | "category"
  | "branding"
  | "payment"
  | "shipping"
  | "media"
  | "faqs"
  | "legal"
  | "publish";

export type GettingStartedStepDef = {
  id: GettingStartedStepId;
  title: string;
  description: string;
  href: string;
  cta: string;
};

/** Static catalog — completion flags come from useGettingStartedProgress. */
export const GETTING_STARTED_STEPS: GettingStartedStepDef[] = [
  {
    id: "product",
    title: "Add your first product",
    description: "Shoppers need something to buy — add at least one product to your catalog.",
    href: "/products/new",
    cta: "Add product",
  },
  {
    id: "category",
    title: "Create a category",
    description: "Group products so visitors can browse your store by type.",
    href: "/categories",
    cta: "Add category",
  },
  {
    id: "branding",
    title: "Add your logo & business info",
    description: "Logo, phone, email, or address make your shop look real and reachable.",
    href: "/settings/site/contact",
    cta: "Open contact",
  },
  {
    id: "payment",
    title: "Connect a payment method",
    description: "Let customers pay — COD, manual wallets, or a gateway.",
    href: "/payments",
    cta: "Set up payments",
  },
  {
    id: "shipping",
    title: "Set up shipping / courier",
    description: "Connect a courier or add shipping locations so orders can leave your shop.",
    href: "/courier",
    cta: "Set up delivery",
  },
  {
    id: "media",
    title: "Upload product or store photos",
    description: "Photos build trust — add images to your media library.",
    href: "/settings/site/media",
    cta: "Open media",
  },
  {
    id: "faqs",
    title: "Add your FAQs",
    description: "Answer common questions so shoppers buy with confidence.",
    href: "/settings/site/faqs",
    cta: "Add FAQs",
  },
  {
    id: "legal",
    title: "Add legal pages",
    description: "Publish Privacy and/or Terms so your storefront is ready to launch.",
    href: "/settings/site/privacy",
    cta: "Open legal",
  },
  {
    id: "publish",
    title: "Publish your site",
    description: "Go live so customers can find and order from your store.",
    href: "/themes",
    cta: "Go to themes",
  },
];

export const GETTING_STARTED_TOTAL = GETTING_STARTED_STEPS.length;
