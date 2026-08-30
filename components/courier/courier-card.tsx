"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { MaskIcon } from "@/components/ui/mask-icon";
import type { CourierConnectionOut } from "@/lib/api/courier";
import type { CourierCatalogEntry } from "./courier-data";

type CourierCardProps = {
  entry: CourierCatalogEntry;
  connection: CourierConnectionOut | null;
  onConnect: () => void;
  onDisconnect: () => void;
  /** Unavailable providers — primary Unlock CTA (same as Payments). */
  onUnlock?: () => void;
};

export function CourierCard({
  entry,
  connection,
  onConnect,
  onDisconnect,
  onUnlock,
}: CourierCardProps) {
  const connected = connection != null;
  const hasError = connection?.status === "error";

  return (
    <article className="flex flex-col rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-border dark:ring-transparent">
      <div className="flex items-start justify-between gap-3">
        <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden">
          <img
            src={entry.logoSrc}
            alt={`${entry.name} logo`}
            className="max-h-18 max-w-[3.25rem] object-contain"
          />
        </span>
        {entry.available ? (
          connected && hasError ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-600">
              <AlertTriangle className="size-3.5" strokeWidth={2} />
              Needs attention
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

      {connected && connection ? (
        <div className="mt-4 space-y-2 rounded-xl bg-search-bg/70 px-3 py-3 text-sm">
          {connection.label ? (
            <p className="font-medium text-foreground">{connection.label}</p>
          ) : null}
          <p className="text-muted">
            API key{" "}
            <span className="font-mono text-foreground">{connection.api_key_hint}</span>
          </p>
          {hasError ? (
            <p className="text-rose-600">
              {entry.name} rejected these credentials. Disconnect and reconnect with
              valid credentials.
            </p>
          ) : connection.last_verified_at ? (
            <p className="text-xs text-muted-soft">
              Verified {new Date(connection.last_verified_at).toLocaleDateString()}
            </p>
          ) : null}
        </div>
      ) : null}

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
          <button
            type="button"
            onClick={onDisconnect}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-search-bg text-sm font-medium text-foreground transition-colors hover:bg-border"
          >
            Disconnect
          </button>
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
