import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { 
  DeliveryNote, 
  DeliveryNoteCreateRequest, 
  DeliveryNoteUpdateRequest,
  DeliveryNoteFilters 
} from '@/types/delivery-note';
import { Filter } from 'frappe-js-sdk/lib/db/types';
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  if (action === 'get-customers') {
    return handleApiRequest<{ customers: string[] }>(
      withEndpointLogging('/api/delivery-notes - GET Customers')(async () => {
        const customers = await frappeClient.db.getDocList('Customer', {
          fields: ['name'],
          limit: 1000,
        });
        
        const customerNames = customers.map(customer => customer.name);
        return { customers: customerNames };
      })
    );
  }
  
  // Get delivery note types
  if (action === 'get-delivery-note-types') {
    return handleApiRequest<{ delivery_note_types: string[] }>(
      withEndpointLogging('/api/delivery-notes - GET Types')(async () => {
        const entries = await frappeClient.db.getDocList('Delivery Note', {
          fields: ['delivery_note_type'],
          limit: 1000,
        });
        const types = [
          ...new Set(
            entries.map((entry) => entry.delivery_note_type).filter(Boolean)
          ),
        ];
        return { delivery_note_types: types };
      })
    );
  }
  
  // Get territories
  if (action === 'get-territories') {
    return handleApiRequest<{ territories: string[] }>(
      withEndpointLogging('/api/delivery-notes - GET Territories')(async () => {
        const territories = await frappeClient.db.getDocList('Territory', {
          fields: ['name'],
          limit: 1000,
        });
        
        const territoryNames = territories.map(territory => territory.name);
        return { territories: territoryNames };
      })
    );
  }
  
  // Handle filtered requests
  if (action === 'filter') {
    return handleApiRequest<{ deliveryNotes: DeliveryNote[] }>(
      withEndpointLogging('/api/delivery-notes - GET Filtered')(async () => {
        const filters: DeliveryNoteFilters = {};
        
        // Extract filter parameters
        searchParams.forEach((value, key) => {
          if (value && key !== 'action') {
            if (key === 'docstatus') {
              filters[key as 'docstatus'] = value as DeliveryNoteFilters['docstatus'];
            } else {
              filters[key as Exclude<keyof DeliveryNoteFilters, 'docstatus'>] = value;
            }
          }
        });
        
        // Build Frappe filters
        const frappeFilters: Filter[] = [];
        
        if (filters.customer && filters.customer !== 'all') {
          frappeFilters.push(['customer', '=', filters.customer]);
        }
        
        // Note: sales_order filter removed as it's not a direct field
        
        if (filters.territory && filters.territory !== 'all') {
          frappeFilters.push(['territory', '=', filters.territory]);
        }
        
        if (filters.posting_date_from) {
          frappeFilters.push(['posting_date', '>=', filters.posting_date_from]);
        }
        
        if (filters.posting_date_to) {
          frappeFilters.push(['posting_date', '<=', filters.posting_date_to]);
        }
        
        if (filters.docstatus && filters.docstatus !== 'all') {
          frappeFilters.push(['docstatus', '=', parseInt(filters.docstatus)]);
        }
        
        const limit = searchParams.get('limit') || '100';
        const fields: (keyof DeliveryNote | '*')[] = [
          'name', 
          'customer', 
          'customer_name',
          'posting_date', 
          'posting_time',
          'set_warehouse',
          'territory',
          'docstatus',
          'company',
          'modified'
        ];
        // Note: sales_order field removed from fields array
        
        const deliveryNotes = await frappeClient.db.getDocList<DeliveryNote>('Delivery Note', {
          fields: fields,
          filters: frappeFilters.length > 0 ? frappeFilters : undefined,
          orderBy: {
            field: 'modified',
            order: 'desc',
          },
          limit: parseInt(limit),
        });
        
        return { deliveryNotes };
      })
    );
  }
  
  // Default: return all delivery notes
  return handleApiRequest<{ deliveryNotes: DeliveryNote[] }>(
    withEndpointLogging('/api/delivery-notes - GET')(async () => {
      const limit = searchParams.get('limit') || '100';
      const fields: (keyof DeliveryNote | '*')[] = [
        'name', 
        'customer', 
        'customer_name',
        'posting_date', 
        'posting_time',
        'set_warehouse',
        'territory',
        'docstatus',
        'company',
        'modified'
      ];
      // Note: sales_order field removed from fields array
      
      const deliveryNotes = await frappeClient.db.getDocList<DeliveryNote>('Delivery Note', {
        fields: fields,
        orderBy: {
          field: 'modified',
          order: 'desc',
        },
        limit: parseInt(limit),
      });
      
      return { deliveryNotes };
    })
  ); 
}
// POST - Create new delivery note
export async function POST(request: NextRequest) {
  return handleApiRequest<{ deliveryNote: DeliveryNote }>(
    withEndpointLogging('/api/delivery-notes - POST')(async () => {
      const data: DeliveryNoteCreateRequest = await request.json();
      if (!data.customer || !data.posting_date || !data.items || data.items.length === 0) {
        throw new Error('Missing required fields: customer, posting_date, and items');
      }
      if (!data.set_warehouse) {
        throw new Error('Warehouse is required for Delivery Note');
      }
      // Generate name if not provided
      if (!data.name) {
        data.name = `DN-${data.customer}-${Date.now()}`;
      }
      
      // Add allow_zero_valuation_rate to all items to bypass valuation rate validation
      if (data.items) {
        data.items = data.items.map(item => ({
          ...item,
          allow_zero_valuation_rate: 1
        }));
      }
      
      const deliveryNote = await frappeClient.db.createDoc<DeliveryNoteCreateRequest>('Delivery Note', data);
      return { deliveryNote: deliveryNote as DeliveryNote };
    }),
    { requireAuth: true }
  );
}
// PUT - Update delivery note
export async function PUT(request: NextRequest) {
  return handleApiRequest<{ deliveryNote: DeliveryNote }>(
    withEndpointLogging('/api/delivery-notes - PUT')(async () => {
      const { searchParams } = new URL(request.url);
      const name = searchParams.get('name');
      if (!name) throw new Error('Delivery Note name parameter is required');
      const data: DeliveryNoteUpdateRequest = await request.json();
      
      // Add allow_zero_valuation_rate to all items if present
      if (data.items) {
        data.items = data.items.map(item => ({
          ...item,
          allow_zero_valuation_rate: 1
        }));
      }
      
      const deliveryNote = await frappeClient.db.updateDoc<DeliveryNoteUpdateRequest>('Delivery Note', name, data);
      return { deliveryNote: deliveryNote as DeliveryNote };
    }),
    { requireAuth: true }
  );
}
// DELETE - Delete delivery note
export async function DELETE(request: NextRequest) {
  return handleApiRequest<{ message: string }>(
    withEndpointLogging('/api/delivery-notes - DELETE')(async () => {
      const { searchParams } = new URL(request.url);
      const name = searchParams.get('name');
      if (!name) throw new Error('Delivery Note name parameter is required');
      await frappeClient.db.deleteDoc('Delivery Note', name);
      return { message: `Delivery Note ${name} deleted successfully` };
    }),
    { requireAuth: true }
  );
}