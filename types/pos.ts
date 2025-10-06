// types/pos.ts
export interface POSProfile {
  name: string;
  company: string;
  customer: string;
  warehouse: string;
  currency: string;
  write_off_account: string;
  expense_account: string;
  income_account: string;
}

export interface POSItem {
  item_code: string;
  item_name: string;
  description?: string;
  stock_uom: string;
  image?: string;
  standard_rate: number;
  valuation_rate: number;
  actual_qty: number;
  is_stock_item: 1 | 0;
  item_group: string;
}

export interface POSOrderItem {
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  amount: number;
  uom: string;
}

export interface POSOrder {
  customer: string;
  posting_date: string;
  posting_time: string;
  company: string;
  warehouse: string;
  items: POSOrderItem[];
  payments: POSPayment[];
  total: number;
  grand_total: number;
  rounded_total: number;
  outstanding_amount: number;
}

export interface POSPayment {
  mode_of_payment: string;
  amount: number;
}

export interface SalesInvoice {
  name: string;
  customer: string;
  customer_name: string;
  posting_date: string;
  posting_time: string;
  due_date: string;
  company: string;
  warehouse: string;
  total: number;
  grand_total: number;
  rounded_total: number;
  outstanding_amount: number;
  status: string;
  items: SalesInvoiceItem[];
}

export interface SalesInvoiceItem {
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  amount: number;
  uom: string;
  warehouse: string;
}

export interface StockCheck {
  item_code: string;
  item_name: string;
  warehouse: string;
  actual_qty: number;
  projected_qty: number;
  stock_uom: string;
  is_stock_item: 1 | 0;
}

export interface POSResponse {
  profile: POSProfile;
  customers: string[];
  categories: Array<{
    name: string;
    items: POSItem[];
  }>;
}