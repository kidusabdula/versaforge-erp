// app/api/accounting/expenses/[name]/route.ts
import { NextRequest } from "next/server";
import { frappeClient } from "@/lib/frappe-client";
import { handleApiRequest, withEndpointLogging } from "@/lib/api-template";
import { ExpenseRecord } from "@/types/accounting";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;          // <-- await the Promise

  return handleApiRequest<{ expense: ExpenseRecord }>(
    withEndpointLogging(`/api/accounting/expenses/${name} - GET`)(
      async () => {
        const fullExpense = await frappeClient.call.get("frappe.client.get", {
          doctype: "Expense",
          name,
        });

        if (!fullExpense?.message) {
          throw new Error("Expense not found");
        }

        const doc = fullExpense.message;

        const expense: ExpenseRecord = {
          name: doc.name,
          expense_type: doc.expense_type,
          posting_date: doc.posting_date,
          amount: doc.amount,
          tax_amount: doc.tax_amount,
          total_amount: doc.total_amount,
          description: doc.description,
          paid_by: doc.paid_by,
          status: doc.status,
          employee: doc.employee,
          company: doc.company,
          currency: doc.currency,
          approval_status: doc.approval_status,
          remark: doc.remark,
          attachments: doc.attachments || [],
        };

        return { expense };
      }
    ),
    { requireAuth: true }
  );
}