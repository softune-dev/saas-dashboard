"use client";

import { ArrowUpRight, Globe, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { useToast } from "@/components/ui/toast";
import { PrimaryButton } from "@/components/ui/primary-button";
import { OutlineButton } from "@/components/ui/outline-button";
import { saveSiteDomain, useSiteSettingsSWR } from "@/lib/api/site-settings";
import { SettingsModal } from "../ui/settings-modal";
import { SettingsRowSkeleton } from "../ui/settings-skeleton";

const SITE_BASE_DOMAIN = process.env.NEXT_PUBLIC_SITE_BASE_DOMAIN || "softune.xyz";

/** One custom domain per site — matches sites.custom_domain (nullable
 * string) exactly; there's no multi-domain support on the backend, so this
 * doesn't pretend there is. Setting/clearing it (once the site is
 * published) queues the same Vercel domain-attach automation as Publish —
 * see app/api/sites.py's update_site and app/vercel.py. */
export function DomainsSection() {
  const { currentSite } = useSession();
  const { toast } = useToast();
  const siteId = currentSite?.id ?? null;
  const { data, isLoading, mutate } = useSiteSettingsSWR(siteId);

  const [host, setHost] = useState("");
  const [saving, setSaving] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);

  useEffect(() => {
    if (data) setHost(data.custom_domain ?? "");
  }, [data]);

  const isPublished = currentSite?.status === "published";
  const liveUrl = data
    ? data.custom_domain
      ? `https://${data.custom_domain}`
      : `https://${data.subdomain}.${SITE_BASE_DOMAIN}`
    : null;

  async function handleSave() {
    if (!siteId) return;
    const trimmed = host.trim().toLowerCase() || null;
    setSaving(true);
    try {
      const updated = await saveSiteDomain(siteId, trimmed);
      await mutate({ ...data!, custom_domain: updated.custom_domain }, { revalidate: false });
      toast({
        title: trimmed ? "Custom domain saved" : "Custom domain removed",
        description: isPublished
          ? "DNS can take a few minutes to a few hours to fully connect."
          : "It'll connect once this site is published.",
        variant: "success",
      });
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

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-500">Your live URL</p>
        <button
          type="button"
          onClick={() => setSetupOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-opacity hover:opacity-80"
        >
          <Info className="size-4" strokeWidth={1.75} />
          How to connect a domain
        </button>
      </div>

      {/* What's actually live right now — real domain if set, otherwise the
       * subdomain every site gets automatically. Not a mock list. */}
      <div className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Globe className="size-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">
            {liveUrl?.replace(/^https:\/\//, "") ?? "—"}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {isPublished ? "Live" : "Will go live once you publish this site"}
          </p>
        </div>
        {liveUrl && isPublished ? (
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open in a new tab"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg hover:text-primary"
          >
            <ArrowUpRight className="size-4" strokeWidth={2} />
          </a>
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
        <ol className="flex list-decimal flex-col gap-3 pl-4 text-slate-600">
          <li>
            Enter your domain above (example:{" "}
            <span className="font-medium text-foreground">shop.yourstore.com</span>) and save.
          </li>
          <li>
            In your domain&apos;s DNS settings, add one record:
            <ul className="mt-1.5 flex flex-col gap-1 pl-4 text-xs">
              <li>
                For a subdomain (<span className="font-medium text-foreground">shop.yourstore.com</span>):
                a <span className="font-medium text-foreground">CNAME</span> record pointing to{" "}
                <span className="font-medium text-primary">cname.vercel-dns.com</span>.
              </li>
              <li>
                For a root domain (<span className="font-medium text-foreground">yourstore.com</span>):
                an <span className="font-medium text-foreground">A</span> record pointing to{" "}
                <span className="font-medium text-primary">76.76.21.21</span>.
              </li>
            </ul>
          </li>
          <li>
            DNS changes can take a few minutes up to 24 hours to fully connect. SSL is
            issued automatically once it does — nothing else to set up.
          </li>
        </ol>
      </SettingsModal>
    </div>
  );
}
