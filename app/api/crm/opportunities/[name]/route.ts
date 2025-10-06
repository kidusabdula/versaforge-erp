// app/api/crm/opportunities/[name]/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { Opportunity } from '@/types/crm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ opportunity: Opportunity }>(
    withEndpointLogging('/api/crm/opportunities/[name] - GET')(async () => {
      // Await the params as required by Next.js 15
      const { name } = await params;
      
      // Get the opportunity
      const fullOpportunity = await frappeClient.call.get("frappe.client.get", {
        doctype: "Opportunity",
        name: name,
      });
      
      if (!fullOpportunity || !fullOpportunity.message) {
        throw new Error("Opportunity not found");
      }
      
      const doc = fullOpportunity.message;
      
      // Map to our interface
      const opportunity: Opportunity = {
        name: doc.name,
        opportunity_from: doc.opportunity_from,
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

// PUT - Update an opportunity
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ opportunity: Opportunity }>(
    withEndpointLogging('/api/crm/opportunities/[name] - PUT')(async () => {
      const { name } = await params;
      const data = await request.json();
      
      // Get the current opportunity
      const currentOpportunity = await frappeClient.call.get("frappe.client.get", {
        doctype: "Opportunity",
        name: name,
      });
      
      if (!currentOpportunity || !currentOpportunity.message) {
        throw new Error("Opportunity not found");
      }
      
      // Prepare updated opportunity data
      const opportunityData = {
        ...currentOpportunity.message,
        opportunity_from: data.opportunity_from || currentOpportunity.message.opportunity_from,
        opportunity_type: data.opportunity_type || currentOpportunity.message.opportunity_type,
        status: data.status || currentOpportunity.message.status,
        probability: data.probability || currentOpportunity.message.probability,
        expected_closing_date: data.expected_closing_date || currentOpportunity.message.expected_closing_date,
        opportunity_amount: data.opportunity_amount || currentOpportunity.message.opportunity_amount,
        sales_stage: data.sales_stage || currentOpportunity.message.sales_stage,
        customer: data.customer || currentOpportunity.message.customer,
        lead: data.lead || currentOpportunity.message.lead
      };
      
      // Use frappe.client.save to update the document
      const result = await frappeClient.call.post("frappe.client.save", {
        doc: opportunityData
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to update opportunity");
      }

      // Fetch the updated document
      const updatedOpportunity = await frappeClient.call.get("frappe.client.get", {
        doctype: "Opportunity",
        name: result.message.name
      });
      
      if (!updatedOpportunity || !updatedOpportunity.message) {
        throw new Error("Failed to fetch updated opportunity");
      }
      
      const doc = updatedOpportunity.message;
      const opportunity: Opportunity = {
        name: doc.name,
        opportunity_from: doc.opportunity_from,
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

// DELETE - Delete an opportunity
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ success: boolean }>(
    withEndpointLogging('/api/crm/opportunities/[name] - DELETE')(async () => {
      const { name } = await params;
      
      // Use frappe.client.delete to delete the document
      const result = await frappeClient.call.post("frappe.client.delete", {
        doctype: "Opportunity",
        name: name
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to delete opportunity");
      }
      
      return { success: true };
    }),
    { requireAuth: true }
  );
}