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
};

export function DeviceToolbar({
  value,
  onChange,
  tone = "light",
  size = "md",
}: DeviceToolbarProps) {
  const dark = tone === "dark";
  const btn = size === "sm" ? "size-7" : "size-8";
  const icon = size === "sm" ? "size-3.5" : "size-4";

  return (
    <div
      className={[
        "relative inline-flex items-center gap-0.5 rounded-full p-0.5",
        dark ? "bg-white/10" : "bg-search-bg",
      ].join(" ")}
    >
      {devices.map(({ id, label, Icon }) => {
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
                  : "text-slate-500 hover:text-foreground",
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
