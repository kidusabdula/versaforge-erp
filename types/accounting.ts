// types/accounting.ts
export interface ChartOfAccount {
  name: string;
  account_name: string;
  account_type: string;
  parent_account?: string;
  is_group: 0 | 1;
  company: string;
  root_type: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
  tax_rate?: number;
  docstatus?: 0 | 1 | 2; // Frappe document status: 0=Draft, 1=Submitted, 2=Cancelled
}

export interface PurchaseRecord {
  name: string;
  supplier: string;
  supplier_name: string;
  posting_date: string;
  due_date?: string;
  total_amount: number;
  total_tax: number;
  grand_total: number;
  status: 'Draft' | 'Submitted' | 'Paid' | 'Cancelled';
  items: PurchaseItem[];
  payments?: PaymentEntry[];
  docstatus?: 0 | 1 | 2; // Frappe document status: 0=Draft, 1=Submitted, 2=Cancelled
  currency: string;
  company: string;
}

export interface PurchaseItem {
  item_code: string;
  item_name: string;
  description?: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface ExpenseRecord {
  name: string;
  expense_type: string;
  posting_date: string;
  amount: number;
  tax_amount?: number;
  total_amount: number;
  description?: string;
  paid_by: string;
  employee: string;
  company: string;
  currency: string;
  status: 'Draft' | 'Unpaid' | 'Paid' | 'Claimed';
  docstatus?: 0 | 1 | 2; // Frappe document status: 0=Draft, 1=Submitted, 2=Cancelled
  attachments?: string[];
  approval_status: string;
  remark: string;
}

export interface PaymentEntry {
  name: string;
  payment_type: 'Receive' | 'Pay';
  party_type: 'Customer' | 'Supplier';
  party: string;
  party_name: string;
  posting_date: string;
  amount: number;
  paid_amount: number;
  received_amount: number;
  reference_no?: string;
  reference_date?: string;
  status: 'Draft' | 'Submitted' | 'Reconciled' | 'Cancelled';
  payment_method: 'Cash' | 'Bank' | 'Check' | 'Online';
  company: string;
  currency: string;
  mode_of_payment?: string;
  paid_from: string;
  paid_to: string;
  paid_from_account_name: string;
  paid_to_account_name: string;
  docstatus?: 0 | 1 | 2; // Frappe document status: 0=Draft, 1=Submitted, 2=Cancelled
}

export interface JournalEntry {
  name: string;
  posting_date: string;
  accounts: JournalAccount[];
  total_debit: number;
  total_credit: number;
  difference: number;
  status: 'Draft' | 'Submitted' | 'Cancelled';
  user_remark?: string;
  docstatus?: 0 | 1 | 2; // Frappe document status: 0=Draft, 1=Submitted, 2=Cancelled
}

export interface JournalAccount {
  account: string;
  debit?: number;
  credit?: number;
  reference_type?: string;
  reference_name?: string;
}

export interface FinancialReport {
  report_type: 'Income' | 'CashFlow' | 'Balance';
  from_date: string;
  to_date: string;
  company: string;
  data: Record<string, number>;
}

export interface TaxConfiguration {
  name: string;
  tax_type: string;
  rate: number;
  description?: string;
  is_active: 1 | 0;
}

export interface SalesInvoice {
  name: string;
  customer: string;
  customer_name: string;
  posting_date: string;
  due_date: string;
  grand_total: number;
  status: string;
  docstatus: number;
  currency: string;
  company: string;
  items: SalesInvoiceItem[];
}

export interface SalesInvoiceItem {
  item_code: string;
  item_name: string;
  description: string;
  qty: number;
  rate: number;
  amount: number;
}