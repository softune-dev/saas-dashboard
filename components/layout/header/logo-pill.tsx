"use client";

import Link from "next/link";
import { SoftuneLogo } from "@/components/brand/softune-logo";
import { useSession } from "@/components/providers/session-provider";

/** Softune brand in the header — large mark, no background pill. */
export function LogoPill() {
  const { me } = useSession();
  const homeHref = me?.user.is_superadmin ? "/superadmin" : "/";

  return (
    <Link
      href={homeHref}
      className="flex shrink-0 items-center transition-opacity hover:opacity-90"
      aria-label="Softunebd home"
    >
      <SoftuneLogo className="h-7 w-auto md:h-8" />
    </Link>
  );
}
