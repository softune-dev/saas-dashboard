"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { AddonCatalogEntry } from "./addon-data";

type AddonCardProps = {
  entry: AddonCatalogEntry;
  onRequest: () => void;
  onLearnMore: () => void;
};

/** Same shell as courier/payment cards — status pill, icon slot, two actions.
 * Entries with `href` are real, already-built features (Payments/Courier),
 * not requestable add-ons — those get a single "Manage" link instead. */
export function AddonCard({ entry, onRequest, onLearnMore }: AddonCardProps) {
  const Icon = entry.icon;
  const builtin = !!entry.href;

  return (
    <article className="flex flex-col rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-border dark:ring-transparent">
      <div className="flex items-start justify-between gap-3">
        {/* Plain art — square webp icons; wide payment/courier marks still fit. */}
        {entry.logoSrc ? (
          <span className="flex h-12 w-14 shrink-0 items-center justify-start overflow-hidden">
            <img
              src={entry.logoSrc}
              alt={`${entry.name} logo`}
              className="max-h-12 w-auto max-w-full object-contain object-left"
            />
          </span>
        ) : Icon ? (
          <Icon className="size-8 shrink-0 text-foreground" strokeWidth={1.5} aria-hidden />
        ) : null}
        {entry.active ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            <CheckCircle2 className="size-3.5" strokeWidth={2} />
            {builtin ? "Included" : "Connected"}
          </span>
        ) : (
          <span className="rounded-full bg-search-bg px-2.5 py-1 text-xs font-medium text-muted">
            Not connected
          </span>
        )}
      </div>

      <h3 className="mt-4 text-base font-semibold text-foreground">{entry.name}</h3>
      <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">
        {entry.description}
      </p>

      <div className="mt-5 flex gap-2">
        {builtin ? (
          <Link
            href={entry.href!}
            className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center rounded-full bg-primary text-sm font-medium text-white shadow-sm shadow-primary/20 transition-opacity hover:opacity-90"
          >
            Manage
          </Link>
        ) : (
          <>
            <button
              type="button"
              onClick={onRequest}
              className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center rounded-full bg-primary text-sm font-medium text-white shadow-sm shadow-primary/20 transition-opacity hover:opacity-90"
            >
              Request
            </button>
            <button
              type="button"
              onClick={onLearnMore}
              className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-search-bg text-sm font-medium text-foreground transition-colors hover:bg-border"
            >
              Learn More
            </button>
          </>
        )}
      </div>
    </article>
  );
}
