// types/item.ts
export interface Item {
  name: string;
  item_code: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  is_stock_item: number;
  is_fixed_asset?: number;
  valuation_rate?: number;
  brand?: string;
  disabled?: number;
  description?: string;
  qty: number;
  uom?: string;
  basic_rate: number;
  warehouse?: string;
  // Standard Frappe fields
  owner?: string;
  creation?: string;
  modified?: string;
  modified_by?: string;
  docstatus?: 0 | 1 | 2;
}
  
  // For items with stock information (this would require a separate API call)
  export interface ItemWithStock extends Item {
    actual_qty?: number;
    reserved_qty?: number;
    ordered_qty?: number;
    projected_qty?: number;
  }
  
  // For creating a new item
  export interface ItemCreateRequest {
    item_code: string;
    item_name: string;
    item_group: string;
    stock_uom: string;
    is_stock_item: number;
    is_fixed_asset?: number;
    description?: string;
    brand?: string;
  }
  
  
  // For updating an existing item
  export interface ItemUpdateRequest extends Partial<ItemCreateRequest> {
    name: string;
  }