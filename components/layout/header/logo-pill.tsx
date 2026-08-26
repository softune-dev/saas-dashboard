import Link from "next/link";
import { SoftuneLogo } from "@/components/brand/softune-logo";

/** Softune brand in the header — large mark, no background pill. */
export function LogoPill() {
  return (
    <Link
      href="/"
      className="flex shrink-0 items-center transition-opacity hover:opacity-90"
      aria-label="Softune home"
    >
      <SoftuneLogo className="h-9 w-auto md:h-10" />
    </Link>
  );
}
