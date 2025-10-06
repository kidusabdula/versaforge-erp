// app/api/pos/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { POSProfile, POSItem, POSOrder, SalesInvoice } from '@/types/pos';

// GET - Fetch POS profile, customers, and available items
export async function GET() {
  return handleApiRequest<{ 
    profile: POSProfile; 
    customers: string[];
    categories: Array<{ name: string; items: POSItem[] }> 
  }>(
    withEndpointLogging('/api/pos - GET')(async () => {
      console.log("Starting POS API request");
      
      // Get POS profile
      const profiles = await frappeClient.db.getDocList<POSProfile>('POS Profile', {
        fields: ['name', 'company', 'customer', 'warehouse', 'currency', 'write_off_account', 'expense_account', 'income_account'],
        limit: 1,
      });
      
      if (profiles.length === 0) {
        throw new Error('No POS profile found');
      }
      
      const profile = profiles[0];
      console.log("Found POS profile:", profile);
      
      // Get customers
      const customers = await frappeClient.db.getDocList('Customer', {
        fields: ['name', 'customer_name'],
        filters: [['disabled', '=', 0]],
        orderBy: { field: 'customer_name', order: 'asc' },
        limit: 100,
      });
      
      console.log(`Found ${customers.length} customers`);
      
      // Get the "Finished Goods" parent item group
      const parentGroups = await frappeClient.db.getDocList('Item Group', {
        fields: ['name'],
        filters: [['name', '=', 'Finished Goods']],
        limit: 1,
      });
      
      if (parentGroups.length === 0) {
        throw new Error('Finished Goods item group not found');
      }
      
      const parentGroupName = parentGroups[0].name;
      console.log("Found parent group:", parentGroupName);
      
      // Get child item groups under "Finished Goods"
      const childGroups = await frappeClient.db.getDocList('Item Group', {
        fields: ['name'],
        filters: [['parent_item_group', '=', parentGroupName]],
        orderBy: { field: 'name', order: 'asc' },
        limit: 100,
      });
      
      console.log("Child groups:", childGroups);
      
      // Get all items under "Finished Goods" (both parent and child groups)
      const allFinishedGoodsItems = await frappeClient.db.getDocList<POSItem>('Item', {
        fields: ['item_code', 'item_name', 'description', 'stock_uom', 'image', 'standard_rate', 'is_stock_item', 'item_group'],
        filters: [
          ['disabled', '=', 0],
          ['is_stock_item', '=', 1],
          ['item_group', '=', parentGroupName]  // Get items directly under Finished Goods
        ],
        orderBy: { field: 'item_name', order: 'asc' },
        limit: 1000,
      });
      
      console.log(`Found ${allFinishedGoodsItems.length} items directly under Finished Goods`);
      
      // Prepare to collect all item codes for stock lookup
      const allItemCodes: string[] = [];
      const categoryItems: Array<{ name: string; items: POSItem[] }> = [];
      
      // Create categories based on child groups
      const categoriesToUse = childGroups.length > 0 ? childGroups : [{ name: parentGroupName }];
      
      // Initialize each category with empty items array
      for (const group of categoriesToUse) {
        categoryItems.push({
          name: group.name,
          items: []
        });
      }
      
      // Add a "All Finished Goods" category as well
      categoryItems.unshift({
        name: "All Finished Goods",
        items: []
      });
      
      // Now categorize items based on their names
      for (const item of allFinishedGoodsItems) {
        allItemCodes.push(item.item_code);
        
        // Categorize items based on their names
        let categorized = false;
        
        // Check if item name contains keywords for specific categories
        if (item.item_name.toLowerCase().includes('beignet')) {
          const beignetsCategory = categoryItems.find(c => c.name === 'Beignets');
          if (beignetsCategory) {
            beignetsCategory.items.push(item);
            categorized = true;
          }
        }
        
        if (item.item_name.toLowerCase().includes('bread')) {
          const breadsCategory = categoryItems.find(c => c.name === 'Breads');
          if (breadsCategory) {
            breadsCategory.items.push(item);
            categorized = true;
          }
        }
        
        if (item.item_name.toLowerCase().includes('croissant')) {
          const croissantsCategory = categoryItems.find(c => c.name === 'Croissants');
          if (croissantsCategory) {
            croissantsCategory.items.push(item);
            categorized = true;
          }
        }
        
        if (item.item_name.toLowerCase().includes('pastry')) {
          const pastriesCategory = categoryItems.find(c => c.name === 'Pastries');
          if (pastriesCategory) {
            pastriesCategory.items.push(item);
            categorized = true;
          }
        }
        
        if (item.item_name.toLowerCase().includes('roll')) {
          const rollsCategory = categoryItems.find(c => c.name === 'Rolls');
          if (rollsCategory) {
            rollsCategory.items.push(item);
            categorized = true;
          }
        }
        
        // If not categorized by name, add to "All Finished Goods"
        if (!categorized) {
          const allCategory = categoryItems.find(c => c.name === 'All Finished Goods');
          if (allCategory) {
            allCategory.items.push(item);
          }
        }
      }
      
      console.log(`Total item codes to check stock for: ${allItemCodes.length}`);
      
      // Get stock for all items in one query
      let stockMap: Record<string, number> = {};
      
      if (allItemCodes.length > 0) {
        // Check if we have a valid warehouse
        if (!profile.warehouse) {
          console.log('No warehouse specified in POS profile');
        } else {
          console.log(`Checking stock for warehouse: ${profile.warehouse}`);
          
          const bins = await frappeClient.db.getDocList('Bin', {
            fields: ['item_code', 'actual_qty'],
            filters: [
              ['item_code', 'in', allItemCodes],
              ['warehouse', '=', profile.warehouse],
            ],
            limit: 10000,
          });
          
          console.log(`Found ${bins.length} stock records`);
          
          // Create a map of item codes to actual quantities
          stockMap = bins.reduce((map, bin) => {
            map[bin.item_code] = bin.actual_qty;
            return map;
          }, {} as Record<string, number>);
        }
      }
      
      // Add stock information to each item
      const categoriesWithStock = categoryItems.map(category => ({
        name: category.name,
        items: category.items.map(item => ({
          ...item,
          actual_qty: stockMap[item.item_code] || 0,
        }))
      }));
      
      // Remove empty categories
      const nonEmptyCategories = categoriesWithStock.filter(category => category.items.length > 0);
      
      // Log the final result for debugging
      console.log('Final categories with stock:', JSON.stringify(nonEmptyCategories, null, 2));
      
      return { 
        profile, 
        customers: customers.map(c => c.name),
        categories: nonEmptyCategories 
      };
    })
  );
}

// POST - Create sales invoice
export async function POST(request: NextRequest) {
  return handleApiRequest<{ salesInvoice: SalesInvoice }>(
    withEndpointLogging('/api/pos - POST')(async () => {
      const order: POSOrder = await request.json();
      
      // Validate order
      if (!order.customer || !order.items || order.items.length === 0) {
        throw new Error('Customer and items are required');
      }
      
      // Create sales invoice with docstatus=1 (submitted) to avoid timestamp mismatch
      const salesInvoiceData = {
        doctype: 'Sales Invoice',
        customer: order.customer,
        posting_date: order.posting_date,
        posting_time: order.posting_time,
        company: order.company,
        set_warehouse: order.warehouse,
        docstatus: 1, // Set to submitted directly
        items: order.items.map(item => ({
          item_code: item.item_code,
          item_name: item.item_name,
          qty: item.qty,
          rate: item.rate,
          uom: item.uom,
          warehouse: order.warehouse,
        })),
        payments: order.payments,
        is_pos: 1,
        update_stock: 1,
        // Add allow_zero_valuation_rate to all items to bypass valuation rate validation
        allow_zero_valuation_rate: 1
      };
      
      try {
        // Create and submit in one operation
        const salesInvoice = await frappeClient.db.createDoc('Sales Invoice', salesInvoiceData);
        
        // Get the complete invoice with all fields
        const completeInvoice = await frappeClient.db.getDoc<SalesInvoice>('Sales Invoice', salesInvoice.name);
        
        return { salesInvoice: completeInvoice };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        // If timestamp mismatch occurs, try with a fresh approach
        if (error.message && error.message.includes('Document has been modified')) {
          console.log('Timestamp mismatch detected, retrying with fresh document...');
          
          // Create with a slight delay to ensure timestamp is fresh
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Add a timestamp to make the document unique
          const uniqueData = {
            ...salesInvoiceData,
            name: `POS-${Date.now()}`,
            posting_time: new Date().toTimeString().slice(0, 8)
          };
          
          // Try again
          const salesInvoice = await frappeClient.db.createDoc('Sales Invoice', uniqueData);
          
          // Get the complete invoice with all fields
          const completeInvoice = await frappeClient.db.getDoc<SalesInvoice>('Sales Invoice', salesInvoice.name);
          
          return { salesInvoice: completeInvoice };
        }
        
        // Re-throw the error if it's not a timestamp mismatch
        throw error;
      }
    }),
    { requireAuth: true }
  );
}