"use client";

import { Search } from "lucide-react";
import { useId } from "react";

export function SearchBar() {
  const id = useId();

  return (
    <div className="relative w-80 min-w-0">
      <label htmlFor={id} className="sr-only">
        Search
      </label>
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-soft"
        aria-hidden
      />
      <input
        id={id}
        type="search"
        placeholder="Search products, orders, customers..."
        className="h-10 w-full rounded-full bg-border pr-4 pl-10 text-sm text-foreground outline-none placeholder:text-muted-soft transition-colors focus:bg-white"
        autoComplete="off"
      />
    </div>
  );
}
