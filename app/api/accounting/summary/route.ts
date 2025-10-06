// app/api/accounting/summary/route.ts
import { NextRequest } from "next/server";
import { frappeClient } from "@/lib/frappe-client";
import { handleApiRequest, withEndpointLogging } from "@/lib/api-template";

interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  cashBalance: number;
  pendingPayments: number;
  overduePayments: number;
}

export async function GET(request: NextRequest) {
  return handleApiRequest<{ summary: FinancialSummary }>(
    withEndpointLogging("/api/accounting/summary - GET")(async () => {
      const { searchParams } = new URL(request.url);
      const company = searchParams.get("company");
      const toDate =
        searchParams.get("to_date") || new Date().toISOString().split("T")[0];
      const fromDate =
        searchParams.get("from_date") ||
        new Date(new Date().setDate(new Date().getDate() - 30))
          .toISOString()
          .split("T")[0];
      if (!company) {
        throw new Error("Company parameter is required");
      }
      // Get current month's financial data
      const currentMonthData = await getFinancialData(
        company,
        fromDate,
        toDate
      );
      // Get cash balance from Cash account
      const cashBalance = await getCashBalance(company);
      // Get payment status
      const paymentStatus = await getPaymentStatus(company);
      const summary: FinancialSummary = {
        totalRevenue: currentMonthData.totalRevenue,
        totalExpenses: currentMonthData.totalExpenses,
        netProfit: currentMonthData.netIncome,
        cashBalance,
        pendingPayments: paymentStatus.pending,
        overduePayments: paymentStatus.overdue,
      };
      return { summary };
    })
  );
}

async function getFinancialData(
  company: string,
  fromDate: string,
  toDate: string
) {
  // Get Sales Invoices (Revenue)
  const salesInvoices = await frappeClient.call.get("frappe.client.get_list", {
    doctype: "Sales Invoice",
    fields: ["name"],
    filters: [
      ["company", "=", company],
      ["posting_date", "between", [fromDate, toDate]],
      ["docstatus", "=", 1],
    ],
  });
  let totalRevenue = 0;
  let totalTax = 0;
  // Fetch each Sales Invoice to get the details
  for (const invoice of salesInvoices.message || []) {
    const invoiceDetails = await frappeClient.call.get("frappe.client.get", {
      doctype: "Sales Invoice",
      name: invoice.name,
    });
    if (invoiceDetails && invoiceDetails.message) {
      totalRevenue += invoiceDetails.message.grand_total || 0;
      totalTax += invoiceDetails.message.total_taxes_and_charges || 0;
    }
  }
  // Get Purchase Invoices (Cost of Goods Sold)
  const purchaseInvoices = await frappeClient.call.get(
    "frappe.client.get_list",
    {
      doctype: "Purchase Invoice",
      fields: ["name"],
      filters: [
        ["company", "=", company],
        ["posting_date", "between", [fromDate, toDate]],
        ["docstatus", "=", 1],
      ],
    }
  );
  let totalCOGS = 0;
  // Fetch each Purchase Invoice to get the details
  for (const invoice of purchaseInvoices.message || []) {
    const invoiceDetails = await frappeClient.call.get("frappe.client.get", {
      doctype: "Purchase Invoice",
      name: invoice.name,
    });
    if (invoiceDetails && invoiceDetails.message) {
      totalCOGS += invoiceDetails.message.grand_total || 0;
    }
  }
  // Get Expense Claims (Operating Expenses)
  const expenseClaims = await frappeClient.call.get("frappe.client.get_list", {
    doctype: "Expense Claim",
    fields: ["name"],
    filters: [
      ["company", "=", company],
      ["posting_date", "between", [fromDate, toDate]],
      ["docstatus", "=", 1],
    ],
  });
  let totalExpenses = 0;
  // Fetch each Expense Claim to get the details
  for (const expense of expenseClaims.message || []) {
    const expenseDetails = await frappeClient.call.get("frappe.client.get", {
      doctype: "Expense Claim",
      name: expense.name,
    });
    if (expenseDetails && expenseDetails.message) {
      totalExpenses += expenseDetails.message.total_amount || 0;
    }
  }
  const grossProfit = totalRevenue - totalCOGS;
  const operatingIncome = grossProfit - totalExpenses;
  const netIncome = operatingIncome - totalTax;
  return {
    totalRevenue,
    totalExpenses: totalCOGS + totalExpenses,
    netIncome,
  };
}

async function getCashBalance(company: string) {
  // Get Cash account balance
  const cashAccounts = await frappeClient.call.get("frappe.client.get_list", {
    doctype: "Account",
    fields: ["name"],
    filters: [
      ["company", "=", company],
      ["account_name", "like", "%Cash%"],
      ["is_group", "=", 0],
    ],
  });
  let cashBalance = 0;
  // Fetch each Cash account to get its balance
  for (const account of cashAccounts.message || []) {
    const accountDetails = await frappeClient.call.get("frappe.client.get", {
      doctype: "Account",
      name: account.name,
    });
    if (accountDetails && accountDetails.message) {
      cashBalance += accountDetails.message.opening_balance || 0;
    }
  }
  return cashBalance;
}

async function getPaymentStatus(company: string) {
  const today = new Date().toISOString().split("T")[0];
  // Get Sales Invoices with payment status
  const salesInvoices = await frappeClient.call.get("frappe.client.get_list", {
    doctype: "Sales Invoice",
    fields: ["name"],
    filters: [
      ["company", "=", company],
      ["docstatus", "=", 1],
      ["status", "in", ["Unpaid", "Overdue"]],
    ],
  });
  let pending = 0;
  let overdue = 0;
  // Fetch each Sales Invoice to check payment status
  for (const invoice of salesInvoices.message || []) {
    const invoiceDetails = await frappeClient.call.get("frappe.client.get", {
      doctype: "Sales Invoice",
      name: invoice.name,
    });
    if (invoiceDetails && invoiceDetails.message) {
      const dueDate = invoiceDetails.message.due_date;
      const outstandingAmount = invoiceDetails.message.outstanding_amount || 0;
      if (outstandingAmount > 0) {
        pending += outstandingAmount;
        if (dueDate && dueDate < today) {
          overdue += outstandingAmount;
        }
      }
    }
  }
  return { pending, overdue };
}