"use client";

import { Check, ChevronRight, ExternalLink, Loader2, Rocket } from "lucide-react";
import confetti from "canvas-confetti";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "@/lib/api";
import { OutlineButton } from "@/components/ui/outline-button";
import { PrimaryButton } from "@/components/ui/primary-button";
import { MaskIcon } from "@/components/ui/mask-icon";
import { saveThemeDraft } from "@/components/themes/theme-store";
import { usePublishTheme } from "@/components/themes/use-publish-theme";
import { resolvePendingUploads } from "@/components/themes/editor/pending-uploads";
import { useSession } from "@/components/providers/session-provider";
import { ONBOARDING_STEPS, type OnboardingStepId } from "../onboarding-steps";
import { useOnboarding } from "../onboarding-context";

// Same icon each step already uses for its own header (step-shop-basics.tsx,
// step-brand.tsx, etc.) — reused here instead of inventing a second set, so
// a step reads as the same thing whether you're inside it or looking at
// this summary of it.
const STEP_ICONS: Record<OnboardingStepId, string> = {
  shop: "/sidebar/shop-bag.svg",
  brand: "/sidebar/color.svg",
  categories: "/sidebar/categories.svg",
  products: "/sidebar/products.svg",
  courier: "/sidebar/delivery.svg",
  payments: "/sidebar/wallet.svg",
  seo: "/sidebar/domain.svg",
  "store-info": "/sidebar/shop-bag.svg",
  finish: "/sidebar/start.svg",
};

// Quick links into the parts of Site Settings most stores still need after
// publishing — the optional steps (seo/store-info) this wizard let a
// merchant skip, plus domains, which was never part of this wizard at all.
const NEXT_UP = [
  {
    href: "/settings/site/domains",
    icon: "/sidebar/domain.svg",
    title: "Add a custom domain",
    description: "Use your own domain instead of the free subdomain.",
  },
  {
    href: "/settings/site/seo",
    icon: "/sidebar/domain.svg",
    title: "Boost your SEO",
    description: "Title, description, and keywords for search engines.",
  },
  {
    href: "/settings/site/about",
    icon: "/sidebar/brand.svg",
    title: "Tell your story",
    description: "An About Us section builds trust with new shoppers.",
  },
  {
    href: "/settings/site/faqs",
    icon: "/sidebar/help-desk.svg",
    title: "Answer common questions",
    description: "FAQs cut down on repetitive support messages.",
  },
  {
    href: "/settings/site/terms",
    icon: "/sidebar/lock.svg",
    title: "Add your policies",
    description: "Terms and a privacy policy, expected by most shoppers.",
  },
];

const CONFETTI_COLORS = ["#ff5a36", "#fbbf24", "#34d399", "#60a5fa"];

function fireConfetti() {
  const opts = { colors: CONFETTI_COLORS, disableForReducedMotion: true };
  confetti({ ...opts, particleCount: 90, spread: 76, origin: { y: 0.55 } });
  window.setTimeout(() => {
    confetti({ ...opts, particleCount: 45, angle: 60, spread: 52, origin: { x: 0, y: 0.7 } });
    confetti({ ...opts, particleCount: 45, angle: 120, spread: 52, origin: { x: 1, y: 0.7 } });
  }, 180);
}

export function StepFinish() {
  const router = useRouter();
  const { state, dispatch } = useOnboarding();
  const { refetch, currentSite } = useSession();
  // usePublishTheme keys everything off the template key (see theme-store.ts's
  // "siteId here is the template key" comment) — same mechanism the real
  // theme editor's Publish button uses, so onboarding doesn't invent a
  // second way to go live.
  const { publishing, publishNow } = usePublishTheme(state.templateKey);
  const [publishError, setPublishError] = useState<string | null>(null);
  // The real subdomain, not state.subdomainPreview — that field only ever
  // updates when the merchant retypes their shop name DURING this wizard
  // (see onboarding-context.tsx's "patchSettings" reducer case), so a
  // trial signup — where the name and subdomain were already set before
  // this dashboard session even started — left it stuck on its literal
  // default ("my-shop") forever. currentSite.subdomain is the one place
  // that's always correct, since it's set once at site creation and never
  // silently guessed.
  const liveUrl = `https://${currentSite?.subdomain}.${process.env.NEXT_PUBLIC_SITE_BASE_DOMAIN || "softunebd.com"}`;
  const done = !!state.finishedAt;

  useEffect(() => {
    if (!done) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    fireConfetti();
  }, [done]);

  async function handleGoLive() {
    setPublishError(null);

    // The Brand step's logo picker (brand-colors-header-panel.tsx) shares
    // the theme editor's image pickers, which now only stage a local blob:
    // preview until the real upload happens right before publish (see
    // pending-uploads.ts) — resolve that here or a blob: URL (dead outside
    // this tab) would get saved as the site's real logo forever.
    let draftSettings = state.draftSettings;
    if (currentSite?.id) {
      try {
        draftSettings = await resolvePendingUploads(currentSite.id, state.draftSettings);
        dispatch({ type: "patchSettings", patch: draftSettings });
      } catch (err) {
        setPublishError(
          err instanceof Error ? err.message : "Couldn't upload your images. Try again.",
        );
        return;
      }
    }

    // The wizard's shop-basics/brand steps kept their edits in
    // state.draftSettings, not in the theme editor's own localStorage draft
    // — write it there first so publishNow() (which reads loadThemeDraft)
    // actually publishes what the merchant typed in this wizard.
    saveThemeDraft(state.templateKey, draftSettings);
    const ok = await publishNow();
    if (!ok) {
      setPublishError("Publish failed — check your connection and try again.");
      return;
    }
    // Marks the wizard done for good, so the sidebar's "Getting Started"
    // item stops appearing — even for a trial tenant, whose site was
    // already "published" before this session started (see that field's
    // own comment on why status alone can't be the signal). Best-effort:
    // worst case the merchant sees Setup once more next login and this
    // simply retries then.
    if (currentSite?.id) {
      try {
        await completeOnboarding(currentSite.id);
      } catch {
        // Non-fatal — the site is already live either way.
      }
    }

    // useOnboardingGuard reads site.status from useSession's cached sites —
    // still "draft" from before this publish. Refresh it now and await the
    // result, otherwise "Open dashboard" (or the guard's own effect) races
    // the fetch and bounces straight back to /onboarding.
    try {
      await refetch();
    } catch {
      // Best-effort — the guard will pick up the real status on its own
      // next natural refetch even if this one failed.
    }
    dispatch({ type: "completeStep", id: "finish", skipped: false });
    dispatch({ type: "finish", at: new Date().toISOString() });
  }

  if (done) {
    return (
      <div className="flex flex-col gap-6 py-2">
        {/* "Live" was already the celebration the merchant saw the moment
            they first landed here (store-live-modal.tsx) — repeating it
            verbatim on this screen too read as the same news twice. This
            one is about what's next, not the launch itself. */}
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-primary text-white">
            <Check className="size-8" strokeWidth={2.5} />
          </span>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              You&apos;re ready to sell! 🎉
            </h2>
            <p className="mt-2 text-sm text-muted">
              Your store is fully set up and ready to accept customers.
            </p>
          </div>
          <a
            href={liveUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-search-bg px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
          >
            <span>{liveUrl}</span>
            <ExternalLink className="size-3.5" strokeWidth={2.5} />
          </a>
          <div className="flex flex-wrap justify-center gap-2">
            <PrimaryButton type="button" onClick={() => router.push("/")}>
              Open dashboard
            </PrimaryButton>
            <OutlineButton
              type="button"
              onClick={() => router.push(`/themes/editor/${state.templateKey}`)}
            >
              Open editor
            </OutlineButton>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            Worth doing next
          </p>
          <ul className="flex flex-col gap-1.5">
            {NEXT_UP.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-md border border-border bg-search-bg px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface">
                    <MaskIcon src={item.icon} className="size-4 text-primary" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {item.title}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {item.description}
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-soft" strokeWidth={2} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <MaskIcon src="/sidebar/start.svg" className="size-4 text-primary" />
        Ready to publish
      </div>

      <p className="text-sm text-muted">
        Review your setup below, then publish your storefront live.
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ONBOARDING_STEPS.filter((s) => s.id !== "finish").map((s) => {
          const completed = state.completedSteps.includes(s.id);
          const skipped = state.skippedSteps.includes(s.id);
          const status = completed ? "Done" : skipped ? "Skipped" : "Pending";
          return (
            <div
              key={s.id}
              className="flex flex-col gap-2 rounded-md border border-border bg-search-bg px-3 py-2.5"
            >
              <div className="flex items-center gap-2">
                <MaskIcon src={STEP_ICONS[s.id]} className="size-3.5 shrink-0 text-primary" />
                <span className="min-w-0 truncate text-sm font-medium text-foreground">
                  {s.title}
                </span>
              </div>
              <span
                className={[
                  "inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  completed
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : skipped
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : "bg-border text-muted",
                ].join(" ")}
              >
                {completed ? <Check className="size-2.5" strokeWidth={3} /> : null}
                {status}
              </span>
            </div>
          );
        })}
      </div>

      <div className="rounded-md border border-border bg-search-bg px-3 py-3 text-sm">
        <p className="font-medium text-foreground">Storefront address</p>
        <p className="mt-1 font-semibold text-primary">{liveUrl}</p>
      </div>

      {publishError ? <p className="text-xs text-rose-500">{publishError}</p> : null}

      <PrimaryButton
        type="button"
        onClick={handleGoLive}
        disabled={publishing}
        aria-busy={publishing}
        className="w-full min-h-11"
      >
        {publishing ? (
          <span className="inline-flex items-center justify-center gap-1.5">
            <Loader2 className="size-4 animate-spin" strokeWidth={2} />
            Publishing…
          </span>
        ) : (
          <span className="inline-flex items-center justify-center gap-1.5">
            <Rocket className="size-4" strokeWidth={2.25} />
            Publish and go live
          </span>
        )}
      </PrimaryButton>
    </div>
  );
}
