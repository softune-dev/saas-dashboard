import type { MetadataRoute } from "next";

/** Authenticated admin panel — disallow everything. The metadata.robots tag
 * in layout.tsx handles crawlers that fetch the page anyway; this handles
 * the ones that check robots.txt first and never fetch it at all. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
