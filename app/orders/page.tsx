import { Suspense } from "react";
import { OrdersView } from "@/components/orders";
import { TableSkeleton } from "@/components/ui/table";

export default function OrdersPage() {
  return (
    <Suspense fallback={<TableSkeleton columns={6} />}>
      <OrdersView />
    </Suspense>
  );
}
