// app/api/crm/customers/[name]/contacts/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { Contact } from '@/types/crm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ contacts: Contact[] }>(
    withEndpointLogging('/api/crm/customers/[name]/contacts - GET')(async () => {
      const { name } = await params;
      
      // Verify customer exists first
      const customer = await frappeClient.call.get("frappe.client.get", {
        doctype: "Customer",
        name: name,
      });
      
      if (!customer || !customer.message) {
        throw new Error("Customer not found");
      }
      
      // Get contacts linked to this customer through dynamic links
      const contacts = await frappeClient.call.get("frappe.client.get_list", {
        doctype: "Contact",
        fields: ["name", "first_name", "last_name", "email_id", "mobile_no", "is_primary_contact"],
        filters: [
          ["Dynamic Link", "link_doctype", "=", "Customer"],
          ["Dynamic Link", "link_name", "=", name]
        ],
        limit: 100,
      });
      
      const processedContacts = contacts.message?.map((contact: any) => ({
        name: contact.name,
        first_name: contact.first_name,
        last_name: contact.last_name,
        email_id: contact.email_id,
        mobile_no: contact.mobile_no,
        is_primary_contact: contact.is_primary_contact,
        customer: name,
        creation: contact.creation,
        modified: contact.modified,
        owner: contact.owner
      })) || [];
      
      return { contacts: processedContacts };
    }),
    { requireAuth: true }
  );
}

// POST - Create a new contact for customer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ contact: Contact }>(
    withEndpointLogging('/api/crm/customers/[name]/contacts - POST')(async () => {
      const { name } = await params;
      const data = await request.json();
      
      // Validate required fields
      if (!data.first_name) {
        throw new Error('First name is required');
      }
      
      // Prepare contact data with dynamic link to customer
      const contactData = {
        doctype: "Contact",
        first_name: data.first_name,
        last_name: data.last_name || "",
        email_id: data.email_id || "",
        mobile_no: data.mobile_no || "",
        is_primary_contact: data.is_primary_contact || 0,
        links: [{
          link_doctype: "Customer",
          link_name: name
        }]
      };
      
      // Use frappe.client.insert to create the document
      const result = await frappeClient.call.post("frappe.client.insert", {
        doc: contactData
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to create contact");
      }

      // Fetch the complete document
      const completeContact = await frappeClient.call.get("frappe.client.get", {
        doctype: "Contact",
        name: result.message.name
      });
      
      if (!completeContact || !completeContact.message) {
        throw new Error("Failed to fetch created contact");
      }
      
      const doc = completeContact.message;
      const contact: Contact = {
        name: doc.name,
        first_name: doc.first_name,
        last_name: doc.last_name,
        email_id: doc.email_id,
        mobile_no: doc.mobile_no,
        is_primary_contact: doc.is_primary_contact,
        customer: name, // We set this manually since it's linked via dynamic links
        creation: doc.creation,
        modified: doc.modified,
        owner: doc.owner
      };
      
      return { contact };
    }),
    { requireAuth: true }
  );
}