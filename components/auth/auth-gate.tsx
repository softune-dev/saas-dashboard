"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { AUTH_EXPIRED_EVENT, getToken, login } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

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
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
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
        description: "Cookies, local storage, and everything else stored by this site have been removed.",
        variant: "success",
      });
    } finally {
      setCleaning(false);
    }
  }

  return (
    <div className="flex h-dvh w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-md bg-surface p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-foreground">
          Sign in to Softune
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Enter your account to access the dashboard.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
          <input
            type="email"
            required
            autoFocus
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 w-full rounded-full border border-border bg-surface px-4 text-sm outline-none focus:border-primary"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-10 w-full rounded-full border border-border bg-surface px-4 text-sm outline-none focus:border-primary"
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="mt-1 inline-flex h-10 w-full items-center justify-center rounded-full bg-primary text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleCleanAll}
          disabled={cleaning}
          className="mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full text-xs font-medium text-slate-400 transition-colors hover:text-red-500 disabled:opacity-60"
        >
          <Trash2 className="size-3.5" strokeWidth={1.75} />
          {cleaning ? "Clearing browser data…" : "Clean all browser data"}
        </button>
      </div>
    </div>
  );
}
