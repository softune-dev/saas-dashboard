import { Suspense } from "react";
import { SuperAdminUsersView } from "@/components/superadmin";
import { TableSkeleton } from "@/components/ui/table";

export default function SuperAdminUsersPage() {
  return (
    <Suspense fallback={<TableSkeleton columns={6} />}>
      <SuperAdminUsersView />
    </Suspense>
  );
}
