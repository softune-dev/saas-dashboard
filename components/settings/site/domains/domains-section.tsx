"use client";

import { ArrowUpRight, Check, Copy, Globe, Info, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { useToast } from "@/components/ui/toast";
import { PrimaryButton } from "@/components/ui/primary-button";
import { useLanguage } from "@/components/providers/language-provider";
import {
  getDomainStatus,
  saveSiteDomain,
  useSiteSettingsSWR,
  type DomainStatus,
} from "@/lib/api/site-settings";
import { SettingsModal } from "../ui/settings-modal";
import { SettingsRowSkeleton } from "../ui/settings-skeleton";

const SITE_BASE_DOMAIN = process.env.NEXT_PUBLIC_SITE_BASE_DOMAIN || "softunebd.com";

/** One-line value with its own copy button — the CNAME target / IP the
 * merchant has to paste verbatim into a DNS panel they've never used
 * before. A plain sentence with the value inline is easy to mistype
 * copying by hand; this removes that step entirely. */
function CopyRow({ value }: { value: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast({ title: "Copied", variant: "info" });
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="flex items-center gap-1.5">
      <code className="min-w-0 truncate text-xs font-semibold text-primary">{value}</code>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy ${value}`}
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-primary"
      >
        {copied ? (
          <Check className="size-3.5 text-emerald-600" strokeWidth={2.5} />
        ) : (
          <Copy className="size-3.5" strokeWidth={1.75} />
        )}
      </button>
    </div>
  );
}

type LiveDomainRowProps = {
  kind: "free" | "custom";
  host: string;
  statusLabel: string;
  statusTone: "live" | "pending" | "unknown";
  /** Custom domain DNS status — colors the host on mobile only. */
  connected?: boolean | null;
  onRefresh?: () => void;
  refreshing?: boolean;
};

const KIND_STYLES: Record<LiveDomainRowProps["kind"], string> = {
  free: "bg-primary/10 text-primary",
  custom: "bg-search-bg text-muted",
};

const STATUS_STYLES: Record<LiveDomainRowProps["statusTone"], string> = {
  live: "bg-primary/10 text-primary",
  pending: "bg-amber-500/10 text-amber-600",
  unknown: "bg-search-bg text-muted",
};

function LiveDomainRow({
  kind,
  host,
  statusLabel,
  statusTone,
  connected,
  onRefresh,
  refreshing,
}: LiveDomainRowProps) {
  const { t } = useLanguage();
  const hostColor =
    kind === "custom"
      ? connected === true
        ? "text-emerald-600 sm:text-foreground"
        : "text-primary sm:text-foreground"
      : "text-foreground";

  return (
    <div className="flex items-center gap-2 rounded-md border border-border px-3 py-3 sm:gap-3">
      <span className="hidden size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary sm:flex">
        <Globe className="size-4" strokeWidth={1.75} />
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <p className={["min-w-0 truncate font-semibold", hostColor].join(" ")}>
          {host}
        </p>
        <span
          className={[
            "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-normal",
            KIND_STYLES[kind],
          ].join(" ")}
        >
          {kind === "free" ? t("Free") : t("Custom")}
        </span>
      </div>
      <span
        className={[
          "hidden shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex",
          STATUS_STYLES[statusTone],
        ].join(" ")}
      >
        {statusLabel}
      </span>
      {onRefresh ? (
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Recheck connection"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg hover:text-primary disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} strokeWidth={1.75} />
        </button>
      ) : null}
      <a
        href={`https://${host}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open in a new tab"
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg hover:text-primary"
      >
        <ArrowUpRight className="size-4" strokeWidth={2} />
      </a>
    </div>
  );
}

/** One custom domain per site — matches sites.custom_domain (nullable
 * string) exactly; there's no multi-domain support on the backend. Setting
 * it never removes the free {subdomain}.SITE_BASE_DOMAIN attachment (see
 * app/vercel.py's add_domain_to_project — it only ever adds), so both stay
 * live together and both are shown here, not one replacing the other. */
export function DomainsSection() {
  const { currentSite } = useSession();
  const { toast } = useToast();
  const { t } = useLanguage();
  const siteId = currentSite?.id ?? null;
  const { data, isLoading, mutate } = useSiteSettingsSWR(siteId);

  const [host, setHost] = useState("");
  const [saving, setSaving] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [dnsTab, setDnsTab] = useState<"root" | "subdomain">("root");

  const [domainStatus, setDomainStatus] = useState<DomainStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    if (data) setHost(data.custom_domain ?? "");
  }, [data]);

  const isPublished = currentSite?.status === "published";
  const subdomainHost = data ? `${data.subdomain}.${SITE_BASE_DOMAIN}` : null;

  async function checkStatus(domain: string) {
    if (!siteId) return;
    setCheckingStatus(true);
    try {
      const result = await getDomainStatus(siteId);
      setDomainStatus(result);
    } catch {
      setDomainStatus({ domain, connected: null });
    } finally {
      setCheckingStatus(false);
    }
  }

  // Check once whenever a custom domain exists — not polled continuously,
  // this is a live Vercel API call each time (see getDomainStatus's own
  // comment), so it only re-runs on mount and the explicit refresh button.
  useEffect(() => {
    if (data?.custom_domain) checkStatus(data.custom_domain);
    else setDomainStatus(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.custom_domain, siteId]);

  // Optional override so the Remove button can pass "" directly instead of
  // relying on `host` state right after calling setHost("") — setHost is
  // async, so reading `host` in the same synchronous call would still see
  // the OLD value (this was the actual bug: Remove silently re-saved the
  // existing domain instead of clearing it).
  async function handleSave(overrideHost?: string) {
    if (!siteId) return;
    const raw = overrideHost ?? host;
    const trimmed = raw.trim().toLowerCase() || null;
    const isNewDomain = trimmed && trimmed !== data?.custom_domain;
    setSaving(true);
    try {
      const updated = await saveSiteDomain(siteId, trimmed);
      await mutate({ ...data!, custom_domain: updated.custom_domain }, { revalidate: false });
      toast({
        title: trimmed ? t("Custom domain saved") : t("Custom domain removed"),
        description: isPublished
          ? t("Now add the DNS record shown below.")
          : t("It'll connect once this site is published."),
        variant: "success",
      });
      // A merchant who just saved a brand-new domain doesn't yet know they
      // still need to touch DNS — the save succeeding looks complete to
      // them otherwise. Show the instructions immediately instead of
      // requiring them to notice and click the link themselves.
      if (isNewDomain) setSetupOpen(true);
    } catch (err) {
      toast({
        title: t("Couldn't save domain"),
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <SettingsRowSkeleton />
        <SettingsRowSkeleton cols={2} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2.5">
        {subdomainHost ? (
          <LiveDomainRow
            kind="free"
            host={subdomainHost}
            statusLabel={isPublished ? t("Live") : t("Not live yet")}
            statusTone={isPublished ? "live" : "unknown"}
          />
        ) : null}
        {data?.custom_domain ? (
          <LiveDomainRow
            kind="custom"
            host={data.custom_domain}
            statusLabel={
              !isPublished
                ? t("Not live yet")
                : checkingStatus
                  ? t("Checking…")
                  : domainStatus?.connected === true
                    ? t("Connected")
                    : domainStatus?.connected === false
                      ? t("DNS not detected yet")
                      : t("Unknown")
            }
            statusTone={
              isPublished && domainStatus?.connected === true
                ? "live"
                : isPublished && domainStatus?.connected === false
                  ? "pending"
                  : "unknown"
            }
            connected={
              isPublished ? domainStatus?.connected ?? null : false
            }
            onRefresh={() => checkStatus(data.custom_domain!)}
            refreshing={checkingStatus}
          />
        ) : null}
      </div>

      {/* One custom domain per site. Once it's set, the row above is the
       * source of truth — showing the input + Save/Remove again looks like
       * you can add a second one. */}
      <div className="flex flex-col gap-1.5">
        {!data?.custom_domain ? (
          <>
            <label htmlFor="custom-domain" className="text-sm font-medium text-muted">
              {t("Custom domain")}
            </label>
            <div className="flex items-center gap-2">
              <input
                id="custom-domain"
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
                placeholder="shop.yourstore.com"
                className="h-10 w-full min-w-0 flex-1 rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted-soft focus:border-primary"
              />
              <PrimaryButton
                type="button"
                onClick={() => handleSave()}
                disabled={saving}
                className="h-10 shrink-0"
              >
                {saving ? t("Saving…") : t("Save")}
              </PrimaryButton>
            </div>
          </>
        ) : null}
        <button
          type="button"
          onClick={() => setSetupOpen(true)}
          className="mr-auto inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-opacity hover:opacity-80"
        >
          <Info className="size-3.5" strokeWidth={2} />
          {t("How to connect a domain")}
        </button>
      </div>

      <SettingsModal
        open={setupOpen}
        title={t("How to connect your domain")}
        onClose={() => setSetupOpen(false)}
      >
        <div className="flex flex-col gap-5 text-sm text-muted">
          <p>
            <span className="font-semibold text-foreground">1.</span> Enter your domain above
            (example: <span className="font-medium text-foreground">shop.yourstore.com</span>)
            and save.
          </p>

          <div>
            <p className="font-semibold text-foreground">2. Add one DNS record</p>
            <p className="mt-1 mb-3 text-xs text-muted">
              In whichever site you bought the domain from (Namecheap, GoDaddy, etc.), find its
              DNS settings and add ONE of these — whichever matches your domain.
            </p>

            <div className="flex flex-col gap-3">
              <div className="flex rounded-md bg-search-bg p-1">
                <button
                  type="button"
                  onClick={() => setDnsTab("root")}
                  className={["flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors", dnsTab === "root" ? "bg-primary text-white shadow-sm" : "text-muted hover:text-foreground"].join(" ")}
                >
                  Root domain
                </button>
                <button
                  type="button"
                  onClick={() => setDnsTab("subdomain")}
                  className={["flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors", dnsTab === "subdomain" ? "bg-primary text-white shadow-sm" : "text-muted hover:text-foreground"].join(" ")}
                >
                  Subdomain
                </button>
              </div>

              {dnsTab === "root" ? (
                <p className="text-xs font-medium text-muted">
                  Example: <span className="font-semibold text-foreground">yourstore.com</span>
                </p>
              ) : (
                <p className="text-xs font-medium text-muted">
                  Example: <span className="font-semibold text-foreground">shop.yourstore.com</span>
                </p>
              )}

              <div className="rounded-lg border border-border p-3">
                {dnsTab === "root" ? (
                  <div className="grid grid-cols-[3.5rem_1fr] items-center gap-x-3 gap-y-1.5 text-xs">
                    <span className="font-medium text-muted">Type</span>
                    <span className="font-semibold text-foreground">A</span>
                    <span className="font-medium text-muted">Value</span>
                    <CopyRow value="216.198.79.1" />
                  </div>
                ) : (
                  <div className="grid grid-cols-[3.5rem_1fr] items-center gap-x-3 gap-y-1.5 text-xs">
                    <span className="font-medium text-muted">Type</span>
                    <span className="font-semibold text-foreground">CNAME</span>
                    <span className="font-medium text-muted">Value</span>
                    <CopyRow value="cname.vercel-dns.com" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <p>
            <span className="font-semibold text-foreground">3.</span> DNS changes can take a few
            minutes up to 24 hours to fully connect. SSL is issued automatically once it does —
            nothing else to set up. Use the refresh button next to your domain above to check
            whether it&apos;s connected yet.
          </p>

          <div className="rounded-lg border border-amber-200 bg-amber-500/10 p-3">
            <p className="text-xs font-medium text-amber-800">
              Used this domain before?
            </p>
            <p className="mt-1 text-xs leading-relaxed text-amber-700">
              If this domain was used elsewhere previously, it might need verification. Contact support if it isn&apos;t connected after 24 hours.
            </p>
          </div>
        </div>
      </SettingsModal>
    </div>
  );
}
