// app/api/crm/leads/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { Lead } from '@/types/crm';

// GET - Fetch all leads
export async function GET(request: NextRequest) {
  return handleApiRequest<{ leads: Lead[] }>(
    withEndpointLogging('/api/crm/leads - GET')(async () => {
      const { searchParams } = new URL(request.url);
      const filters: Record<string, any> = {};
      
      // Build filters from query parameters
      if (searchParams.get('status')) filters.status = searchParams.get('status');
      if (searchParams.get('source')) filters.source = searchParams.get('source');
      if (searchParams.get('territory')) filters.territory = searchParams.get('territory');
      if (searchParams.get('contact_by')) filters.contact_by = searchParams.get('contact_by');
      
      // Step 1: Get just the list of lead names
      const leadNames = await frappeClient.db.getDocList<{ name: string }>(
        "Lead",
        {
          fields: ["name"],
          filters: Object.entries(filters).map(([key, value]) => [key, '=', value]),
          orderBy: { field: 'creation', order: 'desc' },
          limit: 1000,
        }
      );
      
      console.log(`Found ${leadNames.length} leads`);
      
      // Step 2: For each lead, get the full document
      const leadsWithDetails = await Promise.all(
        leadNames.map(async (lead) => {
          try {
            // Use frappe.client.get to get the entire document
            const fullLead = await frappeClient.call.get("frappe.client.get", {
              doctype: "Lead",
              name: lead.name
            });
            
            if (fullLead && fullLead.message) {
              const doc = fullLead.message;
              return {
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
            }
            return null;
          } catch (error) {
            console.error(`Error fetching lead ${lead.name}:`, error);
            return null;
          }
        })
      );
      
      // Filter out any null results
      const validLeads = leadsWithDetails.filter(lead => lead !== null) as Lead[];
      
      return { leads: validLeads };
    })
  );
}

// POST - Create a new lead
export async function POST(request: NextRequest) {
  return handleApiRequest<{ lead: Lead }>(
    withEndpointLogging('/api/crm/leads - POST')(async () => {
      const data = await request.json();
      
      // Validate required fields
      if (!data.lead_name) {
        throw new Error('Lead name is required');
      }
      
      // Prepare lead data
      const leadData = {
        doctype: "Lead",
        lead_name: data.lead_name,
        email_id: data.email_id || "",
        mobile_no: data.mobile_no || "",
        status: data.status || "Open",
        source: data.source || "",
        territory: data.territory || "",
        contact_by: data.contact_by || ""
      };
      
      // Use frappe.client.insert to create the document
      const result = await frappeClient.call.post("frappe.client.insert", {
        doc: leadData
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to create lead");
      }

      // Fetch the complete document
      const completeLead = await frappeClient.call.get("frappe.client.get", {
        doctype: "Lead",
        name: result.message.name
      });
      
      if (!completeLead || !completeLead.message) {
        throw new Error("Failed to fetch created lead");
      }
      
      const doc = completeLead.message;
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
        owner: doc.owner,
        party_name: doc.party_name
      };
      
      return { lead };
    }),
    { requireAuth: true }
  );
}