// types/asset.ts

export interface Asset {
    name: string;
    asset_name: string;
    asset_category: string;
    item_code: string;
    serial_no: string;
    purchase_date: string;
    purchase_value: number;
    current_value: number;
    location: string;
    status: "Available" | "In Use" | "Under Maintenance" | "Scrapped";
    warranty_expiry_date: string;
    assigned_to: string;
    creation: string;
    modified: string;
    owner: string;
  }
  
  export interface AssetCategory {
    name: string;
    asset_category_name: string;
    company: string;
    parent_category: string;
    is_group: number;
    creation: string;
    modified: string;
    owner: string;
    accounts: AssetCategoryAccount[];
  }

  export interface AssetCategoryAccount {
  company: string;
  fixed_asset_account: string;
  accumulated_depreciation_account: string;
  depreciation_expense_account: string;
  capital_work_in_progress_account: string;
}

  
  export interface AssetLocation {
    name: string;
    location_name: string;
    parent_location: string;
    is_group: number;
    address: string;
    creation: string;
    modified: string;
    owner: string;
  }
  
  export interface AssetMaintenance {
    name: string;
    asset: string;
    maintenance_type: string;
    maintenance_date: string;
    description: string;
    cost: number;
    next_maintenance_date?: string;
    status: string;
    creation: string;
    modified: string;
    owner: string;
    maintenance_team?: string;
    asset_maintenance_tasks?: AssetMaintenanceTask[];
  }
  export interface AssetMovement {
    name: string;
    asset: string;
    assets: AssetMovementItem[];
    from_location: string;
    to_location: string;
    movement_date: string;
    purpose: "Issue" | "Receipt" | "Transfer";
    status: "Requested" | "Approved" | "Completed";
    creation: string;
    modified: string;
    owner: string;
    from_employee?: string;
    to_employee?: string;
    company?: string;
  }

  export interface AssetMovementItem {
    asset: string;
    asset_name?: string;
    from_location: string;
    to_location: string;
    from_employee?: string;
    to_employee?: string;
  }
  
  export interface AssetRepair {
    name: string;
    asset: string;
    repair_type: string;
    repair_date: string;
    description: string;
    cost: number;
    technician: string;
    status: "Reported" | "In Progress" | "Completed";
    creation: string;
    modified: string;
    owner: string;
    failure_date: string; // Added mandatory field
    company: string;
    completion_date: string;
    cause_of_failure: string;
    actions_performed: string;
    downtime: number;
    repair_details: string;
  }
  
  export interface AssetValueAdjustment {
    name: string;
    asset: string;
    adjustment_date: string;
    current_value: number;
    new_value: number;
    reason: string;
    approved_by: string;
    creation: string;
    modified: string;
    owner: string;
  }
  
  export interface AssetOptions {
    categories: Array<{ name: string; category_name: string }>;
    locations: Array<{ name: string; location_name: string }>;
    AssetMaintenances: Array<{ name: string; type_name: string }>;
    assetRepairs: Array<{ name: string; type_name: string }>;
    assetMovements: Array<{ name: string; purpose_name: string }>;
    assetStatuses: Array<{ value: string; label: string }>;
  }

  export interface AssetMaintenanceTask {
    maintenance_task: string;
    maintenance_status: "Planned" | "Cancelled" | "Overdue";
    start_date: string;
    end_date?: string;
    assign_to?: string;
    periodicity: "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Half-yearly" | "Yearly" | "2 Yearly" | "3 Yearly";
  }
  
  
  export interface AssetDashboardData {
    total_assets: number;
    assets_under_maintenance: number;
    assets_requiring_attention: number;
    assets_by_category: Array<{
      category: string;
      count: number;
      value: number;
    }>;
    assets_by_location: Array<{
      location: string;
      count: number;
      value: number;
    }>;
    recent_activities: Array<{
      type: "maintenance" | "movement" | "repair";
      asset: string;
      date: string;
      description: string;
    }>;
    maintenance_due: Array<{
      asset: string;
      due_date: string;
      days_remaining: number;
    }>;
  }