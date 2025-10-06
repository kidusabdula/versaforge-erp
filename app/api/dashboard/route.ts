// app/api/dashboard/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';

interface DashboardSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  cashBalance: number;
  pendingPayments: number;
  overduePayments: number;
  salesCount: number;
  purchaseCount: number;
  inventoryValue: number;
  customerCount: number;
  supplierCount: number;
}

interface RecentTransaction {
  id: string;
  type: "sale" | "purchase" | "expense" | "payment";
  date: string;
  description: string;
  amount: number;
  status: string;
  customer?: string;
  supplier?: string;
}

interface TopItem {
  item_code: string;
  item_name: string;
  quantity: number;
  amount: number;
}

interface CustomerMetric {
  name: string;
  total_purchases: number;
  last_purchase_date: string;
}

interface SupplierMetric {
  name: string;
  total_purchases: number;
  last_purchase_date: string;
}

interface InventoryAlert {
  item_code: string;
  item_name: string;
  current_stock: number;
  reorder_level: number;
  status: "low" | "out";
}

interface ExpenseBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

interface SalesTrend {
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface DashboardData {
  summary: DashboardSummary;
  recentTransactions: RecentTransaction[];
  topSellingItems: TopItem[];
  salesByCategory: { category: string; amount: number }[];
  customerMetrics: CustomerMetric[];
  supplierMetrics: SupplierMetric[];
  inventoryAlerts: InventoryAlert[];
  expenseBreakdown: ExpenseBreakdown[];
  salesTrends: SalesTrend[];
}

export async function GET(request: NextRequest) {
  return handleApiRequest<DashboardData>(
    withEndpointLogging('/api/dashboard - GET')(async () => {
      const { searchParams } = new URL(request.url);
      const company = searchParams.get('company') || 'Ma Beignet (Demo)';
      const dateFrom = searchParams.get('date_from') || 
        new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
      const dateTo = searchParams.get('date_to') || 
        new Date().toISOString().split('T')[0];
      
      // Fetch all dashboard data in parallel
      const [
        summary,
        recentTransactions,
        topSellingItems,
        salesByCategory,
        customerMetrics,
        supplierMetrics,
        inventoryAlerts,
        expenseBreakdown,
        salesTrends
      ] = await Promise.all([
        getFinancialSummary(company, dateFrom, dateTo),
        getRecentTransactions(company, dateFrom, dateTo),
        getTopSellingItems(company, dateFrom, dateTo),
        getSalesByCategory(company, dateFrom, dateTo),
        getCustomerMetrics(company, dateFrom, dateTo),
        getSupplierMetrics(company, dateFrom, dateTo),
        getInventoryAlerts(company),
        getExpenseBreakdown(company, dateFrom, dateTo),
        getSalesTrends(company, dateFrom, dateTo)
      ]);
      
      return {
        summary,
        recentTransactions,
        topSellingItems,
        salesByCategory,
        customerMetrics,
        supplierMetrics,
        inventoryAlerts,
        expenseBreakdown,
        salesTrends
      };
    })
  );
}

async function getFinancialSummary(company: string, dateFrom: string, dateTo: string): Promise<DashboardSummary> {
  try {
    // Get total revenue from Sales Invoices
    const salesInvoices = await frappeClient.call.get("frappe.client.get_list", {
      doctype: "Sales Invoice",
      fields: ["name"],
      filters: [
        ["company", "=", company],
        ["posting_date", "between", [dateFrom, dateTo]],
        ["docstatus", "=", 1]
      ],
      limit: 1000
    });
    
    let totalRevenue = 0;
    let pendingPayments = 0;
    let overduePayments = 0;
    
    // Fetch each Sales Invoice to get the details
    for (const invoice of salesInvoices.message || []) {
      const invoiceDetails = await frappeClient.call.get("frappe.client.get", {
        doctype: "Sales Invoice",
        name: invoice.name
      });
      
      if (invoiceDetails && invoiceDetails.message) {
        totalRevenue += invoiceDetails.message.grand_total || 0;
        pendingPayments += invoiceDetails.message.outstanding_amount || 0;
        
        if (invoiceDetails.message.status === 'Overdue') {
          overduePayments += invoiceDetails.message.outstanding_amount || 0;
        }
      }
    }
    
    // Get total expenses from Purchase Invoices
    const purchaseInvoices = await frappeClient.call.get("frappe.client.get_list", {
      doctype: "Purchase Invoice",
      fields: ["name"],
      filters: [
        ["company", "=", company],
        ["posting_date", "between", [dateFrom, dateTo]],
        ["docstatus", "=", 1]
      ],
      limit: 1000
    });
    
    let totalExpenses = 0;
    
    // Fetch each Purchase Invoice to get the details
    for (const invoice of purchaseInvoices.message || []) {
      const invoiceDetails = await frappeClient.call.get("frappe.client.get", {
        doctype: "Purchase Invoice",
        name: invoice.name
      });
      
      if (invoiceDetails && invoiceDetails.message) {
        totalExpenses += invoiceDetails.message.grand_total || 0;
      }
    }
    
    // Get cash balance from GL Entry
    const cashBalance = await frappeClient.call.get("frappe.client.get_list", {
      doctype: "GL Entry",
      fields: ["name"],
      filters: [
        ["company", "=", company],
        ["account", "=", 'Cash - MB'],
        ["posting_date", "<=", dateTo],
        ["docstatus", "=", 1]
      ],
      limit: 1000
    });
    
    let cashBalanceTotal = 0;
    
    // Fetch each GL Entry to get the details
    for (const entry of cashBalance.message || []) {
      const entryDetails = await frappeClient.call.get("frappe.client.get", {
        doctype: "GL Entry",
        name: entry.name
      });
      
      if (entryDetails && entryDetails.message) {
        cashBalanceTotal += (entryDetails.message.debit || 0) - (entryDetails.message.credit || 0);
      }
    }
    
    // Get inventory value
    const inventoryValue = await frappeClient.call.get("frappe.client.get_list", {
      doctype: "Bin",
      fields: ["name"],
      filters: [
        ["warehouse", "=", 'Stores - MB'],
        ["actual_qty", ">", 0]
      ],
      limit: 1000
    });
    
    let totalInventoryValue = 0;
    
    // Fetch each Bin to get the details
    for (const bin of inventoryValue.message || []) {
      const binDetails = await frappeClient.call.get("frappe.client.get", {
        doctype: "Bin",
        name: bin.name
      });
      
      if (binDetails && binDetails.message) {
        totalInventoryValue += (binDetails.message.valuation_rate || 0) * binDetails.message.actual_qty;
      }
    }
    
    // Get customer count
    const customers = await frappeClient.call.get("frappe.client.get_list", {
      doctype: "Customer",
      fields: ["name"],
      filters: [["disabled", "=", 0]],
      limit: 1000
    });
    
    // Get supplier count
    const suppliers = await frappeClient.call.get("frappe.client.get_list", {
      doctype: "Supplier",
      fields: ["name"],
      filters: [["disabled", "=", 0]],
      limit: 1000
    });
    
    // Get counts
    const salesCount = salesInvoices.message?.length || 0;
    const purchaseCount = purchaseInvoices.message?.length || 0;
    const customerCount = customers.message?.length || 0;
    const supplierCount = suppliers.message?.length || 0;
    
    // Calculate net profit
    const netProfit = totalRevenue - totalExpenses;
    
    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      cashBalance: cashBalanceTotal,
      pendingPayments,
      overduePayments,
      salesCount,
      purchaseCount,
      inventoryValue: totalInventoryValue,
      customerCount,
      supplierCount
    };
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    return {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      cashBalance: 0,
      pendingPayments: 0,
      overduePayments: 0,
      salesCount: 0,
      purchaseCount: 0,
      inventoryValue: 0,
      customerCount: 0,
      supplierCount: 0
    };
  }
}

async function getRecentTransactions(company: string, dateFrom: string, dateTo: string): Promise<RecentTransaction[]> {
  try {
    // Get recent Sales Invoices
    const salesInvoices = await frappeClient.call.get("frappe.client.get_list", {
      doctype: "Sales Invoice",
      fields: ["name"],
      filters: [
        ["company", "=", company],
        ["posting_date", "between", [dateFrom, dateTo]],
        ["docstatus", "=", 1]
      ],
      orderBy: { field: "posting_date", order: "desc" },
      limit: 5
    });
    
    // Get recent Purchase Invoices
    const purchaseInvoices = await frappeClient.call.get("frappe.client.get_list", {
      doctype: "Purchase Invoice",
      fields: ["name"],
      filters: [
        ["company", "=", company],
        ["posting_date", "between", [dateFrom, dateTo]],
        ["docstatus", "=", 1]
      ],
      orderBy: { field: "posting_date", order: "desc" },
      limit: 5
    });
    
    // Get recent Payments
    const payments = await frappeClient.call.get("frappe.client.get_list", {
      doctype: "Payment Entry",
      fields: ["name"],
      filters: [
        ["company", "=", company],
        ["posting_date", "between", [dateFrom, dateTo]],
        ["docstatus", "=", 1]
      ],
      orderBy: { field: "posting_date", order: "desc" },
      limit: 5
    });
    
    // Combine and format transactions
    const transactions: RecentTransaction[] = [];
    
    // Add sales invoices
    for (const invoice of salesInvoices.message || []) {
      const invoiceDetails = await frappeClient.call.get("frappe.client.get", {
        doctype: "Sales Invoice",
        name: invoice.name
      });
      
      if (invoiceDetails && invoiceDetails.message) {
        transactions.push({
          id: invoiceDetails.message.name,
          type: 'sale',
          date: invoiceDetails.message.posting_date,
          description: `Sales Invoice to ${invoiceDetails.message.customer}`,
          amount: invoiceDetails.message.grand_total,
          status: invoiceDetails.message.status,
          customer: invoiceDetails.message.customer
        });
      }
    }
    
    // Add purchase invoices
    for (const invoice of purchaseInvoices.message || []) {
      const invoiceDetails = await frappeClient.call.get("frappe.client.get", {
        doctype: "Purchase Invoice",
        name: invoice.name
      });
      
      if (invoiceDetails && invoiceDetails.message) {
        transactions.push({
          id: invoiceDetails.message.name,
          type: 'purchase',
          date: invoiceDetails.message.posting_date,
          description: `Purchase Invoice from ${invoiceDetails.message.supplier}`,
          amount: invoiceDetails.message.grand_total,
          status: invoiceDetails.message.status,
          supplier: invoiceDetails.message.supplier
        });
      }
    }
    
    // Add payments
    for (const payment of payments.message || []) {
      const paymentDetails = await frappeClient.call.get("frappe.client.get", {
        doctype: "Payment Entry",
        name: payment.name
      });
      
      if (paymentDetails && paymentDetails.message) {
        transactions.push({
          id: paymentDetails.message.name,
          type: 'payment',
          date: paymentDetails.message.posting_date,
          description: `Payment ${paymentDetails.message.payment_type} to ${paymentDetails.message.party}`,
          amount: paymentDetails.message.paid_amount || paymentDetails.message.received_amount || 0,
          status: paymentDetails.message.status
        });
      }
    }
    
    // Sort by date and return top 10
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    return [];
  }
}

async function getTopSellingItems(company: string, dateFrom: string, dateTo: string): Promise<TopItem[]> {
  try {
    // Get Sales Invoices within the date range
    const salesInvoices = await frappeClient.call.get("frappe.client.get_list", {
      doctype: "Sales Invoice",
      fields: ["name"],
      filters: [
        ["company", "=", company],
        ["posting_date", "between", [dateFrom, dateTo]],
        ["docstatus", "=", 1]
      ],
      limit: 1000
    });
    
    // Aggregate by item
    const itemMap: Record<string, TopItem> = {};
    
    // Process each sales invoice
    for (const invoice of salesInvoices.message || []) {
      const invoiceDetails = await frappeClient.call.get("frappe.client.get", {
        doctype: "Sales Invoice",
        name: invoice.name
      });
      
      if (invoiceDetails && invoiceDetails.message && invoiceDetails.message.items) {
        // Process each item in the invoice
        for (const item of invoiceDetails.message.items) {
          if (!itemMap[item.item_code]) {
            itemMap[item.item_code] = {
              item_code: item.item_code,
              item_name: item.item_name,
              quantity: 0,
              amount: 0
            };
          }
          
          itemMap[item.item_code].quantity += item.qty || 0;
          itemMap[item.item_code].amount += item.amount || 0;
        }
      }
    }
    
    // Convert to array and sort by amount
    return Object.values(itemMap)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  } catch (error) {
    console.error('Error fetching top selling items:', error);
    return [];
  }
}

async function getSalesByCategory(company: string, dateFrom: string, dateTo: string): Promise<{ category: string; amount: number }[]> {
  try {
    // Get item groups
    const itemGroups = await frappeClient.call.get("frappe.client.get_list", {
      doctype: "Item Group",
      fields: ["name"],
      filters: [
        ["parent_item_group", "=", "All Item Groups"],
        ["is_group", "=", 1]
      ],
      limit: 100
    });
    
    // Get Sales Invoices within the date range
    const salesInvoices = await frappeClient.call.get("frappe.client.get_list", {
      doctype: "Sales Invoice",
      fields: ["name"],
      filters: [
        ["company", "=", company],
        ["posting_date", "between", [dateFrom, dateTo]],
        ["docstatus", "=", 1]
      ],
      limit: 1000
    });
    
    // Initialize category sales
    const categorySales: Record<string, number> = {};
    
    // Initialize with all item groups
    for (const group of itemGroups.message || []) {
      categorySales[group.name] = 0;
    }
    
    // Process each sales invoice
    for (const invoice of salesInvoices.message || []) {
      const invoiceDetails = await frappeClient.call.get("frappe.client.get", {
        doctype: "Sales Invoice",
        name: invoice.name
      });
      
      if (invoiceDetails && invoiceDetails.message && invoiceDetails.message.items) {
        // Process each item in the invoice
        for (const item of invoiceDetails.message.items) {
          // Get item details to find its group
          const itemDetails = await frappeClient.call.get("frappe.client.get", {
            doctype: "Item",
            name: item.item_code
          });
          
          if (itemDetails && itemDetails.message) {
            const itemGroup = itemDetails.message.item_group;
            if (categorySales[itemGroup] !== undefined) {
              categorySales[itemGroup] += item.amount || 0;
            }
          }
        }
      }
    }
    
    // Convert to array and sort by amount
    return Object.entries(categorySales)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  } catch (error) {
    console.error('Error fetching sales by category:', error);
    return [];
  }
}

async function getCustomerMetrics(company: string, dateFrom: string, dateTo: string): Promise<CustomerMetric[]> {
  try {
    // Get Sales Invoices within the date range
    const salesInvoices = await frappeClient.call.get("frappe.client.get_list", {
      doctype: "Sales Invoice",
      fields: ["name"],
      filters: [
        ["company", "=", company],
        ["posting_date", "between", [dateFrom, dateTo]],
        ["docstatus", "=", 1]
      ],
      limit: 1000
    });
    
    // Aggregate by customer
    const customerMap: Record<string, { total_purchases: number; last_purchase_date: string }> = {};
    
    // Process each sales invoice
    for (const invoice of salesInvoices.message || []) {
      const invoiceDetails = await frappeClient.call.get("frappe.client.get", {
        doctype: "Sales Invoice",
        name: invoice.name
      });
      
      if (invoiceDetails && invoiceDetails.message) {
        const customer = invoiceDetails.message.customer;
        const grandTotal = invoiceDetails.message.grand_total || 0;
        const postingDate = invoiceDetails.message.posting_date;
        
        if (!customerMap[customer]) {
          customerMap[customer] = {
            total_purchases: 0,
            last_purchase_date: postingDate
          };
        }
        
        customerMap[customer].total_purchases += grandTotal;
        
        // Update last purchase date if this one is more recent
        if (postingDate > customerMap[customer].last_purchase_date) {
          customerMap[customer].last_purchase_date = postingDate;
        }
      }
    }
    
    // Convert to array and sort by total purchases
    return Object.entries(customerMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total_purchases - a.total_purchases)
      .slice(0, 10);
  } catch (error) {
    console.error('Error fetching customer metrics:', error);
    return [];
  }
}

async function getSupplierMetrics(company: string, dateFrom: string, dateTo: string): Promise<SupplierMetric[]> {
  try {
    // Get Purchase Invoices within the date range
    const purchaseInvoices = await frappeClient.call.get("frappe.client.get_list", {
      doctype: "Purchase Invoice",
      fields: ["name"],
      filters: [
        ["company", "=", company],
        ["posting_date", "between", [dateFrom, dateTo]],
        ["docstatus", "=", 1]
      ],
      limit: 1000
    });
    
    // Aggregate by supplier
    const supplierMap: Record<string, { total_purchases: number; last_purchase_date: string }> = {};
    
    // Process each purchase invoice
    for (const invoice of purchaseInvoices.message || []) {
      const invoiceDetails = await frappeClient.call.get("frappe.client.get", {
        doctype: "Purchase Invoice",
        name: invoice.name
      });
      
      if (invoiceDetails && invoiceDetails.message) {
        const supplier = invoiceDetails.message.supplier;
        const grandTotal = invoiceDetails.message.grand_total || 0;
        const postingDate = invoiceDetails.message.posting_date;
        
        if (!supplierMap[supplier]) {
          supplierMap[supplier] = {
            total_purchases: 0,
            last_purchase_date: postingDate
          };
        }
        
        supplierMap[supplier].total_purchases += grandTotal;
        
        // Update last purchase date if this one is more recent
        if (postingDate > supplierMap[supplier].last_purchase_date) {
          supplierMap[supplier].last_purchase_date = postingDate;
        }
      }
    }
    
    // Convert to array and sort by total purchases
    return Object.entries(supplierMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total_purchases - a.total_purchases)
      .slice(0, 10);
  } catch (error) {
    console.error('Error fetching supplier metrics:', error);
    return [];
  }
}

async function getInventoryAlerts(company: string): Promise<InventoryAlert[]> {
  try {
    // Get all items with reorder level
    const items = await frappeClient.call.get("frappe.client.get_list", {
      doctype: "Item",
      fields: ["name"],
      filters: [
        ["disabled", "=", 0],
        ["is_stock_item", "=", 1]
      ],
      limit: 1000
    });
    
    const alerts: InventoryAlert[] = [];
    
    // Check each item's stock level
    for (const item of items.message || []) {
      const itemDetails = await frappeClient.call.get("frappe.client.get", {
        doctype: "Item",
        name: item.name
      });
      
      if (itemDetails && itemDetails.message) {
        const itemCode = itemDetails.message.name;
        const itemName = itemDetails.message.item_name;
        const reorderLevel = itemDetails.message.reorder_level || 0;
        
        // Get current stock
        const bins = await frappeClient.call.get("frappe.client.get_list", {
          doctype: "Bin",
          fields: ["name"],
          filters: [
            ["item_code", "=", itemCode],
            ["warehouse", "=", "Stores - MB"]
          ],
          limit: 1
        });
        
        let currentStock = 0;
        
        if (bins.message && bins.message.length > 0) {
          const binDetails = await frappeClient.call.get("frappe.client.get", {
            doctype: "Bin",
            name: bins.message[0].name
          });
          
          if (binDetails && binDetails.message) {
            currentStock = binDetails.message.actual_qty || 0;
          }
        }
        
        // Check if stock is low or out
        if (currentStock <= 0) {
          alerts.push({
            item_code: itemCode,
            item_name: itemName,
            current_stock: currentStock,
            reorder_level: reorderLevel,
            status: "out"
          });
        } else if (currentStock <= reorderLevel) {
          alerts.push({
            item_code: itemCode,
            item_name: itemName,
            current_stock: currentStock,
            reorder_level: reorderLevel,
            status: "low"
          });
        }
      }
    }
    
    // Sort by status (out of stock first) then by stock level
    return alerts.sort((a, b) => {
      if (a.status === "out" && b.status !== "out") return -1;
      if (a.status !== "out" && b.status === "out") return 1;
      return a.current_stock - b.current_stock;
    }).slice(0, 10);
  } catch (error) {
    console.error('Error fetching inventory alerts:', error);
    return [];
  }
}

async function getExpenseBreakdown(company: string, dateFrom: string, dateTo: string): Promise<ExpenseBreakdown[]> {
  try {
    // Get Expense Claims within the date range
    const expenseClaims = await frappeClient.call.get("frappe.client.get_list", {
      doctype: "Expense Claim",
      fields: ["name"],
      filters: [
        ["company", "=", company],
        ["posting_date", "between", [dateFrom, dateTo]],
        ["docstatus", "=", 1]
      ],
      limit: 1000
    });
    
    // Aggregate by expense type
    const expenseMap: Record<string, number> = {};
    let totalExpenses = 0;
    
    // Process each expense claim
    for (const claim of expenseClaims.message || []) {
      const claimDetails = await frappeClient.call.get("frappe.client.get", {
        doctype: "Expense Claim",
        name: claim.name
      });
      
      if (claimDetails && claimDetails.message && claimDetails.message.expenses) {
        // Process each expense in the claim
        for (const expense of claimDetails.message.expenses) {
          const expenseType = expense.expense_type || "Other";
          const amount = expense.amount || 0;
          
          if (!expenseMap[expenseType]) {
            expenseMap[expenseType] = 0;
          }
          
          expenseMap[expenseType] += amount;
          totalExpenses += amount;
        }
      }
    }
    
    // Convert to array and calculate percentages
    return Object.entries(expenseMap)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  } catch (error) {
    console.error('Error fetching expense breakdown:', error);
    return [];
  }
}

async function getSalesTrends(company: string, dateFrom: string, dateTo: string): Promise<SalesTrend[]> {
  try {
    // Get Sales Invoices within the date range
    const salesInvoices = await frappeClient.call.get("frappe.client.get_list", {
      doctype: "Sales Invoice",
      fields: ["name"],
      filters: [
        ["company", "=", company],
        ["posting_date", "between", [dateFrom, dateTo]],
        ["docstatus", "=", 1]
      ],
      limit: 1000
    });
    
    // Get Purchase Invoices within the date range
    const purchaseInvoices = await frappeClient.call.get("frappe.client.get_list", {
      doctype: "Purchase Invoice",
      fields: ["name"],
      filters: [
        ["company", "=", company],
        ["posting_date", "between", [dateFrom, dateTo]],
        ["docstatus", "=", 1]
      ],
      limit: 1000
    });
    
    // Aggregate by date
    const salesMap: Record<string, number> = {};
    const expensesMap: Record<string, number> = {};
    
    // Process each sales invoice
    for (const invoice of salesInvoices.message || []) {
      const invoiceDetails = await frappeClient.call.get("frappe.client.get", {
        doctype: "Sales Invoice",
        name: invoice.name
      });
      
      if (invoiceDetails && invoiceDetails.message) {
        const date = invoiceDetails.message.posting_date;
        const grandTotal = invoiceDetails.message.grand_total || 0;
        
        if (!salesMap[date]) {
          salesMap[date] = 0;
        }
        
        salesMap[date] += grandTotal;
      }
    }
    
    // Process each purchase invoice
    for (const invoice of purchaseInvoices.message || []) {
      const invoiceDetails = await frappeClient.call.get("frappe.client.get", {
        doctype: "Purchase Invoice",
        name: invoice.name
      });
      
      if (invoiceDetails && invoiceDetails.message) {
        const date = invoiceDetails.message.posting_date;
        const grandTotal = invoiceDetails.message.grand_total || 0;
        
        if (!expensesMap[date]) {
          expensesMap[date] = 0;
        }
        
        expensesMap[date] += grandTotal;
      }
    }
    
    // Get all unique dates
    const allDates = new Set([
      ...Object.keys(salesMap),
      ...Object.keys(expensesMap)
    ]);
    
    // Convert to array and calculate profit
    return Array.from(allDates)
      .map(date => ({
        date,
        revenue: salesMap[date] || 0,
        expenses: expensesMap[date] || 0,
        profit: (salesMap[date] || 0) - (expensesMap[date] || 0)
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error('Error fetching sales trends:', error);
    return [];
  }
}