export interface BillOfMaterials {
    name: string;
    item: string;
    item_name?: string;
    quantity: number;
    uom?: string;
    is_active?: 1 | 0;
    is_default?: 1 | 0;
    items: BOMItem[];
    // Standard Frappe fields
    owner?: string;
    creation?: string;
    modified?: string;
    modified_by?: string;
    docstatus?: 0 | 1 | 2;
  }
  
  export interface BOMItem {
    item_code: string;
    item_name?: string;
    qty: number;
    uom?: string;
    rate?: number;
    amount?: number;
    source_warehouse?: string;
  }