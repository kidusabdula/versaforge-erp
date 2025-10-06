// Stock Entry Types
export interface StockEntry {
    name: string;
    stock_entry_type: string;
    posting_date: string;
    posting_time: string;
    items: StockEntryItem[];
    purpose: string;
    company: string;
    // Standard Frappe fields
    owner?: string;
    creation?: string;
    modified?: string;
    modified_by?: string;
    docstatus?: 0 | 1 | 2;
  }
  
  export interface StockEntryItem {
    name?: string;
    item_code: string;
    item_name?: string;
    qty: number;
    uom: string;
    conversion_factor?: number;
    transfer_qty?: number;
    basic_rate: number;
    amount?: number;
    valuation_rate?: number;
    serial_no?: string;
    batch_no?: string;
    s_warehouse?: string;
    t_warehouse: string;
    expense_account?: string;
    cost_center?: string;
  }
  
  export interface StockEntryCreateRequest {
    stock_entry_type: string;
    posting_date: string;
    posting_time: string;
    items: StockEntryItem[];
    purpose: string;
    company: string;
  }
  
  export interface StockEntryUpdateRequest extends Partial<StockEntryCreateRequest> {
    name: string;
  }
  
  // Warehouse Types
  export interface Warehouse {
    name: string;
    warehouse_name: string;
    company: string;
    parent_warehouse?: string;
    is_group?: 0 | 1;
    disabled?: 0 | 1;
    // Standard Frappe fields
    owner?: string;
    creation?: string;
    modified?: string;
    modified_by?: string;
    docstatus?: 0 | 1 | 2;
  }
  
  // Stock Ledger Entry Types
  export interface StockLedgerEntry {
    name: string;
    item_code: string;
    warehouse: string;
    posting_date: string;
    posting_time: string;
    voucher_type: string;
    voucher_no: string;
    actual_qty: number;
    qty_after_transaction: number;
    valuation_rate: number;
    stock_value: number;
    stock_value_difference: number;
    company: string;
    // Standard Frappe fields
    owner?: string;
    creation?: string;
    modified?: string;
    modified_by?: string;
  }
  
  // Material Receipt Specific Types
  export interface MaterialReceiptCreateRequest extends Omit<StockEntryCreateRequest, 'stock_entry_type' | 'purpose'> {
    items: MaterialReceiptItem[];
  }
  
  export interface MaterialReceiptItem extends Omit<StockEntryItem, 's_warehouse'> {
    t_warehouse: string;
    basic_rate: number;
  }
  
  export interface MaterialReceipt extends StockEntry {
    stock_entry_type: 'Material Receipt';
    purpose: 'Material Receipt';
  }