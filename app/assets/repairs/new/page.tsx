// app/assets/repairs/new/page.tsx
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import NewRepairForm from "./NewRepairForm"; // ← logic moved here

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="min-h-screen" />}>
      <NewRepairForm />
    </Suspense>
  );
}