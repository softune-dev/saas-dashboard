"use client";

import { Download, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSWRConfig } from "swr";
import { useLanguage } from "@/components/providers/language-provider";
import { useSession } from "@/components/providers/session-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { PrimaryButton } from "@/components/ui/primary-button";
import { TableSkeleton } from "@/components/ui/table";
import { downloadCsv } from "@/lib/export";
import { formatDisplayDate } from "@/lib/format";
import {
  getCustomer,
  updateCustomer,
  useCustomersSWR,
  type CustomerDetailOut,
  type CustomerOut,
} from "@/lib/api/customers";
import { CustomerDetailModal } from "./customer-detail-modal";
import { CustomersStats } from "./customers-stats";
import {
  CustomersTable,
  emptyCustomerFilters,
  type CustomerFilters,
} from "./customers-table";

export function CustomersView() {
  const { t } = useLanguage();
  const { currentSite, loading: sessionLoading } = useSession();
  const { mutate } = useSWRConfig();
  const searchParams = useSearchParams();
  const siteId = currentSite?.id ?? null;
  const [filters, setFilters] = useState<CustomerFilters>(emptyCustomerFilters);
  const deepQuery = searchParams.get("q")?.trim() ?? "";

  const [viewing, setViewing] = useState<CustomerOut | CustomerDetailOut | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailBusy, setDetailBusy] = useState(false);

  const { data: page, error: listError, isLoading: loading } = useCustomersSWR(siteId, {
    limit: 100,
  });
  const customers = useMemo<CustomerOut[]>(() => page?.items ?? [], [page]);
  const error = listError
    ? listError instanceof Error
      ? listError.message
      : t("Failed to load customers")
    : null;

  const showSkeleton = sessionLoading || (loading && !!currentSite && customers.length === 0);

  const handleView = async (customer: CustomerOut) => {
    if (!siteId) return;
    setDetailOpen(true);
    setViewing(customer);
    try {
      const detail = await getCustomer(siteId, customer.id);
      setViewing(detail);
    } catch {
      // Keep the seed data showing rather than closing
    }
  };

  const handleSave = async (name: string, email: string) => {
    if (!siteId || !viewing) return;
    setDetailBusy(true);
    try {
      await updateCustomer(siteId, viewing.id, {
        name: name || null,
        email: email || null,
      });
      const refreshed = await getCustomer(siteId, viewing.id);
      setViewing(refreshed);
      await mutate([siteId, "customers", 100, 0]);
    } finally {
      setDetailBusy(false);
    }
  };

  const handleExport = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    const siteName = (currentSite?.name ?? "store").toLowerCase().replace(/\s+/g, "-");
    const rows: (string | number)[][] = [
      ["Name", "Phone", "Email", "Customer Since"],
      ...customers.map((c) => [
        c.name ?? "",
        c.phone,
        c.email ?? "",
        formatDisplayDate(new Date(c.created_at)),
      ]),
    ];
    downloadCsv(`${siteName}-customers-${stamp}.csv`, rows);
  };

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeading
        title={t("Customers")}
        actionsInline
        actions={
          customers.length > 0 ? (
            <PrimaryButton onClick={handleExport} className="px-4">
              <Download className="size-4" strokeWidth={2} />
              <span className="hidden sm:inline">{t("Export")}</span>
            </PrimaryButton>
          ) : undefined
        }
      />

      {!sessionLoading && !currentSite ? (
        <EmptyState
          icon={Users}
          title={t("No site yet")}
          description={t("Create a site from a template in Themes before viewing customers.")}
        />
      ) : showSkeleton ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[100px] animate-pulse rounded-md bg-surface" />
            ))}
          </div>
          <TableSkeleton columns={4} />
        </>
      ) : error ? (
        <EmptyState icon={Users} title={t("Couldn't load customers")} description={error} />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t("No customers yet")}
          description={t("A customer record is created the first time someone checks out with a phone number — once your first order comes in, they'll appear here.")}
        />
      ) : (
        <>
          <CustomersStats customers={customers} total={page?.total ?? customers.length} />
          <CustomersTable
            customers={customers}
            filters={filters}
            onFiltersChange={setFilters}
            onView={handleView}
            initialQuery={deepQuery}
          />
        </>
      )}

      <CustomerDetailModal
        open={detailOpen}
        customer={viewing}
        busy={detailBusy}
        onClose={() => {
          setDetailOpen(false);
          setViewing(null);
        }}
        onSave={handleSave}
      />
    </div>
  );
}
