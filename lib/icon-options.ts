import { iconNames, type IconName } from "lucide-react/dynamic";

/** The full lucide icon set (2000+ names, kebab-case, e.g. "shield-check")
 * rather than a small curated shortlist — every one of these resolves via
 * <DynamicIcon name=".."/> both here and on every storefront template, code
 * -split per icon so picking from the whole library costs nothing until an
 * icon is actually rendered. */
export const ICON_NAMES: IconName[] = iconNames;

export function randomIconValue(): string {
  return ICON_NAMES[Math.floor(Math.random() * ICON_NAMES.length)];
}
