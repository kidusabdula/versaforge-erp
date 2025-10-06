import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { StockSummary } from '@/types/stock-dashboard';

export async function GET() {
  return handleApiRequest<{ summary: StockSummary }>(
    withEndpointLogging('/api/stock-summary - GET')(async () => {
      // Get total items count
      const items = await frappeClient.db.getCount('Item', [
        ['is_stock_item', '=', 1]
      ]);
      
      // Get total warehouses count
      const warehouses = await frappeClient.db.getCount('Warehouse');
      
      // Get total stock value
      const bins = await frappeClient.db.getDocList('Bin', {
        fields: ['stock_value'],
        limit: 1000
      });
      const totalStockValue = bins.reduce((sum, bin) => sum + (bin.stock_value || 0), 0);
      
      // Get low stock items (less than 10 in stock)
      const lowStockItems = await frappeClient.db.getCount('Bin', [
        ['actual_qty', '>', 0],
        ['actual_qty', '<', 10]
      ]);
      
      // Get out of stock items
      const outOfStockItems = await frappeClient.db.getCount('Bin', [
        ['actual_qty', '=', 0]
      ]);
      
      // Get recent transactions (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const recentTransactions = await frappeClient.db.getCount('Stock Ledger Entry', [
        ['posting_date', '>=', oneWeekAgo.toISOString().split('T')[0]]
      ]);
      
      const summary: StockSummary = {
        total_items: items,
        total_warehouses: warehouses,
        total_stock_value: totalStockValue,
        low_stock_items: lowStockItems,
        out_of_stock_items: outOfStockItems,
        recent_transactions: recentTransactions
      };
      
      return { summary };
    })
  );
}