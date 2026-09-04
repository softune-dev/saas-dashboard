"use client";

import { Check, Copy, ExternalLink, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { formatDisplayDate, formatRelativeTime, trialDaysLeft } from "@/lib/format";
import type { SuperAdminTenant } from "@/lib/api/superadmin";
import { TenantStatusBadge } from "./status-badge";

/** Same pattern as customer-detail-modal.tsx's CopyButton — each detail
 * modal in this codebase defines its own rather than sharing one import. */
function CopyButton({ value, label }: { value: string; label: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast({ title: "Copied", variant: "info" });
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${label}`}
      className="inline-flex size-5 shrink-0 items-center justify-center rounded-md text-muted-soft transition-colors hover:bg-search-bg hover:text-primary"
    >
      {copied ? (
        <Check className="size-3 text-emerald-600" strokeWidth={2.5} />
      ) : (
        <Copy className="size-3" strokeWidth={1.75} />
      )}
    </button>
  );
}

function siteUrl(site: SuperAdminTenant["sites"][number]): string {
  if (site.custom_domain) return `https://${site.custom_domain}`;
  return `https://${site.subdomain}.softunebd.com`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-soft">{label}</p>
      <div className="mt-0.5 text-sm text-foreground">{children}</div>
    </div>
  );
}

type TenantDetailModalProps = {
  tenant: SuperAdminTenant | null;
  onClose: () => void;
};

/** Read-only — every field an operator asked for that the trimmed table row
 * doesn't have room to show: real per-site subdomain/custom_domain (the
 * actual thing needed to go check "is this tenant's live site good or
 * bad"), legal/billing identity, and the counts the table used to carry
 * inline. Edit/Ban/Delete stay on the row's own 3-dot menu, not duplicated
 * here — this modal only ever reads. */
export function TenantDetailModal({ tenant, onClose }: TenantDetailModalProps) {
  return (
    <AnimatePresence>
      {tenant ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Dismiss"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/35"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tenant-detail-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-surface"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4 dark:border-transparent">
              <div className="min-w-0">
                <h3 id="tenant-detail-title" className="truncate text-base font-semibold text-foreground">
                  {tenant.name}
                </h3>
                <p className="mt-0.5 truncate text-sm text-muted">{tenant.slug}</p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg hover:text-foreground"
              >
                <X className="size-4" strokeWidth={1.75} />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
              <div className="flex flex-wrap items-center gap-2">
                <TenantStatusBadge status={tenant.status} />
                <span className="inline-flex rounded-full bg-search-bg px-2.5 py-1 text-xs font-medium text-foreground capitalize">
                  {tenant.plan}
                </span>
                {tenant.plan === "trial" && tenant.trial_expires_at ? (
                  <span className="inline-flex rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                    {(() => {
                      const days = trialDaysLeft(tenant.trial_expires_at);
                      return days <= 0 ? "last day" : days === 1 ? "1 day left" : `${days} days left`;
                    })()}
                  </span>
                ) : null}
              </div>

              {/* Sites — the actual answer to "is their live URL good or
                  bad," which was missing entirely before this modal. */}
              <div>
                <p className="mb-2 text-xs font-medium text-muted">
                  Storefronts{tenant.sites.length ? ` (${tenant.sites.length})` : ""}
                </p>
                {tenant.sites.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border px-3 py-2.5 text-sm text-muted-soft">
                    No storefront yet.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {tenant.sites.map((site) => (
                      <li key={site.id} className="rounded-md border border-border px-3 py-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <span className="truncate text-sm font-medium text-foreground">
                              {site.custom_domain || `${site.subdomain}.softunebd.com`}
                            </span>
                            <CopyButton
                              value={site.custom_domain || `${site.subdomain}.softunebd.com`}
                              label="domain"
                            />
                          </div>
                          <a
                            href={siteUrl(site)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-soft transition-colors hover:bg-search-bg hover:text-primary"
                            aria-label="Open storefront"
                          >
                            <ExternalLink className="size-3.5" strokeWidth={1.75} />
                          </a>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                          <span className="capitalize">{site.status}</span>
                          {site.template_key ? <span>{site.template_key}</span> : null}
                          {site.custom_domain ? (
                            <span>subdomain: {site.subdomain}.softunebd.com</span>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border pt-5 dark:border-transparent sm:grid-cols-3">
                <Field label="Categories">{tenant.category_count}</Field>
                <Field label="Products">{tenant.product_count}</Field>
                <Field label="Orders">{tenant.order_count}</Field>
                <Field label="Users">{tenant.user_count}</Field>
                <Field label="Created">{formatDisplayDate(new Date(tenant.created_at))}</Field>
                <Field label="Owner last login">
                  {tenant.owner_last_login_at
                    ? formatRelativeTime(new Date(tenant.owner_last_login_at))
                    : "Never"}
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border pt-5 dark:border-transparent">
                <Field label="Payment methods">
                  {tenant.payment_providers.length
                    ? tenant.payment_providers.join(", ")
                    : "None connected"}
                </Field>
                <Field label="Couriers">
                  {tenant.courier_providers.length
                    ? tenant.courier_providers.join(", ")
                    : "None connected"}
                </Field>
              </div>

              <div className="border-t border-border pt-5 dark:border-transparent">
                <p className="mb-2 text-xs font-medium text-muted">Billing identity</p>
                {!tenant.business.trade_name && !tenant.business.legal_name ? (
                  <p className="text-sm text-muted-soft">Not set.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Trade name">{tenant.business.trade_name || "—"}</Field>
                    <Field label="Legal name">{tenant.business.legal_name || "—"}</Field>
                    <Field label="Business type">{tenant.business.business_type || "—"}</Field>
                    <Field label="Trade license">{tenant.business.trade_license || "—"}</Field>
                    <Field label="TIN">{tenant.business.tin || "—"}</Field>
                    <Field label="Billing email">{tenant.business.billing_email || "—"}</Field>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
