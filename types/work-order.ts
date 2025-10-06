export interface WorkOrder {
  name: string;
  production_item: string; // Item code of the finished product
  qty: number; // Quantity to produce
  status: 'Draft' | 'Not Started' | 'In Process' | 'Completed' | 'Stopped' | 'Closed';
  bom_no?: string; // Bill of Materials reference (auto-pulled if not provided)
  wip_warehouse?: string; // Warehouse for work-in-progress
  fg_warehouse?: string; // Finished goods warehouse
  produced_qty?: number;
  material_transferred_for_manufacturing?: number;
  // Standard Frappe fields
  owner?: string;
  creation?: string;
  modified?: string;
  modified_by?: string;
  docstatus?: 0 | 1 | 2;
  // Dynamic fields (e.g., from BOM)
  required_items?: Array<{
    item_code: string;
    required_qty: number;
    source_warehouse?: string;
  }>;
}

export interface WorkOrderCreateRequest {
  production_item: string;
  qty: number;
  bom_no?: string; // Optional; Frappe auto-selects default BOM if available
  wip_warehouse?: string;
  fg_warehouse?: string;
}

export interface WorkOrderUpdateRequest extends Partial<WorkOrderCreateRequest> {
  name: string;
}