// app/crm/quotations/new/page.tsx
import { Suspense } from 'react';
import NewQuotationContent from './NewQuotationContent'; // your existing code

export default function NewQuotationPage() {
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
      <NewQuotationContent />
    </Suspense>
  );
}