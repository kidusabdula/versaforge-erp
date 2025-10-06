// app/crm/communications/new/page.tsx
import { Suspense } from 'react';
import NewCommunicationContent from './NewCommunicationContent'; // <-- your existing code

export default function NewCommunicationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4">Loading…</p>
        </div>
      }
    >
      <NewCommunicationContent />
    </Suspense>
  );
}