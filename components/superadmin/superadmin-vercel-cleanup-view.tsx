"use client";

import { Globe, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/providers/session-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { PrimaryButton } from "@/components/ui/primary-button";
import { useToast } from "@/components/ui/toast";
import {
  detachVercelDomains,
  useOrphanedVercelDomainsSWR,
} from "@/lib/api/superadmin";

/** Superadmin -> Vercel Cleanup. Read-only report + explicit opt-in detach —
 * mirrors scripts/cleanup_orphaned_vercel_domains.py's dry-run-then-confirm
 * shape, just as a real UI instead of a CLI flag. Domains in a template's
 * "review" list (custom domains, the real wildcard) are NEVER selectable
 * here — see app/vercel.py's orphaned_domains_report for why that
 * distinction is load-bearing, not cosmetic. */
export function SuperAdminVercelCleanupView() {
  const router = useRouter();
  const { me, loading: sessionLoading } = useSession();
  const { toast } = useToast();
  const allowed = me?.user.is_superadmin === true;

  const { data, error, isLoading, mutate } = useOrphanedVercelDomainsSWR();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [detaching, setDetaching] = useState(false);

  useEffect(() => {
    if (!sessionLoading && !allowed) router.replace("/");
  }, [sessionLoading, allowed, router]);

  const templates = useMemo(
    () => Object.entries(data?.templates ?? {}),
    [data],
  );
  const totalOrphaned = templates.reduce(
    (sum, [, t]) => sum + t.orphaned.length,
    0,
  );

  function toggle(domain: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(domain)) next.delete(domain);
      else next.add(domain);
      return next;
    });
  }

  function toggleAllForTemplate(domains: string[]) {
    setSelected((prev) => {
      const next = new Set(prev);
      const allChecked = domains.every((d) => next.has(d));
      for (const d of domains) {
        if (allChecked) next.delete(d);
        else next.add(d);
      }
      return next;
    });
  }

  async function handleDetach() {
    if (!data) return;
    setDetaching(true);
    try {
      const toDetach = templates.flatMap(([, t]) =>
        t.orphaned
          .filter((d) => selected.has(d))
          .map((domain) => ({ domain, project_id: t.project_id })),
      );
      const { results } = await detachVercelDomains(toDetach);
      const failed = results.filter((r) => !r.success);
      if (failed.length > 0) {
        toast({
          title: `${results.length - failed.length}/${results.length} detached`,
          description: `Failed: ${failed.map((f) => f.domain).join(", ")}`,
          variant: "info",
        });
      } else {
        toast({ title: `${results.length} domain(s) detached`, variant: "success" });
      }
      setSelected(new Set());
      setConfirming(false);
      await mutate();
    } catch (err) {
      toast({
        title: "Couldn't detach domains",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setDetaching(false);
    }
  }

  if (sessionLoading || !allowed) return null;

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeading
        title="Vercel Cleanup"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => mutate()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted transition-colors hover:bg-search-bg hover:text-foreground"
            >
              <RefreshCw className="size-3.5" strokeWidth={1.75} />
              Refresh
            </button>
            <PrimaryButton
              onClick={() => setConfirming(true)}
              disabled={selected.size === 0}
            >
              <Trash2 className="size-4" strokeWidth={1.75} />
              Detach selected ({selected.size})
            </PrimaryButton>
          </div>
        }
      />

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-md bg-surface" />
      ) : error ? (
        <EmptyState
          icon={Globe}
          title="Couldn't load Vercel domain report"
          description={error instanceof Error ? error.message : "Something went wrong."}
        />
      ) : totalOrphaned === 0 ? (
        <EmptyState
          icon={Globe}
          title="No orphaned domains"
          description="Every subdomain still attached to a Vercel project has a live site behind it."
        />
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted">
            Subdomains a deleted tenant left attached to Vercel with no live
            site behind them — see app/api/superadmin.py::delete_tenant and
            app/worker.py::sweep_expired_trials. Custom domains and the real
            wildcard are never listed here as detachable — review those
            manually in the Vercel dashboard.
          </p>
          {templates.map(([key, report]) =>
            report.orphaned.length === 0 && report.review.length === 0 ? null : (
              <section key={key} className="rounded-md bg-surface">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border dark:border-transparent px-4 py-3.5 sm:px-5">
                  <h2 className="text-base font-semibold text-foreground capitalize">
                    {key}
                    <span className="ml-2 align-middle text-xs font-medium text-muted">
                      {report.orphaned.length} orphaned
                    </span>
                  </h2>
                  {report.orphaned.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => toggleAllForTemplate(report.orphaned)}
                      className="text-xs font-semibold text-primary hover:opacity-80"
                    >
                      {report.orphaned.every((d) => selected.has(d))
                        ? "Deselect all"
                        : "Select all"}
                    </button>
                  ) : null}
                </div>

                {report.orphaned.length > 0 ? (
                  <div className="divide-y divide-border dark:divide-transparent">
                    {report.orphaned.map((domain) => (
                      <label
                        key={domain}
                        className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-search-bg sm:px-5"
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(domain)}
                          onChange={() => toggle(domain)}
                          className="size-4 shrink-0 rounded border-border accent-primary"
                        />
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-search-bg text-muted">
                          <Globe className="size-3.5" strokeWidth={1.75} />
                        </span>
                        <p className="font-mono text-sm font-medium text-foreground">
                          {domain}
                        </p>
                      </label>
                    ))}
                  </div>
                ) : null}

                {report.review.length > 0 ? (
                  <div className="border-t border-border px-4 py-3 dark:border-transparent sm:px-5">
                    <p className="mb-1.5 text-xs font-semibold text-muted">
                      Not touched automatically — review manually
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {report.review.map((domain) => (
                        <span
                          key={domain}
                          className="rounded-md bg-search-bg px-2 py-1 font-mono text-xs text-muted"
                        >
                          {domain}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            ),
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirming}
        title={`Detach ${selected.size} domain(s)?`}
        description="This calls Vercel's API immediately — it is not reversible from here. Only domains you explicitly checked above will be touched."
        confirmLabel="Detach"
        destructive
        busy={detaching}
        onConfirm={handleDetach}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
