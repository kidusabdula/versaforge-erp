import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { StockLedgerEntry, DashboardFilters } from '@/types/stock-dashboard';
import { Filter } from 'frappe-js-sdk/lib/db/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  return handleApiRequest<{ ledgerEntries: StockLedgerEntry[] }>(
    withEndpointLogging('/api/stock-ledger - GET')(async () => {
      const filters: Partial<DashboardFilters> = {};
      const frappeFilters: Filter[] = [];
      
      // Extract filter parameters
      searchParams.forEach((value, key) => {
        if (value && value !== 'all') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          filters[key as keyof DashboardFilters] = value as any;
        }
      });
      
      if (filters.warehouse) {
        frappeFilters.push(['warehouse', '=', filters.warehouse]);
      }
      
      if (filters.date_from) {
        frappeFilters.push(['posting_date', '>=', filters.date_from]);
      }
      
      if (filters.date_to) {
        frappeFilters.push(['posting_date', '<=', filters.date_to]);
      }
      
      const ledgerEntries = await frappeClient.db.getDocList<StockLedgerEntry>('Stock Ledger Entry', {
        fields: [
          'name',
          'item_code',
          'warehouse',
          'posting_date',
          'posting_time',
          'voucher_type',
          'voucher_no',
          'actual_qty',
          'qty_after_transaction',
          'incoming_rate',
          'outgoing_rate',
          'valuation_rate',
          'stock_value',
          'stock_uom',
          'batch_no',
          'serial_no'
        ],
        filters: frappeFilters.length > 0 ? frappeFilters : undefined,
        orderBy: {
          field: 'posting_date',
          order: 'desc',
        },
        limit: 200,
      });
      
      // Fetch item names separately
      const itemCodes = [...new Set(ledgerEntries.map(entry => entry.item_code))];
      const items = await frappeClient.db.getDocList('Item', {
        fields: ['item_code', 'item_name'],
        filters: [['item_code', 'in', itemCodes]],
        limit: 1000
      });
      
      // Create a map of item codes to item names
      const itemNameMap = items.reduce((map, item) => {
        map[item.item_code] = item.item_name;
        return map;
      }, {} as Record<string, string>);
      
      // Add item names to ledger entries
      const ledgerEntriesWithNames = ledgerEntries.map(entry => ({
        ...entry,
        item_name: itemNameMap[entry.item_code] || ''
      }));
      
      return { ledgerEntries: ledgerEntriesWithNames };
    })
  );
}