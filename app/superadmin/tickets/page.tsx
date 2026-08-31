import { Suspense } from "react";
import { SuperAdminTicketsView } from "@/components/superadmin";
import { TableSkeleton } from "@/components/ui/table";

export default function SuperAdminTicketsPage() {
  return (
    <Suspense fallback={<TableSkeleton columns={7} />}>
      <SuperAdminTicketsView />
    </Suspense>
  );
}
