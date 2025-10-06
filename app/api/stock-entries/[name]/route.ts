import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { StockEntry } from '@/types/stock-entry';

// GET - Fetch single stock entry with items
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ name: string }> }
) {
  // ✅ Await params because Next.js makes it async
  const { name } = await context.params;

  return handleApiRequest<{ stockEntry: StockEntry }>(
    withEndpointLogging(`/api/stock-entries/${name} - GET`)(async () => {
      if (!name) {
        throw new Error('Stock Entry name parameter is required');
      }

      // getDoc fetches the document and child tables
      const stockEntry = await frappeClient.db.getDoc<StockEntry>('Stock Entry', name);
      return { stockEntry };
    }),
    { requireAuth: true }
  );
}

// PUT - Update stock entry
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ name: string }> }
) {
  const { name } = await context.params;

  return handleApiRequest<{ stockEntry: StockEntry }>(
    withEndpointLogging(`/api/stock-entries/${name} - PUT`)(async () => {
      if (!name) throw new Error('Stock Entry name parameter is required');

      const data = await request.json();
      const stockEntry = await frappeClient.db.updateDoc<StockEntry>('Stock Entry', name, data);

      return { stockEntry };
    }),
    { requireAuth: true }
  );
}

// DELETE - Delete stock entry
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ name: string }> }
) {
  const { name } = await context.params;

  return handleApiRequest<{ message: string }>(
    withEndpointLogging(`/api/stock-entries/${name} - DELETE`)(async () => {
      if (!name) throw new Error('Stock Entry name parameter is required');

      await frappeClient.db.deleteDoc('Stock Entry', name);
      return { message: `Stock Entry ${name} deleted successfully` };
    }),
    { requireAuth: true }
  );
}
