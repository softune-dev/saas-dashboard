"use client";

import { Lock, Upload } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LoginModal } from "@/components/auth/login-modal";
import { useLanguage } from "@/components/providers/language-provider";
import { MaskIcon } from "@/components/ui/mask-icon";
import type { SiteOut } from "@/lib/api";
import { listProducts } from "@/lib/api/commerce";
import { formatNumber } from "@/lib/format";
import { PublishConfirmModal } from "./editor/publish-confirm-modal";
import { summarizeThemeChanges } from "./editor/theme-diff";
import {
  hasUnpublishedThemeDraft,
  loadThemeDraft,
  loadThemePublished,
  THEME_STORE_EVENT,
} from "./theme-store";
import type { ThemeCard as ThemeCardType } from "./themes-data";
import { ThemeStatusPill } from "./theme-status-pill";
import { usePublishTheme } from "./use-publish-theme";

type ThemeCardProps = {
  theme: ThemeCardType;
  /** The tenant's real site using this template, if any — null only for a
   * locked/not-yet-provisioned card. */
  site: SiteOut | null;
};

export function ThemeCard({ theme, site }: ThemeCardProps) {
  const { t } = useLanguage();
  const isActive = theme.status === "active";
  const isLocked = theme.status === "locked";
  const [canPublish, setCanPublish] = useState(false);
  const [counts, setCounts] = useState<{ products: number } | null>(null);

  useEffect(() => {
    if (!site?.id) return;
    let cancelled = false;
    listProducts(site.id, { limit: 1 })
      .then((productPage) => {
        if (!cancelled) {
          setCounts({ products: productPage.total });
        }
      })
      .catch(() => {
        if (!cancelled) setCounts({ products: 0 });
      });
    return () => {
      cancelled = true;
    };
  }, [site?.id]);

  const shopName = site?.name || theme.label || theme.id;
  const {
    loginOpen,
    setLoginOpen,
    confirmOpen,
    setConfirmOpen,
    publishing,
    progress,
    requestPublish,
    publishNow,
  } = usePublishTheme(theme.id);

  const refreshPublishState = useCallback(() => {
    setCanPublish(isActive && hasUnpublishedThemeDraft(theme.id));
  }, [isActive, theme.id]);

  useEffect(() => {
    refreshPublishState();
    window.addEventListener(THEME_STORE_EVENT, refreshPublishState);
    window.addEventListener("storage", refreshPublishState);
    return () => {
      window.removeEventListener(THEME_STORE_EVENT, refreshPublishState);
      window.removeEventListener("storage", refreshPublishState);
    };
  }, [refreshPublishState]);

  const publishChanges = useMemo(
    () =>
      confirmOpen
        ? summarizeThemeChanges(loadThemeDraft(theme.id), loadThemePublished(theme.id))
        : [],
    [confirmOpen, theme.id],
  );

  async function handleConfirmPublish() {
    const ok = await publishNow();
    setConfirmOpen(false);
    if (ok) refreshPublishState();
  }

  return (
    <article
      className={[
        "relative flex flex-col rounded-2xl px-1.5 pt-1.5 pb-3 text-white",
        isActive ? "bg-primary" : "",
      ].join(" ")}
      style={isLocked ? { backgroundColor: "#929090" } : undefined}
    >
      <div className="absolute top-0 left-1/2 z-10 -translate-x-1/2">
        <ThemeStatusPill status={theme.status} />
      </div>

      <div
        className="relative aspect-[375/460] w-full overflow-hidden bg-surface"
        style={{
          borderRadius: "0.5rem 0.5rem 1.25rem 1.25rem",
        }}
      >
        {site?.screenshot_url || theme.imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={site?.screenshot_url || theme.imageSrc}
            alt={`${shopName} storefront preview`}
            className="size-full object-cover object-top"
          />
        ) : null}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 px-1.5">
        <div className="min-w-0 flex-1 truncate pt-0.5">
          <span className="text-base font-semibold text-white mr-2">
            {shopName}
          </span>
          <span className="text-xs text-white/80">
            {isLocked
              ? "Social media funnel"
              : counts
                ? `${formatNumber(counts.products)} ${t("Products")}`
                : "Loading…"}
          </span>
        </div>

        {isActive ? (
          <div className="flex shrink-0 items-center gap-1.5">
            {canPublish ? (
              <button
                type="button"
                onClick={requestPublish}
                disabled={publishing}
                aria-label={`Publish ${shopName}`}
                title="Publish to live site"
                className="inline-flex size-9 items-center justify-center rounded-full bg-white text-black transition-opacity hover:opacity-90 disabled:opacity-60 shadow-sm"
              >
                <Upload className="size-4 text-black" strokeWidth={2} />
              </button>
            ) : null}
            <Link
              href={`/themes/editor/${theme.id}`}
              aria-label={`Edit ${shopName}`}
              title="Edit theme"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-white px-3.5 text-xs font-semibold text-black transition-opacity hover:opacity-90 shadow-sm"
            >
              <MaskIcon src="/sidebar/edit.svg" className="size-3.5 text-black" />
              <span>{t("Edit")}</span>
            </Link>
          </div>
        ) : (
          <button
            type="button"
            aria-label={`${shopName} is locked`}
            disabled
            className="inline-flex size-9 shrink-0 items-center justify-center text-white opacity-100"
          >
            <Lock className="size-6" strokeWidth={1.75} />
          </button>
        )}
      </div>

      <LoginModal
        open={loginOpen}
        onSuccess={() => {
          setLoginOpen(false);
          setConfirmOpen(true);
        }}
        onDismiss={() => setLoginOpen(false)}
      />
      <PublishConfirmModal
        open={confirmOpen}
        publishing={publishing}
        progress={progress}
        changes={publishChanges}
        onConfirm={handleConfirmPublish}
        onCancel={() => setConfirmOpen(false)}
      />
    </article>
  );
}
