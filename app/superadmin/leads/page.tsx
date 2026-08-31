import { Suspense } from "react";
import { SuperAdminLeadsView } from "@/components/superadmin";
import { TableSkeleton } from "@/components/ui/table";

export default function SuperAdminLeadsPage() {
  return (
    <Suspense fallback={<TableSkeleton columns={6} />}>
      <SuperAdminLeadsView />
    </Suspense>
  );
}
