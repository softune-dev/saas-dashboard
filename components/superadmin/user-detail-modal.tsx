"use client";

import { Check, Copy, ExternalLink, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { formatDisplayDate, formatRelativeTime } from "@/lib/format";
import type { SuperAdminUser } from "@/lib/api/superadmin";
import { UserActiveBadge } from "./status-badge";

/** Same pattern as customer-detail-modal.tsx's CopyButton. */
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

function siteUrl(site: SuperAdminUser["sites"][number]): string {
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

type UserDetailModalProps = {
  user: SuperAdminUser | null;
  onClose: () => void;
};

/** Read-only counterpart to EditUserModal — surfaces exactly what the
 * trimmed table row and the edit form both leave out: phone number (real
 * column on User, never shown anywhere in superadmin before this), and the
 * tenant's actual storefront URL(s), so "whose site is this" is one click,
 * not a database query. */
export function UserDetailModal({ user, onClose }: UserDetailModalProps) {
  return (
    <AnimatePresence>
      {user ? (
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
            aria-labelledby="user-detail-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-surface"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4 dark:border-transparent">
              <div className="min-w-0">
                <h3 id="user-detail-title" className="truncate text-base font-semibold text-foreground">
                  {user.full_name || user.email}
                </h3>
                <p className="mt-0.5 truncate text-sm text-muted">{user.tenant_name}</p>
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
                <UserActiveBadge active={user.is_active} />
                <span className="inline-flex rounded-full bg-search-bg px-2.5 py-1 text-xs font-medium text-foreground capitalize">
                  {user.role}
                </span>
                {user.is_superadmin ? (
                  <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    Superadmin
                  </span>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-muted-soft">Email</p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <p className="truncate text-sm text-foreground">{user.email}</p>
                    <CopyButton value={user.email} label="email" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-soft">Phone</p>
                  {user.phone ? (
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <p className="text-sm text-foreground">{user.phone}</p>
                      <CopyButton value={user.phone} label="phone number" />
                    </div>
                  ) : (
                    <p className="mt-0.5 text-sm text-muted-soft">Not set</p>
                  )}
                </div>
              </div>

              {/* Storefronts — was missing entirely; "no connected domain
                  or anything to see their actual site" is the exact gap
                  this section closes. */}
              <div className="border-t border-border pt-5 dark:border-transparent">
                <p className="mb-2 text-xs font-medium text-muted">
                  Storefront{user.sites.length === 1 ? "" : "s"}
                  {user.sites.length ? ` (${user.sites.length})` : ""}
                </p>
                {user.sites.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border px-3 py-2.5 text-sm text-muted-soft">
                    Their tenant has no storefront yet.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {user.sites.map((site) => (
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
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border pt-5 dark:border-transparent">
                <Field label="Created">{formatDisplayDate(new Date(user.created_at))}</Field>
                <Field label="Last login">
                  {user.last_login_at ? formatRelativeTime(new Date(user.last_login_at)) : "Never"}
                </Field>
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
