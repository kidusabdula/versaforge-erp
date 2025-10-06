import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { DeliveryNote, DeliveryNoteItem } from '@/types/delivery-note';

// GET - Fetch single delivery note with items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  // Await params as required by Next.js 13+
  const { name } = await params;
  
  return handleApiRequest<{ deliveryNote: DeliveryNote }>(
    withEndpointLogging(`/api/delivery-notes/${name} - GET`)(async () => {
      if (!name) {
        throw new Error('Delivery Note name parameter is required');
      }
      
      // Get the main delivery note document with items
      const deliveryNote = await frappeClient.db.getDoc<DeliveryNote>('Delivery Note', name);
      
      // If items are not included in the response, fetch them separately
      let items: DeliveryNoteItem[] = [];
      
      if (deliveryNote.items && Array.isArray(deliveryNote.items)) {
        items = deliveryNote.items;
      } else {
        // Alternative approach: use frappe.get_list with proper permissions
        try {
          items = await frappeClient.db.getDocList<DeliveryNoteItem>('Delivery Note Item', {
            fields: [
              'item_code',
              'item_name',
              'qty',
              'uom',
              'rate',
              'amount',
              'warehouse',
              'batch_no',
              'serial_no',
              'against_sales_order'
            ],
            filters: [['parent', '=', name]],
            orderBy: {
              field: 'idx',
              order: 'asc'
            }
          });
        } catch (error) {
          console.error('Error fetching delivery note items:', error);
          // If we can't fetch items, continue with empty array
          items = [];
        }
      }
      
      return { 
        deliveryNote: {
          ...deliveryNote,
          items
        } 
      };
    }),
    {requireAuth: true}
  );
}

// PUT - Update delivery note
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  // Await params as required by Next.js 13+
  const { name } = await params;
  
  return handleApiRequest<{ deliveryNote: DeliveryNote }>(
    withEndpointLogging(`/api/delivery-notes/${name} - PUT`)(async () => {
      if (!name) {
        throw new Error('Delivery Note name parameter is required');
      }
      const data = await request.json();
      
      const deliveryNote = await frappeClient.db.updateDoc<DeliveryNote>('Delivery Note', name, data);
      return { deliveryNote };
    }),
    { requireAuth: true }
  );
}

// DELETE - Delete delivery note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  // Await params as required by Next.js 13+
  const { name } = await params;
  
  return handleApiRequest<{ message: string }>(
    withEndpointLogging(`/api/delivery-notes/${name} - DELETE`)(async () => {
      if (!name) {
        throw new Error('Delivery Note name parameter is required');
      }
      await frappeClient.db.deleteDoc('Delivery Note', name);
      return { message: `Delivery Note ${name} deleted successfully` };
    }),
    { requireAuth: true }
  );
}