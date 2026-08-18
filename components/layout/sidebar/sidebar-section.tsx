import type { ReactNode } from "react";

type SidebarSectionProps = {
  title: string;
  children: ReactNode;
};

export function SidebarSection({ title, children }: SidebarSectionProps) {
  return (
    <div className="flex flex-col gap-1">
      <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-muted-soft uppercase">
        {title}
      </p>
      <nav className="flex flex-col gap-0.5" aria-label={title}>
        {children}
      </nav>
    </div>
  );
}
