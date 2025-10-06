// app/api/crm/customers/[name]/addresses/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { Address } from '@/types/crm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ addresses: Address[] }>(
    withEndpointLogging('/api/crm/customers/[name]/addresses - GET')(async () => {
      const { name } = await params;
      
      // Verify customer exists first
      const customer = await frappeClient.call.get("frappe.client.get", {
        doctype: "Customer",
        name: name,
      });
      
      if (!customer || !customer.message) {
        throw new Error("Customer not found");
      }
      
      // Get addresses linked to this customer through dynamic links
      const addresses = await frappeClient.call.get("frappe.client.get_list", {
        doctype: "Address",
        fields: ["name", "address_title", "address_type", "address_line1", "address_line2", "city", "state", "country", "is_primary_address"],
        filters: [
          ["Dynamic Link", "link_doctype", "=", "Customer"],
          ["Dynamic Link", "link_name", "=", name]
        ],
        limit: 100,
      });
      
      const processedAddresses = addresses.message?.map((address: any) => ({
        name: address.name,
        address_title: address.address_title,
        address_type: address.address_type,
        address_line1: address.address_line1,
        address_line2: address.address_line2,
        city: address.city,
        state: address.state,
        country: address.country,
        is_primary_address: address.is_primary_address,
        customer: name,
        creation: address.creation,
        modified: address.modified,
        owner: address.owner
      })) || [];
      
      return { addresses: processedAddresses };
    }),
    { requireAuth: true }
  );
}

// POST - Create a new address for customer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ address: Address }>(
    withEndpointLogging('/api/crm/customers/[name]/addresses - POST')(async () => {
      const { name } = await params;
      const data = await request.json();
      
      // Validate required fields - Address Title is mandatory in Frappe
      if (!data.address_title) {
        throw new Error('Address title is required');
      }
      if (!data.address_type || !data.address_line1) {
        throw new Error('Address type and address line 1 are required');
      }
      
      // Prepare address data with dynamic link to customer
      const addressData = {
        doctype: "Address",
        address_title: data.address_title, // This is mandatory
        address_type: data.address_type,
        address_line1: data.address_line1,
        address_line2: data.address_line2 || "",
        city: data.city || "",
        state: data.state || "",
        country: data.country || "Ethiopia",
        is_primary_address: data.is_primary_address || 0,
        links: [{
          link_doctype: "Customer",
          link_name: name
        }]
      };
      
      // Use frappe.client.insert to create the document
      const result = await frappeClient.call.post("frappe.client.insert", {
        doc: addressData
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to create address");
      }

      // Fetch the complete document
      const completeAddress = await frappeClient.call.get("frappe.client.get", {
        doctype: "Address",
        name: result.message.name
      });
      
      if (!completeAddress || !completeAddress.message) {
        throw new Error("Failed to fetch created address");
      }
      
      const doc = completeAddress.message;
      const address: Address = {
        name: doc.name,
        address_title: doc.address_title,
        address_type: doc.address_type,
        address_line1: doc.address_line1,
        address_line2: doc.address_line2,
        city: doc.city,
        state: doc.state,
        country: doc.country,
        is_primary_address: doc.is_primary_address,
        customer: name, // We set this manually since it's linked via dynamic links
        creation: doc.creation,
        modified: doc.modified,
        owner: doc.owner
      };
      
      return { address };
    }),
    { requireAuth: true }
  );
}