// app/api/crm/quotations/[name]/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { Quotation } from '@/types/crm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ quotation: Quotation }>(
    withEndpointLogging('/api/crm/quotations/[name] - GET')(async () => {
      // Await the params as required by Next.js 15
      const { name } = await params;
      
      // Get the quotation
      const fullQuotation = await frappeClient.call.get("frappe.client.get", {
        doctype: "Quotation",
        name: name,
      });
      
      if (!fullQuotation || !fullQuotation.message) {
        throw new Error("Quotation not found");
      }
      
      const doc = fullQuotation.message;
      
      // Map to our interface
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

// PUT - Update a quotation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ quotation: Quotation }>(
    withEndpointLogging('/api/crm/quotations/[name] - PUT')(async () => {
      const { name } = await params;
      const data = await request.json();
      
      // Get the current quotation
      const currentQuotation = await frappeClient.call.get("frappe.client.get", {
        doctype: "Quotation",
        name: name,
      });
      
      if (!currentQuotation || !currentQuotation.message) {
        throw new Error("Quotation not found");
      }
      
      // Calculate totals from items if provided
      let total = data.total || currentQuotation.message.total;
      let processedItems = currentQuotation.message.items || [];
      
      if (data.items && data.items.length > 0) {
        total = 0;
        processedItems = data.items.map((item: any) => {
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
            doctype: "Quotation Item",
            parentfield: "items"
          };
        });
      }
      
      // Prepare updated quotation data
      const quotationData = {
        ...currentQuotation.message,
        customer: data.customer || currentQuotation.message.customer,
        transaction_date: data.transaction_date || currentQuotation.message.transaction_date,
        valid_till: data.valid_till || currentQuotation.message.valid_till,
        total: total,
        base_total: total,
        net_total: total,
        base_net_total: total,
        grand_total: total,
        base_grand_total: total,
        status: data.status || currentQuotation.message.status,
        items: processedItems
      };
      
      // Use frappe.client.save to update the document
      const result = await frappeClient.call.post("frappe.client.save", {
        doc: quotationData
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to update quotation");
      }

      // Fetch the updated document
      const updatedQuotation = await frappeClient.call.get("frappe.client.get", {
        doctype: "Quotation",
        name: result.message.name
      });
      
      if (!updatedQuotation || !updatedQuotation.message) {
        throw new Error("Failed to fetch updated quotation");
      }
      
      const doc = updatedQuotation.message;
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

// DELETE - Delete a quotation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ success: boolean }>(
    withEndpointLogging('/api/crm/quotations/[name] - DELETE')(async () => {
      const { name } = await params;
      
      // Use frappe.client.delete to delete the document
      const result = await frappeClient.call.post("frappe.client.delete", {
        doctype: "Quotation",
        name: name
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to delete quotation");
      }
      
      return { success: true };
    }),
    { requireAuth: true }
  );
}