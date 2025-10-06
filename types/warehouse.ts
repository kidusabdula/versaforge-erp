export interface Warehouse {
    name: string;
    warehouse_name: string;
    company?: string;
    disabled?: number;
    is_group?: number;
    parent_warehouse?: string;
  }