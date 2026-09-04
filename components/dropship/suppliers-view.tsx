"use client";

import { MapPin, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { SettingsSelect } from "@/components/settings/site/ui/settings-field";
import { TablePagination } from "@/components/ui/table";
import {
  buildSupplierContactLink,
  MOCK_SUPPLIERS_DIRECTORY,
  type SupplierDirectoryEntry,
} from "@/lib/dropship-mock";
import { useDropshipMock } from "./dropship-mock-context";
import { DropshipShell } from "./dropship-shell";
import { SupplierLogo } from "./supplier-logo";
import { SupplierProfileModal } from "./supplier-profile-modal";
import { WhatsAppIcon } from "./whatsapp-icon";

const PAGE_SIZE = 8;

/** Every supplier in the marketplace, one card each — account info and a
 * jump into their full catalog, instead of only meeting a supplier
 * incidentally while browsing individual products. */
export function SuppliersView() {
  const { marketplace } = useDropshipMock();
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("all");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<SupplierDirectoryEntry | null>(null);

  const listingCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const listing of marketplace) {
      counts.set(listing.supplierName, (counts.get(listing.supplierName) ?? 0) + 1);
    }
    return counts;
  }, [marketplace]);

  const cities = useMemo(
    () => Array.from(new Set(MOCK_SUPPLIERS_DIRECTORY.map((s) => s.city))).sort(),
    [],
  );

  const filtered = MOCK_SUPPLIERS_DIRECTORY.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.trim().toLowerCase());
    const matchesCity = city === "all" || s.city === city;
    return matchesSearch && matchesCity;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handlePageChange(next: number) {
    setPage(next);
  }

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function updateCity(value: string) {
    setCity(value);
    setPage(1);
  }

  return (
    <DropshipShell title="All Suppliers">
      <p className="mb-4 text-sm text-muted">
        Every store supplying wholesale products on Softunebd. Open a profile to see their full
        catalog and import directly from there.
      </p>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block flex-1">
          <span className="text-sm font-medium text-muted">Search</span>
          <div className="relative mt-1.5">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-soft" strokeWidth={1.75} />
            <input
              type="text"
              value={search}
              onChange={(e) => updateSearch(e.target.value)}
              placeholder="Search suppliers"
              className="h-10 w-full rounded-md border border-border bg-search-bg pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-soft focus:border-primary focus:bg-surface"
            />
          </div>
        </label>
        <div className="sm:w-48">
          <SettingsSelect
            label="City"
            value={city}
            onChange={(e) => updateCity(e.target.value)}
            options={[
              { value: "all", label: "All cities" },
              ...cities.map((c) => ({ value: c, label: c })),
            ]}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <Users className="size-6 text-muted-soft" strokeWidth={1.5} />
          <p className="text-sm text-muted">No suppliers match your filters.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pageItems.map((supplier) => {
              const contactLink = buildSupplierContactLink(supplier.contact, supplier.name);
              const count = listingCounts.get(supplier.name) ?? 0;
              return (
                <article
                  key={supplier.name}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4"
                >
                  <div className="flex items-start gap-3">
                    <SupplierLogo name={supplier.name} logo={supplier.logo} size="lg" />
                    <div className="min-w-0 pt-0.5">
                      <h3 className="truncate text-sm font-semibold text-foreground">
                        {supplier.name}
                      </h3>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                        <MapPin className="size-3.5" strokeWidth={1.75} />
                        {supplier.city}
                      </p>
                    </div>
                  </div>
                  <p className="line-clamp-2 text-xs text-muted">{supplier.description}</p>

                  <p className="text-xs font-medium text-muted-soft">
                    {count} product{count === 1 ? "" : "s"} listed
                  </p>

                  <div className="mt-auto flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewing(supplier)}
                      className="h-9 flex-1 rounded-full bg-primary text-sm font-medium text-white transition-opacity hover:opacity-90"
                    >
                      View catalog
                    </button>
                    {contactLink ? (
                      <a
                        href={contactLink}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Contact on WhatsApp"
                        title="Contact on WhatsApp"
                        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-soft transition-colors hover:bg-search-bg hover:text-foreground"
                      >
                        <WhatsAppIcon className="size-4 text-[#25D366]" />
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
          <div className="mt-4">
            <TablePagination
              page={page}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={handlePageChange}
            />
          </div>
        </>
      )}

      <SupplierProfileModal supplier={viewing} onClose={() => setViewing(null)} />
    </DropshipShell>
  );
}
