"use client";

import { Check, Copy, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import {
  saveSiteCourierRules,
  useSiteSettingsSWR,
  type SiteCourierRules,
} from "@/lib/api/site-settings";
import type { CourierConnectionOut } from "@/lib/api/courier";

function CopyField({ label, value }: { label: string; value: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast({ title: "Copied", variant: "info" });
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div>
      <p className="text-xs font-medium text-muted-soft">{label}</p>
      <div className="mt-1 flex items-center gap-2 rounded-md border border-border bg-search-bg px-3 py-2">
        <code className="min-w-0 flex-1 truncate text-xs text-foreground">{value}</code>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy ${label}`}
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-soft transition-colors hover:bg-border hover:text-primary"
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-600" strokeWidth={2.5} />
          ) : (
            <Copy className="size-3.5" strokeWidth={1.75} />
          )}
        </button>
      </div>
    </div>
  );
}

/** Only renders anything once Steadfast is actually connected — auto-book
 * and its webhook are meaningless without a working connection to book
 * against. Toggling auto_book saves immediately (no draft/Save-bar step,
 * unlike Fraud Protection's rule editor) since it's the only setting here. */
export function CourierAutomationCard({
  siteId,
  steadfastConnection,
}: {
  siteId: string;
  steadfastConnection: CourierConnectionOut | null;
}) {
  const { data: settings, mutate } = useSiteSettingsSWR(siteId);
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  if (!steadfastConnection || steadfastConnection.status !== "connected") return null;

  const rules: SiteCourierRules = settings?.courier_rules ?? {};
  const autoBookEnabled = rules.auto_book?.enabled ?? false;

  async function toggleAutoBook() {
    if (!settings) return;
    setSaving(true);
    const next: SiteCourierRules = {
      ...rules,
      auto_book: { enabled: !autoBookEnabled, provider: "steadfast" },
    };
    try {
      const updated = await saveSiteCourierRules(siteId, next);
      await mutate({ ...settings, courier_rules: updated.courier_rules }, { revalidate: false });
      toast({
        title: updated.courier_rules.auto_book?.enabled
          ? "Auto-book turned on"
          : "Auto-book turned off",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Couldn't update auto-book",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-md bg-surface p-4 sm:p-5">
      <h2 className="text-base font-semibold text-foreground">Steadfast automation</h2>
      <p className="mt-1 text-sm text-muted">
        Book new orders automatically and keep delivery status in sync — no manual courier work.
      </p>

      <div className="mt-4 flex items-start justify-between gap-4 rounded-md border border-border px-4 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">Auto-book new orders</p>
          <p className="mt-0.5 text-xs text-muted">
            Every storefront order books with Steadfast the moment it&apos;s placed. Orders flagged
            by Fraud Protection are never auto-booked.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={autoBookEnabled}
          disabled={saving || !settings}
          onClick={toggleAutoBook}
          className={[
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60",
            autoBookEnabled ? "bg-primary" : "bg-border",
          ].join(" ")}
        >
          <span
            className={[
              "inline-block size-4 transform rounded-full bg-white transition-transform",
              autoBookEnabled ? "translate-x-6" : "translate-x-1",
            ].join(" ")}
          />
          {saving ? (
            <Loader2 className="absolute -right-6 size-4 animate-spin text-muted" strokeWidth={2} />
          ) : null}
        </button>
      </div>

      {steadfastConnection.webhook_url && steadfastConnection.webhook_secret ? (
        <div className="mt-4 space-y-3">
          <p className="text-xs font-medium text-muted">
            Delivery status stays in sync automatically once this is set up on Steadfast&apos;s
            side — paste both into{" "}
            <a
              href="https://portal.packzy.com/user/api"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-2"
            >
              Steadfast &rarr; Settings &rarr; API &rarr; Update Webhook Info
            </a>
            .
          </p>
          <CopyField label="Callback URL" value={steadfastConnection.webhook_url} />
          <CopyField label="Auth Token" value={steadfastConnection.webhook_secret} />
        </div>
      ) : null}
    </section>
  );
}
