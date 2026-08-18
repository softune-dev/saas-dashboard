/** Core design tokens — keep UI colors centralized */
export const colors = {
  background: "#EAEAEA",
  primary: "#FF5A36",
  surface: "#FFFFFF",
  foreground: "#171717",
  muted: "#6B7280",
  mutedSoft: "#9CA3AF",
  border: "#E5E7EB",
  store: "#3B82F6",
  searchBg: "#F4F4F5",
} as const;

export const layout = {
  /** Outer gap from viewport edges for floating chrome */
  shellGap: "0.75rem",
  headerHeight: "3.75rem",
  sidebarWidth: "15.5rem",
  radius: "0.375rem", // md
} as const;
