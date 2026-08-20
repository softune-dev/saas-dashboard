import type { ButtonHTMLAttributes, ReactNode } from "react";

type OutlineButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function OutlineButton({
  children,
  className = "",
  type = "button",
  ...props
}: OutlineButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-slate-300 disabled:opacity-50",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
