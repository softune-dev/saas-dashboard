import type { ReactNode } from "react";
import { DropshipMockProvider } from "@/components/dropship/dropship-mock-context";

/** Wraps every /dropship/* route in the shared mock-data context — see
 * lib/dropship-mock.ts's module docstring. */
export default function DropshipLayout({ children }: { children: ReactNode }) {
  return <DropshipMockProvider>{children}</DropshipMockProvider>;
}
