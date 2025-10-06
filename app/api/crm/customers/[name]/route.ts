// app/api/crm/customers/[name]/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { Customer } from '@/types/crm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ customer: Customer }>(
    withEndpointLogging('/api/crm/customers/[name] - GET')(async () => {
      // Await the params as required by Next.js 15
      const { name } = await params;
      
      // Get the customer
      const fullCustomer = await frappeClient.call.get("frappe.client.get", {
        doctype: "Customer",
        name: name,
      });
      
      if (!fullCustomer || !fullCustomer.message) {
        throw new Error("Customer not found");
      }
      
      const doc = fullCustomer.message;
      
      // Map to our interface
      const customer: Customer = {
        name: doc.name,
        customer_name: doc.customer_name,
        customer_type: doc.customer_type,
        customer_group: doc.customer_group,
        territory: doc.territory,
        default_currency: doc.default_currency,
        credit_limit: doc.credit_limit,
        creation: doc.creation,
        modified: doc.modified,
        owner: doc.owner
      };
      
      return { customer };
    }),
    { requireAuth: true }
  );
}

// PUT - Update a customer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ customer: Customer }>(
    withEndpointLogging('/api/crm/customers/[name] - PUT')(async () => {
      const { name } = await params;
      const data = await request.json();
      
      // Get the current customer
      const currentCustomer = await frappeClient.call.get("frappe.client.get", {
        doctype: "Customer",
        name: name,
      });
      
      if (!currentCustomer || !currentCustomer.message) {
        throw new Error("Customer not found");
      }
      
      // Prepare updated customer data
      const customerData = {
        ...currentCustomer.message,
        customer_name: data.customer_name || currentCustomer.message.customer_name,
        customer_type: data.customer_type || currentCustomer.message.customer_type,
        customer_group: data.customer_group || currentCustomer.message.customer_group,
        territory: data.territory || currentCustomer.message.territory,
        default_currency: data.default_currency || currentCustomer.message.default_currency,
        credit_limit: data.credit_limit || currentCustomer.message.credit_limit
      };
      
      // Use frappe.client.save to update the document
      const result = await frappeClient.call.post("frappe.client.save", {
        doc: customerData
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to update customer");
      }

      // Fetch the updated document
      const updatedCustomer = await frappeClient.call.get("frappe.client.get", {
        doctype: "Customer",
        name: result.message.name
      });
      
      if (!updatedCustomer || !updatedCustomer.message) {
        throw new Error("Failed to fetch updated customer");
      }
      
      const doc = updatedCustomer.message;
      const customer: Customer = {
        name: doc.name,
        customer_name: doc.customer_name,
        customer_type: doc.customer_type,
        customer_group: doc.customer_group,
        territory: doc.territory,
        default_currency: doc.default_currency,
        credit_limit: doc.credit_limit,
        creation: doc.creation,
        modified: doc.modified,
        owner: doc.owner
      };
      
      return { customer };
    }),
    { requireAuth: true }
  );
}

// DELETE - Delete a customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ success: boolean }>(
    withEndpointLogging('/api/crm/customers/[name] - DELETE')(async () => {
      const { name } = await params;
      
      // Use frappe.client.delete to delete the document
      const result = await frappeClient.call.post("frappe.client.delete", {
        doctype: "Customer",
        name: name
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to delete customer");
      }
      
      return { success: true };
    }),
    { requireAuth: true }
  );
}