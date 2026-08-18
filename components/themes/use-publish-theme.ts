"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { findSiteByTemplateKey, getToken, publishSite, publishSiteTheme } from "@/lib/api";
import { loadThemeDraft, publishThemeDraft } from "./theme-store";

/** Publish progress, as a percentage of the work actually done.
 *
 * These are real checkpoints, not a timer: each value is set only once the
 * preceding network call has resolved. The gap between 25 and 70 is the site
 * lookup; 70 to 95 is the theme write, which is the slow part. */
const STAGE = {
  idle: 0,
  resolving: 25,
  writing: 70,
  finalising: 95,
  done: 100,
} as const;

export function usePublishTheme(siteId: string) {
  const { toast } = useToast();
  const [loginOpen, setLoginOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [progress, setProgress] = useState<number>(STAGE.idle);

  async function publishNow(): Promise<boolean> {
    setPublishing(true);
    setProgress(STAGE.resolving);
    try {
      const site = await findSiteByTemplateKey(siteId);
      if (!site) {
        toast({
          title: "No live site found",
          description: `No site was created from the "${siteId}" template yet.`,
          variant: "info",
        });
        return false;
      }

      setProgress(STAGE.writing);
      await publishSiteTheme(site.id, loadThemeDraft(siteId));
      // Writing the theme alone leaves sites.status stuck on "draft" forever
      // — this is the step that actually takes the site live (see publishSite's
      // docstring in lib/api.ts). Safe to call every time; it's idempotent.
      await publishSite(site.id);

      setProgress(STAGE.finalising);
      const ok = publishThemeDraft(siteId);
      if (!ok) {
        toast({
          title: "Nothing to publish",
          description: "Save changes in the editor first.",
          variant: "info",
        });
        return false;
      }

      setProgress(STAGE.done);
      toast({
        title: "Published live",
        description: "The storefront now reflects these changes.",
        variant: "success",
      });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      // The Supabase pooler drops prepared statements between requests, which
      // surfaces as a scary SQL error for what is really "try again".
      const isPoolerError =
        msg.includes("prepared statement") || msg.includes("pool");
      toast({
        title: "Publish failed",
        description: isPoolerError
          ? "Connection hiccup — press Publish again."
          : msg,
        variant: "info",
      });
      return false;
    } finally {
      setPublishing(false);
    }
  }

  /** Entry point for a Publish button: gates on login, then asks for
   * confirmation before touching the live site. */
  function requestPublish() {
    if (!getToken()) {
      setLoginOpen(true);
      return;
    }
    setProgress(STAGE.idle);
    setConfirmOpen(true);
  }

  return {
    loginOpen,
    setLoginOpen,
    confirmOpen,
    setConfirmOpen,
    publishing,
    progress,
    requestPublish,
    publishNow,
  };
}
