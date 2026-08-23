import type { SiteEditorSettings } from "@/components/themes/editor/editor-types";
import type { CategoryOut, ProductOut } from "@/lib/api/commerce";
import type { CourierConnectionOut } from "@/lib/api/courier";
import type { PaymentConnectionOut } from "@/lib/api/payments";
import type { OnboardingStepId } from "./onboarding-steps";

export type TemplateKey = "aurora" | "bazaar" | "sweets";

export type OnboardingState = {
  /** Which real site this draft belongs to (null until the first backend
   * hydration resolves one). The wizard's local draft is a single
   * localStorage blob shared across every account on this browser — without
   * this tag, switching accounts would silently keep the previous account's
   * stale field values (including dead blob: image URLs) forever, since
   * hydrateFromBackend only fills a field when the local value is empty. */
  siteId: string | null;
  currentStep: number;
  completedSteps: OnboardingStepId[];
  skippedSteps: OnboardingStepId[];
  finishedAt: string | null;
  templateKey: TemplateKey;
  draftSettings: SiteEditorSettings;
  shopCategory: string;
  legalBusinessName: string;
  taxId: string;
  tradeName: string;
  tradeLicenseNo: string;
  // Real rows fetched from the backend (listCategories/listProducts/
  // listCourierConnections/listPaymentConnections) — never client-generated,
  // so ids are always real DB ids. Refetched into these on every mutation
  // rather than optimistically patched locally, since that's the only way
  // to stay honest about what the backend actually persisted.
  categories: CategoryOut[];
  products: ProductOut[];
  courierConnections: CourierConnectionOut[];
  paymentConnections: PaymentConnectionOut[];
  seoTitle: string;
  seoTitleSuffix: string;
  seoDescription: string;
  seoKeywords: string;
  seoOgTitle: string;
  seoOgDescription: string;
  seoOgImage: string;
  seoFavicon: string;
  contactPhone: string;
  contactEmail: string;
  aboutHeading: string;
  aboutStory: string;
  termsTitle: string;
  termsContent: string;
  privacyTitle: string;
  privacyContent: string;
  faqQuestion: string;
  faqAnswer: string;
  homepageReviewed: boolean;
  subdomainPreview: string;
  /** True once the initial backend prefill fetch (categories/products/
   * couriers/payments/site settings/tenant business) has resolved. Steps
   * use this to avoid flashing "no products yet" before the real list has
   * had a chance to load. */
  hydratedFromBackend: boolean;
};

export const ONBOARDING_STORAGE_KEY = "softune.onboarding.mock";

/** Same-tab signal so the sidebar Setup badge updates while the wizard runs. */
export const ONBOARDING_PROGRESS_EVENT = "softune-onboarding-progress";
