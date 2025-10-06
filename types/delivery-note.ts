export interface DeliveryNoteItem {
    name?: string;
    item_code: string;
    item_name?: string;
    qty: number;
    uom: string;
    rate: number;
    amount: number;
    warehouse?: string;
    batch_no?: string;
    serial_no?: string;
    against_sales_order?: string;
    idx?: number;
  }
  
  export interface DeliveryNote {
    name: string;
    customer: string;
    customer_name?: string;
    posting_date: string;
    posting_time?: string;
    items: DeliveryNoteItem[];
    company: string;
    set_warehouse?: string;
    territory?: string;
    tax_id?: string;
    docstatus: 0 | 1 | 2;
    // Sales reference fields
    sales_order?: string;
    customer_address?: string;
    contact_person?: string;
    // Standard Frappe fields
    owner?: string;
    creation?: string;
    modified?: string;
    modified_by?: string;
  }
  
  export interface DeliveryNoteCreateRequest {
    name?: string;
    customer: string;
    posting_date: string;
    posting_time?: string;
    items: Omit<DeliveryNoteItem, 'item_name' | 'name'>[];
    company: string;
    set_warehouse?: string;
    territory?: string;
    tax_id?: string;
    // Sales reference fields
    sales_order?: string;
    customer_address?: string;
    contact_person?: string;
  }
  
  export interface DeliveryNoteUpdateRequest extends Partial<Omit<DeliveryNoteCreateRequest, 'items'>> {
    name: string;
    items?: Partial<DeliveryNoteItem>[];
  }
  
  export interface DeliveryNoteFilters {
    customer?: string;
    posting_date_from?: string;
    posting_date_to?: string;
    docstatus?: '0' | '1' | '2' | 'all';
    sales_order?: string;
    territory?: string;
  }