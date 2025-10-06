// app/api/crm/opportunities/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { Opportunity } from '@/types/crm';

// GET - Fetch all opportunities
export async function GET(request: NextRequest) {
  return handleApiRequest<{ opportunities: Opportunity[] }>(
    withEndpointLogging('/api/crm/opportunities - GET')(async () => {
      const { searchParams } = new URL(request.url);
      const filters: Record<string, any> = {};
      
      // Build filters from query parameters
      if (searchParams.get('status')) filters.status = searchParams.get('status');
      if (searchParams.get('opportunity_type')) filters.opportunity_type = searchParams.get('opportunity_type');
      if (searchParams.get('sales_stage')) filters.sales_stage = searchParams.get('sales_stage');
      if (searchParams.get('customer')) filters.customer = searchParams.get('customer');
      if (searchParams.get('lead')) filters.lead = searchParams.get('lead');
      
      // Step 1: Get just the list of opportunity names
      const opportunityNames = await frappeClient.db.getDocList<{ name: string }>(
        "Opportunity",
        {
          fields: ["name"],
          filters: Object.entries(filters).map(([key, value]) => [key, '=', value]),
          orderBy: { field: 'creation', order: 'desc' },
          limit: 1000,
        }
      );
      
      console.log(`Found ${opportunityNames.length} opportunities`);
      
      // Step 2: For each opportunity, get the full document
      const opportunitiesWithDetails = await Promise.all(
        opportunityNames.map(async (opportunity) => {
          try {
            // Use frappe.client.get to get the entire document
            const fullOpportunity = await frappeClient.call.get("frappe.client.get", {
              doctype: "Opportunity",
              name: opportunity.name
            });
            
            if (fullOpportunity && fullOpportunity.message) {
              const doc = fullOpportunity.message;
              return {
                name: doc.name,
                opportunity_from: doc.opportunity_from,
                party_name: doc.party_name, // Include party_name
                opportunity_type: doc.opportunity_type,
                status: doc.status,
                probability: doc.probability,
                expected_closing_date: doc.expected_closing_date,
                opportunity_amount: doc.opportunity_amount,
                sales_stage: doc.sales_stage,
                customer: doc.customer,
                lead: doc.lead,
                creation: doc.creation,
                modified: doc.modified,
                owner: doc.owner
              };
            }
            return null;
          } catch (error) {
            console.error(`Error fetching opportunity ${opportunity.name}:`, error);
            return null;
          }
        })
      );
      
      // Filter out any null results
      const validOpportunities = opportunitiesWithDetails.filter(opportunity => opportunity !== null) as Opportunity[];
      
      return { opportunities: validOpportunities };
    })
  );
}

// POST - Create a new opportunity
export async function POST(request: NextRequest) {
  return handleApiRequest<{ opportunity: Opportunity }>(
    withEndpointLogging('/api/crm/opportunities - POST')(async () => {
      const data = await request.json();
      
      // Validate required fields
      if (!data.opportunity_from || !data.opportunity_type) {
        throw new Error('Opportunity source and type are required');
      }
      
      // Determine party_name based on opportunity_from
      let party_name = '';
      if (data.opportunity_from === 'Customer' && data.customer) {
        party_name = data.customer;
      } else if (data.opportunity_from === 'Lead' && data.lead) {
        party_name = data.lead;
      } else {
        throw new Error('Party name is required based on opportunity source');
      }
      
      // Prepare opportunity data with party_name
      const opportunityData = {
        doctype: "Opportunity",
        opportunity_from: data.opportunity_from,
        party_name: party_name, // Mandatory field
        opportunity_type: data.opportunity_type,
        status: data.status || "Open",
        probability: data.probability || 0,
        expected_closing_date: data.expected_closing_date,
        opportunity_amount: data.opportunity_amount || 0,
        sales_stage: data.sales_stage || "Qualification",
        customer: data.customer || "",
        lead: data.lead || ""
      };
      
      // Use frappe.client.insert to create the document
      const result = await frappeClient.call.post("frappe.client.insert", {
        doc: opportunityData
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to create opportunity");
      }

      // Fetch the complete document
      const completeOpportunity = await frappeClient.call.get("frappe.client.get", {
        doctype: "Opportunity",
        name: result.message.name
      });
      
      if (!completeOpportunity || !completeOpportunity.message) {
        throw new Error("Failed to fetch created opportunity");
      }
      
      const doc = completeOpportunity.message;
      const opportunity: Opportunity = {
        name: doc.name,
        opportunity_from: doc.opportunity_from,
        party_name: doc.party_name, // Include in response
        opportunity_type: doc.opportunity_type,
        status: doc.status,
        probability: doc.probability,
        expected_closing_date: doc.expected_closing_date,
        opportunity_amount: doc.opportunity_amount,
        sales_stage: doc.sales_stage,
        customer: doc.customer,
        lead: doc.lead,
        creation: doc.creation,
        modified: doc.modified,
        owner: doc.owner
      };
      
      return { opportunity };
    }),
    { requireAuth: true }
  );
}