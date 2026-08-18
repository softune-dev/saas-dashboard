export type ProductStatus = "Published" | "Draft" | "Archived";

/**
 * What kind of choice this product offers.
 * Fashion → Size · Food → Weight · etc.
 * Options under a product always share the same kind.
 */
export type VariantKind = "size" | "weight" | "color" | "volume";

export const variantKindLabel: Record<VariantKind, string> = {
  size: "Size",
  weight: "Weight",
  color: "Color",
  volume: "Volume",
};

/** One selectable option (e.g. XL, or 1kg) with its own price & stock */
export type ProductOption = {
  id: string;
  value: string;
  price: number;
  stock: number;
};

export type Product = {
  id: string;
  productId: string;
  name: string;
  image: string;
  category: string;
  variantKind: VariantKind;
  options: ProductOption[];
  status: ProductStatus;
  updatedAt: string;
};

export type ProductStat = {
  id: string;
  title: string;
  value: string;
  changePercent: number;
  lastMonthValue: string;
  icon: string;
};

export function productTotalStock(product: Product): number {
  return product.options.reduce((sum, o) => sum + o.stock, 0);
}

export function productPriceRange(product: Product): {
  min: number;
  max: number;
} {
  const prices = product.options.map((o) => o.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

export function formatTaka(amount: number): string {
  return `${amount.toLocaleString("en-US")}৳`;
}

export const productStats: ProductStat[] = [
  {
    id: "total",
    title: "Total Products",
    value: "1,284",
    changePercent: 11.4,
    lastMonthValue: "1,152",
    icon: "/sidebar/products.svg",
  },
  {
    id: "published",
    title: "Published",
    value: "1,102",
    changePercent: 9.2,
    lastMonthValue: "1,009",
    icon: "/sidebar/shop-bag.svg",
  },
  {
    id: "low-stock",
    title: "Low Stock",
    value: "48",
    changePercent: -6.3,
    lastMonthValue: "51",
    icon: "/sidebar/shop-bag2.svg",
  },
  {
    id: "out-of-stock",
    title: "Out of Stock",
    value: "23",
    changePercent: -12.5,
    lastMonthValue: "26",
    icon: "/sidebar/orders.svg",
  },
];

export const products: Product[] = [
  {
    id: "1",
    productId: "#PRD-24081",
    name: "Sundarban Raw Honey",
    image:
      "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=160&h=160&fit=crop",
    category: "Raw Honey",
    variantKind: "weight",
    options: [
      { id: "1a", value: "250g", price: 480, stock: 64 },
      { id: "1b", value: "500g", price: 850, stock: 52 },
      { id: "1c", value: "1kg", price: 1450, stock: 26 },
    ],
    status: "Published",
    updatedAt: "Aug 7, 2026",
  },
  {
    id: "2",
    productId: "#PRD-24080",
    name: "Organic Multiflora Honey",
    image:
      "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=160&h=160&fit=crop",
    category: "Organic Honey",
    variantKind: "weight",
    options: [
      { id: "2a", value: "500g", price: 980, stock: 40 },
      { id: "2b", value: "1kg", price: 1750, stock: 46 },
    ],
    status: "Published",
    updatedAt: "Aug 6, 2026",
  },
  {
    id: "3",
    productId: "#PRD-24079",
    name: "Cinnamon Infused Honey",
    image:
      "https://images.unsplash.com/photo-1471943311424-646960669fbc?w=160&h=160&fit=crop",
    category: "Flavored Honey",
    variantKind: "weight",
    options: [
      { id: "3a", value: "250g", price: 620, stock: 18 },
      { id: "3b", value: "500g", price: 1100, stock: 0 },
    ],
    status: "Published",
    updatedAt: "Aug 5, 2026",
  },
  {
    id: "4",
    productId: "#PRD-24078",
    name: "Linen Summer Shirt",
    image:
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=160&h=160&fit=crop",
    category: "Apparel",
    variantKind: "size",
    options: [
      { id: "4a", value: "S", price: 1890, stock: 12 },
      { id: "4b", value: "M", price: 1890, stock: 28 },
      { id: "4c", value: "L", price: 1890, stock: 22 },
      { id: "4d", value: "XL", price: 1990, stock: 9 },
    ],
    status: "Published",
    updatedAt: "Aug 4, 2026",
  },
  {
    id: "5",
    productId: "#PRD-24077",
    name: "Honey Gift Box Classic",
    image:
      "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=160&h=160&fit=crop",
    category: "Gift Boxes",
    variantKind: "size",
    options: [
      { id: "5a", value: "Small", price: 1200, stock: 0 },
      { id: "5b", value: "Medium", price: 1800, stock: 14 },
      { id: "5c", value: "Large", price: 2200, stock: 8 },
    ],
    status: "Published",
    updatedAt: "Aug 3, 2026",
  },
  {
    id: "6",
    productId: "#PRD-24076",
    name: "Black Seed Spice Mix",
    image:
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=160&h=160&fit=crop",
    category: "Spices",
    variantKind: "weight",
    options: [
      { id: "6a", value: "50g", price: 180, stock: 90 },
      { id: "6b", value: "100g", price: 320, stock: 120 },
    ],
    status: "Published",
    updatedAt: "Aug 2, 2026",
  },
  {
    id: "7",
    productId: "#PRD-24075",
    name: "Everyday Cotton Tee",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=160&h=160&fit=crop",
    category: "Apparel",
    variantKind: "size",
    options: [
      { id: "7a", value: "S", price: 650, stock: 4 },
      { id: "7b", value: "M", price: 650, stock: 6 },
      { id: "7c", value: "L", price: 650, stock: 2 },
      { id: "7d", value: "XL", price: 690, stock: 0 },
      { id: "7e", value: "XXL", price: 690, stock: 0 },
    ],
    status: "Draft",
    updatedAt: "Jul 30, 2026",
  },
  {
    id: "8",
    productId: "#PRD-24074",
    name: "Winter Warmth Honey Set",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=160&h=160&fit=crop",
    category: "Seasonal",
    variantKind: "color",
    options: [
      { id: "8a", value: "Red Box", price: 1890, stock: 7 },
      { id: "8b", value: "Green Box", price: 1890, stock: 0 },
    ],
    status: "Archived",
    updatedAt: "Jul 22, 2026",
  },
  {
    id: "9",
    productId: "#PRD-24073",
    name: "Mustard Flower Honey",
    image:
      "https://images.unsplash.com/photo-1558642084-fd07fae5282e?w=160&h=160&fit=crop",
    category: "Raw Honey",
    variantKind: "weight",
    options: [
      { id: "9a", value: "500g", price: 790, stock: 55 },
      { id: "9b", value: "1kg", price: 1380, stock: 40 },
    ],
    status: "Published",
    updatedAt: "Aug 7, 2026",
  },
  {
    id: "10",
    productId: "#PRD-24072",
    name: "Classic Denim Jacket",
    image:
      "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=160&h=160&fit=crop",
    category: "Apparel",
    variantKind: "size",
    options: [
      { id: "10a", value: "S", price: 3200, stock: 5 },
      { id: "10b", value: "M", price: 3200, stock: 11 },
      { id: "10c", value: "L", price: 3400, stock: 8 },
      { id: "10d", value: "XL", price: 3400, stock: 3 },
    ],
    status: "Published",
    updatedAt: "Aug 6, 2026",
  },
];
