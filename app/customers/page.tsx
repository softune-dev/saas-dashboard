import { Suspense } from "react";
import { CustomersView } from "@/components/customers";
import { TableSkeleton } from "@/components/ui/table";

export default function CustomersPage() {
  return (
    <Suspense fallback={<TableSkeleton columns={5} />}>
      <CustomersView />
    </Suspense>
  );
}
