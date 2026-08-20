import Link from "next/link";

/** Softune mark from the landing navbar — primary disc + wordmark, same pill bg.
 * Wordmark hides below md so the mobile header stays compact. */
export function LogoPill() {
  return (
    <Link
      href="/"
      className="flex shrink-0 items-center gap-2.5 rounded-full bg-border py-1.5 pr-1.5 pl-1.5 transition-opacity hover:opacity-90 md:pr-4"
      aria-label="Softune home"
    >
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary"
        aria-hidden
      >
        <img
          src="/logo.svg"
          alt=""
          className="h-[18px] w-auto object-contain brightness-0 invert"
        />
      </span>
      <span className="hidden text-sm font-semibold tracking-tight text-foreground md:inline">
        Softune
      </span>
    </Link>
  );
}
