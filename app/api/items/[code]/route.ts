// app/api/items/[code]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
// import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
// import { Item } from '@/types/item';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    // Await the params before using its properties
    const { code } = await params;
    const decodedCode = decodeURIComponent(code);
    console.log("API: Looking for item with code:", decodedCode);
    
    // Fetch item by item_code
    const items = await frappeClient.db.getDocList('Item', {
      fields: ['name', 'item_code', 'item_name', 'stock_uom', 'item_group', 'brand', 'is_stock_item', 'is_fixed_asset', 'disabled', 'modified'],
      filters: [['item_code', '=', decodedCode]],
      limit: 1,
    });

    console.log("API: Found items:", items);

    if (items.length === 0) {
      return NextResponse.json(
        { error: `Item with code ${decodedCode} not found` },
        { status: 404 }
      );
    }

    // Return the expected format
    return NextResponse.json({ item: items[0] });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}