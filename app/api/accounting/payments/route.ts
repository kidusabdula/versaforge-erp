// app/api/accounting/payments/route.ts
import { NextRequest } from "next/server";
import { frappeClient } from "@/lib/frappe-client";
import { handleApiRequest, withEndpointLogging } from "@/lib/api-template";
import { PaymentEntry } from "@/types/accounting";
import { Filter } from "frappe-js-sdk/lib/db/types";

// GET - Fetch payment entries
export async function GET(request: NextRequest) {
  return handleApiRequest<{ payments: PaymentEntry[] }>(
    withEndpointLogging("/api/accounting/payments - GET")(async () => {
      const { searchParams } = new URL(request.url);
      const limit = searchParams.get("limit") || "100";
      const paymentType = searchParams.get("payment_type");
      const partyType = searchParams.get("party_type");
      const status = searchParams.get("status");

      const filters: Filter[] = [];
      if (paymentType) filters.push(["payment_type", "=", paymentType]);
      if (partyType) filters.push(["party_type", "=", partyType]);
      if (status) filters.push(["status", "=", status]);

      const payments = await frappeClient.db.getDocList<PaymentEntry>(
        "Payment Entry",
        {
          fields: [
            "name",
            "payment_type",
            "party_type",
            "party",
            "posting_date",
            //"amount",
            "reference_no",
            "reference_date",
            "status",
            //"payment_method",
          ],
          filters: filters.length > 0 ? filters : undefined,
          orderBy: { field: "posting_date", order: "desc" },
          limit: parseInt(limit),
        }
      );

      return { payments };
    })
  );
}


// POST - Create new payment entry

export async function POST(request: NextRequest) {
  return handleApiRequest<{ payment: PaymentEntry }>(
    withEndpointLogging("/api/accounting/payments - POST")(async () => {
      const data = await request.json();

      // Validate required fields
      const requiredFields = ["payment_type", "party_type", "party", "posting_date", "amount", "company", "paid_from", "paid_to"];
      const missingFields = requiredFields.filter((f) => !data[f]);
      if (missingFields.length) {
        throw new Error(
          `Missing required fields: ${missingFields.join(", ")}`
        );
      }

      // Build full Payment Entry document for one-step insert
      const paymentDoc = {
        doctype: "Payment Entry",
        payment_type: data.payment_type,              // "Receive" or "Pay"
        party_type: data.party_type,                  // "Customer", "Supplier", etc.
        party: data.party,
        posting_date: data.posting_date,
        company: data.company,
        paid_amount: data.amount,                     // MANDATORY
        ...(data.payment_type === "Receive" ? { received_amount: data.amount } : {}),
        paid_from: data.paid_from,                   // GL account
        paid_to: data.paid_to,                       // GL account
        paid_from_account_currency: data.paid_from_account_currency || "ETB",
        paid_to_account_currency: data.paid_to_account_currency || "ETB",
        source_exchange_rate: data.source_exchange_rate || 1,
        target_exchange_rate: data.target_exchange_rate || 1,
        mode_of_payment: data.payment_method,
        reference_no: data.reference_no || "",
        reference_date: data.reference_date || data.posting_date,
        docstatus: 0
      };

      // Insert the Payment Entry in one step
      const createResult = await frappeClient.call.post("frappe.client.insert", {
        doc: paymentDoc
      });

      if (!createResult.message || !createResult.message.name) {
        throw new Error("Failed to create payment entry");
      }

      // Fetch the complete Payment Entry after creation
      const payment = await frappeClient.db.getDoc<PaymentEntry>(
        "Payment Entry",
        createResult.message.name
      );

      return { payment };
    })
  );
}
// PUT - Update payment entry
export async function PUT(request: NextRequest) {
  return handleApiRequest<{ payment: PaymentEntry }>(
    withEndpointLogging("/api/accounting/payments - PUT")(async () => {
      const { searchParams } = new URL(request.url);
      const name = searchParams.get("name");
      if (!name) throw new Error("Payment name parameter is required");
      
      // Get the full document first
      const currentDoc = await frappeClient.call.get("frappe.client.get", {
        doctype: "Payment Entry",
        name: name
      });
      
      if (!currentDoc || !currentDoc.message) {
        throw new Error("Payment entry not found");
      }
      
      // Update the document with new data
      const updateData = await request.json();
      const updatedDoc = {
        ...currentDoc.message,
        ...updateData,
        doctype: "Payment Entry",
        name: name, // Ensure name is preserved
        // Map payment_method to mode_of_payment if present
        ...(updateData.payment_method && { mode_of_payment: updateData.payment_method }),
        // Set the appropriate amount field based on payment type if amount is updated
        ...(updateData.amount && {
          ...(updateData.payment_type === "Receive" 
            ? { received_amount: updateData.amount } 
            : { paid_amount: updateData.amount }
          )
        })
      };
      
      // Remove payment_method if we've mapped it to mode_of_payment
      delete updatedDoc.payment_method;
      
      // Use frappe.client.save to update the document
      const result = await frappeClient.call.post("frappe.client.save", {
        doc: updatedDoc
      });
      
      if (!result.message || !result.message.name) {
        throw new Error("Failed to update payment entry");
      }
      
      return { payment: result.message as PaymentEntry };
    })
  );
}

// DELETE - Delete payment entry
export async function DELETE(request: NextRequest) {
  return handleApiRequest<{ message: string }>(
    withEndpointLogging("/api/accounting/payments - DELETE")(async () => {
      const { searchParams } = new URL(request.url);
      const name = searchParams.get("name");

      if (!name) throw new Error("Payment name parameter is required");

      await frappeClient.db.deleteDoc("Payment Entry", name);
      return { message: `Payment ${name} deleted successfully` };
    })
  );
}
