// app/assets/movements/new/page.tsx
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import NewMovementForm from "./NewMovementForm"; // ← logic moved here

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="min-h-screen" />}>
      <NewMovementForm />
    </Suspense>
  );
}