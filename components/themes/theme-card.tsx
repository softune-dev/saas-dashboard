"use client";

import { Lock, Upload } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LoginModal } from "@/components/auth/login-modal";
import { MaskIcon } from "@/components/ui/mask-icon";
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
};

export function ThemeCard({ theme }: ThemeCardProps) {
  const isActive = theme.status === "active";
  const isLocked = theme.status === "locked";
  const [canPublish, setCanPublish] = useState(false);
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
        className="aspect-[16/11] w-full bg-white"
        style={{
          borderRadius: "0.5rem 0.5rem 1.25rem 1.25rem",
        }}
      />

      <div className="mt-2.5 flex items-center gap-2 px-1.5">
        <div className="min-w-0 flex-1 truncate pt-0.5">
          <span className="text-base font-semibold text-white mr-2">
            {theme.shopName}
          </span>
          <span className="text-xs text-white/80">
            {isLocked
              ? "Social media funnel"
              : `${formatNumber(theme.productsCount)} Products · ${formatNumber(theme.categoriesCount)} Categories`}
          </span>
        </div>

        {isActive ? (
          <div className="flex shrink-0 items-center gap-1.5">
            {canPublish ? (
              <button
                type="button"
                onClick={requestPublish}
                disabled={publishing}
                aria-label={`Publish ${theme.shopName}`}
                title="Publish to live site"
                className="inline-flex size-9 items-center justify-center rounded-full bg-white text-primary transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                <Upload className="size-4" strokeWidth={2} />
              </button>
            ) : null}
            <Link
              href={`/themes/editor/${theme.id}`}
              aria-label={`Edit ${theme.shopName}`}
              title="Edit theme"
              className="inline-flex size-9 items-center justify-center text-white transition-opacity hover:opacity-80"
            >
              <MaskIcon src="/sidebar/settings.svg" className="size-6" />
            </Link>
          </div>
        ) : (
          <button
            type="button"
            aria-label={`${theme.shopName} is locked`}
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
