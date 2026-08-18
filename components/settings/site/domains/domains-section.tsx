"use client";

import { ArrowUpRight, Check, Copy, Globe, Info, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { useToast } from "@/components/ui/toast";
import { PrimaryButton } from "@/components/ui/primary-button";
import { OutlineButton } from "@/components/ui/outline-button";
import {
  getDomainStatus,
  saveSiteDomain,
  useSiteSettingsSWR,
  type DomainStatus,
} from "@/lib/api/site-settings";
import { SettingsModal } from "../ui/settings-modal";
import { SettingsRowSkeleton } from "../ui/settings-skeleton";

const SITE_BASE_DOMAIN = process.env.NEXT_PUBLIC_SITE_BASE_DOMAIN || "softune.xyz";

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
    <div className="flex items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2">
      <code className="min-w-0 truncate text-sm font-medium text-foreground">{value}</code>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy ${value}`}
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-white hover:text-primary"
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
  label: string;
  host: string;
  statusLabel: string;
  statusTone: "live" | "pending" | "unknown";
  onRefresh?: () => void;
  refreshing?: boolean;
};

const STATUS_STYLES: Record<LiveDomainRowProps["statusTone"], string> = {
  live: "bg-emerald-50 text-emerald-600",
  pending: "bg-amber-50 text-amber-600",
  unknown: "bg-slate-100 text-slate-500",
};

function LiveDomainRow({ label, host, statusLabel, statusTone, onRefresh, refreshing }: LiveDomainRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Globe className="size-4" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-foreground">{host}</p>
        <p className="mt-0.5 text-xs text-slate-500">{label}</p>
      </div>
      <span className={["inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium", STATUS_STYLES[statusTone]].join(" ")}>
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
  const siteId = currentSite?.id ?? null;
  const { data, isLoading, mutate } = useSiteSettingsSWR(siteId);

  const [host, setHost] = useState("");
  const [saving, setSaving] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);

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

  async function handleSave() {
    if (!siteId) return;
    const trimmed = host.trim().toLowerCase() || null;
    const isNewDomain = trimmed && trimmed !== data?.custom_domain;
    setSaving(true);
    try {
      const updated = await saveSiteDomain(siteId, trimmed);
      await mutate({ ...data!, custom_domain: updated.custom_domain }, { revalidate: false });
      toast({
        title: trimmed ? "Custom domain saved" : "Custom domain removed",
        description: isPublished
          ? "Now add the DNS record shown below."
          : "It'll connect once this site is published.",
        variant: "success",
      });
      // A merchant who just saved a brand-new domain doesn't yet know they
      // still need to touch DNS — the save succeeding looks complete to
      // them otherwise. Show the instructions immediately instead of
      // requiring them to notice and click the link themselves.
      if (isNewDomain) setSetupOpen(true);
    } catch (err) {
      toast({
        title: "Couldn't save domain",
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

  const customStatusLabel = !isPublished
    ? "Not live yet"
    : checkingStatus
      ? "Checking…"
      : domainStatus?.connected === true
        ? "Connected"
        : domainStatus?.connected === false
          ? "DNS not detected yet"
          : "Unknown";
  const customStatusTone: LiveDomainRowProps["statusTone"] =
    isPublished && domainStatus?.connected === true
      ? "live"
      : isPublished && domainStatus?.connected === false
        ? "pending"
        : "unknown";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-500">Your domains</p>
        <button
          type="button"
          onClick={() => setSetupOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-opacity hover:opacity-80"
        >
          <Info className="size-4" strokeWidth={1.75} />
          How to connect a domain
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {subdomainHost ? (
          <LiveDomainRow
            label="Free subdomain — always on, no setup needed"
            host={subdomainHost}
            statusLabel={isPublished ? "Live" : "Not live yet"}
            statusTone={isPublished ? "live" : "unknown"}
          />
        ) : null}
        {data?.custom_domain ? (
          <LiveDomainRow
            label="Custom domain"
            host={data.custom_domain}
            statusLabel={customStatusLabel}
            statusTone={customStatusTone}
            onRefresh={() => checkStatus(data.custom_domain!)}
            refreshing={checkingStatus}
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="custom-domain" className="text-sm font-medium text-slate-500">
          Custom domain
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
            className="h-10 w-full min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm text-foreground outline-none placeholder:text-muted-soft focus:border-primary"
          />
          <PrimaryButton type="button" onClick={handleSave} disabled={saving} className="h-10 shrink-0">
            {saving ? "Saving…" : "Save"}
          </PrimaryButton>
          {data?.custom_domain ? (
            <OutlineButton
              type="button"
              onClick={() => {
                setHost("");
                handleSave();
              }}
              disabled={saving}
              className="h-10 shrink-0"
            >
              Remove
            </OutlineButton>
          ) : null}
        </div>
        <p className="text-xs text-slate-500">
          Leave blank to use your free {`{shop}.${SITE_BASE_DOMAIN}`} address instead.
        </p>
      </div>

      <SettingsModal
        open={setupOpen}
        title="How to connect your domain"
        onClose={() => setSetupOpen(false)}
      >
        <div className="flex flex-col gap-5 text-sm text-slate-600">
          <p>
            <span className="font-semibold text-foreground">1.</span> Enter your domain above
            (example: <span className="font-medium text-foreground">shop.yourstore.com</span>)
            and save.
          </p>

          <div>
            <p className="font-semibold text-foreground">2. Add one DNS record</p>
            <p className="mt-1 mb-3 text-xs text-slate-500">
              In whichever site you bought the domain from (Namecheap, GoDaddy, etc.), find its
              DNS settings and add ONE of these — whichever matches your domain.
            </p>

            <div className="flex flex-col gap-3">
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-medium text-slate-500">
                  Subdomain — e.g. <span className="font-semibold text-foreground">shop.yourstore.com</span>
                </p>
                <div className="mt-2 grid grid-cols-[3.5rem_1fr] items-center gap-x-3 gap-y-1.5 text-xs">
                  <span className="font-medium text-slate-500">Type</span>
                  <span className="font-semibold text-foreground">CNAME</span>
                  <span className="font-medium text-slate-500">Value</span>
                  <CopyRow value="cname.vercel-dns.com" />
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-medium text-slate-500">
                  Root domain — e.g. <span className="font-semibold text-foreground">yourstore.com</span>
                </p>
                <div className="mt-2 grid grid-cols-[3.5rem_1fr] items-center gap-x-3 gap-y-1.5 text-xs">
                  <span className="font-medium text-slate-500">Type</span>
                  <span className="font-semibold text-foreground">A</span>
                  <span className="font-medium text-slate-500">Value</span>
                  <CopyRow value="76.76.21.21" />
                </div>
              </div>
            </div>
          </div>

          <p>
            <span className="font-semibold text-foreground">3.</span> DNS changes can take a few
            minutes up to 24 hours to fully connect. SSL is issued automatically once it does —
            nothing else to set up. Use the refresh button next to your domain above to check
            whether it&apos;s connected yet.
          </p>
        </div>
      </SettingsModal>
    </div>
  );
}
