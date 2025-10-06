// app/api/items/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { Item, ItemCreateRequest, ItemUpdateRequest } from '@/types/item';

// GET - Fetch all items
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'get-item-groups') {
    return handleApiRequest<{ item_groups: string[] }>(
      withEndpointLogging('/api/items - GET Item Groups')(async () => {
        const itemGroups = await frappeClient.db.getDocList('Item Group', {
          fields: ['name'],
          limit: 1000,
        });

        return { item_groups: itemGroups.map(group => group.name) };
      })
    );
  }

  if (action === 'get-uoms') {
    return handleApiRequest<{ uoms: string[] }>(
      withEndpointLogging('/api/items - GET UOMs')(async () => {
        const uoms = await frappeClient.db.getDocList('UOM', {
          fields: ['name'],
          limit: 1000,
        });

        return { uoms: uoms.map(uom => uom.name) };
      })
    );
  }

  // Default: return items list
  return handleApiRequest<{ items: Item[] }>(
    withEndpointLogging('/api/items - GET')(async () => {
      const limit = searchParams.get('limit') || '100';
      const fields = ['name', 'item_code', 'item_name', 'stock_uom', 'item_group', 'brand', 'is_stock_item', 'is_fixed_asset', 'disabled', 'modified'];

      const items = await frappeClient.db.getDocList('Item', {
        fields: fields,
        orderBy: {
          field: 'modified',
          order: 'desc',
        },
        limit: parseInt(limit),
      });

      return { items };
    })
  );
}



// POST - Create a new item
export async function POST(request: NextRequest) {
  return handleApiRequest<{ item: Item }>(
    withEndpointLogging('/api/items - POST')(async () => {
      const data: ItemCreateRequest = await request.json();

      // Validation
      if (!data.item_name || !data.stock_uom) {
        throw new Error('Missing required fields: item_name and stock_uom');
      }

      if (!data.item_code) {
        // Generate item_code from item_name if not provided
        data.item_code = data.item_name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
      }

      // Ensure is_stock_item is set (default to 1 if not provided)
      if (data.is_stock_item === undefined) {
        data.is_stock_item = 1;
      }

      // Create the item
      await frappeClient.db.createDoc<ItemCreateRequest>('Item', data);
      const item = await frappeClient.db.getDoc<Item>('Item', data.item_code);

      return { item: item as Item };
    })
  );
}

// PUT - Update an existing item
export async function PUT(request: NextRequest) {
  return handleApiRequest<{ item: Item }>(
    withEndpointLogging('/api/items - PUT')(async () => {
      const { searchParams } = new URL(request.url);
      const name = searchParams.get('name');
      
      if (!name) {
        throw new Error('Item name (name parameter) is required');
      }

      const data: ItemUpdateRequest = await request.json();

      // Update the item
      await frappeClient.db.updateDoc<ItemUpdateRequest>('Item', name, data);
      const item = await frappeClient.db.getDoc<Item>('Item', name);

      return { item: item as Item };
    })
  );
}

// DELETE - Delete an item
export async function DELETE(request: NextRequest) {
  return handleApiRequest<{ message: string }>(
    withEndpointLogging('/api/items - DELETE')(async () => {
      const { searchParams } = new URL(request.url);
      const name = searchParams.get('name');
      
      if (!name) {
        throw new Error('Item name (name parameter) is required');
      }

      await frappeClient.db.deleteDoc('Item', name);

      return { message: `Item ${name} deleted successfully` };
    })
  );
}