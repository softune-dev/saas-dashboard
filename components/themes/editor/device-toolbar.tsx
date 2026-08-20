"use client";

import { Monitor, Smartphone, Tablet } from "lucide-react";
import { motion } from "motion/react";
import type { DeviceId } from "./editor-types";

const devices: {
  id: DeviceId;
  label: string;
  Icon: typeof Monitor;
}[] = [
  { id: "desktop", label: "Desktop", Icon: Monitor },
  { id: "tablet", label: "Tablet", Icon: Tablet },
  { id: "mobile", label: "Mobile", Icon: Smartphone },
];

type DeviceToolbarProps = {
  value: DeviceId;
  onChange: (device: DeviceId) => void;
  /** Match browser chrome theme */
  tone?: "light" | "dark";
  size?: "sm" | "md";
  /** Small viewport editing the storefront in mobile view — only the Mobile
   * option makes sense there, so Desktop/Tablet are hidden entirely rather
   * than shown-but-pointless. */
  mobileOnly?: boolean;
};

export function DeviceToolbar({
  value,
  onChange,
  tone = "light",
  size = "md",
  mobileOnly = false,
}: DeviceToolbarProps) {
  const dark = tone === "dark";
  const btn = size === "sm" ? "size-7" : "size-8";
  const icon = size === "sm" ? "size-3.5" : "size-4";
  const visibleDevices = mobileOnly
    ? devices.filter((d) => d.id === "mobile")
    : devices;

  return (
    <div
      data-tour="editor-device-toolbar"
      className={[
        "relative inline-flex items-center gap-0.5 rounded-full p-0.5",
        dark ? "bg-surface/10" : "bg-search-bg",
      ].join(" ")}
    >
      {visibleDevices.map(({ id, label, Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            aria-label={label}
            aria-pressed={active}
            onClick={() => onChange(id)}
            className={[
              "relative z-10 inline-flex items-center justify-center rounded-full transition-colors",
              btn,
              active
                ? "text-white"
                : dark
                  ? "text-white/55 hover:text-white"
                  : "text-muted hover:text-foreground",
            ].join(" ")}
          >
            {active ? (
              <motion.span
                layoutId="device-pill"
                className="absolute inset-0 rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            ) : null}
            <Icon className={["relative", icon].join(" ")} strokeWidth={1.75} />
          </button>
        );
      })}
    </div>
  );
}
