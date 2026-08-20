"use client";

import { Trash2, Eye, EyeOff } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { AUTH_EXPIRED_EVENT, getToken, login } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { MaskIcon } from "@/components/ui/mask-icon";
import { ForgotPasswordModal } from "./forgot-password-modal";

/**
 * Blocks the entire dashboard behind a login screen. Nothing here is
 * mock-gated per page — every route lives under this same client boundary,
 * so there is exactly one place that decides "authenticated or not."
 */
export function AuthGate({ children }: { children: ReactNode }) {
  // Starts null (unknown) so the server-rendered shell and the first client
  // render match — token presence can only be checked after mount.
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    setAuthed(!!getToken());
    const onStorage = () => setAuthed(!!getToken());
    // Same-tab session expiry (a 401 that a refresh couldn't recover from) —
    // storage events alone don't fire in the tab that made the change.
    const onExpired = () => setAuthed(false);
    window.addEventListener("storage", onStorage);
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
    };
  }, []);

  if (authed === null) {
    return <div className="h-dvh w-full bg-background" />;
  }

  if (!authed) {
    return <LoginScreen onSuccess={() => setAuthed(true)} />;
  }

  return <>{children}</>;
}

/** Deletes every cookie this page can see. document.cookie only exposes
 * non-httpOnly cookies for the current path/domain — this app doesn't set
 * any httpOnly cookies itself (auth is bearer-token-in-localStorage), so
 * that covers everything real, but it's a JS-level limit worth naming. */
function clearAllCookies() {
  if (typeof document === "undefined") return;
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const name = cookie.split("=")[0]?.trim();
    if (!name) continue;
    // Clear for every path/domain combination a cookie could have been set
    // under — a cookie set with a specific path only expires if the
    // expiring request uses that same path.
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
  }
}

/** Deletes every IndexedDB database this origin owns. Nothing in this app
 * uses IndexedDB directly today, but browser extensions, SWR, or a future
 * feature might — "whatever the browser stores" means not assuming. */
async function clearAllIndexedDb() {
  if (typeof indexedDB === "undefined" || !indexedDB.databases) return;
  try {
    const dbs = await indexedDB.databases();
    await Promise.all(
      dbs
        .filter((db): db is { name: string } => !!db.name)
        .map(
          (db) =>
            new Promise<void>((resolve) => {
              const req = indexedDB.deleteDatabase(db.name);
              req.onsuccess = () => resolve();
              req.onerror = () => resolve();
              req.onblocked = () => resolve();
            }),
        ),
    );
  } catch {
    // Not fatal — localStorage/sessionStorage/cookies are the real target.
  }
}

/** Wipes every client-side trace this origin can reach: localStorage,
 * sessionStorage, cookies, IndexedDB, and the Cache API — a genuine "start
 * over" for whoever's using this browser/machine next, not just a logout. */
async function cleanAllBrowserData(): Promise<void> {
  localStorage.clear();
  sessionStorage.clear();
  clearAllCookies();
  await clearAllIndexedDb();
  if (typeof caches !== "undefined") {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
}

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  const slides = [
    {
      badge: "Real merchant dashboard",
      title: "See exactly what's selling",
      desc: "Real-time orders, revenue, and stock in one place — know where the business stands without digging for it.",
      image: "/auth-slide-dashboard.png"
    },
    {
      badge: "Real storefront theme",
      title: "A store that earns trust",
      desc: "Shoppers buy more from stores that look this good. No designer, no code — just a storefront that sells.",
      image: "/auth-slide-theme.jpg"
    },
    {
      badge: "Real storefront theme",
      title: "Built to grow with you",
      desc: "Start with one category. Scale to twenty. The same store, ready for wherever the business goes next.",
      image: "/auth-slide-bazaar.jpg"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password, rememberMe);
      setExiting(true);
      setTimeout(() => {
        onSuccess();
      }, 550);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setBusy(false);
    }
  }

  function handleForgotPassword() {
    setForgotModalOpen(true);
  }

  async function handleCleanAll() {
    setCleaning(true);
    try {
      await cleanAllBrowserData();
      setEmail("");
      setPassword("");
      setError(null);
      toast({
        title: "Browser data cleared",
        description: "Cookies, local storage, and everything else stored by this site have been removed.",
        variant: "success",
      });
    } finally {
      setCleaning(false);
    }
  }

  return (
    <>
      <div className="relative flex h-dvh w-full items-center justify-center overflow-hidden bg-slate-50 dark:bg-zinc-950 p-4 sm:p-6 lg:p-8">
        <div className="flex h-full w-full max-w-5xl items-center justify-between gap-6 lg:gap-10">
          {/* Left Column: Stacked Image Section (Filled at left, rounded corners, stacked at an angle, slideshow) */}
          <motion.div
            initial={{ x: 0, opacity: 1 }}
            animate={exiting ? { x: "-120%", opacity: 0 } : { x: 0, opacity: 1 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="relative hidden h-full max-h-[680px] w-1/2 lg:block"
          >
            {slides.map((slide, i) => {
              const isActive = i === slideIndex;
              const isNext = i === (slideIndex + 1) % slides.length;

              let zIndex = 10;
              let scale = 0.9;
              let rotate = -4;
              let y = 16;
              let x = -12;
              let opacity = 0.5;

              if (isActive) {
                zIndex = 30;
                scale = 1;
                rotate = -1.5;
                y = 0;
                x = 0;
                opacity = 1;
              } else if (isNext) {
                zIndex = 20;
                scale = 0.95;
                rotate = 3;
                y = 8;
                x = 12;
                opacity = 0.8;
              }

              return (
                <motion.div
                  key={i}
                  animate={{
                    zIndex,
                    scale,
                    rotate,
                    y,
                    x,
                    opacity,
                  }}
                  transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-3xl border border-border/60 shadow-lg p-8 bg-surface"
                >
                  {/* Background Image - Filled */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="absolute inset-0 size-full object-cover"
                  />

                  {/* Dark Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Top Brand Tag */}
                  <div className="relative z-10 flex items-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-3.5 py-1.5 backdrop-blur-md">
                      <span className="size-2 rounded-full bg-primary" />
                      <span className="text-xs font-medium text-white">{slide.badge}</span>
                    </div>
                  </div>

                  {/* Bottom Simple Overlay Text (Concise, max-weight medium) */}
                  <div className="relative z-10 flex flex-col gap-2">
                    <h2 className="font-serif text-2xl font-medium leading-tight text-white xl:text-3xl">
                      {slide.title}
                    </h2>
                    <p className="text-xs font-normal leading-relaxed text-slate-200">
                      {slide.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Right Column: Form Section (White Background) */}
          <motion.div
            initial={{ x: 0, opacity: 1 }}
            animate={exiting ? { x: "120%", opacity: 0 } : { x: 0, opacity: 1 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="flex h-full w-full flex-col justify-center max-h-[680px] lg:w-1/2 rounded-3xl border border-border/60 bg-white p-6 sm:p-10 md:p-12 shadow-xl dark:bg-zinc-900"
          >
            <div className="mx-auto w-full max-w-sm space-y-6">
              {/* Header with Rounded Primary BG & White Softune Logo */}
              <div>
                <div className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-primary p-2.5 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo.svg"
                    alt="Softune Logo"
                    className="size-full object-contain brightness-0 invert"
                  />
                </div>
                <h1 className="font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
                  Sign in to dashboard
                </h1>
                <p className="mt-1.5 text-xs font-normal text-muted">
                  Please enter your credentials to access your store dashboard.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Input using Public Sidebar Icon */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Email Address
                  </label>
                  <div className="relative">
                    <MaskIcon
                      src="/sidebar/account.svg"
                      className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
                    />
                    <input
                      type="email"
                      required
                      autoFocus
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 w-full rounded-xl border border-border bg-search-bg pl-10 pr-4 text-sm font-normal text-foreground outline-none transition-colors placeholder:text-muted-soft focus:border-primary focus:bg-surface"
                    />
                  </div>
                </div>

                {/* Password Input using Public Sidebar Icon */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <MaskIcon
                      src="/sidebar/lock.svg"
                      className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 w-full rounded-xl border border-border bg-search-bg pl-10 pr-10 text-sm font-normal text-foreground outline-none transition-colors placeholder:text-muted-soft focus:border-primary focus:bg-surface"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted transition-colors hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Options: Remember Me & Forgot Password */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex cursor-pointer select-none items-center gap-2 text-xs font-normal text-muted">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="size-4 rounded border-border text-primary accent-primary focus:ring-primary/20"
                    />
                    Remember me for 30 days
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs font-medium text-primary transition-colors hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Error Message */}
                {error ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400">
                    {error}
                  </div>
                ) : null}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={busy || exiting}
                  className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-white shadow-sm transition-all hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                >
                  {busy ? (
                    <>
                      <div className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : exiting ? (
                    <span>Opening dashboard...</span>
                  ) : (
                    <span>Sign in</span>
                  )}
                </button>
              </form>

              {/* Clear browser data trigger */}
              <div className="border-t border-border/60 pt-4 text-center">
                <button
                  type="button"
                  onClick={handleCleanAll}
                  disabled={cleaning || busy || exiting}
                  className="inline-flex items-center gap-1.5 text-xs font-normal text-muted transition-colors hover:text-rose-500 disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" />
                  {cleaning ? "Clearing browser storage..." : "Clear browser data & reset cache"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <ForgotPasswordModal
        open={forgotModalOpen}
        initialEmail={email}
        onClose={() => setForgotModalOpen(false)}
      />
    </>
  );
}
