"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type ThemeToggleProps = {
  className?: string;
};

/** Header dark-mode switch — Sun/Moon, same sliding-thumb pattern as
 * account notification toggles. */
export function ThemeToggle({ className = "ml-2.5" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

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
        "relative flex w-[4.25rem] shrink-0 items-center rounded-full px-1.5 py-1.5 transition-colors duration-300",
        isDark ? "bg-primary" : "bg-border",
        className,
      ].join(" ")}
    >
      <span
        className={[
          "relative flex size-8 items-center justify-center rounded-full bg-[#ffffff] text-foreground shadow-sm transition-transform duration-300",
          isDark ? "translate-x-6" : "translate-x-0",
        ].join(" ")}
      >
        <Moon
          className={[
            "absolute size-4 text-primary transition-all duration-300",
            isDark ? "scale-100 opacity-100 rotate-0" : "scale-50 opacity-0 -rotate-90",
          ].join(" ")}
          strokeWidth={2}
          aria-hidden
        />
        <Sun
          className={[
            "absolute size-4 text-muted transition-all duration-300",
            isDark ? "scale-50 opacity-0 rotate-90" : "scale-100 opacity-100 rotate-0",
          ].join(" ")}
          strokeWidth={2}
          aria-hidden
        />
      </span>
    </button>
  );
}
