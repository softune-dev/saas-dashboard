"use client";

import { ArrowUpRight, Check, ChevronDown, Plus, Repeat, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { useSession } from "@/components/providers/session-provider";
import { getThemeById } from "@/components/themes/themes-data";
import { clearToken, listTemplates, resolveSiteLogoUrl } from "@/lib/api";
import { useSiteSettingsSWR } from "@/lib/api/site-settings";
import { MaskIcon } from "@/components/ui/mask-icon";
import {
  logoutItem,
  menuItems,
  settingsItems,
  type NavItem,
} from "@/components/layout/sidebar/nav-config";
import {
  keepCurrentAccountLinked,
  listLinkedAccounts,
  MAX_LINKED_ACCOUNTS,
  removeLinkedAccount,
  switchToAccount,
  type LinkedAccount,
} from "@/lib/linked-accounts";
import { displayStorefrontHost } from "@/lib/format";
import { AccountSwitchOverlay } from "./account-switch-overlay";
import { AddAccountModal } from "./add-account-modal";
import { SetupProgressRing } from "./setup-progress-ring";
import { TrialBadge } from "./trial-badge";

/** Quick jumps in the user menu — same icons/hrefs as the sidebar. */
const QUICK_LINKS: NavItem[] = [
  menuItems.find((i) => i.href === "/products")!,
  menuItems.find((i) => i.href === "/orders")!,
  menuItems.find((i) => i.href === "/customers")!,
  menuItems.find((i) => i.href === "/themes")!,
  settingsItems.find((i) => i.href === "/settings/site")!,
  settingsItems.find((i) => i.href === "/settings/account")!,
  settingsItems.find((i) => i.href === "/settings/billing")!,
].filter(Boolean);

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function StorePill() {
  const pathname = usePathname();
  const { me, sites, currentSite, setCurrentSiteId, loading } = useSession();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Close when the route changes (link click inside menu).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const title = loading
    ? "Loading…"
    : (currentSite?.name ?? me?.tenant.name ?? "No site yet");
  const subtitle = loading
    ? ""
    : (me?.user.full_name ?? me?.user.email ?? "");
  // The account menu shows the SIGNED-IN USER's avatar, not the shop's logo
  // — this is "who am I", the shop logo already lives in the sidebar/theme
  // editor. avatar_url is never empty in practice (session-provider assigns
  // a random preset the first time `me` loads with none set).
  const avatarUrl = me?.user.avatar_url ?? null;

  // Same shop URL rules as the My Shop panel — published domain when live,
  // otherwise the template preview with ?__site= for drafts.
  const { data: templates } = useSWR("templates", listTemplates);
  const templateKey = templates?.find(
    (t) => t.id === currentSite?.template_id,
  )?.key;
  const theme = templateKey ? getThemeById(templateKey) : undefined;
  const host = currentSite?.custom_domain || currentSite?.subdomain;
  const displayHost = displayStorefrontHost(currentSite);
  const realShopUrl =
    currentSite?.status === "published" && displayHost
      ? `https://${displayHost}`
      : null;
  const shopUrl =
    realShopUrl ??
    (theme?.previewUrl && host ? `${theme.previewUrl}?__site=${host}` : null);

  const displayName = me?.user.full_name?.trim() || "";
  const email = me?.user.email?.trim() || "";

  // Setup completeness — three groups, matching where each is actually
  // edited (Account -> Profile, Account -> Business, Site Settings ->
  // Contact). Each counts as done only once its core fields are filled;
  // partial credit within a group would make the ring meaningless.
  const { data: siteSettings } = useSiteSettingsSWR(currentSite?.id ?? null);
  const profileDone = !!(me?.user.full_name && me?.user.phone);
  const businessDone = !!(
    me?.tenant.business.legal_name && me?.tenant.business.billing_email
  );
  const storeDone = !!(
    siteSettings?.business.phone && siteSettings?.business.address?.city
  );
  const setupSteps = [profileDone, businessDone, storeDone];
  const setupCompleted = setupSteps.filter(Boolean).length;

  function handleLogout() {
    clearToken();
    setOpen(false);
    window.location.href = "/";
  }

  // ---------------------------------------------------------------------
  // Account switcher — see lib/linked-accounts.ts. Never touches passwords;
  // only ever holds token pairs a real login/refresh already returned.
  // ---------------------------------------------------------------------
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [switchingLabel, setSwitchingLabel] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setLinkedAccounts(listLinkedAccounts());
  }, [open]);

  const otherAccounts = linkedAccounts.filter((a) => a.userId !== me?.user.id);
  const atAccountLimit = 1 + otherAccounts.length >= MAX_LINKED_ACCOUNTS;

  // Shop logo, not the user's avatar — two of this person's own stores can
  // easily share the same name/photo, but never the same shop identity.
  // Same helper the "My Shop" panel uses (shop-info-panel.tsx's ShopAvatar),
  // so the switcher's circle matches its size/colors exactly, not an
  // independent (and, first time round, incomplete) guess at logo lookup.
  const currentShopLogo = resolveSiteLogoUrl(currentSite);

  function currentAsLinked() {
    if (!me) return null;
    return {
      userId: me.user.id,
      tenantId: me.user.tenant_id,
      email: me.user.email,
      fullName: me.user.full_name || "",
      avatarUrl: me.user.avatar_url,
      siteName: me.tenant.name,
      logoUrl: currentShopLogo,
    };
  }

  async function handleSwitchAccount(account: LinkedAccount) {
    setSwitchError(null);
    setSwitchingLabel(account.fullName || account.email);
    try {
      const current = currentAsLinked();
      if (current) keepCurrentAccountLinked(current);
      await switchToAccount(account.userId);
      // Hard reload, not a client nav — the only way to guarantee nothing
      // from the old tenant (cached lists, editor drafts, component state)
      // survives into the new session.
      window.location.href = "/";
    } catch (err) {
      setSwitchingLabel(null);
      setSwitchError(err instanceof Error ? err.message : "Couldn't switch accounts");
    }
  }

  async function handleRemoveLinkedAccount(e: React.MouseEvent, userId: string) {
    e.stopPropagation();
    await removeLinkedAccount(userId);
    setLinkedAccounts(listLinkedAccounts());
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex max-w-[11.5rem] shrink-0 items-center gap-2 rounded-full bg-border py-1.5 pr-1.5 pl-1.5 transition-opacity hover:opacity-90 md:max-w-[13rem] md:gap-2.5 md:pr-3"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu: ${title}${subtitle ? ` — ${subtitle}` : ""}`}
      >
        {avatarUrl ? (
          // A real photo/preset avatar is meant to fill the circle, unlike a
          // shop logo — object-cover, no inset padding.
          <span className="relative size-9 shrink-0 overflow-hidden rounded-full bg-border">
            <Image
              src={avatarUrl}
              alt=""
              fill
              className="object-cover"
              sizes="36px"
              unoptimized
            />
          </span>
        ) : (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-store text-white">
            <MaskIcon src="/sidebar/account.svg" className="size-4" />
          </span>
        )}

        {/* Name/email hidden below md so the mobile header stays avatar-only. */}
        <span className="hidden min-w-0 flex-col items-start text-left leading-tight md:flex">
          <span className="w-full max-w-[6.5rem] truncate text-sm font-semibold text-foreground">
            {title}
          </span>
          {subtitle ? (
            <span className="w-full max-w-[6.5rem] truncate text-[11px] font-medium text-muted">
              {subtitle}
            </span>
          ) : null}
        </span>

        <ChevronDown
          className={[
            "hidden size-4 shrink-0 text-muted transition-transform md:block",
            open ? "rotate-180" : "",
          ].join(" ")}
          strokeWidth={1.75}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="menu"
          // right-0 keeps the panel inside the viewport — left-0 was growing
          // past the page edge and expanding horizontal scroll.
          className="absolute top-full right-0 z-50 mt-2 w-[min(17.5rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-border bg-surface"
        >
          {/* Account header — email once; site host + open-shop arrow under it */}
          <div className="border-b border-border dark:border-transparent px-3.5 py-3">
            <div className="flex items-center gap-2.5">
              {setupCompleted < setupSteps.length ? (
                <Link
                  href="/settings/account"
                  onClick={() => setOpen(false)}
                  aria-label={`Account setup ${setupCompleted} of ${setupSteps.length} complete`}
                  className="relative shrink-0 text-muted transition-colors hover:text-primary"
                >
                  <SetupProgressRing completedSteps={setupCompleted} totalSteps={setupSteps.length} />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
                    {Math.round((setupCompleted / setupSteps.length) * 100)}
                  </span>
                </Link>
              ) : null}
              <div className="min-w-0 flex-1">
                {displayName ? (
                  <p className="truncate text-sm font-semibold text-foreground">
                    {displayName}
                  </p>
                ) : null}
                {email ? (
                  <p
                    className={[
                      "truncate",
                      displayName
                        ? "mt-0.5 text-xs text-muted"
                        : "text-sm font-semibold text-foreground",
                    ].join(" ")}
                  >
                    {email}
                  </p>
                ) : !displayName ? (
                  <p className="truncate text-sm font-semibold text-foreground">
                    Account
                  </p>
                ) : null}
              </div>
            </div>
            {currentSite ? (
              <div className="mt-2 flex min-w-0 items-center gap-2">
                <MaskIcon
                  src="/sidebar/domain.svg"
                  className="size-4 shrink-0 text-muted"
                />
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                  {displayHost ?? "No domain yet"}
                </p>
                {shopUrl ? (
                  <a
                    href={shopUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open shop in a new tab"
                    onClick={() => setOpen(false)}
                    className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg hover:text-primary"
                  >
                    <ArrowUpRight className="size-3.5" strokeWidth={2} />
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Trial countdown — the header itself hides this below md for
              lack of room (see Header's own comment), so it shows here
              instead on small screens. Redundant (and hidden) at md+,
              where the header already has it. Gated on plan === "trial"
              here too (not just inside TrialBadge) so this row's own
              border/padding don't render as an empty strip for every
              other plan. */}
          {me?.tenant.plan === "trial" ? (
            <div className="border-b border-border px-3.5 py-2.5 md:hidden dark:border-transparent">
              <TrialBadge className="w-full justify-center" />
            </div>
          ) : null}

          {/* Account switcher — current account plus any others linked in
              this browser, and a "+" to add one. Switching never logs out;
              see lib/linked-accounts.ts. */}
          <div className="border-b border-border dark:border-transparent p-1.5">
            <p className="px-2 py-1.5 text-[10px] font-semibold tracking-wide text-muted-soft uppercase">
              Accounts
            </p>
            <div className="flex flex-wrap items-center gap-2 px-2 pb-1.5">
              {/* Same size/colors as the "My Shop" panel's ShopAvatar
                  (shop-info-panel.tsx): size-9, white circle + object-contain
                  for a real logo (logos are rarely 1:1 — cropping with
                  object-cover cuts marks off), bg-store + shop-bag icon
                  when there isn't one. The extra ring here is just this
                  account being the active one, layered on top. */}
              <span
                title={`${title} (current)`}
                className="relative flex size-9 shrink-0 items-center justify-center rounded-full ring-2 ring-neutral-900 dark:ring-neutral-100"
              >
                {currentShopLogo ? (
                  <span className="relative size-full overflow-hidden rounded-full bg-white">
                    <Image
                      src={currentShopLogo}
                      alt=""
                      fill
                      className="object-contain p-1.5"
                      sizes="36px"
                      unoptimized
                    />
                  </span>
                ) : (
                  <span className="flex size-full items-center justify-center rounded-full bg-store text-white">
                    <MaskIcon src="/sidebar/shop-bag.svg" className="size-4" />
                  </span>
                )}
              </span>

              {otherAccounts.map((account) => (
                <button
                  key={account.userId}
                  type="button"
                  title={`Switch to ${account.siteName || account.email}`}
                  onClick={() => handleSwitchAccount(account)}
                  className="group relative flex size-9 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-90"
                >
                  {/* overflow-hidden lives on this INNER wrapper, not the
                      button itself — the remove badge below sits partially
                      outside the circle and would get clipped by the same
                      overflow rule that keeps the logo image round. */}
                  <span className="absolute inset-0 overflow-hidden rounded-full bg-white">
                    {account.logoUrl ? (
                      <Image
                        src={account.logoUrl}
                        alt=""
                        fill
                        className="object-contain p-1.5"
                        sizes="36px"
                        unoptimized
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center bg-store text-xs font-semibold text-white uppercase">
                        {(account.siteName || account.email).slice(0, 1)}
                      </span>
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <Repeat className="size-4 text-white" strokeWidth={2} />
                    </span>
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Remove ${account.email}`}
                    onClick={(e) => handleRemoveLinkedAccount(e, account.userId)}
                    className="absolute -top-1 -right-1 z-10 flex size-4 items-center justify-center rounded-full bg-surface text-muted-soft opacity-0 ring-1 ring-border transition-opacity group-hover:opacity-100 hover:text-red-500"
                  >
                    <X className="size-2.5" strokeWidth={2.5} />
                  </span>
                </button>
              ))}

              {!atAccountLimit ? (
                <button
                  type="button"
                  onClick={() => setAddAccountOpen(true)}
                  aria-label="Add another account"
                  title="Add another account"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-muted-soft transition-colors hover:border-primary hover:text-primary"
                >
                  <Plus className="size-4" strokeWidth={2} />
                </button>
              ) : null}
            </div>
            {atAccountLimit ? (
              <p className="px-2 pb-1 text-xs text-muted-soft">
                Up to {MAX_LINKED_ACCOUNTS} accounts — remove one to add another.
              </p>
            ) : null}
            {switchError ? (
              <p className="px-2 pb-1 text-xs text-red-600">{switchError}</p>
            ) : null}
          </div>

          {/* Site switcher */}
          {sites.length > 1 ? (
            <div className="border-b border-border dark:border-transparent p-1.5">
              <p className="px-2 py-1.5 text-[10px] font-semibold tracking-wide text-muted-soft uppercase">
                Switch site
              </p>
              <div className="max-h-36 overflow-y-auto">
                {sites.map((site) => {
                  const active = site.id === currentSite?.id;
                  return (
                    <button
                      key={site.id}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setCurrentSiteId(site.id);
                        setOpen(false);
                      }}
                      className={[
                        "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                        active
                          ? "bg-search-bg font-medium text-foreground"
                          : "text-foreground hover:bg-search-bg",
                      ].join(" ")}
                    >
                      <span className="min-w-0 flex-1 truncate">{site.name}</span>
                      {active ? (
                        <Check
                          className="size-3.5 shrink-0 text-primary"
                          strokeWidth={2.5}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Quick links — sidebar icons */}
          <div className="p-1.5">
            <p className="px-2 py-1.5 text-[10px] font-semibold tracking-wide text-muted-soft uppercase">
              Quick access
            </p>
            {QUICK_LINKS.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={[
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-foreground hover:bg-search-bg",
                  ].join(" ")}
                >
                  <MaskIcon src={item.icon} className="size-4" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Logout */}
          <div className="border-t border-border dark:border-transparent p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
            >
              <MaskIcon src={logoutItem.icon} className="size-4" />
              <span>{logoutItem.label}</span>
            </button>
          </div>
        </div>
      ) : null}

      <AddAccountModal
        open={addAccountOpen}
        onAdded={() => {
          setAddAccountOpen(false);
          setLinkedAccounts(listLinkedAccounts());
        }}
        onDismiss={() => setAddAccountOpen(false)}
      />
      {switchingLabel ? (
        <AccountSwitchOverlay label={`Switching to ${switchingLabel}…`} />
      ) : null}
    </div>
  );
}
