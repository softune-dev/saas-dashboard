/** Shared gallery image union for the product form + media gallery.
 * Pending images stay local until Save so cancel never orphans uploads. */
export type GalleryImage =
  | { kind: "uploaded"; url: string; public_id?: string }
  | { kind: "pending"; file: File; previewUrl: string };
