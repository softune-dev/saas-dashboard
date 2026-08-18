type MaskIconProps = {
  src: string;
  className?: string;
};

/** Public SVG as a mask so fill follows `currentColor`. */
export function MaskIcon({ src, className = "size-5" }: MaskIconProps) {
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
