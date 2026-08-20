"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { useSession } from "@/components/providers/session-provider";
import { defaultSiteSettingsByTheme } from "@/components/themes/editor/editor-defaults";
import type { SiteEditorSettings } from "@/components/themes/editor/editor-types";
import { listCategories, listProducts, type CategoryOut, type ProductOut } from "@/lib/api/commerce";
import { listCourierConnections, type CourierConnectionOut } from "@/lib/api/courier";
import { listPaymentConnections, type PaymentConnectionOut } from "@/lib/api/payments";
import { getSiteTheme } from "@/lib/api";
import { getSiteSettings } from "@/lib/api/site-settings";
import {
  ONBOARDING_STEPS,
  type OnboardingStepId,
} from "./onboarding-steps";
import {
  ONBOARDING_PROGRESS_EVENT,
  ONBOARDING_STORAGE_KEY,
  type OnboardingState,
  type TemplateKey,
} from "./onboarding-types";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}

function freshState(templateKey: TemplateKey = "aurora"): OnboardingState {
  const draft = structuredClone(defaultSiteSettingsByTheme[templateKey]);
  draft.siteName = "";
  draft.tagline = "";
  draft.logoImage = "";
  return {
    currentStep: 0,
    completedSteps: [],
    skippedSteps: [],
    finishedAt: null,
    templateKey,
    draftSettings: draft,
    shopCategory: "",
    legalBusinessName: "",
    taxId: "",
    tradeName: "",
    tradeLicenseNo: "",
    categories: [],
    products: [],
    courierConnections: [],
    paymentConnections: [],
    seoTitle: "",
    seoTitleSuffix: "",
    seoDescription: "",
    seoKeywords: "",
    seoOgTitle: "",
    seoOgDescription: "",
    seoOgImage: "",
    seoFavicon: "",
    contactPhone: "",
    contactEmail: "",
    aboutHeading: "",
    aboutStory: "",
    termsTitle: "Terms of Service",
    termsContent: "",
    privacyTitle: "Privacy Policy",
    privacyContent: "",
    faqQuestion: "",
    faqAnswer: "",
    homepageReviewed: false,
    subdomainPreview: "my-shop",
    hydratedFromBackend: false,
  };
}

function readStored(): OnboardingState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OnboardingState;
    // Never trust a stale hydration flag from a previous session — the
    // backend fetch effect below re-checks it fresh every mount.
    parsed.hydratedFromBackend = false;
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(state: OnboardingState) {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
    // Sidebar badge listens for this (storage events don't fire in the same tab).
    window.dispatchEvent(new Event(ONBOARDING_PROGRESS_EVENT));
  } catch {
    // Quota / private mode: wizard still works for the session.
  }
}

type Action =
  | { type: "hydrate"; state: OnboardingState }
  | { type: "setStep"; index: number }
  | { type: "patchSettings"; patch: Partial<SiteEditorSettings> }
  | { type: "setTemplate"; key: TemplateKey }
  | { type: "setCategories"; categories: CategoryOut[] }
  | { type: "setProducts"; products: ProductOut[] }
  | { type: "setCourierConnections"; connections: CourierConnectionOut[] }
  | { type: "setPaymentConnections"; connections: PaymentConnectionOut[] }
  | { type: "hydrateFromBackend"; patch: Partial<OnboardingState> }
  | { type: "setField"; field: keyof OnboardingState; value: unknown }
  | { type: "markHomepageReviewed" }
  | { type: "completeStep"; id: OnboardingStepId; skipped?: boolean }
  | { type: "goNext" }
  | { type: "goBack" }
  | { type: "finish"; at: string };

function reducer(state: OnboardingState, action: Action): OnboardingState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "setStep":
      return {
        ...state,
        currentStep: Math.max(0, Math.min(ONBOARDING_STEPS.length - 1, action.index)),
      };
    case "patchSettings":
      return {
        ...state,
        draftSettings: { ...state.draftSettings, ...action.patch },
        subdomainPreview:
          action.patch.siteName !== undefined
            ? slugify(action.patch.siteName) || state.subdomainPreview
            : state.subdomainPreview,
      };
    case "setTemplate": {
      const next = structuredClone(defaultSiteSettingsByTheme[action.key]);
      // Keep merchant name/tagline if they already typed them.
      next.siteName = state.draftSettings.siteName || next.siteName;
      next.tagline = state.draftSettings.tagline || next.tagline;
      next.logoType = state.draftSettings.logoType;
      next.logoImage = state.draftSettings.logoImage;
      return { ...state, templateKey: action.key, draftSettings: next };
    }
    case "setCategories":
      return { ...state, categories: action.categories };
    case "setProducts":
      return { ...state, products: action.products };
    case "setCourierConnections":
      return { ...state, courierConnections: action.connections };
    case "setPaymentConnections":
      return { ...state, paymentConnections: action.connections };
    case "hydrateFromBackend":
      return { ...state, ...action.patch, hydratedFromBackend: true };
    case "setField":
      return { ...state, [action.field]: action.value } as OnboardingState;
    case "markHomepageReviewed":
      return { ...state, homepageReviewed: true };
    case "completeStep": {
      const completed = state.completedSteps.includes(action.id)
        ? state.completedSteps
        : [...state.completedSteps, action.id];
      const skipped = action.skipped
        ? state.skippedSteps.includes(action.id)
          ? state.skippedSteps
          : [...state.skippedSteps, action.id]
        : state.skippedSteps.filter((id) => id !== action.id);
      return { ...state, completedSteps: completed, skippedSteps: skipped };
    }
    case "goNext":
      return {
        ...state,
        currentStep: Math.min(ONBOARDING_STEPS.length - 1, state.currentStep + 1),
      };
    case "goBack":
      return { ...state, currentStep: Math.max(0, state.currentStep - 1) };
    case "finish":
      return { ...state, finishedAt: action.at };
    default:
      return state;
  }
}

export function canContinue(state: OnboardingState, stepId: OnboardingStepId): boolean {
  switch (stepId) {
    case "shop":
      return (
        (state.draftSettings.siteName || "").trim().length > 0 &&
        (state.legalBusinessName || "").trim().length > 0 &&
        (state.draftSettings.tagline || "").trim().length > 0 &&
        (state.draftSettings.logoType === "text" ||
          (state.draftSettings.logoImage || "").trim().length > 0)
      );
    case "brand":
      return (
        !!state.draftSettings.primaryColor &&
        !!state.draftSettings.displayFont &&
        !!state.draftSettings.bodyFont
      );
    case "categories":
      return state.categories.length >= 1;
    case "products":
      return state.products.length >= 1;
    case "payments":
      return state.paymentConnections.length >= 1;
    case "courier":
    case "seo":
    case "store-info":
    case "finish":
      return true;
    default:
      return true;
  }
}

type OnboardingContextValue = {
  state: OnboardingState;
  step: (typeof ONBOARDING_STEPS)[number];
  stepIndex: number;
  dispatch: React.Dispatch<Action>;
  canContinueCurrent: boolean;
  continueOrSkip: (opts?: { skip?: boolean }) => void;
  reset: () => void;
  /** Lets the current step register an async "persist my local edits to the
   * real backend" function, run right before the wizard advances. Steps that
   * write immediately on every field change (categories/products/courier/
   * payments) don't need this — it exists for the steps that batch several
   * text fields into one PATCH (SEO, Store info, Shop basics identity). */
  registerSaveHandler: (fn: (() => Promise<void>) | null) => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  // Read storage in the initializer so the first paint isn't a blank draft
  // that immediately overwrites a saved progress blob via the persist effect.
  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    () => readStored() ?? freshState(),
  );
  const { currentSite, me } = useSession();
  const saveHandlerRef = useRef<null | (() => Promise<void>)>(null);

  useEffect(() => {
    writeStored(state);
  }, [state]);

  // One-time prefill from the real backend once we know which site/tenant
  // we're working with. Only fills fields the merchant hasn't already typed
  // into this session's local draft, so resuming onboarding never clobbers
  // in-progress (but unsaved) edits with older saved data.
  useEffect(() => {
    if (!currentSite?.id || state.hydratedFromBackend) return;
    const siteId = currentSite.id;
    let cancelled = false;
    (async () => {
      try {
        const [categories, productsPage, couriers, payments, settings, theme] = await Promise.all([
          listCategories(siteId),
          listProducts(siteId, { limit: 50 }),
          listCourierConnections(siteId),
          listPaymentConnections(siteId),
          getSiteSettings(siteId),
          getSiteTheme(siteId).catch(() => null),
        ]);
        if (cancelled) return;

        const keep = <T,>(local: T, remote: T | undefined): T =>
          local && String(local).trim().length > 0 ? local : ((remote as T) ?? local);

        // Real shop identity/brand already lives on the site's published
        // theme — a merchant revisiting onboarding (e.g. via ?force=1)
        // should see what's actually live, not a blank Shop Basics/Brand
        // step, since freshState() starts siteName/tagline/logoImage empty
        // on purpose (see its own comment) for genuinely brand-new tenants.
        const remoteTheme = (theme ?? {}) as Partial<SiteEditorSettings>;
        const draftSettings: SiteEditorSettings = {
          ...state.draftSettings,
          siteName: keep(state.draftSettings.siteName, remoteTheme.siteName),
          tagline: keep(state.draftSettings.tagline, remoteTheme.tagline),
          logoType: state.draftSettings.logoImage
            ? state.draftSettings.logoType
            : (remoteTheme.logoType ?? state.draftSettings.logoType),
          logoImage: keep(state.draftSettings.logoImage, remoteTheme.logoImage),
          primaryColor: keep(state.draftSettings.primaryColor, remoteTheme.primaryColor),
          accentColor: keep(state.draftSettings.accentColor, remoteTheme.accentColor),
          surfaceColor: keep(state.draftSettings.surfaceColor, remoteTheme.surfaceColor),
          displayFont: keep(state.draftSettings.displayFont, remoteTheme.displayFont),
          bodyFont: keep(state.draftSettings.bodyFont, remoteTheme.bodyFont),
          buttonStyle: keep(state.draftSettings.buttonStyle, remoteTheme.buttonStyle),
        };

        const faq = settings.faqs?.[0];
        const patch: Partial<OnboardingState> = {
          categories,
          products: productsPage.items,
          courierConnections: couriers,
          paymentConnections: payments,
          draftSettings,
          shopCategory: keep(state.shopCategory, settings.business?.type),
          contactPhone: keep(state.contactPhone, settings.business?.phone),
          contactEmail: keep(state.contactEmail, settings.business?.email),
          aboutHeading: keep(state.aboutHeading, settings.about?.heading),
          aboutStory: keep(state.aboutStory, settings.about?.paragraphs?.join("\n\n")),
          termsTitle: keep(state.termsTitle, settings.legal?.terms?.title),
          termsContent: keep(state.termsContent, settings.legal?.terms?.content),
          privacyTitle: keep(state.privacyTitle, settings.legal?.privacy?.title),
          privacyContent: keep(state.privacyContent, settings.legal?.privacy?.content),
          faqQuestion: keep(state.faqQuestion, faq?.question),
          faqAnswer: keep(state.faqAnswer, faq?.answer),
          seoTitleSuffix: keep(state.seoTitleSuffix, settings.seo?.title_suffix),
          seoDescription: keep(state.seoDescription, settings.seo?.meta_description),
          seoKeywords: keep(state.seoKeywords, settings.seo?.keywords),
          seoOgTitle: keep(state.seoOgTitle, settings.seo?.og_title),
          seoOgDescription: keep(state.seoOgDescription, settings.seo?.og_description),
          seoOgImage: keep(state.seoOgImage, settings.seo?.og_image),
          seoFavicon: keep(state.seoFavicon, settings.seo?.favicon),
          legalBusinessName: keep(state.legalBusinessName, me?.tenant.business.legal_name ?? undefined),
          tradeName: keep(state.tradeName, me?.tenant.business.trade_name ?? undefined),
          taxId: keep(state.taxId, me?.tenant.business.tin ?? undefined),
          tradeLicenseNo: keep(state.tradeLicenseNo, me?.tenant.business.trade_license ?? undefined),
        };
        dispatch({ type: "hydrateFromBackend", patch });
      } catch {
        // No real data yet (new tenant) or the fetch failed — the wizard
        // still works with local-only state, just without prefill.
      }
    })();
    return () => {
      cancelled = true;
    };
    // Only re-run when the site/tenant identity changes, not on every state edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSite?.id, me?.tenant.id, state.hydratedFromBackend]);

  const step = ONBOARDING_STEPS[state.currentStep] ?? ONBOARDING_STEPS[0];
  const canContinueCurrent = canContinue(state, step.id);

  const registerSaveHandler = useCallback((fn: (() => Promise<void>) | null) => {
    saveHandlerRef.current = fn;
  }, []);

  const continueOrSkip = useCallback(
    (opts?: { skip?: boolean }) => {
      const skip = !!opts?.skip;
      if (!skip && !canContinue(state, step.id)) return;
      const advance = () => {
        dispatch({ type: "completeStep", id: step.id, skipped: skip });
        if (step.id === "finish") {
          dispatch({ type: "finish", at: new Date().toISOString() });
          return;
        }
        dispatch({ type: "goNext" });
      };
      if (!skip && saveHandlerRef.current) {
        // Persist this step's batched text fields before moving on. Errors
        // are swallowed here — the field-level UI already surfaces them via
        // toasts, and blocking navigation on a save failure would trap the
        // merchant on a step they can't get past.
        saveHandlerRef.current().finally(advance);
        return;
      }
      advance();
    },
    [state, step.id],
  );

  const reset = useCallback(() => {
    const next = freshState();
    dispatch({ type: "hydrate", state: next });
    writeStored(next);
  }, []);

  const value = useMemo(
    () => ({
      state,
      step,
      stepIndex: state.currentStep,
      dispatch,
      canContinueCurrent,
      continueOrSkip,
      reset,
      registerSaveHandler,
    }),
    [state, step, canContinueCurrent, continueOrSkip, reset, registerSaveHandler],
  );

  return (
    <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}
