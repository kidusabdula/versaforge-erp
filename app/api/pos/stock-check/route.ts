import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { StockCheck } from '@/types/pos';

export async function GET(request: NextRequest) {
  return handleApiRequest<{ stock: StockCheck[] }>(
    withEndpointLogging('/api/pos/stock-check - GET')(async () => {
      const { searchParams } = new URL(request.url);
      const itemCodes = searchParams.get('item_codes')?.split(',') || [];
      const warehouse = searchParams.get('warehouse') || '';
      
      if (itemCodes.length === 0 || !warehouse) {
        throw new Error('Item codes and warehouse are required');
      }
      
      // Get stock for items
      const bins = await frappeClient.db.getDocList<StockCheck>('Bin', {
        fields: ['item_code', 'warehouse', 'actual_qty', 'projected_qty', 'stock_uom'],
        filters: [
          ['item_code', 'in', itemCodes],
          ['warehouse', '=', warehouse],
        ],
        limit: 1000,
      });
      
      // Get item details
      const items = await frappeClient.db.getDocList('Item', {
        fields: ['item_code', 'item_name', 'is_stock_item'],
        filters: [['item_code', 'in', itemCodes]],
        limit: 1000,
      });
      
      // Create a map of item details
      const itemMap = items.reduce((map, item) => {
        map[item.item_code] = {
          item_name: item.item_name,
          is_stock_item: item.is_stock_item,
        };
        return map;
      }, {} as Record<string, { item_name: string; is_stock_item: 1 | 0 }>);
      
      // Combine stock with item details
      const stockWithDetails = bins.map(bin => ({
        ...bin,
        item_name: itemMap[bin.item_code]?.item_name || '',
        is_stock_item: itemMap[bin.item_code]?.is_stock_item || 0,
      }));
      
      return { stock: stockWithDetails };
    })
  );
}