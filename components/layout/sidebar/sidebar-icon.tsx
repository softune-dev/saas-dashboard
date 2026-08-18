type SidebarIconProps = {
  src: string;
  className?: string;
};

/**
 * Renders a public SVG via CSS mask so color follows `currentColor`
 * (works for active white, default dark, and primary logout states).
 */
export function SidebarIcon({ src, className = "size-4" }: SidebarIconProps) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{
        maskImage: `url(${src})`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskImage: `url(${src})`,
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
      }}
    />
  );
}
