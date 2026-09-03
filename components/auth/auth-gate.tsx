"use client";

import { Trash2, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AUTH_EXPIRED_EVENT,
  RecaptchaChallengeRequiredError,
  getToken,
  ingestLeadDemoTokens,
  login,
} from "@/lib/api";
import { getRecaptchaToken, hasV2Fallback } from "@/lib/recaptcha";
import { useToast } from "@/components/ui/toast";
import { MaskIcon } from "@/components/ui/mask-icon";
import { ForgotPasswordModal } from "./forgot-password-modal";
import { LoginOtpForm } from "./login-otp-form";
import { RecaptchaDisclosure } from "./recaptcha-disclosure";
import { RecaptchaV2Fallback, type RecaptchaV2FallbackHandle } from "./recaptcha-v2-fallback";

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
    ingestLeadDemoTokens();
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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [needsChallenge, setNeedsChallenge] = useState(false);
  const [v2Token, setV2Token] = useState<string | null>(null);
  const [loginToken, setLoginToken] = useState<string | null>(null);
  const v2Ref = useRef<RecaptchaV2FallbackHandle>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Light → auth-lite, dark → auth-dark. Default lite before mount (dashboard light default).
  const authImage =
    mounted && resolvedTheme === "dark" ? "/auth-dark.png" : "/auth-lite.png";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const recaptchaToken = await getRecaptchaToken("login");
      const result = await login(
        email,
        password,
        rememberMe,
        recaptchaToken,
        v2Token ?? "",
      );
      if (result.otp_required) {
        setLoginToken(result.login_token);
        setBusy(false);
        return;
      }
      onSuccess();
    } catch (err) {
      if (err instanceof RecaptchaChallengeRequiredError) {
        setNeedsChallenge(true);
        setError(hasV2Fallback ? null : err.message);
      } else {
        setError(err instanceof Error ? err.message : "Login failed");
        v2Ref.current?.reset();
      }
      setBusy(false);
    }
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
        description:
          "Cookies, local storage, and everything else stored by this site have been removed.",
        variant: "success",
      });
    } finally {
      setCleaning(false);
    }
  }

  return (
    <>
      <div className="flex min-h-dvh w-full items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
        <div className="grid w-full min-w-0 max-w-5xl overflow-hidden rounded-2xl bg-surface shadow-[0_20px_50px_-12px_rgba(0,0,0,0.18)] sm:rounded-3xl lg:grid-cols-2">
          {/* Left: form on transparent card surface */}
          <div className="flex min-w-0 flex-col justify-center p-5 sm:p-8 lg:p-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-icon.png"
              alt="Softunebd"
              className="h-10 w-auto object-contain object-left sm:h-11"
            />

            <h1 className="mt-8 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {loginToken ? "Check your email" : "Sign in to dashboard"}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {loginToken
                ? "Enter the 6-digit code we sent. It expires in 10 minutes."
                : "Please enter your credentials to access your store dashboard."}
            </p>

            {loginToken ? (
              <LoginOtpForm
                email={email}
                loginToken={loginToken}
                remember={rememberMe}
                onSuccess={onSuccess}
                onBack={() => {
                  setLoginToken(null);
                  setError(null);
                }}
              />
            ) : (
            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
              <div className="flex flex-col gap-2.5">
                <label
                  htmlFor="login-email"
                  className="text-sm font-medium text-foreground"
                >
                  Email Address
                </label>
                <div className="relative">
                  <MaskIcon
                    src="/sidebar/user.svg"
                    className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
                  />
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoFocus
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 w-full rounded-lg border border-border bg-search-bg pr-4 pl-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted-soft focus:border-primary focus:bg-surface"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <label
                  htmlFor="login-password"
                  className="text-sm font-medium text-foreground"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
                    strokeWidth={2}
                  />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 w-full rounded-lg border border-border bg-search-bg pr-10 pl-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted-soft focus:border-primary focus:bg-surface"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-muted transition-colors hover:text-foreground"
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

              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="size-4 rounded border-border text-primary accent-primary"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {error ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400">
                  {error}
                </div>
              ) : null}

              {needsChallenge && hasV2Fallback ? (
                <RecaptchaV2Fallback ref={v2Ref} onVerify={setV2Token} />
              ) : null}

              <div className="flex flex-col gap-2.5 pt-1">
                <button
                  type="submit"
                  disabled={busy || (needsChallenge && !v2Token)}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-60"
                >
                  {busy ? (
                    <>
                      <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <MaskIcon
                        src="/sidebar/logout.svg"
                        className="size-4 text-white"
                      />
                      Sign in
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCleanAll}
                  disabled={cleaning || busy}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface text-sm font-semibold text-foreground transition-colors hover:bg-search-bg disabled:opacity-50"
                >
                  <Trash2 className="size-4" />
                  {cleaning ? "Clearing..." : "Clear browser data"}
                </button>
              </div>

              <RecaptchaDisclosure />
            </form>
            )}

            <a
              href="mailto:support@softunebd.com"
              className="mt-6 inline-flex items-center gap-2 self-start text-sm text-muted transition-colors hover:text-primary"
            >
              <Mail className="size-4 shrink-0" />
              <span>support@softunebd.com</span>
            </a>
          </div>

          {/* Right: theme art — auth-lite / auth-dark; small gaps top/bottom/right. */}
          <div className="relative hidden min-h-[480px] pt-2.5 pr-2.5 pb-2.5 lg:block">
            <div className="relative size-full overflow-hidden rounded-xl sm:rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={authImage}
                src={authImage}
                alt=""
                className="absolute inset-0 size-full object-cover object-left-top"
              />
            </div>
          </div>
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
