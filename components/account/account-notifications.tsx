"use client";

import { useEffect, useState } from "react";
import { updateTenantNotifications, type TenantNotificationPrefs } from "@/lib/api";
import { useSession } from "@/components/providers/session-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { SettingsActions } from "@/components/settings/site/ui/settings-actions";
import { useToast } from "@/components/ui/toast";

const TOGGLES: { id: keyof TenantNotificationPrefs; label: string; description: string }[] = [
  {
    id: "orders",
    label: "New orders",
    description: "Email when a customer places an order",
  },
  {
    id: "low_stock",
    label: "Low stock alerts",
    description: "Notify when product stock is low",
  },
  {
    id: "billing",
    label: "Billing & invoices",
    description: "Subscription renewals and payment receipts",
  },
  {
    id: "marketing",
    label: "Product tips",
    description: "Occasional Softunebd product updates",
  },
];

const FALLBACK: TenantNotificationPrefs = {
  orders: true,
  low_stock: true,
  billing: true,
  marketing: false,
};

export function AccountNotifications() {
  const { me, refetch } = useSession();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<TenantNotificationPrefs>(
    me?.tenant.notifications ?? FALLBACK,
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (me?.tenant.notifications) setPrefs(me.tenant.notifications);
  }, [me?.tenant.notifications]);

  function flip(id: keyof TenantNotificationPrefs) {
    setPrefs((p) => ({ ...p, [id]: !p[id] }));
  }

  async function handleSave() {
    if (busy) return;
    setBusy(true);
    try {
      await updateTenantNotifications(prefs);
      await refetch();
      toast({ title: "Notification preferences saved", variant: "success" });
    } catch (err) {
      toast({
        title: "Couldn't save preferences",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-md bg-surface p-4 sm:p-5">
      <h2 className="mb-4 text-base font-semibold text-foreground">
        {t("Notifications")}
      </h2>

      <ul className="flex flex-col gap-3">
        {TOGGLES.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-4 rounded-md border border-border px-3 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {t(item.label)}
              </p>
              <p className="mt-0.5 text-xs text-muted">{t(item.description)}</p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={prefs[item.id]}
              onClick={() => flip(item.id)}
              className={[
                "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                prefs[item.id] ? "bg-primary" : "bg-border",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute top-0.5 left-0.5 size-5 rounded-full bg-[#ffffff] transition-transform",
                  prefs[item.id] ? "translate-x-5" : "translate-x-0",
                ].join(" ")}
              />
            </button>
          </li>
        ))}
      </ul>

      <SettingsActions
        saveLabel={busy ? "Saving…" : t("Save preferences")}
        onSave={handleSave}
      />
    </section>
  );
}
