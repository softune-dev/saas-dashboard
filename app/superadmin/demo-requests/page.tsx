import { Suspense } from "react";
import { SuperAdminDemoRequestsView } from "@/components/superadmin";
import { TableSkeleton } from "@/components/ui/table";

export default function SuperAdminDemoRequestsPage() {
  return (
    <Suspense fallback={<TableSkeleton columns={5} />}>
      <SuperAdminDemoRequestsView />
    </Suspense>
  );
}
