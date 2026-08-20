import { Package } from "lucide-react";
import Image from "next/image";
import { formatTaka } from "@/lib/format";
import type { BestSeller } from "@/lib/api/analytics";

export function BestSellers({ items }: { items: BestSeller[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">No sales in this period yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, index) => (
        <li
          key={item.id ?? item.name}
          className="flex items-center gap-3 rounded-md bg-search-bg/50 px-3 py-2.5"
        >
          <span 
            className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
              index < 3 
                ? "bg-primary text-white" 
                : "bg-primary/20 text-primary"
            }`}
          >
            {index + 1}
          </span>
          <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface">
            {item.image ? (
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <Package className="size-4 text-muted-soft" strokeWidth={1.75} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {item.name}
            </p>
            <p className="truncate text-xs text-muted">{item.category}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold tabular-nums text-foreground">
              {item.sold}
            </p>
            <p className="text-[11px] text-muted">sold</p>
          </div>
          <div className="hidden w-24 shrink-0 text-right sm:block">
            <p className="text-sm font-semibold text-foreground">
              {formatTaka(item.revenue_cents / 100)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
