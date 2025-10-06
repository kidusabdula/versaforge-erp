// app/api/crm/leads/[name]/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { Lead } from '@/types/crm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ lead: Lead }>(
    withEndpointLogging('/api/crm/leads/[name] - GET')(async () => {
      // Await the params as required by Next.js 15
      const { name } = await params;
      
      // Get the lead
      const fullLead = await frappeClient.call.get("frappe.client.get", {
        doctype: "Lead",
        name: name,
      });
      
      if (!fullLead || !fullLead.message) {
        throw new Error("Lead not found");
      }
      
      const doc = fullLead.message;
      
      // Map to our interface
      const lead: Lead = {
        name: doc.name,
        lead_name: doc.lead_name,
        email_id: doc.email_id || "",
        mobile_no: doc.mobile_no || "",
        status: doc.status,
        source: doc.source || "",
        territory: doc.territory || "",
        contact_by: doc.contact_by || "",
        creation: doc.creation,
        modified: doc.modified,
        owner: doc.owner
      };
      
      return { lead };
    }),
    { requireAuth: true }
  );
}

// PUT - Update a lead
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ lead: Lead }>(
    withEndpointLogging('/api/crm/leads/[name] - PUT')(async () => {
      const { name } = await params;
      const data = await request.json();
      
      // Get the current lead
      const currentLead = await frappeClient.call.get("frappe.client.get", {
        doctype: "Lead",
        name: name,
      });
      
      if (!currentLead || !currentLead.message) {
        throw new Error("Lead not found");
      }
      
      // Prepare updated lead data
      const leadData = {
        ...currentLead.message,
        lead_name: data.lead_name || currentLead.message.lead_name,
        email_id: data.email_id || currentLead.message.email_id,
        mobile_no: data.mobile_no || currentLead.message.mobile_no,
        status: data.status || currentLead.message.status,
        source: data.source || currentLead.message.source,
        territory: data.territory || currentLead.message.territory,
        contact_by: data.contact_by || currentLead.message.contact_by
      };
      
      // Use frappe.client.save to update the document
      const result = await frappeClient.call.post("frappe.client.save", {
        doc: leadData
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to update lead");
      }

      // Fetch the updated document
      const updatedLead = await frappeClient.call.get("frappe.client.get", {
        doctype: "Lead",
        name: result.message.name
      });
      
      if (!updatedLead || !updatedLead.message) {
        throw new Error("Failed to fetch updated lead");
      }
      
      const doc = updatedLead.message;
      const lead: Lead = {
        name: doc.name,
        lead_name: doc.lead_name,
        email_id: doc.email_id || "",
        mobile_no: doc.mobile_no || "",
        status: doc.status,
        source: doc.source || "",
        territory: doc.territory || "",
        contact_by: doc.contact_by || "",
        creation: doc.creation,
        modified: doc.modified,
        owner: doc.owner
      };
      
      return { lead };
    }),
    { requireAuth: true }
  );
}

// DELETE - Delete a lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ success: boolean }>(
    withEndpointLogging('/api/crm/leads/[name] - DELETE')(async () => {
      const { name } = await params;
      
      // Use frappe.client.delete to delete the document
      const result = await frappeClient.call.post("frappe.client.delete", {
        doctype: "Lead",
        name: name
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to delete lead");
      }
      
      return { success: true };
    }),
    { requireAuth: true }
  );
}