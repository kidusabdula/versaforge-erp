// app/assets/value-adjustments/new/page.tsx
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import NewValueAdjustmentForm from "./NewValueAdjustmentForm"; // ← logic moved here

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="min-h-screen" />}>
      <NewValueAdjustmentForm />
    </Suspense>
  );
}