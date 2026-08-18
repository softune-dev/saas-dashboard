import { BookOpen, Image, Search, type LucideIcon } from "lucide-react";

export type SiteSettingsNavItem = {
  id: string;
  label: string;
  href: string;
  /** Public sidebar SVG path (used with MaskIcon) */
  iconSrc?: string;
  /** Lucide icon component when no sidebar asset fits */
  LucideIcon?: LucideIcon;
};

/** Sub-menus under Site Settings */
export const siteSettingsNav: SiteSettingsNavItem[] = [
  {
    id: "domains",
    label: "Domains",
    href: "/settings/site/domains",
    iconSrc: "/sidebar/brand.svg",
  },
  {
    id: "seo",
    label: "SEO",
    href: "/settings/site/seo",
    LucideIcon: Search,
  },
  {
    id: "shipping",
    label: "Shipping",
    href: "/settings/site/shipping",
    iconSrc: "/sidebar/delivery.svg",
  },
  {
    id: "contact",
    label: "Contact Info",
    href: "/settings/site/contact",
    iconSrc: "/sidebar/note.svg",
  },
  {
    id: "about",
    label: "About Us",
    href: "/settings/site/about",
    LucideIcon: BookOpen,
  },
  {
    id: "faqs",
    label: "FAQs",
    href: "/settings/site/faqs",
    iconSrc: "/sidebar/empty.svg",
  },
  {
    id: "privacy",
    label: "Privacy Policy",
    href: "/settings/site/privacy",
    iconSrc: "/sidebar/note.svg",
  },
  {
    id: "terms",
    label: "Terms",
    href: "/settings/site/terms",
    iconSrc: "/sidebar/note.svg",
  },
  {
    id: "media",
    label: "Media",
    href: "/settings/site/media",
    LucideIcon: Image,
  },
];
