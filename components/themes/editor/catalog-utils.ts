import { categories, type Category } from "@/components/categories/categories-data";
import {
  formatTaka,
  productPriceRange,
  products,
  type Product,
} from "@/components/products/products-data";

export function getActiveCategories(): Category[] {
  return categories.filter((c) => c.status === "Active");
}

export function getPublishedProducts(): Product[] {
  return products.filter((p) => p.status === "Published");
}

export function resolveCategories(ids: string[]): Category[] {
  const list = Array.isArray(ids) ? ids : [];
  return list
    .map((id) => categories.find((c) => c.id === id))
    .filter((c): c is Category => Boolean(c));
}

export function resolveProducts(ids: string[]): Product[] {
  const list = Array.isArray(ids) ? ids : [];
  return list
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));
}

export function resolveProduct(id: string | null | undefined): Product | null {
  if (!id) return null;
  return products.find((p) => p.id === id) ?? null;
}

export function productDisplayPrice(product: Product): string {
  const { min, max } = productPriceRange(product);
  if (min === max) return formatTaka(min);
  return `${formatTaka(min)} – ${formatTaka(max)}`;
}

/** Initials-style avatar when no client photo is set */
export function testimonialInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}
