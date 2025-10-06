// app/api/accounting/purchases/route.ts
import { NextRequest } from "next/server";
import { frappeClient } from "@/lib/frappe-client";
import { handleApiRequest, withEndpointLogging } from "@/lib/api-template";
import { PurchaseRecord, PurchaseItem } from "@/types/accounting";
import { Filter } from "frappe-js-sdk/lib/db/types";

// GET - Fetch purchase records
export async function GET(request: NextRequest) {
  return handleApiRequest<{ purchases: PurchaseRecord[] }>(
    withEndpointLogging("/api/accounting/purchases - GET")(async () => {
      const { searchParams } = new URL(request.url);
      const limit = searchParams.get("limit") || "100";
      const status = searchParams.get("status");
      const supplier = searchParams.get("supplier");
      const filters: Filter[] = [];

      // Convert status to proper Frappe value
      if (status) {
        let statusValue = status;
        if (status.toLowerCase() === "drafts") statusValue = "Draft";
        else if (status.toLowerCase() === "submitted")
          statusValue = "Submitted";
        else if (status.toLowerCase() === "paid") statusValue = "Paid";
        else if (status.toLowerCase() === "unpaid") statusValue = "Unpaid";
        else if (status.toLowerCase() === "overdue") statusValue = "Overdue";

        filters.push(["status", "=", statusValue]);
      }

      if (supplier) filters.push(["supplier", "=", supplier]);

      console.log("Using filters:", filters);

      // Step 1: Get just the list of purchase invoice names
      const purchaseNames = await frappeClient.db.getDocList<{ name: string }>(
        "Purchase Invoice",
        {
          fields: ["name"],
          filters: filters.length > 0 ? filters : undefined,
          orderBy: { field: "posting_date", order: "desc" },
          limit: parseInt(limit),
        }
      );

      console.log(`Found ${purchaseNames.length} purchase invoices`);

      // Step 2: For each purchase invoice, get the full document with items
      const purchasesWithItems = await Promise.all(
        purchaseNames.map(async (purchase) => {
          try {
            // Use frappe.client.get to get the entire document with child tables
            const fullPurchase = await frappeClient.call.get(
              "frappe.client.get",
              {
                doctype: "Purchase Invoice",
                name: purchase.name,
              }
            );

            if (fullPurchase && fullPurchase.message) {
              const doc = fullPurchase.message;
              return {
                name: doc.name,
                supplier: doc.supplier,
                supplier_name: doc.supplier_name,
                posting_date: doc.posting_date,
                due_date: doc.due_date,
                grand_total: doc.grand_total,
                total_amount: doc.grand_total, // Assuming grand_total represents total_amount
                total_tax: doc.total_tax || 0, // Assuming total_tax might exist or default to 0
                status: doc.status,
                docstatus: doc.docstatus,
                currency: doc.currency,
                company: doc.company,
                items: doc.items || [], // Items included in the document
              };
            }
            return null;
          } catch (error) {
            console.error(`Error fetching purchase ${purchase.name}:`, error);
            return null;
          }
        })
      );

      // Filter out any null results
      const validPurchases = purchasesWithItems.filter(
        (p) => p !== null
      ) as PurchaseRecord[];

      return { purchases: validPurchases };
    }),
    { requireAuth: true }
  );
}

// POST - Create new purchase record
export async function POST(request: NextRequest) {
  return handleApiRequest<{ purchase: PurchaseRecord }>(
    withEndpointLogging("/api/accounting/purchases - POST")(async () => {
      const data: { items: Record<string, unknown>[]; [key: string]: unknown } =
        await request.json();
      const { items, ...purchaseData } = data;

      // Validate required fields
      if (
        !purchaseData.supplier ||
        !purchaseData.posting_date ||
        !purchaseData.company ||
        !items ||
        items.length === 0
      ) {
        throw new Error(
          "Missing required fields: supplier, posting_date, company, items"
        );
      }

      // Calculate totals from items
      let total = 0;
      const processedItems = items.map((item) => {
        const qty = Number(item.qty) || 0;
        const rate = Number(item.rate) || 0;
        const amount = qty * rate;
        total += amount;

        return {
          item_code: item.item_code as string,
          item_name: item.item_name as string,
          description: item.description as string,
          qty,
          rate,
          amount,
          doctype: "Purchase Invoice Item",
        };
      });

      // Create the complete document with items in one go
      const completeDoc = {
        doctype: "Purchase Invoice",
        ...purchaseData,
        company: purchaseData.company,
        currency: purchaseData.currency || "ETB",
        conversion_rate: purchaseData.conversion_rate || 1,
        grand_total: total,
        base_grand_total: total,
        total: total,
        base_total: total,
        net_total: total,
        base_net_total: total,
        outstanding_amount: total,
        docstatus: 0,
        update_stock: 0,
        is_return: 0,
        is_debit_note: 0,
        items: processedItems.map((item) => ({
          ...item,
          parentfield: "items",
        })),
      };

      // Use frappe.client.insert to create the document with items
      const result = await frappeClient.call.post("frappe.client.insert", {
        doc: completeDoc,
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to create purchase invoice");
      }

      // Fetch the complete document
      const completePurchase = await frappeClient.db.getDoc<PurchaseRecord>(
        "Purchase Invoice",
        result.message.name
      );

      return {
        purchase: {
          ...completePurchase,
          items: processedItems,
        },
      };
    }),
    { requireAuth: true }
  );
}

// DELETE - Delete purchase record
export async function DELETE(request: NextRequest) {
  return handleApiRequest<{ message: string }>(
    withEndpointLogging("/api/accounting/purchases - DELETE")(async () => {
      const { searchParams } = new URL(request.url);
      const name = searchParams.get("name");
      if (!name) throw new Error("Purchase name parameter is required");

      await frappeClient.call.post("frappe.client.delete", {
        doctype: "Purchase Invoice",
        name: name,
      });

      return { message: `Purchase ${name} deleted successfully` };
    }),
    { requireAuth: true }
  );
}
