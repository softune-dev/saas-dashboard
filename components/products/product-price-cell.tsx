import { formatTaka, productPriceRange, type Product } from "./products-data";

type ProductPriceCellProps = {
  product: Product;
};

/** Single base price (lowest option price). */
export function ProductPriceCell({ product }: ProductPriceCellProps) {
  if (product.options.length === 0) {
    return <span className="text-muted">—</span>;
  }

  const { min } = productPriceRange(product);

  return (
    <span className="text-sm font-semibold tabular-nums text-foreground">
      {formatTaka(min)}
    </span>
  );
}
