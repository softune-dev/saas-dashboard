"use client";

import { Icon } from "@iconify/react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";

/** Renders whatever the icon picker (IconPicker in
 * components/themes/editor/editor-field.tsx) could have stored, across both
 * eras of that picker:
 * - New values are full Iconify ids, e.g. "solar:bag-bold" — always contain
 *   a colon, rendered via @iconify/react's <Icon>.
 * - Old values are bare lucide kebab-case names, e.g. "shopping-bag" — no
 *   colon, rendered via lucide's <DynamicIcon>, same as before the picker
 *   moved to Solar. This is the only reason the lucide dependency is still
 *   here: every category/product/theme record saved before the switch
 *   keeps rendering exactly as it always has, with no migration required.
 *
 * Mirrors the storefront templates' own FeatureIcon (lib/icon-map.tsx in
 * both templates) — keep the two in sync if this logic changes. */
export function AppIcon({
  name,
  className,
  strokeWidth,
}: {
  name: string | undefined | null;
  className?: string;
  strokeWidth?: number;
}) {
  if (!name) return null;
  if (name.includes(":")) {
    return <Icon icon={name} className={className} />;
  }
  return <DynamicIcon name={name as IconName} className={className} strokeWidth={strokeWidth} />;
}
