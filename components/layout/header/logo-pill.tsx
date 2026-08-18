import Link from "next/link";

export function LogoPill() {
  return (
    <Link
      href="/"
      className="flex shrink-0 items-center gap-2.5 rounded-full bg-border py-1.5 pr-4 pl-1.5 transition-opacity hover:opacity-90"
      aria-label="Softune home"
    >
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary"
        aria-hidden
      >
        <span className="size-2.5 rounded-full bg-white" />
      </span>
      <span className="text-sm font-semibold tracking-tight text-foreground">
        Softune
      </span>
    </Link>
  );
}
