"use client";

import { ArrowLeftRight, Building2, Check, Landmark } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { TablePagination } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { formatTaka } from "@/lib/format";
import type { SettlementEntry, SettlementMethod } from "@/lib/dropship-mock";
import { useDropshipMock } from "./dropship-mock-context";
import { DropshipShell } from "./dropship-shell";

const PAGE_SIZE = 6;

const PAYOUT_METHOD_LABEL: Record<SettlementMethod, string> = {
  bkash: "bKash",
  nagad: "Nagad",
  bank: "Bank transfer",
};

type Tab = "to_pay" | "to_collect" | "settled";

/** Pure bookkeeping, never real money movement — see the settlement-design
 * discussion this feature is built from. Each row is a statement, not a
 * transaction: the two stores pay each other directly (bKash/bank) outside
 * Softunebd, then "Mark settled" here is just a record.
 *
 * Deliberately avoids "you owe" / "owed to you" as the primary language —
 * that reads as bank/accounting jargon. Every card instead says the actual
 * next action in plain words: "Pay X" or "Collect from X", with the
 * direction shown by color and icon, not a vocabulary word. */
export function SettlementsView() {
  const { settlements, markSettled } = useDropshipMock();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("to_pay");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const toPay = settlements.filter((s) => s.direction === "you_owe" && !s.settled);
  const toCollect = settlements.filter((s) => s.direction === "owed_to_you" && !s.settled);
  const settled = settlements.filter((s) => s.settled);

  const totalToPay = toPay.reduce((sum, s) => sum + s.amountCents, 0);
  const totalToCollect = toCollect.reduce((sum, s) => sum + s.amountCents, 0);

  const activeItems = tab === "to_pay" ? toPay : tab === "to_collect" ? toCollect : settled;
  const totalPages = Math.max(1, Math.ceil(activeItems.length / PAGE_SIZE));
  const pageItems = activeItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function switchTab(next: Tab) {
    setTab(next);
    setPage(1);
    setExpanded(null);
  }

  function handleMarkSettled(entry: SettlementEntry) {
    markSettled(entry.id);
    toast({ title: `Marked settled with ${entry.counterpartyName}`, variant: "success" });
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "to_pay", label: "To pay", count: toPay.length },
    { id: "to_collect", label: "To collect", count: toCollect.length },
    { id: "settled", label: "Settled", count: settled.length },
  ];

  return (
    <DropshipShell title="Settlements">
      <p className="mb-4 text-sm text-muted">
        What you need to pay suppliers, and what to collect from resellers. Softunebd never moves
        this money — pay or collect directly (bKash, Nagad, bank transfer), then mark it done here.
      </p>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-rose-500/20 bg-rose-500/5 px-4 py-3">
          <p className="text-xs font-medium text-rose-700 dark:text-rose-400">
            You need to pay
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-rose-600">
            {formatTaka(totalToPay / 100)}
          </p>
        </div>
        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            You need to collect
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-emerald-600">
            {formatTaka(totalToCollect / 100)}
          </p>
        </div>
      </div>

      {settlements.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="Nothing to settle yet"
          description="Once dropship orders are delivered, settlements show up here automatically."
        />
      ) : (
        <>
          <div className="mb-4 flex gap-1 border-b border-border">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => switchTab(t.id)}
                className={[
                  "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                  tab === t.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-foreground",
                ].join(" ")}
              >
                {t.label}
                <span
                  className={[
                    "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold",
                    tab === t.id ? "bg-primary/10 text-primary" : "bg-search-bg text-muted-soft",
                  ].join(" ")}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {activeItems.length === 0 ? (
            <EmptyState
              icon={ArrowLeftRight}
              title={
                tab === "to_pay"
                  ? "Nothing to pay"
                  : tab === "to_collect"
                    ? "Nothing to collect"
                    : "No settled records yet"
              }
              description="Once dropship orders are delivered, settlements show up here automatically."
            />
          ) : (
            <>
              <div className="space-y-2">
                {pageItems.map((entry) => {
                  const isPay = entry.direction === "you_owe";
                  const isExpanded = expanded === entry.id;
                  return (
                    <div key={entry.id} className="rounded-md border border-border">
                      <button
                        type="button"
                        onClick={() => setExpanded(isExpanded ? null : entry.id)}
                        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {isPay ? "Pay" : "Collect from"}{" "}
                            <span className="font-semibold">{entry.counterpartyName}</span>
                          </p>
                          <p className="text-xs text-muted">
                            {entry.periodLabel} · {entry.orderCount} order
                            {entry.orderCount === 1 ? "" : "s"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span
                            className={[
                              "text-base font-semibold tabular-nums",
                              entry.settled
                                ? "text-muted"
                                : isPay
                                  ? "text-rose-600"
                                  : "text-emerald-600",
                            ].join(" ")}
                          >
                            {formatTaka(entry.amountCents / 100)}
                          </span>
                          {entry.settled ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-search-bg px-2.5 py-1 text-xs font-medium text-muted">
                              <Check className="size-3" strokeWidth={2.5} />
                              Settled
                            </span>
                          ) : null}
                        </div>
                      </button>

                      {isExpanded ? (
                        <div className="border-t border-border px-4 py-3">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2.5">
                              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-search-bg text-muted-soft">
                                {entry.payoutMethod === "bank" ? (
                                  <Landmark className="size-4" strokeWidth={1.75} />
                                ) : (
                                  <Building2 className="size-4" strokeWidth={1.75} />
                                )}
                              </span>
                              <div>
                                <p className="text-xs font-medium text-muted-soft">
                                  {PAYOUT_METHOD_LABEL[entry.payoutMethod]}
                                </p>
                                <p className="text-sm text-foreground">
                                  {entry.payoutAccountNumber}
                                </p>
                                <p className="text-xs text-muted">{entry.payoutAccountName}</p>
                              </div>
                            </div>
                            {!entry.settled ? (
                              <button
                                type="button"
                                onClick={() => handleMarkSettled(entry)}
                                className="inline-flex h-9 shrink-0 items-center rounded-full border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-search-bg"
                              >
                                Mark settled
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 ? (
                <div className="mt-2 rounded-md border border-border">
                  <TablePagination
                    page={page}
                    totalPages={totalPages}
                    totalItems={activeItems.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setPage}
                  />
                </div>
              ) : null}
            </>
          )}
        </>
      )}
    </DropshipShell>
  );
}
