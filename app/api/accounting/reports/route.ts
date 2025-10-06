// app/api/accounting/reports/route.ts
import { NextRequest } from "next/server";
import { frappeClient } from "@/lib/frappe-client";
import { handleApiRequest, withEndpointLogging } from "@/lib/api-template";
import { FinancialReport } from "@/types/accounting";

// GET - Generate financial report
export async function GET(request: NextRequest) {
  return handleApiRequest<{ report: FinancialReport }>(
    withEndpointLogging("/api/accounting/reports - GET")(async () => {
      const { searchParams } = new URL(request.url);
      const reportType = searchParams.get("report_type") as
        | "Income"
        | "CashFlow"
        | "Balance";
      const fromDate = searchParams.get("date_from");
      const toDate = searchParams.get("date_to");
      const company = searchParams.get("company");
      if (!reportType || !fromDate || !toDate || !company) {
        throw new Error(
          "Missing required parameters: report_type, date_from, date_to, company" // Updated
        );
      }
      let reportData: Record<string, number> = {};
      if (reportType === "Income") {
        // Generate Income Statement
        reportData = await generateIncomeStatement(company, fromDate, toDate);
      } else if (reportType === "CashFlow") {
        // Generate Cash Flow Statement
        reportData = await generateCashFlowStatement(company, fromDate, toDate);
      } else if (reportType === "Balance") {
        // Generate Balance Sheet
        reportData = await generateBalanceSheet(company, toDate);
      }
      const report: FinancialReport = {
        report_type: reportType,
        from_date: fromDate,
        to_date: toDate,
        company,
        data: reportData,
      };
      return { report };
    })
  );
}

// Helper function to generate Income Statement
async function generateIncomeStatement(
  company: string,
  fromDate: string,
  toDate: string
): Promise<Record<string, number>> {
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
    Revenue: totalRevenue,
    "Cost of Goods Sold": totalCOGS,
    "Gross Profit": grossProfit,
    "Operating Expenses": totalExpenses,
    "Operating Income": operatingIncome,
    Tax: totalTax,
    "Net Income": netIncome,
  };
}

// Helper function to generate Cash Flow Statement
async function generateCashFlowStatement(
  company: string,
  fromDate: string,
  toDate: string
): Promise<Record<string, number>> {
  // Get Payment Entries (Cash Inflows and Outflows)
  const paymentEntries = await frappeClient.call.get("frappe.client.get_list", {
    doctype: "Payment Entry",
    fields: ["name"],
    filters: [
      ["company", "=", company],
      ["posting_date", "between", [fromDate, toDate]],
      ["docstatus", "=", 1],
    ],
  });

  let cashInflows = 0;
  let cashOutflows = 0;

  // Fetch each Payment Entry to get the details
  for (const payment of paymentEntries.message || []) {
    const paymentDetails = await frappeClient.call.get("frappe.client.get", {
      doctype: "Payment Entry",
      name: payment.name,
    });

    if (paymentDetails && paymentDetails.message) {
      if (paymentDetails.message.payment_type === "Receive") {
        cashInflows +=
          paymentDetails.message.received_amount ||
          paymentDetails.message.paid_amount ||
          0;
      } else {
        cashOutflows +=
          paymentDetails.message.paid_amount ||
          paymentDetails.message.received_amount ||
          0;
      }
    }
  }

  const netCashFlow = cashInflows - cashOutflows;

  return {
    "Cash Inflows": cashInflows,
    "Cash Outflows": cashOutflows,
    "Net Cash Flow": netCashFlow,
  };
}

// Helper function to generate Balance Sheet
async function generateBalanceSheet(
  company: string,
  toDate: string
): Promise<Record<string, number>> {
  // Get GL Entries
  const glEntries = await frappeClient.call.get("frappe.client.get_list", {
    doctype: "GL Entry",
    fields: ["name"],
    filters: [
      ["company", "=", company],
      ["posting_date", "<=", toDate],
      ["docstatus", "=", 1],
    ],
  });

  const accountBalances: Record<string, number> = {};

  // Fetch each GL Entry to get the details
  for (const entry of glEntries.message || []) {
    const entryDetails = await frappeClient.call.get("frappe.client.get", {
      doctype: "GL Entry",
      name: entry.name,
    });

    if (entryDetails && entryDetails.message) {
      const account = entryDetails.message.account;
      const debit = entryDetails.message.debit || 0;
      const credit = entryDetails.message.credit || 0;

      if (!accountBalances[account]) {
        accountBalances[account] = 0;
      }
      accountBalances[account] += debit - credit;
    }
  }

  // Get Account details to categorize them
  const accountDetails = await frappeClient.call.get("frappe.client.get_list", {
    doctype: "Account",
    fields: ["name"],
    filters: [["company", "=", company]],
  });

  const categorizedBalances: Record<string, number> = {
    Assets: 0,
    Liabilities: 0,
    Equity: 0,
  };

  // Fetch each Account to get its root_type
  for (const account of accountDetails.message || []) {
    const accountInfo = await frappeClient.call.get("frappe.client.get", {
      doctype: "Account",
      name: account.name,
    });

    if (accountInfo && accountInfo.message) {
      const balance = accountBalances[account.name] || 0;
      if (accountInfo.message.root_type === "Asset") {
        categorizedBalances["Assets"] += balance;
      } else if (accountInfo.message.root_type === "Liability") {
        categorizedBalances["Liabilities"] += balance;
      } else if (accountInfo.message.root_type === "Equity") {
        categorizedBalances["Equity"] += balance;
      }
    }
  }

  return categorizedBalances;
}
