// app/api/crm/quotations/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { Quotation, QuotationItem } from '@/types/crm';

// GET - Fetch all quotations
export async function GET(request: NextRequest) {
  return handleApiRequest<{ quotations: Quotation[] }>(
    withEndpointLogging('/api/crm/quotations - GET')(async () => {
      const { searchParams } = new URL(request.url);
      const filters: Record<string, any> = {};
      
      // Build filters from query parameters
      if (searchParams.get('status')) filters.status = searchParams.get('status');
      if (searchParams.get('customer')) filters.customer = searchParams.get('customer');
      if (searchParams.get('date_from')) filters.transaction_date = ['>=', searchParams.get('date_from')];
      if (searchParams.get('date_to')) filters.transaction_date = ['<=', searchParams.get('date_to')];
      
      // Step 1: Get just the list of quotation names
      const quotationNames = await frappeClient.db.getDocList<{ name: string }>(
        "Quotation",
        {
          fields: ["name"],
          filters: Object.entries(filters).map(([key, value]) => {
            if (key === 'transaction_date' && Array.isArray(value)) {
              return [value[0], value[1], value[2]];
            }
            return [key, '=', value];
          }),
          orderBy: { field: 'creation', order: 'desc' },
          limit: 1000,
        }
      );
      
      console.log(`Found ${quotationNames.length} quotations`);
      
      // Step 2: For each quotation, get the full document
      const quotationsWithDetails = await Promise.all(
        quotationNames.map(async (quotation) => {
          try {
            // Use frappe.client.get to get the entire document
            const fullQuotation = await frappeClient.call.get("frappe.client.get", {
              doctype: "Quotation",
              name: quotation.name
            });
            
            if (fullQuotation && fullQuotation.message) {
              const doc = fullQuotation.message;
              return {
                name: doc.name,
                customer: doc.customer,
                transaction_date: doc.transaction_date,
                valid_till: doc.valid_till,
                total: doc.total,
                status: doc.status,
                items: doc.items || [],
                creation: doc.creation,
                modified: doc.modified,
                owner: doc.owner
              };
            }
            return null;
          } catch (error) {
            console.error(`Error fetching quotation ${quotation.name}:`, error);
            return null;
          }
        })
      );
      
      // Filter out any null results
      const validQuotations = quotationsWithDetails.filter(quotation => quotation !== null) as Quotation[];
      
      return { quotations: validQuotations };
    })
  );
}

// POST - Create a new quotation
export async function POST(request: NextRequest) {
  return handleApiRequest<{ quotation: Quotation }>(
    withEndpointLogging('/api/crm/quotations - POST')(async () => {
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
          doctype: "Quotation Item"
        };
      });
      
      // Prepare quotation data
      const quotationData = {
        doctype: "Quotation",
        customer: data.customer,
        transaction_date: data.transaction_date || new Date().toISOString().split('T')[0],
        valid_till: data.valid_till || "",
        total: total,
        base_total: total,
        net_total: total,
        base_net_total: total,
        grand_total: total,
        base_grand_total: total,
        status: data.status || "Draft",
        items: processedItems.map((item: QuotationItem) => ({
          ...item,
          parentfield: "items"
        }))
      };
      
      // Use frappe.client.insert to create the document
      const result = await frappeClient.call.post("frappe.client.insert", {
        doc: quotationData
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to create quotation");
      }

      // Fetch the complete document
      const completeQuotation = await frappeClient.call.get("frappe.client.get", {
        doctype: "Quotation",
        name: result.message.name
      });
      
      if (!completeQuotation || !completeQuotation.message) {
        throw new Error("Failed to fetch created quotation");
      }
      
      const doc = completeQuotation.message;
      const quotation: Quotation = {
        name: doc.name,
        customer: doc.customer,
        transaction_date: doc.transaction_date,
        valid_till: doc.valid_till,
        total: doc.total,
        status: doc.status,
        items: doc.items || [],
        creation: doc.creation,
        modified: doc.modified,
        owner: doc.owner
      };
      
      return { quotation };
    }),
    { requireAuth: true }
  );
}