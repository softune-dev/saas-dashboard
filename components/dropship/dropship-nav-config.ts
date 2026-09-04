import {
  ArrowLeftRight,
  PackageSearch,
  ShoppingBag,
  Store,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";

export type DropshipNavItem = {
  id: string;
  label: string;
  href: string;
  LucideIcon: LucideIcon;
};

/** Sub-menus under the single "Dropship" sidebar entry — same "one nav
 * item, real routes inside" shape as Site Settings (see
 * components/settings/site/site-nav-config.ts), not five separate top-level
 * items competing for sidebar space. */
export const dropshipNav: DropshipNavItem[] = [
  { id: "browse", label: "Browse Suppliers", href: "/dropship/browse", LucideIcon: PackageSearch },
  { id: "suppliers", label: "Suppliers", href: "/dropship/suppliers", LucideIcon: Users },
  { id: "listings", label: "My Listings", href: "/dropship/listings", LucideIcon: Store },
  { id: "imported", label: "Imported Products", href: "/dropship/imported", LucideIcon: ShoppingBag },
  { id: "fulfillment", label: "Fulfillment", href: "/dropship/fulfillment", LucideIcon: Truck },
  { id: "settlements", label: "Settlements", href: "/dropship/settlements", LucideIcon: ArrowLeftRight },
];
