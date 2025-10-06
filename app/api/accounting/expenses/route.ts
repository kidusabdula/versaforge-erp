// app/api/accounting/expenses/route.ts
import { NextRequest } from "next/server";
import { frappeClient } from "@/lib/frappe-client";
import { handleApiRequest, withEndpointLogging } from "@/lib/api-template";
import { ExpenseRecord } from "@/types/accounting";
import { Filter } from "frappe-js-sdk/lib/db/types";

// GET - Fetch expense records
export async function GET(request: NextRequest) {
  return handleApiRequest<{ expenses: ExpenseRecord[] }>(
    withEndpointLogging("/api/accounting/expenses - GET")(async () => {
      const { searchParams } = new URL(request.url);
      const limit = searchParams.get("limit") || "100";
      const expenseType = searchParams.get("expense_type");
      const status = searchParams.get("status");
      const filters: Filter[] = [];

      // Convert status to proper Frappe value
      if (status) {
        let statusValue = status;
        if (status.toLowerCase() === "paid") statusValue = "Paid";
        else if (status.toLowerCase() === "unpaid") statusValue = "Unpaid";
        else if (status.toLowerCase() === "draft") statusValue = "Draft";
        else if (status.toLowerCase() === "submitted")
          statusValue = "Submitted";

        filters.push(["status", "=", statusValue]);
      }

      if (expenseType) filters.push(["expense_type", "=", expenseType]);

      console.log("Using filters:", filters);

      // Step 1: Get just the list of expense claim names
      const expenseNames = await frappeClient.db.getDocList<{ name: string }>(
        "Expense Claim", // Reverted back to "Expense Claim"
        {
          fields: ["name"],
          filters: filters.length > 0 ? filters : undefined,
          orderBy: { field: "posting_date", order: "desc" },
          limit: parseInt(limit),
        }
      );

      console.log(`Found ${expenseNames.length} expense claims`);

      // Step 2: For each expense claim, get the full document with details
      const expensesWithDetails = await Promise.all(
        expenseNames.map(async (expense) => {
          try {
            // Use frappe.client.get to get the entire document
            const fullExpense = await frappeClient.call.get(
              "frappe.client.get",
              {
                doctype: "Expense Claim", // Reverted back to "Expense Claim"
                name: expense.name,
              }
            );

            if (fullExpense && fullExpense.message) {
              const doc = fullExpense.message;
              return {
                name: doc.name,
                expense_type: doc.expense_type,
                posting_date: doc.posting_date,
                amount: doc.total_amount,
                tax_amount: doc.total_taxes_and_charges,
                total_amount: doc.total_sanctioned_amount,
                description: doc.description,
                paid_by: doc.paid_by,
                status: doc.status,
                employee: doc.employee,
                company: doc.company,
                currency: doc.currency,
                approval_status: doc.approval_status,
                remark: doc.remark,
                docstatus: doc.docstatus,
              } as ExpenseRecord;
            }
            return null;
          } catch (error) {
            console.error(`Error fetching expense ${expense.name}:`, error);
            return null;
          }
        })
      );

      // Filter out any null results
      const validExpenses = expensesWithDetails.filter(
        (expense) => expense !== null
      ) as ExpenseRecord[];

      return { expenses: validExpenses };
    })
  );
}

// POST - Create new expense record
export async function POST(request: NextRequest) {
  return handleApiRequest<{ expense: ExpenseRecord }>(
    withEndpointLogging("/api/accounting/expenses - POST")(async () => {
      const data = await request.json();

      if (
        !data.expense_type ||
        !data.posting_date ||
        !data.amount ||
        !data.paid_by
      ) {
        throw new Error(
          "Missing required fields: expense_type, posting_date, amount, paid_by"
        );
      }

      // Create the complete document
      const completeDoc = {
        doctype: "Expense Claim", // Reverted back to "Expense Claim"
        ...data,
        status: "Draft",
        docstatus: 0,
      };

      // Use frappe.client.insert to create the document
      const result = await frappeClient.call.post("frappe.client.insert", {
        doc: completeDoc,
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to create expense claim");
      }

      // Fetch the complete document
      const expense = await frappeClient.db.getDoc<ExpenseRecord>(
        "Expense Claim", // Reverted back to "Expense Claim"
        result.message.name
      );

      return { expense };
    })
  );
}

// PUT - Update expense record
export async function PUT(request: NextRequest) {
  return handleApiRequest<{ expense: ExpenseRecord }>(
    withEndpointLogging("/api/accounting/expenses - PUT")(async () => {
      const { searchParams } = new URL(request.url);
      const name = searchParams.get("name");
      if (!name) throw new Error("Expense name parameter is required");

      // Get the full document first
      const currentDoc = await frappeClient.call.get("frappe.client.get", {
        doctype: "Expense Claim", // Reverted back to "Expense Claim"
        name: name,
      });

      if (!currentDoc || !currentDoc.message) {
        throw new Error("Expense claim not found");
      }

      // Update the document with new data
      const updateData = await request.json();
      const updatedDoc = {
        ...currentDoc.message,
        ...updateData,
        doctype: "Expense Claim", // Reverted back to "Expense Claim"
        name: name, // Ensure name is preserved
      };

      // Use frappe.client.save to update the document
      const result = await frappeClient.call.post("frappe.client.save", {
        doc: updatedDoc,
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to update expense claim");
      }

      return { expense: result.message as ExpenseRecord };
    })
  );
}

// DELETE - Delete expense record
export async function DELETE(request: NextRequest) {
  return handleApiRequest<{ message: string }>(
    withEndpointLogging("/api/accounting/expenses - DELETE")(async () => {
      const { searchParams } = new URL(request.url);
      const name = searchParams.get("name");
      if (!name) throw new Error("Expense name parameter is required");

      await frappeClient.call.post("frappe.client.delete", {
        doctype: "Expense Claim", // Reverted back to "Expense Claim"
        name: name,
      });

      return { message: `Expense claim ${name} deleted successfully` };
    })
  );
}
