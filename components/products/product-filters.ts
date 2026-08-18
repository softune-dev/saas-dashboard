/** Shared product list filters — category/status map to listProducts where
 * the API supports them; stock and "uncategorized" are applied client-side. */
export type ProductFilters = {
  /** "" = all, "uncategorized" = no category_id, else a category UUID. */
  categoryId: string;
  /** "" = all, "active" | "inactive". */
  status: "" | "active" | "inactive";
  /** "" = all, "in_stock" | "out_of_stock". */
  stock: "" | "in_stock" | "out_of_stock";
};

export const emptyProductFilters: ProductFilters = {
  categoryId: "",
  status: "",
  stock: "",
};

export function countActiveFilters(f: ProductFilters): number {
  return [f.categoryId, f.status, f.stock].filter(Boolean).length;
}
