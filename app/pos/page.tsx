import { Suspense } from "react";
import { NewSalePage } from "@/components/pos/new-sale-page";

export default function PosPage() {
  return (
    <Suspense fallback={null}>
      <NewSalePage />
    </Suspense>
  );
}
