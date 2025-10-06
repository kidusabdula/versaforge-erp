// app/api/accounting/reports/detailed/route.ts
import { NextRequest } from "next/server";
import { frappeClient } from "@/lib/frappe-client";
import { handleApiRequest, withEndpointLogging } from "@/lib/api-template";

interface DetailedReport {
  report_type: "Income" | "CashFlow" | "Balance";
  from_date: string;
  to_date: string;
  company: string;
  data: Record<string, any>;
  details: any[];
}

export async function GET(request: NextRequest) {
  return handleApiRequest<{ report: DetailedReport }>(
    withEndpointLogging("/api/accounting/reports/detailed - GET")(async () => {
      const { searchParams } = new URL(request.url);
      const reportType = searchParams.get("report_type") as "Income" | "CashFlow" | "Balance";
      const fromDate = searchParams.get("from_date");
      const toDate = searchParams.get("to_date");
      const company = searchParams.get("company");

      if (!reportType || !fromDate || !toDate || !company) {
        throw new Error("Missing required parameters: report_type, from_date, to_date, company");
      }

      let reportData: Record<string, any> = {};
      let details: any[] = [];

      if (reportType === "Income") {
        const result = await generateDetailedIncomeStatement(company, fromDate, toDate);
        reportData = result.summary;
        details = result.details;
      } else if (reportType === "CashFlow") {
        const result = await generateDetailedCashFlowStatement(company, fromDate, toDate);
        reportData = result.summary;
        details = result.details;
      } else if (reportType === "Balance") {
        const result = await generateDetailedBalanceSheet(company, toDate);
        reportData = result.summary;
        details = result.details;
      }

      const report: DetailedReport = {
        report_type: reportType,
        from_date: fromDate,
        to_date: toDate,
        company,
        data: reportData,
        details,
      };

      return { report };
    })
  );
}

async function generateDetailedIncomeStatement(company: string, fromDate: string, toDate: string) {
  // Get Sales Invoices with details
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
  const salesDetails: any[] = [];
  
  // Fetch each Sales Invoice to get the details
  for (const invoice of salesInvoices.message || []) {
    const invoiceDetails = await frappeClient.call.get("frappe.client.get", {
      doctype: "Sales Invoice",
      name: invoice.name
    });
    
    if (invoiceDetails && invoiceDetails.message) {
      const grandTotal = invoiceDetails.message.grand_total || 0;
      const taxes = invoiceDetails.message.total_taxes_and_charges || 0;
      
      totalRevenue += grandTotal;
      totalTax += taxes;
      
      salesDetails.push({
        invoice: invoiceDetails.message.name,
        customer: invoiceDetails.message.customer,
        date: invoiceDetails.message.posting_date,
        amount: grandTotal,
        tax: taxes,
      });
    }
  }
  
  // Get Purchase Invoices with details
  const purchaseInvoices = await frappeClient.call.get("frappe.client.get_list", {
    doctype: "Purchase Invoice",
    fields: ["name"],
    filters: [
      ["company", "=", company],
      ["posting_date", "between", [fromDate, toDate]],
      ["docstatus", "=", 1],
    ],
  });
  
  let totalCOGS = 0;
  const purchaseDetails: any[] = [];
  
  // Fetch each Purchase Invoice to get the details
  for (const invoice of purchaseInvoices.message || []) {
    const invoiceDetails = await frappeClient.call.get("frappe.client.get", {
      doctype: "Purchase Invoice",
      name: invoice.name
    });
    
    if (invoiceDetails && invoiceDetails.message) {
      const grandTotal = invoiceDetails.message.grand_total || 0;
      
      totalCOGS += grandTotal;
      
      purchaseDetails.push({
        invoice: invoiceDetails.message.name,
        supplier: invoiceDetails.message.supplier,
        date: invoiceDetails.message.posting_date,
        amount: grandTotal,
      });
    }
  }
  
  // Get Expense Claims with details
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
  const expenseDetails: any[] = [];
  
  // Fetch each Expense Claim to get the details
  for (const expense of expenseClaims.message || []) {
    const expenseDetailsData = await frappeClient.call.get("frappe.client.get", {
      doctype: "Expense Claim",
      name: expense.name
    });
    
    if (expenseDetailsData && expenseDetailsData.message) {
      const totalAmount = expenseDetailsData.message.total_amount || 0;
      const expenseType = expenseDetailsData.message.expense_type;
      
      totalExpenses += totalAmount;
      
      expenseDetails.push({
        expense: expenseDetailsData.message.name,
        type: expenseType,
        date: expenseDetailsData.message.posting_date,
        amount: totalAmount,
        employee: expenseDetailsData.message.employee,
      });
    }
  }
  
  const grossProfit = totalRevenue - totalCOGS;
  const operatingIncome = grossProfit - totalExpenses;
  const netIncome = operatingIncome - totalTax;
  
  return {
    summary: {
      Revenue: totalRevenue,
      "Cost of Goods Sold": totalCOGS,
      "Gross Profit": grossProfit,
      "Operating Expenses": totalExpenses,
      "Operating Income": operatingIncome,
      Tax: totalTax,
      "Net Income": netIncome,
    },
    details: [
      ...salesDetails.map(item => ({ ...item, category: "Revenue" })),
      ...purchaseDetails.map(item => ({ ...item, category: "Cost of Goods Sold" })),
      ...expenseDetails.map(item => ({ ...item, category: "Operating Expenses" })),
    ],
  };
}

async function generateDetailedCashFlowStatement(company: string, fromDate: string, toDate: string) {
  // Get Payment Entries with details
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
  const paymentDetails: any[] = [];
  
  // Fetch each Payment Entry to get the details
  for (const payment of paymentEntries.message || []) {
    const paymentDetailsData = await frappeClient.call.get("frappe.client.get", {
      doctype: "Payment Entry",
      name: payment.name
    });
    
    if (paymentDetailsData && paymentDetailsData.message) {
      const amount = paymentDetailsData.message.paid_amount || paymentDetailsData.message.received_amount || 0;
      
      if (paymentDetailsData.message.payment_type === "Receive") {
        cashInflows += amount;
        paymentDetails.push({
          payment: paymentDetailsData.message.name,
          type: "Inflow",
          party: paymentDetailsData.message.party,
          date: paymentDetailsData.message.posting_date,
          amount,
          mode: paymentDetailsData.message.mode_of_payment,
        });
      } else {
        cashOutflows += amount;
        paymentDetails.push({
          payment: paymentDetailsData.message.name,
          type: "Outflow",
          party: paymentDetailsData.message.party,
          date: paymentDetailsData.message.posting_date,
          amount,
          mode: paymentDetailsData.message.mode_of_payment,
        });
      }
    }
  }
  
  const netCashFlow = cashInflows - cashOutflows;
  
  return {
    summary: {
      "Cash Inflows": cashInflows,
      "Cash Outflows": cashOutflows,
      "Net Cash Flow": netCashFlow,
    },
    details: paymentDetails,
  };
}

async function generateDetailedBalanceSheet(company: string, toDate: string) {
  // Get GL Entries with details
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
  const accountDetails: Record<string, any[]> = {};
  
  // Fetch each GL Entry to get the details
  for (const entry of glEntries.message || []) {
    const entryDetails = await frappeClient.call.get("frappe.client.get", {
      doctype: "GL Entry",
      name: entry.name
    });
    
    if (entryDetails && entryDetails.message) {
      const account = entryDetails.message.account;
      const debit = entryDetails.message.debit || 0;
      const credit = entryDetails.message.credit || 0;
      
      if (!accountBalances[account]) {
        accountBalances[account] = 0;
        accountDetails[account] = [];
      }
      
      const balance = debit - credit;
      accountBalances[account] += balance;
      
      accountDetails[account].push({
        entry: entryDetails.message.name,
        date: entryDetails.message.posting_date,
        debit,
        credit,
        balance,
        voucher_type: entryDetails.message.voucher_type,
        voucher_no: entryDetails.message.voucher_no,
      });
    }
  }
  
  // Get Account information to categorize them
  const accounts = await frappeClient.call.get("frappe.client.get_list", {
    doctype: "Account",
    fields: ["name"],
    filters: [["company", "=", company]],
  });
  
  const categorizedBalances: Record<string, number> = {
    Assets: 0,
    Liabilities: 0,
    Equity: 0,
  };
  
  const categorizedDetails: Record<string, any[]> = {
    Assets: [],
    Liabilities: [],
    Equity: [],
  };
  
  // Fetch each Account to get its root_type
  for (const account of accounts.message || []) {
    const accountInfo = await frappeClient.call.get("frappe.client.get", {
      doctype: "Account",
      name: account.name
    });
    
    if (accountInfo && accountInfo.message) {
      const balance = accountBalances[account.name] || 0;
      const rootType = accountInfo.message.root_type;
      
      if (rootType === "Asset") {
        categorizedBalances["Assets"] += balance;
        categorizedDetails["Assets"].push({
          account: account.name,
          account_name: accountInfo.message.account_name,
          balance,
          entries: accountDetails[account.name] || [],
        });
      } else if (rootType === "Liability") {
        categorizedBalances["Liabilities"] += balance;
        categorizedDetails["Liabilities"].push({
          account: account.name,
          account_name: accountInfo.message.account_name,
          balance,
          entries: accountDetails[account.name] || [],
        });
      } else if (rootType === "Equity") {
        categorizedBalances["Equity"] += balance;
        categorizedDetails["Equity"].push({
          account: account.name,
          account_name: accountInfo.message.account_name,
          balance,
          entries: accountDetails[account.name] || [],
        });
      }
    }
  }
  
  return {
    summary: categorizedBalances,
    details: [
      ...categorizedDetails.Assets.map(item => ({ ...item, category: "Assets" })),
      ...categorizedDetails.Liabilities.map(item => ({ ...item, category: "Liabilities" })),
      ...categorizedDetails.Equity.map(item => ({ ...item, category: "Equity" })),
    ],
  };
}