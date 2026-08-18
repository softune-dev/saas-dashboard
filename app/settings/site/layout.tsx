import type { ReactNode } from "react";

/** Nested under dashboard shell — sections render their own SiteSettingsShell */
export default function SiteSettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
