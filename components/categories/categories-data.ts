export type CategoryStatus = "Active" | "Inactive";

export type Category = {
  id: string;
  name: string;
  slug: string;
  /** Category cover / thumbnail image URL */
  image: string;
  products: number;
  status: CategoryStatus;
  updatedAt: string;
};

export type CategoryStat = {
  id: string;
  title: string;
  value: string;
  changePercent: number;
  lastMonthValue: string;
  icon: string;
};

export const categoryStats: CategoryStat[] = [
  {
    id: "total",
    title: "Total Categories",
    value: "24",
    changePercent: 8.2,
    lastMonthValue: "22",
    icon: "/sidebar/categories.svg",
  },
  {
    id: "active",
    title: "Active",
    value: "19",
    changePercent: 5.5,
    lastMonthValue: "18",
    icon: "/sidebar/products.svg",
  },
  {
    id: "inactive",
    title: "Inactive",
    value: "5",
    changePercent: -2.1,
    lastMonthValue: "4",
    icon: "/sidebar/orders.svg",
  },
  {
    id: "products",
    title: "Listed Products",
    value: "1,284",
    changePercent: 11.4,
    lastMonthValue: "1,152",
    icon: "/sidebar/shop-bag.svg",
  },
];

export const categories: Category[] = [
  {
    id: "1",
    name: "Raw Honey",
    slug: "raw-honey",
    image:
      "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=160&h=160&fit=crop",
    products: 48,
    status: "Active",
    updatedAt: "Aug 6, 2026",
  },
  {
    id: "2",
    name: "Organic Honey",
    slug: "organic-honey",
    image:
      "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=160&h=160&fit=crop",
    products: 36,
    status: "Active",
    updatedAt: "Aug 5, 2026",
  },
  {
    id: "3",
    name: "Flavored Honey",
    slug: "flavored-honey",
    image:
      "https://images.unsplash.com/photo-1471943311424-646960669fbc?w=160&h=160&fit=crop",
    products: 22,
    status: "Active",
    updatedAt: "Aug 4, 2026",
  },
  {
    id: "4",
    name: "Honey Comb",
    slug: "honey-comb",
    image:
      "https://images.unsplash.com/photo-1587049659285-7b0d0a833a05?w=160&h=160&fit=crop",
    products: 14,
    status: "Active",
    updatedAt: "Aug 3, 2026",
  },
  {
    id: "5",
    name: "Gift Boxes",
    slug: "gift-boxes",
    image:
      "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=160&h=160&fit=crop",
    products: 18,
    status: "Active",
    updatedAt: "Aug 2, 2026",
  },
  {
    id: "6",
    name: "Spices",
    slug: "spices",
    image:
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=160&h=160&fit=crop",
    products: 31,
    status: "Active",
    updatedAt: "Aug 1, 2026",
  },
  {
    id: "7",
    name: "Tea Blends",
    slug: "tea-blends",
    image:
      "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=160&h=160&fit=crop",
    products: 27,
    status: "Inactive",
    updatedAt: "Jul 28, 2026",
  },
  {
    id: "8",
    name: "Seasonal",
    slug: "seasonal",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=160&h=160&fit=crop",
    products: 9,
    status: "Inactive",
    updatedAt: "Jul 22, 2026",
  },
];
