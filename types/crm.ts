// types/crm.ts
export interface Lead {
  name: string;
  lead_name: string;
  email_id: string;
  mobile_no: string;
  status: "Open" | "Contacted" | "Interested" | "Not Interested" | "Converted";
  source: string;
  territory: string;
  contact_by: string;
  creation: string;
  modified: string;
  owner: string;
  party_name?: string;
}

export interface Customer {
  name: string;
  customer_name: string;
  customer_type: "Individual" | "Company";
  customer_group: string;
  territory: string;
  default_currency: string;
  credit_limit: number;
  creation: string;
  modified: string;
  owner: string;
}

export interface Contact {
  name: string;
  first_name: string;
  last_name: string;
  email_id: string;
  mobile_no: string;
  is_primary_contact: number;
  customer: string;
  creation: string;
  modified: string;
  owner: string;
}

export interface Address {
  name: string;
  address_title: string;
  address_type: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  country: string;
  is_primary_address: number;
  customer: string;
  creation: string;
  modified: string;
  owner: string;
}

export interface Opportunity {
  name: string;
  opportunity_from: string;
  party_name?: string;
  opportunity_type: string;
  status: "Open" | "Quoted" | "Lost" | "Closed";
  probability: number;
  expected_closing_date: string;
  opportunity_amount: number;
  sales_stage: string;
  customer: string;
  lead: string;
  territory?: string;
  creation: string;
  modified: string;
  owner: string;
}

export interface Quotation {
  name: string;
  customer: string;
  transaction_date: string;
  valid_till: string;
  currency?: string;
  total: number;
  status: "Draft" | "Submitted" | "Accepted" | "Lost" | "Expired";
  items: QuotationItem[];
  creation: string;
  modified: string;
  owner: string;
}

export interface QuotationItem {
  item_code: string;
  item_name: string;
  description: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface SalesOrder {
  name: string;
  customer: string;
  transaction_date: string;
  delivery_date: string;
  currency?: string;
  total: number;
  status: "Draft" | "Submitted" | "To Deliver" | "Delivered" | "Closed";
  items: SalesOrderItem[];
  creation: string;
  modified: string;
  owner: string;
}

export interface SalesOrderItem {
  item_code: string;
  item_name: string;
  description: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface Communication {
  name: string;
  communication_type: "Communication" | "Email" | "Phone" | "Meeting";
  subject: string;
  content: string;
  status: "Open" | "Closed";
  reference_doctype: string;
  reference_name: string;
  creation: string;
  modified: string;
  owner: string;
}

export interface Activity {
  name: string;
  activity_type: "Task" | "Event" | "Call" | "Email";
  subject: string;
  description: string;
  status: "Open" | "Closed";
  priority: "Low" | "Medium" | "High" | "Urgent";
  due_date: string;
  assigned_to: string;
  reference_doctype: string;
  reference_name: string;
  creation: string;
  modified: string;
  owner: string;
}

export interface Territory {
  name: string;
  territory_name: string;
  parent_territory: string;
  is_group: number;
  creation: string;
  modified: string;
  owner: string;
}

export interface SalesPerson {
  name: string;
  sales_person_name: string;
  employee: string;
  territory: string;
  creation: string;
  modified: string;
  owner: string;
}

export interface CustomerGroup {
  name: string;
  customer_group_name: string;
  parent_customer_group: string;
  is_group: number;
  creation: string;
  modified: string;
  owner: string;
}

export interface CRMDashboardData {
  total_leads: number;
  open_opportunities: number;
  quotations_to_follow_up: number;
  leadConversionRate: number;
  opportunities_by_stage: Array<{
    stage: string;
    count: number;
    amount: number;
  }>;
  recent_activities: Activity[];
  top_sales_persons: Array<{
    name: string;
    opportunities: number;
    amount: number;
  }>;
}
