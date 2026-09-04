"use client";

import { Globe, Phone, Plus, Shield, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { MaskIcon } from "@/components/ui/mask-icon";
import { PageHeading } from "@/components/ui/page-heading";
import { PrimaryButton } from "@/components/ui/primary-button";
import { useToast } from "@/components/ui/toast";
import {
  addIpToBlocklist,
  addToBlocklist,
  removeFromBlocklist,
  removeIpFromBlocklist,
  useBlocklistSWR,
  useIpBlocklistSWR,
  useSuspiciousOrdersSWR,
  type FraudBlocklistEntry,
  type FraudIpBlocklistEntry,
} from "@/lib/api/fraud";
import { saveSiteFraudRules, useSiteSettingsSWR } from "@/lib/api/site-settings";
import { AddBlockModal, type AddBlockValues } from "./add-block-modal";
import { AddIpBlockModal, type AddIpBlockValues } from "./add-ip-block-modal";
import {
  defaultRuleState,
  FRAUD_RULES,
  type FraudRuleId,
  type FraudRuleState,
} from "./fraud-data";
import { SuspiciousOrdersTable } from "./suspicious-orders-table";

/** Local-only row until Save (no server id yet). */
type DraftBlockEntry = {
  id: string;
  phone: string;
  note: string;
  created_at: string;
  /** True until Save posts it to the API. */
  isLocal?: boolean;
};

type DraftIpBlockEntry = {
  id: string;
  ip_address: string;
  note: string;
  created_at: string;
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
    device_pending_lock: {
      ...defaults.device_pending_lock,
      ...stored?.device_pending_lock,
    },
    device_cooldown: {
      ...defaults.device_cooldown,
      ...stored?.device_cooldown,
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
    data: serverIpBlocklist = [],
    error: ipBlocklistError,
    isLoading: ipBlocklistLoading,
    mutate: mutateIpBlocklist,
  } = useIpBlocklistSWR(siteId);
  const {
    data: siteSettings,
    error: settingsError,
    isLoading: settingsLoading,
    mutate: mutateSettings,
  } = useSiteSettingsSWR(siteId);
  const {
    data: suspiciousOrders = [],
    error: suspiciousError,
    isLoading: suspiciousLoading,
    mutate: mutateSuspicious,
  } = useSuspiciousOrdersSWR(siteId);

  const [tab, setTab] = useState<"rules" | "suspicious">("rules");

  const [draftRules, setDraftRules] = useState<Record<FraudRuleId, FraudRuleState>>(
    defaultRuleState,
  );
  const [draftBlocklist, setDraftBlocklist] = useState<DraftBlockEntry[]>([]);
  const [draftIpBlocklist, setDraftIpBlocklist] = useState<DraftIpBlockEntry[]>([]);
  /** Server snapshots used to compute add/remove diffs on Save. */
  const [baselineBlocklist, setBaselineBlocklist] = useState<FraudBlocklistEntry[]>(
    [],
  );
  const [baselineIpBlocklist, setBaselineIpBlocklist] = useState<FraudIpBlocklistEntry[]>(
    [],
  );
  const [baselineRules, setBaselineRules] = useState<Record<
    FraudRuleId,
    FraudRuleState
  > | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addIpOpen, setAddIpOpen] = useState(false);
  const [unblocking, setUnblocking] = useState<DraftBlockEntry | null>(null);
  const [unblockingIp, setUnblockingIp] = useState<DraftIpBlockEntry | null>(null);
  const [saving, setSaving] = useState(false);
  /** Which siteId the draft was last filled for — avoids re-clobbering edits
   * on SWR revalidate, and avoids a second effect that cleared baseline on
   * mount (that left the page stuck on the skeleton forever). */
  const hydratedForSite = useRef<string | null>(null);

  // Hydrate draft once per site — don't clobber unsaved edits on revalidate.
  useEffect(() => {
    if (!siteId) return;
    if (sessionLoading || blocklistLoading || ipBlocklistLoading || settingsLoading) return;
    if (!siteSettings) return;
    if (hydratedForSite.current === siteId) return;

    const rules = mergeRules(siteSettings.fraud_rules);
    setDraftRules(rules);
    setBaselineRules(rules);
    setDraftBlocklist(serverBlocklist.map((e) => ({ ...e })));
    setBaselineBlocklist(serverBlocklist);
    setDraftIpBlocklist(serverIpBlocklist.map((e) => ({ ...e })));
    setBaselineIpBlocklist(serverIpBlocklist);
    hydratedForSite.current = siteId;
  }, [
    siteId,
    sessionLoading,
    blocklistLoading,
    ipBlocklistLoading,
    settingsLoading,
    siteSettings,
    serverBlocklist,
    serverIpBlocklist,
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
    if (draftKey !== baseKey) return true;
    const draftIpKey = draftIpBlocklist
      .map((e) => `${e.id}|${e.ip_address}|${e.note}`)
      .sort()
      .join(";");
    const baseIpKey = baselineIpBlocklist
      .map((e) => `${e.id}|${e.ip_address}|${e.note}`)
      .sort()
      .join(";");
    return draftIpKey !== baseIpKey;
  }, [
    draftRules,
    baselineRules,
    draftBlocklist,
    baselineBlocklist,
    draftIpBlocklist,
    baselineIpBlocklist,
  ]);

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

  function handleAddIp(values: AddIpBlockValues) {
    if (draftIpBlocklist.some((e) => e.ip_address === values.ip_address)) {
      toast({
        title: "Already on the list",
        description: "That IP address is already blocked.",
        variant: "info",
      });
      return;
    }
    setDraftIpBlocklist((prev) => [
      {
        id: `local-${Date.now()}`,
        ip_address: values.ip_address,
        note: values.note,
        created_at: new Date().toISOString(),
        isLocal: true,
      },
      ...prev,
    ]);
    setAddIpOpen(false);
  }

  function confirmUnblockIp() {
    if (!unblockingIp) return;
    setDraftIpBlocklist((prev) => prev.filter((e) => e.id !== unblockingIp.id));
    setUnblockingIp(null);
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

  function handleOrderReviewed(orderId: string, _decision: "cleared" | "confirmed_fraud") {
    mutateSuspicious(
      (prev) => (prev ?? []).filter((o) => o.id !== orderId),
      { revalidate: false },
    );
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

      // 2) Phone blocklist: remove missing server rows, add local-only rows
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

      // 3) IP blocklist: same diff pattern
      const draftIpServerIds = new Set(
        draftIpBlocklist.filter((e) => !isLocalId(e.id)).map((e) => e.id),
      );
      for (const row of baselineIpBlocklist) {
        if (!draftIpServerIds.has(row.id)) {
          await removeIpFromBlocklist(siteId, row.id);
        }
      }
      const keptIp: DraftIpBlockEntry[] = draftIpBlocklist.filter(
        (e) => !isLocalId(e.id),
      );
      for (const row of draftIpBlocklist.filter((e) => isLocalId(e.id))) {
        const created = await addIpToBlocklist(siteId, {
          ip_address: row.ip_address,
          note: row.note || undefined,
        });
        keptIp.unshift(created);
      }
      await mutateIpBlocklist(keptIp as FraudIpBlocklistEntry[], false);
      setDraftIpBlocklist(keptIp);
      setBaselineIpBlocklist(keptIp as FraudIpBlocklistEntry[]);

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

  if (blocklistError || ipBlocklistError || settingsError) {
    const err = settingsError || blocklistError || ipBlocklistError;
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
    ipBlocklistLoading ||
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
          tab === "rules" ? (
            <PrimaryButton onClick={handleSave} disabled={!dirty || saving}>
              <MaskIcon src="/sidebar/save.svg" className="size-4" />
              {saving ? "Saving…" : "Save"}
            </PrimaryButton>
          ) : undefined
        }
      />

      <div className="inline-flex w-fit items-center gap-1 rounded-lg bg-surface p-1">
        <button
          type="button"
          onClick={() => setTab("rules")}
          className={[
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            tab === "rules"
              ? "bg-primary text-white"
              : "text-muted hover:text-foreground",
          ].join(" ")}
        >
          Protection rules
        </button>
        <button
          type="button"
          onClick={() => setTab("suspicious")}
          className={[
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            tab === "suspicious"
              ? "bg-primary text-white"
              : "text-muted hover:text-foreground",
          ].join(" ")}
        >
          Suspicious orders
          {suspiciousOrders.length > 0 ? (
            <span
              className={[
                "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold",
                tab === "suspicious" ? "bg-white/25" : "bg-amber-500/15 text-amber-600 dark:text-amber-300",
              ].join(" ")}
            >
              {suspiciousOrders.length}
            </span>
          ) : null}
        </button>
      </div>

      {tab === "suspicious" ? (
        suspiciousLoading ? (
          <div className="h-56 animate-pulse rounded-md bg-surface" />
        ) : suspiciousError ? (
          <EmptyState
            icon={Shield}
            title="Couldn't load suspicious orders"
            description={
              suspiciousError instanceof Error ? suspiciousError.message : "Something went wrong."
            }
          />
        ) : (
          <SuspiciousOrdersTable
            siteId={siteId as string}
            orders={suspiciousOrders}
            onReviewed={handleOrderReviewed}
          />
        )
      ) : (
      <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
            <Globe className="size-5" strokeWidth={1.75} />
          </div>
          <p className="text-sm font-medium text-muted">IPs blocked</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {draftIpBlocklist.length}
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
              <div key={rule.id} className="px-4 py-3.5 sm:px-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 hidden size-10 shrink-0 items-center justify-center rounded-full bg-primary text-white sm:flex">
                    <MaskIcon src={rule.icon} className="size-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold leading-snug text-foreground">
                          {rule.name}
                        </h3>
                        <p className="mt-0.5 text-xs leading-snug text-muted">
                          {rule.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={state.enabled}
                        aria-label={`${state.enabled ? "Disable" : "Enable"} ${rule.name}`}
                        onClick={() => toggleRule(rule.id)}
                        className={[
                          "relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition-colors",
                          state.enabled
                            ? "bg-primary"
                            : "bg-border dark:bg-white/15",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform",
                            state.enabled ? "left-[1.125rem]" : "left-0.5",
                          ].join(" ")}
                        />
                      </button>
                    </div>

                    {thr && state.enabled ? (
                      <label className="mt-2.5 flex max-w-xs items-center gap-2 rounded-lg bg-search-bg px-2.5 py-2">
                        <span className="shrink-0 text-xs text-muted">
                          {thr.label}
                        </span>
                        <span className="ml-auto inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 dark:border-transparent">
                          {thr.suffix === "৳" ? (
                            <span className="text-xs font-medium text-muted">
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
                            className="h-7 w-16 bg-transparent text-sm font-semibold tabular-nums text-foreground outline-none"
                          />
                          {thr.suffix !== "৳" ? (
                            <span className="text-xs font-medium text-muted">
                              {thr.suffix}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    ) : null}
                  </div>
                </div>
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
              {draftBlocklist.length > 0 ? (
                <span className="ml-2 align-middle text-xs font-medium text-muted">
                  {draftBlocklist.length}
                </span>
              ) : null}
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Add or remove numbers freely — Save writes the list.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Plus className="size-3.5" strokeWidth={2.25} />
            Add number
          </button>
        </div>

        {draftBlocklist.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-10 text-center sm:px-5">
            <span className="mb-3 flex size-10 items-center justify-center rounded-lg bg-search-bg text-muted">
              <Phone className="size-4" strokeWidth={1.75} />
            </span>
            <p className="text-sm font-semibold text-foreground">
              No numbers blocked
            </p>
            <p className="mt-0.5 max-w-xs text-xs leading-snug text-muted">
              Add phones you already know are bad — from experience or word of
              mouth.
            </p>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-lg bg-search-bg px-3 text-xs font-semibold text-foreground transition-colors hover:bg-border dark:hover:bg-white/10"
            >
              <Plus className="size-3.5" strokeWidth={2.25} />
              Add first number
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border dark:divide-transparent">
            {draftBlocklist.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 px-4 py-3 sm:px-5"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-search-bg text-muted">
                  <Phone className="size-3.5" strokeWidth={1.75} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-sm font-semibold tracking-tight text-foreground">
                      {entry.phone}
                    </p>
                    {isLocalId(entry.id) ? (
                      <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                        Unsaved
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-xs leading-snug text-muted">
                    {entry.note ? entry.note : "No note"}
                    <span className="text-muted-soft">
                      {" · "}
                      {new Date(entry.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setUnblocking(entry)}
                  aria-label={`Unblock ${entry.phone}`}
                  className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-muted transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300"
                >
                  <Trash2 className="size-3.5" strokeWidth={2} />
                  <span className="hidden sm:inline">Unblock</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-md bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border dark:border-transparent px-4 py-3.5 sm:px-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              IP blocklist
              {draftIpBlocklist.length > 0 ? (
                <span className="ml-2 align-middle text-xs font-medium text-muted">
                  {draftIpBlocklist.length}
                </span>
              ) : null}
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Blocks browsing entirely, not just checkout — Save writes the list.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddIpOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Plus className="size-3.5" strokeWidth={2.25} />
            Add IP
          </button>
        </div>

        {draftIpBlocklist.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-10 text-center sm:px-5">
            <span className="mb-3 flex size-10 items-center justify-center rounded-lg bg-search-bg text-muted">
              <Globe className="size-4" strokeWidth={1.75} />
            </span>
            <p className="text-sm font-semibold text-foreground">
              No IPs blocked
            </p>
            <p className="mt-0.5 max-w-xs text-xs leading-snug text-muted">
              Block an address that's spamming or attacking your storefront —
              it won't be able to load any page, not just checkout.
            </p>
            <button
              type="button"
              onClick={() => setAddIpOpen(true)}
              className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-lg bg-search-bg px-3 text-xs font-semibold text-foreground transition-colors hover:bg-border dark:hover:bg-white/10"
            >
              <Plus className="size-3.5" strokeWidth={2.25} />
              Add first IP
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border dark:divide-transparent">
            {draftIpBlocklist.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 px-4 py-3 sm:px-5"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-search-bg text-muted">
                  <Globe className="size-3.5" strokeWidth={1.75} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-sm font-semibold tracking-tight text-foreground">
                      {entry.ip_address}
                    </p>
                    {isLocalId(entry.id) ? (
                      <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                        Unsaved
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-xs leading-snug text-muted">
                    {entry.note ? entry.note : "No note"}
                    <span className="text-muted-soft">
                      {" · "}
                      {new Date(entry.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setUnblockingIp(entry)}
                  aria-label={`Unblock ${entry.ip_address}`}
                  className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-muted transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300"
                >
                  <Trash2 className="size-3.5" strokeWidth={2} />
                  <span className="hidden sm:inline">Unblock</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
      </>
      )}

      <AddBlockModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleAdd}
      />
      <AddIpBlockModal
        open={addIpOpen}
        onClose={() => setAddIpOpen(false)}
        onAdd={handleAddIp}
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
      <ConfirmDialog
        open={!!unblockingIp}
        title="Remove from list?"
        description={
          unblockingIp
            ? `${unblockingIp.ip_address} will be unblocked when you Save.`
            : undefined
        }
        confirmLabel="Remove"
        destructive
        onConfirm={confirmUnblockIp}
        onCancel={() => setUnblockingIp(null)}
      />
    </div>
  );
}
