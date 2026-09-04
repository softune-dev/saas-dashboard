"use client";

import { ArrowLeftRight, Check } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, type TableColumn } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { formatTaka } from "@/lib/format";
import type { SettlementEntry } from "@/lib/dropship-mock";
import { useDropshipMock } from "./dropship-mock-context";
import { DropshipShell } from "./dropship-shell";

/** Pure bookkeeping, never real money movement — see the settlement-design
 * discussion this feature is built from. Each row is a statement, not a
 * transaction: the two stores pay each other directly (bKash/bank) outside
 * Softunebd, then "Mark settled" here is just a record, same as ticking a
 * line off a shared spreadsheet. */
export function SettlementsView() {
  const { settlements, markSettled } = useDropshipMock();
  const { toast } = useToast();

  const totalOwedByYou = settlements
    .filter((s) => s.direction === "you_owe" && !s.settled)
    .reduce((sum, s) => sum + s.amountCents, 0);
  const totalOwedToYou = settlements
    .filter((s) => s.direction === "owed_to_you" && !s.settled)
    .reduce((sum, s) => sum + s.amountCents, 0);

  function handleMarkSettled(entry: SettlementEntry) {
    markSettled(entry.id);
    toast({ title: `Marked settled with ${entry.counterpartyName}`, variant: "success" });
  }

  const columns: TableColumn<SettlementEntry>[] = [
    {
      id: "counterparty",
      header: "Store",
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{row.counterpartyName}</p>
          <p className="text-xs text-muted">{row.periodLabel} · {row.orderCount} order{row.orderCount === 1 ? "" : "s"}</p>
        </div>
      ),
    },
    {
      id: "direction",
      header: "Direction",
      cell: (row) => (
        <span className={row.direction === "you_owe" ? "text-rose-600" : "text-emerald-600"}>
          {row.direction === "you_owe" ? "You owe them" : "They owe you"}
        </span>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      cell: (row) => (
        <span className="tabular-nums font-medium text-foreground">
          {formatTaka(row.amountCents / 100)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) =>
        row.settled ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600">
            <Check className="size-3" strokeWidth={2.5} />
            Settled
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
            Outstanding
          </span>
        ),
    },
    {
      id: "actions",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (row) =>
        !row.settled ? (
          <button
            type="button"
            onClick={() => handleMarkSettled(row)}
            className="inline-flex h-8 items-center rounded-full border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-search-bg"
          >
            Mark settled
          </button>
        ) : null,
    },
  ];

  return (
    <DropshipShell title="Settlements">
      <p className="mb-4 text-sm text-muted">
        A running statement of what you owe suppliers and what resellers owe you — Softunebd
        never moves this money. Settle it directly (bKash, bank transfer) with each store, then
        mark it here.
      </p>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-border px-4 py-3">
          <p className="text-xs font-medium text-muted">You owe (outstanding)</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-rose-600">
            {formatTaka(totalOwedByYou / 100)}
          </p>
        </div>
        <div className="rounded-md border border-border px-4 py-3">
          <p className="text-xs font-medium text-muted">Owed to you (outstanding)</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-emerald-600">
            {formatTaka(totalOwedToYou / 100)}
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
        <DataTable
          columns={columns}
          data={settlements}
          rowKey={(row) => row.id}
          emptyMessage="No settlements match this search."
          pageSize={10}
        />
      )}
    </DropshipShell>
  );
}
