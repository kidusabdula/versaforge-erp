// app/api/crm/sales-orders/route.ts
import { NextRequest } from "next/server";
import { frappeClient } from "@/lib/frappe-client";
import { handleApiRequest, withEndpointLogging } from "@/lib/api-template";
import { SalesOrder, SalesOrderItem } from "@/types/crm";

// GET - Fetch all sales orders
export async function GET(request: NextRequest) {
  return handleApiRequest<{ salesOrders: SalesOrder[] }>(
    withEndpointLogging("/api/crm/sales-orders - GET")(async () => {
      const { searchParams } = new URL(request.url);
      const filters: Record<string, any> = {};

      // Build filters from query parameters
      if (searchParams.get("status"))
        filters.status = searchParams.get("status");
      if (searchParams.get("customer"))
        filters.customer = searchParams.get("customer");
      if (searchParams.get("date_from"))
        filters.transaction_date = [">=", searchParams.get("date_from")];
      if (searchParams.get("date_to"))
        filters.transaction_date = ["<=", searchParams.get("date_to")];

      // Step 1: Get just the list of sales order names
      const salesOrderNames = await frappeClient.db.getDocList<{
        name: string;
      }>("Sales Order", {
        fields: ["name"],
        filters: Object.entries(filters).map(([key, value]) => {
          if (key === "transaction_date" && Array.isArray(value)) {
            return [value[0], value[1], value[2]];
          }
          return [key, "=", value];
        }),
        orderBy: { field: "creation", order: "desc" },
        limit: 1000,
      });

      console.log(`Found ${salesOrderNames.length} sales orders`);

      // Step 2: For each sales order, get the full document
      const salesOrdersWithDetails = await Promise.all(
        salesOrderNames.map(async (salesOrder) => {
          try {
            // Use frappe.client.get to get the entire document
            const fullSalesOrder = await frappeClient.call.get(
              "frappe.client.get",
              {
                doctype: "Sales Order",
                name: salesOrder.name,
              }
            );

            if (fullSalesOrder && fullSalesOrder.message) {
              const doc = fullSalesOrder.message;
              return {
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
            }
            return null;
          } catch (error) {
            console.error(
              `Error fetching sales order ${salesOrder.name}:`,
              error
            );
            return null;
          }
        })
      );

      // Filter out any null results
      const validSalesOrders = salesOrdersWithDetails.filter(
        (salesOrder) => salesOrder !== null
      ) as SalesOrder[];

      return { salesOrders: validSalesOrders };
    })
  );
}

// POST - Create a new sales order
export async function POST(request: NextRequest) {
  return handleApiRequest<{ salesOrder: SalesOrder }>(
    withEndpointLogging("/api/crm/sales-orders - POST")(async () => {
      const data = await request.json();

      // Validate required fields
      if (!data.customer || !data.items || data.items.length === 0) {
        throw new Error("Customer and items are required");
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
          doctype: "Sales Order Item",
        };
      });

      // Prepare sales order data
      const salesOrderData = {
        doctype: "Sales Order",
        customer: data.customer,
        transaction_date:
          data.transaction_date || new Date().toISOString().split("T")[0],
        delivery_date: data.delivery_date || "",
        total: total,
        base_total: total,
        net_total: total,
        base_net_total: total,
        grand_total: total,
        base_grand_total: total,
        status: data.status || "Draft",
        items: processedItems.map((item: SalesOrderItem) => ({
          ...item,
          parentfield: "items",
        })),
      };

      // Use frappe.client.insert to create the document
      const result = await frappeClient.call.post("frappe.client.insert", {
        doc: salesOrderData,
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to create sales order");
      }

      // Fetch the complete document
      const completeSalesOrder = await frappeClient.call.get(
        "frappe.client.get",
        {
          doctype: "Sales Order",
          name: result.message.name,
        }
      );

      if (!completeSalesOrder || !completeSalesOrder.message) {
        throw new Error("Failed to fetch created sales order");
      }

      const doc = completeSalesOrder.message;
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
