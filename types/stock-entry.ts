export interface StockEntryItem {
  name?: string;
  item_code: string;
  item_name?: string;
  qty: number;
  uom: string;
  rate?: number;
  amount?: number;
  serial_no?: string;
  batch_no?: string;
  warehouse?: string;
  target_warehouse?: string;
  basic_rate?: number;
  valuation_rate?: number;
  idx?: number;
  // Manufacturing specific fields
  is_finished_item?: boolean;
  source_warehouse?: string;
}

export interface StockEntry {
  name: string;
  stock_entry_type: string;
  purpose: 'Material Receipt' | 'Material Issue' | 'Material Transfer' | 'Manufacture' | 'Repack';
  posting_date: string;
  posting_time?: string;
  items: StockEntryItem[];
  company: string;
  from_warehouse?: string;
  to_warehouse?: string;
  docstatus: 0 | 1 | 2;
  // Production reference fields
  production_order?: string;
  batch_no?: string;
  work_order?: string;
  // Manufacturing specific fields
  finished_goods?: string;
  finished_qty?: number;
  finished_uom?: string;
  // Standard Frappe fields
  owner?: string;
  creation?: string;
  modified?: string;
  modified_by?: string;
}

export interface StockEntryCreateRequest {
  name?: string;
  stock_entry_type: string;
  purpose: StockEntry['purpose'];
  posting_date: string;
  posting_time?: string;
  items: Omit<StockEntryItem, 'item_name' | 'name'>[];
  company: string;
  from_warehouse?: string;
  to_warehouse?: string;
  // Production reference fields
  production_order?: string;
  batch_no?: string;
  work_order?: string;
  // Manufacturing specific fields
  finished_goods?: string;
  finished_qty?: number;
  finished_uom?: string;
}

export interface StockEntryUpdateRequest extends Partial<Omit<StockEntryCreateRequest, 'items'>> {
  name: string;
  items?: Partial<StockEntryItem>[];
}

export interface StockEntryFilters {
  stock_entry_type?: string;
  purpose?: string;
  from_warehouse?: string;
  to_warehouse?: string;
  posting_date_from?: string;
  posting_date_to?: string;
  docstatus?: '0' | '1' | '2' | 'all';
  production_order?: string;
  batch_no?: string;
  work_order?: string;
}