"use client";

import { FolderTree, Plus } from "lucide-react";
import { useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { PrimaryButton } from "@/components/ui/primary-button";
import { TableSkeleton } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { useUndoableDelete } from "@/lib/use-undoable-delete";
import {
  createCategory,
  deleteCategory,
  updateCategory,
  useCategoriesSWR,
  useProductsSWR,
  type CategoryCreate,
  type CategoryOut,
  type CategoryUpdate,
} from "@/lib/api/commerce";
import { CategoriesStats } from "./categories-stats";
import {
  CategoriesTable,
  emptyCategoryFilters,
  type CategoryFilters,
} from "./categories-table";
import { CategoryFormModal } from "./category-form-modal";

export function CategoriesView() {
  const { currentSite, loading: sessionLoading } = useSession();
  const { toast } = useToast();
  const { deleteWithUndo } = useUndoableDelete();
  const siteId = currentSite?.id ?? null;
  const [filters, setFilters] = useState<CategoryFilters>(emptyCategoryFilters);

  const {
    data: categories = [],
    error: categoriesError,
    isLoading: categoriesLoading,
    mutate: mutateCategories,
  } = useCategoriesSWR(siteId);
  // Enough to count-by-category honestly for a typical catalog size; see
  // lib/api/commerce.ts's ListProductsParams comment on the same tradeoff
  // in the Products page. Shares a cache key with nothing else on purpose —
  // Products' own list has different filters/pagination and can't reuse it.
  const { data: productsPage, isLoading: productsLoading } = useProductsSWR(siteId, {
    limit: 100,
  });
  const products = productsPage?.items ?? [];

  const loading = categoriesLoading || productsLoading;
  const error = categoriesError
    ? categoriesError instanceof Error
      ? categoriesError.message
      : "Failed to load categories"
    : null;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryOut | null>(null);
  const [deleting, setDeleting] = useState<CategoryOut | null>(null);

  const productCountByCategory = new Map<string, number>();
  for (const p of products) {
    if (!p.category_id) continue;
    productCountByCategory.set(
      p.category_id,
      (productCountByCategory.get(p.category_id) ?? 0) + 1,
    );
  }

  async function handleCreate(data: CategoryCreate) {
    if (!currentSite) return;
    const created = await createCategory(currentSite.id, data);
    await mutateCategories((prev) => [...(prev ?? []), created], { revalidate: false });
    toast({ title: "Category created", variant: "success" });
  }

  async function handleUpdate(id: string, data: CategoryUpdate) {
    if (!currentSite) return;
    const updated = await updateCategory(currentSite.id, id, data);
    await mutateCategories(
      (prev) => (prev ?? []).map((c) => (c.id === id ? updated : c)),
      { revalidate: false },
    );
    toast({ title: "Category updated", variant: "success" });
  }

  function handleDelete() {
    if (!currentSite || !deleting) return;
    const site = currentSite;
    const category = deleting;
    setDeleting(null);

    deleteWithUndo({
      id: category.id,
      item: category,
      title: `"${category.name}" deleted`,
      optimisticRemove: () =>
        mutateCategories((prev) => (prev ?? []).filter((c) => c.id !== category.id), {
          revalidate: false,
        }),
      restore: (c) =>
        mutateCategories((prev) => [...(prev ?? []), c], { revalidate: false }),
      commitDelete: () => deleteCategory(site.id, category.id),
      onError: (err) =>
        toast({
          title: "Couldn't delete category",
          description: err instanceof Error ? err.message : "Something went wrong.",
          variant: "info",
        }),
    });
  }

  const showSkeleton = sessionLoading || (loading && currentSite);

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeading
        title="Categories"
        actions={
          <PrimaryButton
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            disabled={!currentSite}
          >
            <Plus className="size-4" strokeWidth={2} />
            Add Category
          </PrimaryButton>
        }
      />

      {!sessionLoading && !currentSite ? (
        <EmptyState
          icon={FolderTree}
          title="No site yet"
          description="Create a site from a template in Themes before adding categories."
        />
      ) : showSkeleton ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[132px] animate-pulse rounded-md bg-surface" />
            ))}
          </div>
          <TableSkeleton columns={4} />
        </>
      ) : error ? (
        <EmptyState icon={FolderTree} title="Couldn't load categories" description={error} />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="No categories yet"
          description="Group your products by adding your first category."
          action={
            <PrimaryButton
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" strokeWidth={2} />
              Add Category
            </PrimaryButton>
          }
        />
      ) : (
        <>
          <CategoriesStats categories={categories} productCounts={products.length} />
          <CategoriesTable
            categories={categories}
            productCountByCategory={productCountByCategory}
            filters={filters}
            onFiltersChange={setFilters}
            onEdit={(c) => {
              setEditing(c);
              setFormOpen(true);
            }}
            onDelete={setDeleting}
          />
        </>
      )}

      <CategoryFormModal
        open={formOpen}
        siteId={currentSite?.id ?? null}
        category={editing}
        onClose={() => setFormOpen(false)}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

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
