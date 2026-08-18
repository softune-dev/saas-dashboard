type ProductStockCellProps = {
  stock: number;
  optionCount?: number;
};

/** Stock count pill — solid red when low/out, solid green when healthy. */
export function ProductStockCell({ stock }: ProductStockCellProps) {
  const isLow = stock <= 20;

  return (
    <span
      className={[
        "inline-flex min-w-10 items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums text-white",
        isLow ? "bg-red-500" : "bg-emerald-500",
      ].join(" ")}
    >
      {stock}
    </span>
  );
}
