"use client";

import { RefreshCw, Upload } from "lucide-react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { DeviceToolbar } from "./device-toolbar";
import {
  FALLBACK_PREVIEW_URL,
  resolvePageUrl,
  type BrowserChromeTheme,
  type DeviceId,
  type SiteEditorSettings,
  type SitePage,
} from "./editor-types";

type SitePreviewProps = {
  settings: SiteEditorSettings;
  activePage?: SitePage;
  device: DeviceId;
  onDeviceChange: (device: DeviceId) => void;
  /** This site's own preview server (set per card in themes-data.ts). */
  previewUrl?: string;
  /** Real subdomain/domain of the site being edited. Passed to the template
   * as ?__site= so the preview renders THIS site rather than whatever host
   * the template's own .env defaults to.
   * Tri-state: `undefined` = still resolving (do not mount iframe yet),
   * `string` = known host, `null` = lookup done with no host (load without
   * __site). Mounting before resolve causes a double load: first without
   * __site (wrong default site), then again with the real host. */
  siteHost?: string | null;
  /** Bump this (e.g. Date.now()) after a successful publish to force the
   * iframe to reload — otherwise the preview keeps showing pre-publish
   * content until the visitor manually refreshes. */
  refreshSignal?: number;
  onPublishClick?: () => void;
  publishing?: boolean;
  publishDisabled?: boolean;
};

const DEVICE_TARGET: Record<DeviceId, number | "fill"> = {
  desktop: "fill",
  tablet: 768,
  mobile: 390,
};

function resolveWidth(device: DeviceId, available: number) {
  const target = DEVICE_TARGET[device];
  if (target === "fill") return Math.max(280, available);
  return Math.min(target, Math.max(280, available));
}

export function SitePreview({
  settings,
  activePage,
  device,
  onDeviceChange,
  previewUrl,
  siteHost,
  refreshSignal,
  onPublishClick,
  publishing,
  publishDisabled,
}: SitePreviewProps) {
  const baseUrl = previewUrl || FALLBACK_PREVIEW_URL;
  // Changing this forces the iframe to remount, which reloads it — a plain
  // iframe.src reassignment doesn't reliably reload in every browser.
  //
  // Derived from both reload triggers rather than synced with an effect: the
  // Refresh button bumps its own counter, and a publish changes refreshSignal.
  // Combining them here means neither needs to write to the other's state.
  const [manualReloads, setManualReloads] = useState(0);
  const reloadNonce = `${manualReloads}.${refreshSignal ?? 0}`;
  const hasReloaded = manualReloads > 0 || refreshSignal !== undefined;

  const page =
    activePage ??
    settings.pages.find((p) => p.type === "home") ??
    settings.pages[0];
  // Hold the iframe until the parent finishes siteHost lookup. Mounting with
  // no __site and then updating src causes two full document navigations.
  const hostReady = siteHost !== undefined;
  // reloadNonce is in the URL, not just the iframe key: without a changing
  // URL the browser may serve its own cached copy of the page, which defeats
  // the point of pressing Refresh after publishing.
  const src = hostReady
    ? (() => {
        const url = new URL(`${baseUrl}${page?.path ?? "/"}`);
        if (siteHost) url.searchParams.set("__site", siteHost);
        if (hasReloaded) url.searchParams.set("__r", reloadNonce);
        return url.toString();
      })()
    : null;

  // The path actually loaded inside the iframe right now, reported by
  // PreviewRouteBeacon (see templates/aurora/components/dev). A cross-origin
  // iframe.contentWindow.location isn't readable at all — postMessage is the
  // only channel the browser allows — so without this the address bar would
  // only ever reflect the sidebar's own page picker, frozen the moment a
  // merchant clicks a link inside the preview itself.
  const [iframePath, setIframePath] = useState<string | null>(null);

  // A page switch from the sidebar is about to force-navigate the iframe
  // elsewhere; drop the last reported path so the bar shows the destination
  // immediately instead of the page being left behind for one render.
  useEffect(() => {
    setIframePath(null);
  }, [page?.path]);

  useEffect(() => {
    let previewOrigin: string;
    try {
      previewOrigin = new URL(baseUrl).origin;
    } catch {
      return;
    }

    function onMessage(event: MessageEvent) {
      if (event.origin !== previewOrigin) return;
      const data = event.data;
      if (
        data &&
        typeof data === "object" &&
        data.source === "softune-preview" &&
        data.type === "route" &&
        typeof data.path === "string"
      ) {
        setIframePath(data.path);
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [baseUrl]);

  // What the address bar shows. Deliberately the clean route without the
  // __site / __r preview params: this is the string the merchant copies into a
  // nav link, and those params must not travel with it.
  const currentUrl = iframePath
    ? `${baseUrl.replace(/\/$/, "")}${iframePath}`
    : page
      ? resolvePageUrl(page, baseUrl)
      : `${baseUrl.replace(/\/$/, "")}/`;

  // Real loading state, driven by the iframe's own load event — not a fake
  // timer. True while waiting for siteHost, while the preview server is
  // fetching/rendering, and for page switches / manual refreshes alike.
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // Stay on the spinner until host is known; then again until onLoad.
    setLoading(true);
  }, [src, reloadNonce]);

  // Aurora no longer has a dark mode, so the chrome stays light. Kept as a
  // constant rather than deleted because DeviceToolbar still takes a tone.
  const chromeTheme: BrowserChromeTheme = "light";
  const stageRef = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(900);

  const widthMv = useMotionValue(900);
  const widthSpring = useSpring(widthMv, {
    stiffness: 260,
    damping: 32,
    mass: 0.85,
  });

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const measure = () => {
      // p-4 on both sides
      const w = Math.max(280, el.clientWidth - 32);
      setAvailable(w);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    widthMv.set(resolveWidth(device, available));
  }, [device, available, widthMv]);

  return (
    <div
      ref={stageRef}
      className="relative flex h-full min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#F0F0F0] p-4"
      style={{
        backgroundImage: "radial-gradient(#d4d4d4 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="flex h-full w-full items-stretch justify-center"
      >
        <motion.div
          style={{ width: widthSpring, maxWidth: "100%" }}
          className="flex h-full flex-col overflow-hidden rounded-2xl bg-white"
        >
          {/* Browser chrome */}
          <div
            className="flex shrink-0 items-center gap-1.5 border-b border-slate-100 bg-[#FAFAFA] px-2.5 py-2 sm:gap-2 sm:px-3"
          >
            <DeviceToolbar
              value={device}
              onChange={onDeviceChange}
              tone={chromeTheme}
              size="sm"
            />

            {/* Click to select the whole URL: this is the real running route,
             * and the merchant is meant to copy it into a nav link's route
             * field — so make that copy one click cheaper. */}
            <button
              type="button"
              title="Click to select, then copy"
              onClick={(e) => {
                const node = e.currentTarget.querySelector("span");
                if (!node) return;
                const range = document.createRange();
                range.selectNodeContents(node);
                const sel = window.getSelection();
                sel?.removeAllRanges();
                sel?.addRange(range);
              }}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-2.5 py-1.5 text-left text-slate-500 ring-1 ring-slate-200/80"
            >
              <span className="truncate text-[11px] sm:text-xs">
                {currentUrl}
              </span>
              {loading ? (
                <span className="ml-auto size-3 shrink-0 animate-spin rounded-full border-[1.5px] border-current border-t-transparent opacity-60" />
              ) : null}
            </button>

            <button
              type="button"
              aria-label="Refresh"
              onClick={() => setManualReloads((n) => n + 1)}
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white hover:text-foreground"
            >
              <RefreshCw
                className={["size-3.5", loading ? "animate-spin" : ""].join(" ")}
                strokeWidth={1.75}
              />
            </button>

            {onPublishClick ? (
              <button
                type="button"
                onClick={onPublishClick}
                disabled={publishing || publishDisabled}
                title={
                  publishDisabled
                    ? "No unpublished changes"
                    : "Publish changes to the live site"
                }
                className="inline-flex h-7 shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-3 text-[11px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Upload className="size-3" strokeWidth={2} />
                {publishing ? "Publishing…" : "Publish"}
              </button>
            ) : null}
          </div>

          <div className="relative min-h-0 flex-1 bg-white">
            {loading || !src ? (
              <div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white"
              >
                <span className="size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                <p className="text-xs font-medium text-slate-500">
                  Loading {settings.siteName || "site"}…
                </p>
              </div>
            ) : null}

            {/* Only mount once siteHost is resolved so the first navigation
             * already carries the correct __site= — avoids the wrong-then-right
             * double load. Page switches / refresh still remount via key. */}
            {src ? (
              <iframe
                key={`${page?.path ?? "/"}-${reloadNonce}`}
                src={src}
                title="Storefront preview"
                onLoad={() => setLoading(false)}
                className="h-full w-full border-0"
              />
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
