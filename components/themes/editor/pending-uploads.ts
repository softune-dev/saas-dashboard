"use client";

import { uploadSiteMedia, type MediaCategory } from "@/lib/api";

/**
 * Images picked in the theme editor used to upload to Cloudinary the
 * instant a file was chosen — even if the merchant never publishes, or
 * picks a different image seconds later. This module defers that: picking
 * a file just creates a local blob: preview URL and remembers the real
 * File in memory; the actual upload only happens once, right before
 * publish, via resolvePendingUploads.
 *
 * Tradeoff, by design: a blob: URL only lives for this tab's session — a
 * page reload before publishing loses the pending file (same as any other
 * unsaved editor change; nothing here is meant to survive a reload).
 */
type PendingEntry = { file: File; category: MediaCategory };

const pending = new Map<string, PendingEntry>();

/** Register a locally-picked file and get back an instant preview URL to
 * use in editor state right away — no network call, no siteId needed yet. */
export function registerPendingUpload(file: File, category: MediaCategory): string {
  const url = URL.createObjectURL(file);
  pending.set(url, { file, category });
  return url;
}

function collectBlobUrls(value: unknown, found: Set<string>): void {
  if (typeof value === "string") {
    if (pending.has(value)) found.add(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectBlobUrls(item, found);
    return;
  }
  if (value && typeof value === "object") {
    for (const v of Object.values(value)) collectBlobUrls(v, found);
  }
}

function replaceBlobUrls<T>(value: T, map: Map<string, string>): T {
  if (typeof value === "string") {
    return (map.get(value) ?? value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => replaceBlobUrls(v, map)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = replaceBlobUrls(v, map);
    return out as T;
  }
  return value;
}

/** Walks `value` (typically the whole editor settings object), uploads
 * every pending local file it finds inside, and returns a new value with
 * each blob: URL swapped for its real Cloudinary URL. Call this once,
 * right before publishing — a no-op (returns `value` unchanged) if nothing
 * pending is referenced in it. */
export async function resolvePendingUploads<T>(siteId: string, value: T): Promise<T> {
  const found = new Set<string>();
  collectBlobUrls(value, found);
  if (found.size === 0) return value;

  const uploaded = await Promise.all(
    Array.from(found).map(async (blobUrl) => {
      const entry = pending.get(blobUrl);
      if (!entry) return null;
      const result = await uploadSiteMedia(siteId, entry.file, entry.category);
      return [blobUrl, result.url] as const;
    }),
  );

  const map = new Map(uploaded.filter((e): e is [string, string] => e !== null));
  if (map.size === 0) return value;

  const resolved = replaceBlobUrls(value, map);
  for (const [blobUrl] of map) {
    pending.delete(blobUrl);
    URL.revokeObjectURL(blobUrl);
  }
  return resolved;
}
