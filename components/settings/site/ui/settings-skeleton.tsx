/** Shaped loading skeletons for Site Settings forms — every section used to
 * fall back to one flat pulsing rectangle whose height was hand-picked per
 * section (h-48/h-64/h-96) and looked nothing like the real form, unlike
 * Courier's card-grid skeleton or Media's image-grid skeleton. These pieces
 * compose into something that roughly traces the actual field layout, so the
 * loading state reads as "this page" rather than a generic gray box. */

function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-search-bg ${className}`} />;
}

/** One label + input pair, the base unit almost every settings field is. */
export function SettingsFieldSkeleton({ short = false }: { short?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Bar className={`h-3 ${short ? "w-16" : "w-24"}`} />
      <Bar className="h-10 w-full" />
    </div>
  );
}

/** N fields side by side — mirrors the sm:grid-cols-2/3 rows every section uses. */
export function SettingsRowSkeleton({ cols = 2 }: { cols?: 2 | 3 }) {
  return (
    <div className={`grid grid-cols-1 gap-4 ${cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
      {Array.from({ length: cols }).map((_, i) => (
        <SettingsFieldSkeleton key={i} />
      ))}
    </div>
  );
}

/** A textarea-shaped field. */
export function SettingsTextareaSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Bar className="h-3 w-28" />
      <Bar className={tall ? "h-24 w-full" : "h-16 w-full"} />
    </div>
  );
}

/** A repeatable list row — hours, FAQs, social links, delivery locations:
 * every "add another" list in these sections is a horizontal strip of 2-3
 * fields plus a trailing icon-button, so this is the one shape reused for
 * all of them. */
export function SettingsListRowSkeleton() {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border dark:border-transparent p-3">
      <Bar className="h-8 flex-1" />
      <Bar className="h-8 flex-1" />
      <Bar className="size-8 shrink-0 rounded-full" />
    </div>
  );
}

/** A full rich-text editor block (Privacy/Terms). */
export function SettingsEditorSkeleton() {
  return (
    <div className="flex flex-col gap-1.5">
      <Bar className="h-9 w-full" />
      <Bar className="h-64 w-full" />
    </div>
  );
}
