"use client";

import { useState } from "react";
import { SettingsActions } from "@/components/settings/site/ui/settings-actions";

type Toggle = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
};

const initialToggles: Toggle[] = [
  {
    id: "orders",
    label: "New orders",
    description: "Email when a customer places an order",
    enabled: true,
  },
  {
    id: "low-stock",
    label: "Low stock alerts",
    description: "Notify when product stock is low",
    enabled: true,
  },
  {
    id: "billing",
    label: "Billing & invoices",
    description: "Subscription renewals and payment receipts",
    enabled: true,
  },
  {
    id: "marketing",
    label: "Product tips",
    description: "Occasional Softune product updates",
    enabled: false,
  },
];

export function AccountNotifications() {
  const [toggles, setToggles] = useState(initialToggles);

  function flip(id: string) {
    setToggles((list) =>
      list.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)),
    );
  }

  return (
    <section className="rounded-md bg-surface p-4 sm:p-5">
      <h2 className="mb-4 text-base font-semibold text-foreground">
        Notifications
      </h2>

      <ul className="flex flex-col gap-3">
        {toggles.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-4 rounded-md border border-border px-3 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {item.label}
              </p>
              <p className="mt-0.5 text-xs text-muted">{item.description}</p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={item.enabled}
              onClick={() => flip(item.id)}
              className={[
                "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                item.enabled ? "bg-primary" : "bg-border",
              ].join(" ")}
            >
              <span
                className={[
                  // Thumb stays white in both themes for contrast on the track.
                  "absolute top-0.5 left-0.5 size-5 rounded-full bg-[#ffffff] transition-transform",
                  item.enabled ? "translate-x-5" : "translate-x-0",
                ].join(" ")}
              />
            </button>
          </li>
        ))}
      </ul>

      <SettingsActions saveLabel="Save preferences" />
    </section>
  );
}
