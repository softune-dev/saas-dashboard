"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type ThemeToggleProps = {
  className?: string;
  /** `sm` = compact header; `lg` = larger control (mobile sidebar). */
  size?: "sm" | "lg";
};

/** Header / drawer dark-mode switch — absolute thumb, no dead track space. */
export function ThemeToggle({
  className = "ml-2",
  size = "sm",
}: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const isLg = size === "lg";
  const thumb = isLg ? "size-7" : "size-6";
  // Thumb diameter: lg 1.75rem, sm 1.5rem — keep 2px inset from the track edge.
  const thumbLeft = isDark
    ? isLg
      ? "left-[calc(100%-0.125rem-1.75rem)]"
      : "left-[calc(100%-0.125rem-1.5rem)]"
    : "left-0.5";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      disabled={!mounted}
      onClick={() => {
        if (typeof document !== "undefined" && (document as any).startViewTransition) {
          (document as any).startViewTransition(() => {
            setTheme(isDark ? "light" : "dark");
          });
        } else {
          setTheme(isDark ? "light" : "dark");
        }
      }}
      className={[
        "relative shrink-0 rounded-full transition-colors duration-300",
        isLg ? "h-8 w-14" : "h-7 w-11",
        isDark ? "bg-primary" : "bg-border",
        className,
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-0.5 flex items-center justify-center rounded-full bg-white text-foreground shadow-sm transition-[left] duration-300",
          thumb,
          thumbLeft,
        ].join(" ")}
      >
        <Moon
          className={[
            "absolute size-3.5 text-primary transition-all duration-300",
            isDark ? "scale-100 opacity-100 rotate-0" : "scale-50 opacity-0 -rotate-90",
          ].join(" ")}
          strokeWidth={2}
          aria-hidden
        />
        <Sun
          className={[
            "absolute size-3.5 text-muted transition-all duration-300",
            isDark ? "scale-50 opacity-0 rotate-90" : "scale-100 opacity-100 rotate-0",
          ].join(" ")}
          strokeWidth={2}
          aria-hidden
        />
      </span>
    </button>
  );
}
