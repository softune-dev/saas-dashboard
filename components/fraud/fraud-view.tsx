"use client";

import { Plus, Shield } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { MaskIcon } from "@/components/ui/mask-icon";
import { PageHeading } from "@/components/ui/page-heading";
import { PrimaryButton } from "@/components/ui/primary-button";
import { useToast } from "@/components/ui/toast";
import {
  addToBlocklist,
  removeFromBlocklist,
  useBlocklistSWR,
  type FraudBlocklistEntry,
} from "@/lib/api/fraud";
import { saveSiteFraudRules, useSiteSettingsSWR } from "@/lib/api/site-settings";
import { AddBlockModal, type AddBlockValues } from "./add-block-modal";
import {
  defaultRuleState,
  FRAUD_RULES,
  type FraudRuleId,
  type FraudRuleState,
} from "./fraud-data";

/** Local-only row until Save (no server id yet). */
type DraftBlockEntry = {
  id: string;
  phone: string;
  note: string;
  created_at: string;
  /** True until Save posts it to the API. */
  isLocal?: boolean;
};

function isLocalId(id: string) {
  return id.startsWith("local-");
}

function mergeRules(
  stored: Partial<Record<FraudRuleId, FraudRuleState>> | undefined,
): Record<FraudRuleId, FraudRuleState> {
  const defaults = defaultRuleState();
  return {
    hold_first_high_value: {
      ...defaults.hold_first_high_value,
      ...stored?.hold_first_high_value,
    },
    flag_burst_orders: {
      ...defaults.flag_burst_orders,
      ...stored?.flag_burst_orders,
    },
    block_blocklist: {
      ...defaults.block_blocklist,
      ...stored?.block_blocklist,
    },
  };
}

/** Settings → Fraud Protection.
 * Edits stay in draft state (instant toggles, no per-click API). Save
 * persists rules + blocklist diffs in one action. */
export function FraudView() {
  const { currentSite, loading: sessionLoading } = useSession();
  const { toast } = useToast();
  const siteId = currentSite?.id ?? null;

  const {
    data: serverBlocklist = [],
    error: blocklistError,
    isLoading: blocklistLoading,
    mutate: mutateBlocklist,
  } = useBlocklistSWR(siteId);
  const {
    data: siteSettings,
    error: settingsError,
    isLoading: settingsLoading,
    mutate: mutateSettings,
  } = useSiteSettingsSWR(siteId);

  const [draftRules, setDraftRules] = useState<Record<FraudRuleId, FraudRuleState>>(
    defaultRuleState,
  );
  const [draftBlocklist, setDraftBlocklist] = useState<DraftBlockEntry[]>([]);
  /** Server snapshot used to compute blocklist add/remove on Save. */
  const [baselineBlocklist, setBaselineBlocklist] = useState<FraudBlocklistEntry[]>(
    [],
  );
  const [baselineRules, setBaselineRules] = useState<Record<
    FraudRuleId,
    FraudRuleState
  > | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [unblocking, setUnblocking] = useState<DraftBlockEntry | null>(null);
  const [saving, setSaving] = useState(false);
  /** Which siteId the draft was last filled for — avoids re-clobbering edits
   * on SWR revalidate, and avoids a second effect that cleared baseline on
   * mount (that left the page stuck on the skeleton forever). */
  const hydratedForSite = useRef<string | null>(null);

  // Hydrate draft once per site — don't clobber unsaved edits on revalidate.
  useEffect(() => {
    if (!siteId) return;
    if (sessionLoading || blocklistLoading || settingsLoading) return;
    if (!siteSettings) return;
    if (hydratedForSite.current === siteId) return;

    const rules = mergeRules(siteSettings.fraud_rules);
    setDraftRules(rules);
    setBaselineRules(rules);
    setDraftBlocklist(serverBlocklist.map((e) => ({ ...e })));
    setBaselineBlocklist(serverBlocklist);
    hydratedForSite.current = siteId;
  }, [
    siteId,
    sessionLoading,
    blocklistLoading,
    settingsLoading,
    siteSettings,
    serverBlocklist,
  ]);

  const dirty = useMemo(() => {
    if (!baselineRules) return false;
    if (JSON.stringify(draftRules) !== JSON.stringify(baselineRules)) return true;
    const draftKey = draftBlocklist
      .map((e) => `${e.id}|${e.phone}|${e.note}`)
      .sort()
      .join(";");
    const baseKey = baselineBlocklist
      .map((e) => `${e.id}|${e.phone}|${e.note}`)
      .sort()
      .join(";");
    return draftKey !== baseKey;
  }, [draftRules, baselineRules, draftBlocklist, baselineBlocklist]);

  const activeRules = useMemo(
    () => Object.values(draftRules).filter((r) => r.enabled).length,
    [draftRules],
  );

  function handleAdd(values: AddBlockValues) {
    const phoneKey = values.phone.replace(/\s/g, "");
    if (
      draftBlocklist.some((e) => e.phone.replace(/\s/g, "") === phoneKey)
    ) {
      toast({
        title: "Already on the list",
        description: "That number is already blocked.",
        variant: "info",
      });
      return;
    }
    setDraftBlocklist((prev) => [
      {
        id: `local-${Date.now()}`,
        phone: values.phone,
        note: values.note,
        created_at: new Date().toISOString(),
        isLocal: true,
      },
      ...prev,
    ]);
    setAddOpen(false);
  }

  function confirmUnblock() {
    if (!unblocking) return;
    setDraftBlocklist((prev) => prev.filter((e) => e.id !== unblocking.id));
    setUnblocking(null);
  }

  function toggleRule(id: FraudRuleId) {
    setDraftRules((prev) => ({
      ...prev,
      [id]: { ...prev[id], enabled: !prev[id].enabled },
    }));
  }

  function setRuleValue(id: FraudRuleId, value: number) {
    setDraftRules((prev) => ({
      ...prev,
      [id]: { ...prev[id], value },
    }));
  }

  async function handleSave() {
    if (!siteId || !siteSettings || !dirty) return;
    setSaving(true);
    try {
      // 1) Rules
      const updated = await saveSiteFraudRules(siteId, draftRules);
      await mutateSettings(
        { ...siteSettings, fraud_rules: updated.fraud_rules },
        { revalidate: false },
      );

      // 2) Blocklist: remove missing server rows, add local-only rows
      const draftServerIds = new Set(
        draftBlocklist.filter((e) => !isLocalId(e.id)).map((e) => e.id),
      );
      for (const row of baselineBlocklist) {
        if (!draftServerIds.has(row.id)) {
          await removeFromBlocklist(siteId, row.id);
        }
      }
      const kept: DraftBlockEntry[] = draftBlocklist.filter(
        (e) => !isLocalId(e.id),
      );
      for (const row of draftBlocklist.filter((e) => isLocalId(e.id))) {
        const created = await addToBlocklist(siteId, {
          phone: row.phone,
          note: row.note || undefined,
        });
        kept.unshift(created);
      }

      await mutateBlocklist(kept as FraudBlocklistEntry[], false);
      setDraftBlocklist(kept);
      setBaselineBlocklist(kept as FraudBlocklistEntry[]);
      setBaselineRules(draftRules);
      toast({ title: "Fraud settings saved", variant: "success" });
    } catch (err) {
      toast({
        title: "Couldn't save",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setSaving(false);
    }
  }

  if (!sessionLoading && !currentSite) {
    return (
      <div className="flex flex-col gap-4 pb-2">
        <PageHeading title="Fraud Protection" />
        <EmptyState
          icon={Shield}
          title="No site yet"
          description="Create a site from a template in Themes before configuring fraud tools."
        />
      </div>
    );
  }

  if (blocklistError || settingsError) {
    const err = settingsError || blocklistError;
    return (
      <div className="flex flex-col gap-4 pb-2">
        <PageHeading title="Fraud Protection" />
        <EmptyState
          icon={Shield}
          title="Couldn't load fraud settings"
          description={err instanceof Error ? err.message : "Something went wrong."}
        />
      </div>
    );
  }

  const stillLoading =
    sessionLoading ||
    blocklistLoading ||
    settingsLoading ||
    // One frame after data arrives, hydrate effect sets baselineRules.
    (!!siteId && !!siteSettings && !baselineRules);

  if (stillLoading) {
    return (
      <div className="flex flex-col gap-4 pb-2">
        <PageHeading title="Fraud Protection" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="h-[100px] animate-pulse rounded-md bg-surface" />
          <div className="h-[100px] animate-pulse rounded-md bg-surface" />
        </div>
        <div className="h-48 animate-pulse rounded-md bg-surface" />
        <div className="h-56 animate-pulse rounded-md bg-surface" />
      </div>
    );
  }

  // Loads finished but nothing to hydrate (shouldn't happen with a site).
  if (!baselineRules) {
    return (
      <div className="flex flex-col gap-4 pb-2">
        <PageHeading title="Fraud Protection" />
        <EmptyState
          icon={Shield}
          title="Couldn't load fraud settings"
          description="Settings did not return for this site."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeading
        title="Fraud Protection"
        actions={
          <PrimaryButton onClick={handleSave} disabled={!dirty || saving}>
            <MaskIcon src="/sidebar/save.svg" className="size-4" />
            {saving ? "Saving…" : "Save"}
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <article className="relative flex min-h-[100px] flex-col justify-between rounded-md bg-surface p-4 pr-16">
          <div className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full bg-primary text-white">
            <MaskIcon src="/sidebar/lock.svg" className="size-5" />
          </div>
          <p className="text-sm font-medium text-muted">Numbers blocked</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {draftBlocklist.length}
          </p>
        </article>
        <article className="relative flex min-h-[100px] flex-col justify-between rounded-md bg-surface p-4 pr-16">
          <div className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full bg-primary text-white">
            <MaskIcon src="/sidebar/settings.svg" className="size-5" />
          </div>
          <p className="text-sm font-medium text-muted">Rules active</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {activeRules}/{FRAUD_RULES.length}
          </p>
        </article>
      </div>

      <section className="rounded-md bg-surface">
        <div className="border-b border-border dark:border-transparent px-4 py-3.5 sm:px-5">
          <h2 className="text-base font-semibold text-foreground">
            Checkout rules
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Changes stay local until you hit Save.
          </p>
        </div>
        <div className="divide-y divide-border dark:divide-transparent">
          {FRAUD_RULES.map((rule) => {
            const state = draftRules[rule.id];
            const thr = rule.threshold;
            return (
              <div
                key={rule.id}
                className="flex flex-col gap-3 px-4 py-4 sm:px-5"
              >
                {/* Title row — icon + name/badge + toggle; never cramps the description */}
                <div className="flex items-center gap-3">
                  <span className="hidden size-10 shrink-0 items-center justify-center rounded-full bg-primary text-white sm:flex">
                    <MaskIcon src={rule.icon} className="size-4" />
                  </span>
                  <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                    {rule.name}
                  </h3>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={state.enabled}
                    aria-label={`${state.enabled ? "Disable" : "Enable"} ${rule.name}`}
                    onClick={() => toggleRule(rule.id)}
                    className={[
                      "relative h-7 w-12 shrink-0 rounded-full transition-colors",
                      state.enabled ? "bg-primary" : "bg-border",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "absolute top-0.5 size-6 rounded-full bg-[#ffffff] shadow-sm transition-transform",
                        state.enabled ? "left-5" : "left-0.5",
                      ].join(" ")}
                    />
                  </button>
                </div>

                <p className="text-sm leading-relaxed text-muted sm:pl-[3.25rem]">
                  {rule.description}
                </p>

                {thr && state.enabled ? (
                  <label className="flex flex-wrap items-center gap-2 sm:pl-[3.25rem]">
                    <span className="text-xs text-muted">{thr.label}</span>
                    <span className="inline-flex items-center gap-1">
                      {thr.suffix === "৳" ? (
                        <span className="text-xs font-medium text-foreground">
                          ৳
                        </span>
                      ) : null}
                      <input
                        type="number"
                        min={thr.min}
                        max={thr.max}
                        aria-label={thr.label}
                        value={state.value ?? thr.defaultValue}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (Number.isFinite(n)) {
                            setRuleValue(
                              rule.id,
                              Math.min(thr.max, Math.max(thr.min, n)),
                            );
                          }
                        }}
                        className="h-8 w-20 rounded-md border border-border bg-search-bg px-2 text-sm font-medium text-foreground outline-none focus:border-primary focus:bg-surface"
                      />
                      {thr.suffix !== "৳" ? (
                        <span className="text-xs font-medium text-foreground">
                          {thr.suffix}
                        </span>
                      ) : null}
                    </span>
                  </label>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-md bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border dark:border-transparent px-4 py-3.5 sm:px-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Blocklist
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Add or remove numbers freely — Save writes the list.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3.5 text-sm font-medium text-white shadow-sm shadow-primary/20 transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" strokeWidth={2} />
            Add a number
          </button>
        </div>

        {draftBlocklist.length === 0 ? (
          <div className="px-4 py-10 text-center sm:px-5">
            <p className="text-sm font-medium text-foreground">
              No numbers blocked
            </p>
            <p className="mt-1 text-xs text-muted">
              Add phones you already know are bad — from experience or word of
              mouth.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border dark:divide-transparent">
            {draftBlocklist.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5"
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold text-foreground">
                    {entry.phone}
                    {isLocalId(entry.id) ? (
                      <span className="ml-2 rounded-full bg-amber-500/10 px-2 py-0.5 font-sans text-[10px] font-medium text-amber-700">
                        Unsaved
                      </span>
                    ) : null}
                  </p>
                  {entry.note ? (
                    <p className="mt-0.5 truncate text-sm text-muted">
                      {entry.note}
                    </p>
                  ) : null}
                  <p className="mt-0.5 text-xs text-muted-soft">
                    Added{" "}
                    {new Date(entry.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setUnblocking(entry)}
                  className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-search-bg px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-border"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <AddBlockModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleAdd}
      />

      <ConfirmDialog
        open={!!unblocking}
        title="Remove from list?"
        description={
          unblocking
            ? `${unblocking.phone} will be unblocked when you Save.`
            : undefined
        }
        confirmLabel="Remove"
        destructive
        onConfirm={confirmUnblock}
        onCancel={() => setUnblocking(null)}
      />
    </div>
  );
}
