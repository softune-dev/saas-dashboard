"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OutlineButton } from "@/components/ui/outline-button";
import { PrimaryButton } from "@/components/ui/primary-button";
import { MaskIcon } from "@/components/ui/mask-icon";
import { saveThemeDraft } from "@/components/themes/theme-store";
import { usePublishTheme } from "@/components/themes/use-publish-theme";
import { ONBOARDING_STEPS } from "../onboarding-steps";
import { useOnboarding } from "../onboarding-context";

export function StepFinish() {
  const router = useRouter();
  const { state, dispatch, reset } = useOnboarding();
  // usePublishTheme keys everything off the template key (see theme-store.ts's
  // "siteId here is the template key" comment) — same mechanism the real
  // theme editor's Publish button uses, so onboarding doesn't invent a
  // second way to go live.
  const { publishing, publishNow } = usePublishTheme(state.templateKey);
  const [publishError, setPublishError] = useState<string | null>(null);
  const liveUrl = `https://${state.subdomainPreview}.softune.xyz`;
  const done = !!state.finishedAt;

  async function handleGoLive() {
    setPublishError(null);
    // The wizard's shop-basics/brand steps kept their edits in
    // state.draftSettings, not in the theme editor's own localStorage draft
    // — write it there first so publishNow() (which reads loadThemeDraft)
    // actually publishes what the merchant typed in this wizard.
    saveThemeDraft(state.templateKey, state.draftSettings);
    const ok = await publishNow();
    if (!ok) {
      setPublishError("Publish failed — check your connection and try again.");
      return;
    }
    dispatch({ type: "completeStep", id: "finish", skipped: false });
    dispatch({ type: "finish", at: new Date().toISOString() });
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-8 text-center">
        <MaskIcon src="/sidebar/start.svg" className="size-14 text-primary" />
        <div>
          <h2 className="text-xl font-semibold text-foreground">You&apos;re live!</h2>
          <p className="mt-2 text-sm text-muted">
            Your store is fully set up and ready to accept customers.
          </p>
        </div>
        <a
          href={liveUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-search-bg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
        >
          <span>{liveUrl}</span>
          <MaskIcon src="/sidebar/domain.svg" className="size-4" />
        </a>
        <div className="flex flex-wrap justify-center gap-2">
          <PrimaryButton type="button" onClick={() => router.push("/")}>
            Open dashboard
          </PrimaryButton>
          <OutlineButton type="button" onClick={() => reset()}>
            Reset wizard
          </OutlineButton>
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

      <ul className="space-y-1.5">
        {ONBOARDING_STEPS.filter((s) => s.id !== "finish").map((s) => {
          const completed = state.completedSteps.includes(s.id);
          const skipped = state.skippedSteps.includes(s.id);
          return (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-md border border-border bg-search-bg px-3 py-2 text-sm"
            >
              <span className="font-medium text-foreground">{s.title}</span>
              <span className="text-xs font-semibold text-muted">
                {completed ? "Done" : skipped ? "Skipped" : "Pending"}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="rounded-md border border-border bg-search-bg px-3 py-3 text-sm">
        <p className="font-medium text-foreground">Storefront address</p>
        <p className="mt-1 font-semibold text-primary">{liveUrl}</p>
      </div>

      {publishError ? <p className="text-xs text-rose-500">{publishError}</p> : null}

      <PrimaryButton type="button" onClick={handleGoLive} disabled={publishing} className="w-full min-h-11">
        {publishing ? "Publishing…" : "Publish and go live"}
      </PrimaryButton>
    </div>
  );
}
