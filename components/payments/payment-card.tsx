"use client";

import { CheckCircle2 } from "lucide-react";
import { MaskIcon } from "@/components/ui/mask-icon";
import type { PaymentCatalogEntry } from "./payment-data";
import type { PaymentConnection } from "./payment-types";

type PaymentCardProps = {
  entry: PaymentCatalogEntry;
  connection: PaymentConnection | null;
  onConnect: () => void;
  /** Re-open config for an already-connected method (details live in the modal). */
  onManage: () => void;
  onDisconnect: () => void;
  /** Gateways that aren't free yet — primary Unlock CTA (not “Coming soon”). */
  onUnlock?: () => void;
};

/** Compact catalog card — no expanded detail body when connected (that
 * stretched cards unevenly). Config is always in the connect/manage modal. */
export function PaymentCard({
  entry,
  connection,
  onConnect,
  onManage,
  onDisconnect,
  onUnlock,
}: PaymentCardProps) {
  const connected = connection != null;

  return (
    <article className="flex flex-col rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-border dark:ring-transparent">
      <div className="flex items-start justify-between gap-3">
        {/* Wide wordmarks (~997×438) need horizontal room; square icons still
         * scale up to the same height via object-contain. */}
        <span className="flex h-14 w-[8.5rem] shrink-0 items-center justify-start overflow-hidden">
          <img
            src={entry.logoSrc}
            alt={`${entry.name} logo`}
            className="max-h-14 w-auto max-w-full object-contain object-left"
          />
        </span>
        {entry.available ? (
          connected && connection?.status === "error" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-600">
              Needs attention
            </span>
          ) : connected &&
            (entry.provider === "sslcommerz" || entry.provider === "nagad") &&
            !connection?.lastVerifiedAt ? (
            <span className="rounded-full bg-search-bg px-2.5 py-1 text-xs font-medium text-muted">
              Saved — not yet verified
            </span>
          ) : connected ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              <CheckCircle2 className="size-3.5" strokeWidth={2} />
              Connected
            </span>
          ) : (
            <span className="rounded-full bg-search-bg px-2.5 py-1 text-xs font-medium text-muted">
              Not connected
            </span>
          )
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-search-bg px-2.5 py-1 text-xs font-medium text-muted">
            <MaskIcon src="/sidebar/lock.svg" className="size-3" />
            Locked
          </span>
        )}
      </div>

      <h3 className="mt-4 text-base font-semibold text-foreground">{entry.name}</h3>
      <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">
        {entry.description}
      </p>

      <div className="mt-5 flex gap-2">
        {!entry.available ? (
          <button
            type="button"
            onClick={onUnlock}
            className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-white shadow-sm shadow-primary/20 transition-opacity hover:opacity-90"
          >
            <MaskIcon src="/sidebar/lock.svg" className="size-4" />
            Unlock
          </button>
        ) : connected ? (
          <>
            <button
              type="button"
              onClick={onManage}
              className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center rounded-full bg-primary text-sm font-medium text-white shadow-sm shadow-primary/20 transition-opacity hover:opacity-90"
            >
              Manage
            </button>
            <button
              type="button"
              onClick={onDisconnect}
              className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-search-bg text-sm font-medium text-foreground transition-colors hover:bg-border"
            >
              Disconnect
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onConnect}
            className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center rounded-full bg-primary text-sm font-medium text-white shadow-sm shadow-primary/20 transition-opacity hover:opacity-90"
          >
            Connect
          </button>
        )}
      </div>
    </article>
  );
}
