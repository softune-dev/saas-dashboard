import { Suspense } from "react";
import { SuperAdminTenantsView } from "@/components/superadmin";
import { TableSkeleton } from "@/components/ui/table";

export default function SuperAdminTenantsPage() {
  return (
    <Suspense fallback={<TableSkeleton columns={5} />}>
      <SuperAdminTenantsView />
    </Suspense>
  );
}
