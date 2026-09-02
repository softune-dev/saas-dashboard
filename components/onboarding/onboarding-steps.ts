export type OnboardingStepId =
  | "shop"
  | "categories"
  | "products"
  | "courier"
  | "payments"
  | "seo"
  | "store-info"
  | "finish";

export type OnboardingStepDef = {
  id: OnboardingStepId;
  title: string;
  description: string;
  required: boolean;
  skippable: boolean;
};

export const ONBOARDING_STEPS: OnboardingStepDef[] = [
  {
    id: "shop",
    title: "Shop basics",
    description: "Name, logo, tagline, and category for your store.",
    required: true,
    skippable: false,
  },
  {
    id: "categories",
    title: "Categories",
    description: "Add at least one category so products have a home.",
    required: true,
    skippable: false,
  },
  {
    id: "products",
    title: "Products",
    description: "Add at least one product shoppers can buy.",
    required: true,
    skippable: false,
  },
  {
    id: "courier",
    title: "Courier",
    description: "Connect a courier so orders can leave your shop.",
    required: false,
    skippable: true,
  },
  {
    id: "payments",
    title: "Payments",
    description: "Connect at least one way customers can pay.",
    required: true,
    skippable: false,
  },
  {
    id: "seo",
    title: "SEO",
    description: "Title, description, and favicon for search engines.",
    required: false,
    skippable: true,
  },
  {
    id: "store-info",
    title: "Store info",
    description: "Contact, about story, policies, and FAQs.",
    required: false,
    skippable: true,
  },
  {
    id: "finish",
    title: "Go live",
    description: "Publish your store and open your real subdomain.",
    required: false,
    skippable: false,
  },
];

export const ONBOARDING_TOTAL = ONBOARDING_STEPS.length;
