"use client";

import { ArrowDownCircle, ArrowLeftRight, ArrowUpCircle, Check } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { TablePagination } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { formatTaka } from "@/lib/format";
import type { SettlementEntry } from "@/lib/dropship-mock";
import { useDropshipMock } from "./dropship-mock-context";
import { DropshipShell } from "./dropship-shell";

const PAGE_SIZE = 4;

function paginate<T>(items: T[], page: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return { pageItems, totalPages };
}

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
  const [payPage, setPayPage] = useState(1);
  const [collectPage, setCollectPage] = useState(1);
  const [settledPage, setSettledPage] = useState(1);

  const toPay = settlements.filter((s) => s.direction === "you_owe" && !s.settled);
  const toCollect = settlements.filter((s) => s.direction === "owed_to_you" && !s.settled);
  const settled = settlements.filter((s) => s.settled);

  const payPagination = paginate(toPay, payPage);
  const collectPagination = paginate(toCollect, collectPage);
  const settledPagination = paginate(settled, settledPage);

  const totalToPay = toPay.reduce((sum, s) => sum + s.amountCents, 0);
  const totalToCollect = toCollect.reduce((sum, s) => sum + s.amountCents, 0);

  function handleMarkSettled(entry: SettlementEntry) {
    markSettled(entry.id);
    toast({ title: `Marked settled with ${entry.counterpartyName}`, variant: "success" });
  }

  function SettlementCard({ entry }: { entry: SettlementEntry }) {
    const isPay = entry.direction === "you_owe";
    return (
      <div className="flex items-center justify-between gap-4 rounded-md border border-border px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={[
              "flex size-9 shrink-0 items-center justify-center rounded-full",
              isPay ? "bg-rose-500/10 text-rose-600" : "bg-emerald-500/10 text-emerald-600",
            ].join(" ")}
          >
            {isPay ? (
              <ArrowUpCircle className="size-4.5" strokeWidth={1.75} />
            ) : (
              <ArrowDownCircle className="size-4.5" strokeWidth={1.75} />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {isPay ? "Pay" : "Collect from"}{" "}
              <span className="font-semibold">{entry.counterpartyName}</span>
            </p>
            <p className="text-xs text-muted">
              {entry.periodLabel} · {entry.orderCount} order{entry.orderCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span
            className={[
              "text-base font-semibold tabular-nums",
              entry.settled ? "text-muted" : isPay ? "text-rose-600" : "text-emerald-600",
            ].join(" ")}
          >
            {formatTaka(entry.amountCents / 100)}
          </span>
          {entry.settled ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-search-bg px-2.5 py-1 text-xs font-medium text-muted">
              <Check className="size-3" strokeWidth={2.5} />
              Settled
            </span>
          ) : (
            <button
              type="button"
              onClick={() => handleMarkSettled(entry)}
              className="inline-flex h-8 items-center rounded-full border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-search-bg"
            >
              Mark settled
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <DropshipShell title="Settlements">
      <p className="mb-4 text-sm text-muted">
        What you need to pay suppliers, and what to collect from resellers. Softunebd never moves
        this money — pay or collect directly (bKash, bank transfer), then mark it done here.
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
        <div className="space-y-5">
          {toPay.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-soft uppercase tracking-wide">
                To pay
              </p>
              <div className="space-y-2">
                {payPagination.pageItems.map((entry) => (
                  <SettlementCard key={entry.id} entry={entry} />
                ))}
              </div>
              {payPagination.totalPages > 1 ? (
                <div className="mt-2 rounded-md border border-border">
                  <TablePagination
                    page={payPage}
                    totalPages={payPagination.totalPages}
                    totalItems={toPay.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setPayPage}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {toCollect.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-soft uppercase tracking-wide">
                To collect
              </p>
              <div className="space-y-2">
                {collectPagination.pageItems.map((entry) => (
                  <SettlementCard key={entry.id} entry={entry} />
                ))}
              </div>
              {collectPagination.totalPages > 1 ? (
                <div className="mt-2 rounded-md border border-border">
                  <TablePagination
                    page={collectPage}
                    totalPages={collectPagination.totalPages}
                    totalItems={toCollect.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setCollectPage}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {settled.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-soft uppercase tracking-wide">
                Settled
              </p>
              <div className="space-y-2">
                {settledPagination.pageItems.map((entry) => (
                  <SettlementCard key={entry.id} entry={entry} />
                ))}
              </div>
              {settledPagination.totalPages > 1 ? (
                <div className="mt-2 rounded-md border border-border">
                  <TablePagination
                    page={settledPage}
                    totalPages={settledPagination.totalPages}
                    totalItems={settled.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setSettledPage}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </DropshipShell>
  );
}
