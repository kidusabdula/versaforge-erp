// app/api/crm/sales-orders/[name]/route.ts
import { NextRequest } from "next/server";
import { frappeClient } from "@/lib/frappe-client";
import { handleApiRequest, withEndpointLogging } from "@/lib/api-template";
import { SalesOrder } from "@/types/crm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ salesOrder: SalesOrder }>(
    withEndpointLogging("/api/crm/sales-orders/[name] - GET")(async () => {
      // Await the params as required by Next.js 15
      const { name } = await params;

      // Get the sales order
      const fullSalesOrder = await frappeClient.call.get("frappe.client.get", {
        doctype: "Sales Order",
        name: name,
      });

      if (!fullSalesOrder || !fullSalesOrder.message) {
        throw new Error("Sales order not found");
      }

      const doc = fullSalesOrder.message;

      // Map to our interface
      const salesOrder: SalesOrder = {
        name: doc.name,
        customer: doc.customer,
        transaction_date: doc.transaction_date,
        delivery_date: doc.delivery_date,
        total: doc.total,
        status: doc.status,
        items: doc.items || [],
        creation: doc.creation,
        modified: doc.modified,
        owner: doc.owner,
      };

      return { salesOrder };
    }),
    { requireAuth: true }
  );
}

// PUT - Update a sales order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ salesOrder: SalesOrder }>(
    withEndpointLogging("/api/crm/sales-orders/[name] - PUT")(async () => {
      const { name } = await params;
      const data = await request.json();

      // Get the current sales order
      const currentSalesOrder = await frappeClient.call.get(
        "frappe.client.get",
        {
          doctype: "Sales Order",
          name: name,
        }
      );

      if (!currentSalesOrder || !currentSalesOrder.message) {
        throw new Error("Sales order not found");
      }

      // Calculate totals from items if provided
      let total = data.total || currentSalesOrder.message.total;
      let processedItems = currentSalesOrder.message.items || [];

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
            doctype: "Sales Order Item",
            parentfield: "items",
          };
        });
      }

      // Prepare updated sales order data
      const salesOrderData = {
        ...currentSalesOrder.message,
        customer: data.customer || currentSalesOrder.message.customer,
        transaction_date:
          data.transaction_date || currentSalesOrder.message.transaction_date,
        delivery_date:
          data.delivery_date || currentSalesOrder.message.delivery_date,
        total: total,
        base_total: total,
        net_total: total,
        base_net_total: total,
        grand_total: total,
        base_grand_total: total,
        status: data.status || currentSalesOrder.message.status,
        items: processedItems,
      };

      // Use frappe.client.save to update the document
      const result = await frappeClient.call.post("frappe.client.save", {
        doc: salesOrderData,
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to update sales order");
      }

      // Fetch the updated document
      const updatedSalesOrder = await frappeClient.call.get(
        "frappe.client.get",
        {
          doctype: "Sales Order",
          name: result.message.name,
        }
      );

      if (!updatedSalesOrder || !updatedSalesOrder.message) {
        throw new Error("Failed to fetch updated sales order");
      }

      const doc = updatedSalesOrder.message;
      const salesOrder: SalesOrder = {
        name: doc.name,
        customer: doc.customer,
        transaction_date: doc.transaction_date,
        delivery_date: doc.delivery_date,
        total: doc.total,
        status: doc.status,
        items: doc.items || [],
        creation: doc.creation,
        modified: doc.modified,
        owner: doc.owner,
      };

      return { salesOrder };
    }),
    { requireAuth: true }
  );
}

// DELETE - Delete a sales order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ success: boolean }>(
    withEndpointLogging("/api/crm/sales-orders/[name] - DELETE")(async () => {
      const { name } = await params;

      // Use frappe.client.delete to delete the document
      const result = await frappeClient.call.post("frappe.client.delete", {
        doctype: "Sales Order",
        name: name,
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to delete sales order");
      }

      return { success: true };
    }),
    { requireAuth: true }
  );
}
