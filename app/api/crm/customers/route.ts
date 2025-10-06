// app/api/crm/customers/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { Customer } from '@/types/crm';

// GET - Fetch all customers
export async function GET(request: NextRequest) {
  return handleApiRequest<{ customers: Customer[] }>(
    withEndpointLogging('/api/crm/customers - GET')(async () => {
      const { searchParams } = new URL(request.url);
      const filters: Record<string, any> = {};
      
      // Build filters from query parameters
      if (searchParams.get('customer_type')) filters.customer_type = searchParams.get('customer_type');
      if (searchParams.get('customer_group')) filters.customer_group = searchParams.get('customer_group');
      if (searchParams.get('territory')) filters.territory = searchParams.get('territory');
      
      // Step 1: Get just the list of customer names
      const customerNames = await frappeClient.db.getDocList<{ name: string }>(
        "Customer",
        {
          fields: ["name"],
          filters: Object.entries(filters).map(([key, value]) => [key, '=', value]),
          orderBy: { field: 'creation', order: 'desc' },
          limit: 1000,
        }
      );
      
      console.log(`Found ${customerNames.length} customers`);
      
      // Step 2: For each customer, get the full document
      const customersWithDetails = await Promise.all(
        customerNames.map(async (customer) => {
          try {
            // Use frappe.client.get to get the entire document
            const fullCustomer = await frappeClient.call.get("frappe.client.get", {
              doctype: "Customer",
              name: customer.name
            });
            
            if (fullCustomer && fullCustomer.message) {
              const doc = fullCustomer.message;
              return {
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
            }
            return null;
          } catch (error) {
            console.error(`Error fetching customer ${customer.name}:`, error);
            return null;
          }
        })
      );
      
      // Filter out any null results
      const validCustomers = customersWithDetails.filter(customer => customer !== null) as Customer[];
      
      return { customers: validCustomers };
    })
  );
}

// POST - Create a new customer
export async function POST(request: NextRequest) {
  return handleApiRequest<{ customer: Customer }>(
    withEndpointLogging('/api/crm/customers - POST')(async () => {
      const data = await request.json();
      
      // Validate required fields
      if (!data.customer_name) {
        throw new Error('Customer name is required');
      }
      
      // Prepare customer data
      const customerData = {
        doctype: "Customer",
        customer_name: data.customer_name,
        customer_type: data.customer_type || "Individual",
        customer_group: data.customer_group || "All Customer Groups",
        territory: data.territory || "All Territories",
        default_currency: data.default_currency || "ETB",
        credit_limit: data.credit_limit || 0
      };
      
      // Use frappe.client.insert to create the document
      const result = await frappeClient.call.post("frappe.client.insert", {
        doc: customerData
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to create customer");
      }

      // Fetch the complete document
      const completeCustomer = await frappeClient.call.get("frappe.client.get", {
        doctype: "Customer",
        name: result.message.name
      });
      
      if (!completeCustomer || !completeCustomer.message) {
        throw new Error("Failed to fetch created customer");
      }
      
      const doc = completeCustomer.message;
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