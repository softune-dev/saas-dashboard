"use client";

import { Package, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { PrimaryButton } from "@/components/ui/primary-button";
import { TableSkeleton } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { useUndoableDelete } from "@/lib/use-undoable-delete";
import {
  deleteProduct,
  useCategoriesSWR,
  useProductsSWR,
  type ProductOut,
} from "@/lib/api/commerce";
import {
  countActiveFilters,
  emptyProductFilters,
  type ProductFilters,
} from "./product-filters";
import { ProductsStats } from "./products-stats";
import { ProductsTable } from "./products-table";

function applyClientFilters(
  products: ProductOut[],
  filters: ProductFilters,
): ProductOut[] {
  return products.filter((p) => {
    if (filters.categoryId === "uncategorized" && p.category_id) return false;
    if (filters.status === "inactive" && p.is_active) return false;
    // active is also requested server-side via active_only; keep client guard
    // so a stale page never shows inactive rows under that filter.
    if (filters.status === "active" && !p.is_active) return false;
    if (filters.stock === "out_of_stock") {
      if (!p.track_stock || p.stock > 0) return false;
    }
    if (filters.stock === "in_stock") {
      if (p.track_stock && p.stock <= 0) return false;
    }
    return true;
  });
}

export function ProductsView() {
  const router = useRouter();
  const { currentSite, loading: sessionLoading } = useSession();
  const { toast } = useToast();
  const { deleteWithUndo } = useUndoableDelete();
  const siteId = currentSite?.id ?? null;

  const [query, setQuery] = useState("");
  // Debounced separately from `query` so typing doesn't fire a request (and
  // SWR cache-key change) on every keystroke — same 350ms feel as before,
  // just driving a cache key instead of a manual fetch call.
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filters, setFilters] = useState<ProductFilters>(emptyProductFilters);

  const [deleting, setDeleting] = useState<ProductOut | null>(null);

  // category_id + active_only are real backend params; uncategorized /
  // inactive / stock are refined client-side after the fetch.
  const categoryId =
    filters.categoryId && filters.categoryId !== "uncategorized"
      ? filters.categoryId
      : undefined;

  const {
    data: productPage,
    error: productsError,
    isLoading: productsLoading,
    mutate: mutateProducts,
  } = useProductsSWR(siteId, {
    q: debouncedQuery || undefined,
    category_id: categoryId,
    active_only: filters.status === "active" ? true : undefined,
    limit: 100,
  });
  const { data: categories = [], isLoading: categoriesLoading } = useCategoriesSWR(siteId);

  const products = useMemo(() => productPage?.items ?? [], [productPage]);
  const total = productPage?.total ?? 0;
  const loading = productsLoading || categoriesLoading;
  const error = productsError
    ? productsError instanceof Error
      ? productsError.message
      : "Failed to load products"
    : null;

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  function handleSearch(q: string) {
    setQuery(q);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => setDebouncedQuery(q), 350);
  }

  function handleFiltersChange(next: ProductFilters) {
    setFilters(next);
  }

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const filteredProducts = useMemo(
    () => applyClientFilters(products, filters),
    [products, filters],
  );

  function handleDelete() {
    if (!currentSite || !deleting) return;
    const site = currentSite;
    const product = deleting;
    setDeleting(null);

    deleteWithUndo({
      id: product.id,
      item: product,
      title: `"${product.name}" deleted`,
      optimisticRemove: () =>
        mutateProducts(
          (prev) =>
            prev && {
              ...prev,
              items: prev.items.filter((p) => p.id !== product.id),
              total: Math.max(0, prev.total - 1),
            },
          { revalidate: false },
        ),
      restore: (p) =>
        mutateProducts(
          (prev) =>
            prev && { ...prev, items: [p, ...prev.items], total: prev.total + 1 },
          { revalidate: false },
        ),
      commitDelete: () => deleteProduct(site.id, product.id),
      onError: (err) =>
        toast({
          title: "Couldn't delete product",
          description: err instanceof Error ? err.message : "Something went wrong.",
          variant: "info",
        }),
    });
  }

  const hasFilters = countActiveFilters(filters) > 0 || !!query;
  const showSkeleton =
    sessionLoading || (loading && currentSite && products.length === 0 && !hasFilters);

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeading
        title="Products"
        actions={
          <PrimaryButton
            onClick={() => router.push("/products/new")}
            disabled={!currentSite}
          >
            <Plus className="size-4" strokeWidth={2} />
            Add Product
          </PrimaryButton>
        }
      />

      {!sessionLoading && !currentSite ? (
        <EmptyState
          icon={Package}
          title="No site yet"
          description="Create a site from a template in Themes before adding products."
        />
      ) : showSkeleton ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[132px] animate-pulse rounded-md bg-white" />
            ))}
          </div>
          <TableSkeleton columns={6} />
        </>
      ) : error ? (
        <EmptyState icon={Package} title="Couldn't load products" description={error} />
      ) : products.length === 0 && !hasFilters ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Add your first product to start selling."
          action={
            <PrimaryButton onClick={() => router.push("/products/new")}>
              <Plus className="size-4" strokeWidth={2} />
              Add Product
            </PrimaryButton>
          }
        />
      ) : (
        <>
          <ProductsStats products={filteredProducts} totalCount={total} />
          <ProductsTable
            products={filteredProducts}
            categories={categories}
            categoryById={categoryById}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onEdit={(p) => router.push(`/products/${p.id}/edit`)}
            onDelete={setDeleting}
            onSearch={handleSearch}
          />
        </>
      )}

      <ConfirmDialog
        open={!!deleting}
        title={`Delete "${deleting?.name}"?`}
        description="You'll have 10 seconds to undo from the toast after this."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
