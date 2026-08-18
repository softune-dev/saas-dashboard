import type { Product, ProductOption } from "./products-data";

type ProductVariantCellProps = {
  product: Product;
};

function optionTone(option: ProductOption): string {
  if (option.stock === 0) return "bg-slate-100 text-slate-400 line-through";
  if (option.stock <= 10) return "bg-amber-50 text-amber-700";
  return "bg-search-bg text-foreground";
}

/** Option chips only — no kind / count labels. */
export function ProductVariantCell({ product }: ProductVariantCellProps) {
  const { options } = product;

  if (options.length === 0) {
    return <span className="text-muted">—</span>;
  }

  return (
    <div className="flex max-w-[14rem] flex-wrap gap-1">
      {options.map((option) => (
        <span
          key={option.id}
          title={`${option.value} · ${option.price.toLocaleString("en-US")}৳ · ${option.stock} in stock`}
          className={[
            "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
            optionTone(option),
          ].join(" ")}
        >
          {option.value}
        </span>
      ))}
    </div>
  );
}
