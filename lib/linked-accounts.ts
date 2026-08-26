/**
 * Multi-account switcher — lets one browser hold several logged-in accounts
 * (e.g. two different stores bought under different logins) and jump
 * between them without a manual logout/login round trip.
 *
 * SECURITY RULE, non-negotiable: a password is never stored here, only the
 * token pair a real /auth/login or /auth/refresh call already handed back.
 * That's the same thing a single active session already keeps in
 * localStorage (see lib/api.ts) — this just keeps more than one at a time.
 * Switching always exchanges the stored refresh token for a fresh pair via
 * /auth/refresh (the same call api.ts's silent-refresh already trusts),
 * never reuses a possibly-stale access token directly.
 */
import { API_URL, RecaptchaChallengeRequiredError, getRefreshToken, getToken, setTokens } from "./api";

const KEY = "softune.auth.linkedAccounts";

/** Two accounts can easily share the same person's name/photo (one owner,
 * two stores) — the shop's own logo is what actually tells them apart in
 * the switcher, not the user's avatar. */
export type LinkedAccount = {
  userId: string;
  tenantId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  siteName: string;
  logoUrl: string | null;
  accessToken: string;
  refreshToken: string;
};

/** One browser is only meant to juggle a handful of stores at once — past
 * this, the switcher itself becomes the thing that's hard to navigate. */
export const MAX_LINKED_ACCOUNTS = 3;

function readAll(): LinkedAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LinkedAccount[]) : [];
  } catch {
    return [];
  }
}

function writeAll(list: LinkedAccount[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

function upsert(account: LinkedAccount) {
  writeAll([...readAll().filter((a) => a.userId !== account.userId), account]);
}

export function listLinkedAccounts(): LinkedAccount[] {
  return readAll();
}

/** Local removal only — see removeLinkedAccount for the version that also
 * revokes the account's tokens server-side. */
function forget(userId: string) {
  writeAll(readAll().filter((a) => a.userId !== userId));
}

type TokenPair = { access_token: string; refresh_token: string };
type MeOut = {
  user: {
    id: string;
    tenant_id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  tenant: { name: string };
};
type SitesPage = {
  items: {
    theme?: Record<string, unknown>;
    business?: Record<string, unknown>;
  }[];
};

/** Best-effort: the shop's own logo, not the user's avatar — is what
 * actually tells two of this person's stores apart in the switcher. Same
 * precedence as lib/api.ts's resolveSiteLogoUrl (theme brand image, then
 * business.logo_url) so the switcher's circle matches the "My Shop" panel
 * exactly instead of an independent, incomplete guess. Never blocks adding
 * the account if this fails; falls back to the generic shop-bag icon. */
async function fetchShopLogo(accessToken: string): Promise<string | null> {
  try {
    const page = await raw<SitesPage>("/sites?limit=1", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const site = page.items[0];
    if (!site) return null;
    const theme = site.theme ?? {};
    const logoType = theme.logoType;
    const logoImage = typeof theme.logoImage === "string" ? theme.logoImage.trim() : "";
    if (logoImage && (logoType === "image" || /^https?:\/\//i.test(logoImage))) {
      return logoImage;
    }
    const businessLogo = site.business?.logo_url;
    if (typeof businessLogo === "string" && businessLogo.trim()) {
      return businessLogo.trim();
    }
    return null;
  } catch {
    return null;
  }
}

/** Raw fetch, deliberately not lib/api.ts's request() — that helper always
 * signs with the CURRENTLY ACTIVE session's token and silently refreshes it
 * on a 401, neither of which is safe to trigger while logging in or
 * refreshing a DIFFERENT, not-yet-active account. */
async function raw<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = body.detail;
    if (detail && typeof detail === "object" && detail.code === "recaptcha_challenge_required") {
      throw new RecaptchaChallengeRequiredError(detail.message || "Additional verification required.");
    }
    const message = typeof detail === "string" ? detail : detail?.message;
    throw new Error(message || `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function toAccount(me: MeOut, tokens: TokenPair, logoUrl: string | null): LinkedAccount {
  return {
    userId: me.user.id,
    tenantId: me.user.tenant_id,
    email: me.user.email,
    fullName: me.user.full_name || "",
    avatarUrl: me.user.avatar_url,
    siteName: me.tenant.name,
    logoUrl,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
  };
}

/** "Add account" — a real login for a SECOND account, never touching the
 * currently active session's tokens. The MAX_LINKED_ACCOUNTS cap (current
 * session included) is enforced by the caller hiding the "+" button —
 * store-pill.tsx is the one place that actually knows which account is
 * "current" and isn't in this stored list until it's switched away from. */
export async function addLinkedAccount(
  email: string,
  password: string,
  recaptchaToken: string = "",
  recaptchaV2Token: string = "",
): Promise<LinkedAccount> {
  const tokens = await raw<TokenPair>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      recaptcha_token: recaptchaToken,
      recaptcha_v2_token: recaptchaV2Token,
    }),
  });
  const [me, logoUrl] = await Promise.all([
    raw<MeOut>("/auth/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    }),
    fetchShopLogo(tokens.access_token),
  ]);
  const account = toAccount(me, tokens, logoUrl);
  upsert(account);
  return account;
}

/** Save the CURRENTLY ACTIVE session into the linked list under its own
 * slot, so switching away from it and back later doesn't need a fresh
 * login. Call this right before switching to somewhere else. */
export function keepCurrentAccountLinked(current: {
  userId: string;
  tenantId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  siteName: string;
  logoUrl: string | null;
}) {
  const accessToken = getToken();
  const refreshToken = getRefreshToken();
  if (!accessToken || !refreshToken) return;
  upsert({ ...current, accessToken, refreshToken });
}

/** Makes a linked account the active session. Always exchanges its stored
 * refresh token for a fresh pair first — same "does this account still
 * exist and is it still active" check /auth/refresh always performs,
 * rather than trusting a stored access token that may have expired or been
 * revoked (e.g. a password change on that account since it was linked). */
export async function switchToAccount(userId: string): Promise<void> {
  const target = readAll().find((a) => a.userId === userId);
  if (!target) {
    throw new Error("That account isn't linked here anymore — add it again.");
  }
  const fresh = await raw<TokenPair>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: target.refreshToken }),
  });
  upsert({ ...target, accessToken: fresh.access_token, refreshToken: fresh.refresh_token });
  setTokens(fresh.access_token, fresh.refresh_token, true);
}

/** Removes a linked account, revoking its tokens server-side first (not
 * just forgetting it locally) — a stolen copy of localStorage shouldn't be
 * able to resurrect an account the merchant explicitly removed here. */
export async function removeLinkedAccount(userId: string): Promise<void> {
  const target = readAll().find((a) => a.userId === userId);
  forget(userId);
  if (!target) return;
  try {
    await raw("/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${target.accessToken}` },
      body: JSON.stringify({ refresh_token: target.refreshToken }),
    });
  } catch {
    // Best-effort: the account is already forgotten locally either way, and
    // an expired/already-invalid token has nothing left to revoke.
  }
}
