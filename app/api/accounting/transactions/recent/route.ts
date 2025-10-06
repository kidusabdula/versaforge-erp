// app/api/accounting/transactions/recent/route.ts
import { NextRequest } from "next/server";
import { frappeClient } from "@/lib/frappe-client";
import { handleApiRequest, withEndpointLogging } from "@/lib/api-template";

interface RecentTransaction {
  id: string;
  type: "purchase" | "expense" | "payment" | "sale";
  date: string;
  description: string;
  amount: number;
  status: string;
}

export async function GET(request: NextRequest) {
  return handleApiRequest<{ transactions: RecentTransaction[] }>(
    withEndpointLogging("/api/accounting/transactions/recent - GET")(async () => {
      const { searchParams } = new URL(request.url);
      const company = searchParams.get("company");
      const limit = parseInt(searchParams.get("limit") || "10");

      if (!company) {
        throw new Error("Company parameter is required");
      }

      const transactions: RecentTransaction[] = [];

      // Get recent Sales Invoices
      const salesInvoices = await frappeClient.call.get("frappe.client.get_list", {
        doctype: "Sales Invoice",
        fields: ["name"],
        filters: [["company", "=", company]],
        order_by: "posting_date desc",
        limit: limit / 4,
      });

      for (const invoice of salesInvoices.message || []) {
        const details = await frappeClient.call.get("frappe.client.get", {
          doctype: "Sales Invoice",
          name: invoice.name,
        });

        if (details && details.message) {
          transactions.push({
            id: details.message.name,
            type: "sale",
            date: details.message.posting_date,
            description: `Sales Invoice - ${details.message.customer}`,
            amount: details.message.grand_total || 0,
            status: details.message.status,
          });
        }
      }

      // Get recent Purchase Invoices
      const purchaseInvoices = await frappeClient.call.get("frappe.client.get_list", {
        doctype: "Purchase Invoice",
        fields: ["name"],
        filters: [["company", "=", company]],
        order_by: "posting_date desc",
        limit: limit / 4,
      });

      for (const invoice of purchaseInvoices.message || []) {
        const details = await frappeClient.call.get("frappe.client.get", {
          doctype: "Purchase Invoice",
          name: invoice.name,
        });

        if (details && details.message) {
          transactions.push({
            id: details.message.name,
            type: "purchase",
            date: details.message.posting_date,
            description: `Purchase Invoice - ${details.message.supplier}`,
            amount: details.message.grand_total || 0,
            status: details.message.status,
          });
        }
      }

      // Get recent Expense Claims
      const expenseClaims = await frappeClient.call.get("frappe.client.get_list", {
        doctype: "Expense Claim",
        fields: ["name"],
        filters: [["company", "=", company]],
        order_by: "posting_date desc",
        limit: limit / 4,
      });

      for (const expense of expenseClaims.message || []) {
        const details = await frappeClient.call.get("frappe.client.get", {
          doctype: "Expense Claim",
          name: expense.name,
        });

        if (details && details.message) {
          transactions.push({
            id: details.message.name,
            type: "expense",
            date: details.message.posting_date,
            description: `Expense - ${details.message.expense_type}`,
            amount: details.message.total_amount || 0,
            status: details.message.status,
          });
        }
      }

      // Get recent Payment Entries
      const paymentEntries = await frappeClient.call.get("frappe.client.get_list", {
        doctype: "Payment Entry",
        fields: ["name"],
        filters: [["company", "=", company]],
        order_by: "posting_date desc",
        limit: limit / 4,
      });

      for (const payment of paymentEntries.message || []) {
        const details = await frappeClient.call.get("frappe.client.get", {
          doctype: "Payment Entry",
          name: payment.name,
        });

        if (details && details.message) {
          transactions.push({
            id: details.message.name,
            type: "payment",
            date: details.message.posting_date,
            description: `Payment - ${details.message.party_type}: ${details.message.party}`,
            amount: details.message.paid_amount || details.message.received_amount || 0,
            status: details.message.status,
          });
        }
      }

      // Sort all transactions by date and return the most recent ones
      return {
        transactions: transactions
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, limit),
      };
    })
  );
}