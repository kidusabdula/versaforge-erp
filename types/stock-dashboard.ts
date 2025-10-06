export interface StockBalance {
    item_code: string;
    item_name: string;
    warehouse: string;
    actual_qty: number;
    reserved_qty: number;
    ordered_qty: number;
    projected_qty: number;
    valuation_rate: number;
    stock_value: number;
    stock_uom: string;
    item_group: string;
    brand?: string;
  }
  
  export interface StockLedgerEntry {
    name: string;
    item_code: string;
    item_name: string;
    warehouse: string;
    posting_date: string;
    posting_time: string;
    voucher_type: 'Stock Entry' | 'Delivery Note' | 'Purchase Receipt' | 'Material Issue';
    voucher_no: string;
    actual_qty: number;
    qty_after_transaction: number;
    incoming_rate: number;
    outgoing_rate: number;
    valuation_rate: number;
    stock_value: number;
    stock_uom: string;
    batch_no?: string;
    serial_no?: string;
  }
  
  export interface StockSummary {
    total_items: number;
    total_warehouses: number;
    total_stock_value: number;
    low_stock_items: number;
    out_of_stock_items: number;
    recent_transactions: number;
  }
  
  export interface StockTrend {
    date: string;
    incoming: number;
    outgoing: number;
    net_change: number;
    total_value: number;
  }
  
  export interface DashboardFilters {
    warehouse?: string;
    item_group?: string;
    date_from?: string;
    date_to?: string;
    show_low_stock?: boolean;
    show_out_of_stock?: boolean;
  }