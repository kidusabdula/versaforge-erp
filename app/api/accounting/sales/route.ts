// app/api/accounting/sales/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { SalesInvoice } from '@/types/accounting';

// GET - Fetch all sales invoices
export async function GET(request: NextRequest) {
  return handleApiRequest<{ sales: SalesInvoice[] }>(
    withEndpointLogging('/api/accounting/sales - GET')(async () => {
      const { searchParams } = new URL(request.url);
      const filters: Record<string, any> = {};
      
      // Build filters from query parameters
      if (searchParams.get('customer')) filters.customer = searchParams.get('customer');
      if (searchParams.get('status')) filters.status = searchParams.get('status');
      if (searchParams.get('date_from')) filters.posting_date_from = searchParams.get('date_from');
      if (searchParams.get('date_to')) filters.posting_date_to = searchParams.get('date_to');
      
      // Step 1: Get just the list of sales invoice names
      const salesInvoiceNames = await frappeClient.db.getDocList<{ name: string }>(
        "Sales Invoice",
        {
          fields: ["name"],
          filters: Object.entries(filters).map(([key, value]) => {
            if (key === 'posting_date_from') return ['posting_date', '>=', value];
            if (key === 'posting_date_to') return ['posting_date', '<=', value];
            return [key, '=', value];
          }),
          orderBy: { field: 'posting_date', order: 'desc' },
          limit: 1000,
        }
      );
      
      console.log(`Found ${salesInvoiceNames.length} sales invoices`);
      
      // Step 2: For each sales invoice, get the full document with items
      const salesWithDetails = await Promise.all(
        salesInvoiceNames.map(async (invoice) => {
          try {
            // Use frappe.client.get to get the entire document with child tables
            const fullInvoice = await frappeClient.call.get("frappe.client.get", {
              doctype: "Sales Invoice",
              name: invoice.name
            });
            
            if (fullInvoice && fullInvoice.message) {
              const doc = fullInvoice.message;
              return {
                name: doc.name,
                customer: doc.customer,
                customer_name: doc.customer_name,
                posting_date: doc.posting_date,
                due_date: doc.due_date,
                grand_total: doc.grand_total,
                status: doc.status,
                docstatus: doc.docstatus,
                currency: doc.currency,
                company: doc.company,
                items: doc.items || [] // Items included in the document
              };
            }
            return null;
          } catch (error) {
            console.error(`Error fetching sales invoice ${invoice.name}:`, error);
            return null;
          }
        })
      );
      
      // Filter out any null results
      const validSales = salesWithDetails.filter(sale => sale !== null) as SalesInvoice[];
      
      return { sales: validSales };
    })
  );
}

// POST - Create a new sales invoice
export async function POST(request: NextRequest) {
  return handleApiRequest<{ salesInvoice: SalesInvoice }>(
    withEndpointLogging('/api/accounting/sales - POST')(async () => {
      const data = await request.json();
      
      // Validate required fields
      if (!data.customer || !data.items || data.items.length === 0) {
        throw new Error('Customer and items are required');
      }
      
      // Calculate totals from items
      let total = 0;
      const processedItems = data.items.map((item: any) => {
        const qty = Number(item.qty) || 0;
        const rate = Number(item.rate) || 0;
        const amount = qty * rate;
        total += amount;
        
        return {
          item_code: item.item_code,
          item_name: item.item_name,
          description: item.description,
          qty,
          rate,
          amount,
          doctype: "Sales Invoice Item"
        };
      });
      
      // Prepare sales invoice data
      const salesInvoiceData = {
        doctype: "Sales Invoice",
        customer: data.customer,
        posting_date: data.posting_date,
        due_date: data.due_date || data.posting_date,
        company: data.company,
        currency: data.currency || "ETB",
        conversion_rate: data.conversion_rate || 1,
        grand_total: total,
        base_grand_total: total,
        total: total,
        base_total: total,
        net_total: total,
        base_net_total: total,
        outstanding_amount: total,
        docstatus: 0,
        update_stock: 1,
        is_return: 0,
        is_debit_note: 0,
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: processedItems.map((item: any) => ({
          ...item,
          parentfield: "items"
        }))
      };
      
      // Use frappe.client.insert to create the document with items
      const result = await frappeClient.call.post("frappe.client.insert", {
        doc: salesInvoiceData
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to create sales invoice");
      }

      // Fetch the complete document
      const completeInvoice = await frappeClient.db.getDoc<SalesInvoice>(
        "Sales Invoice",
        result.message.name
      );
      
      return { salesInvoice: completeInvoice };
    }),
    { requireAuth: true }
  );
}