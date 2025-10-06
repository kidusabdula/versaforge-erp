// app/assets/maintenance/new/page.tsx
"use client";

import { Suspense } from "react";
import NewMaintenanceForm from "./NewMaintenanceForm";   // ← logic moved here
import { Skeleton } from "@/components/ui/skeleton";

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-screen" />}>
      <NewMaintenanceForm />
    </Suspense>
  );
}