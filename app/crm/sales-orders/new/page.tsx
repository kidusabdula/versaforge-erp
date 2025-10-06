// app/crm/sales-orders/new/page.tsx
import { Suspense } from 'react';
import NewSalesOrderContent from './NewSalesOrderContent'; // your existing code

export default function NewSalesOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="mt-4">Loading…</p>
          </div>
        </div>
      }
    >
      <NewSalesOrderContent />
    </Suspense>
  );
}