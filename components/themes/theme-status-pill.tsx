import type { ThemeStatus } from "./themes-data";

type ThemeStatusPillProps = {
  status: ThemeStatus;
};

/** Pill matches parent card color; white label text. */
export function ThemeStatusPill({ status }: ThemeStatusPillProps) {
  const isActive = status === "active";

  return (
    <span
      className={[
        "inline-flex rounded-b-md px-3 py-1 text-[11px] font-semibold tracking-wide text-white",
        isActive ? "bg-primary" : "",
      ].join(" ")}
      style={isActive ? undefined : { backgroundColor: "#929090" }}
    >
      {isActive ? "Active" : "Locked"}
    </span>
  );
}
