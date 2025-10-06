// app/api/crm/communications/by-reference/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { Communication } from '@/types/crm';

export async function GET(request: NextRequest) {
  return handleApiRequest<{ communications: Communication[] }>(
    withEndpointLogging('/api/crm/communications/by-reference - GET')(async () => {
      const { searchParams } = new URL(request.url);
      const doctype = searchParams.get('doctype');
      const name = searchParams.get('name');
      
      if (!doctype || !name) {
        throw new Error('Doctype and name are required');
      }
      
      // Get communications linked to this reference
      const communications = await frappeClient.call.get("frappe.client.get_list", {
        doctype: "Communication",
        fields: ["name", "communication_type", "subject", "content", "status", "creation", "modified", "owner"],
        filters: [
          ["reference_doctype", "=", doctype],
          ["reference_name", "=", name]
        ],
        orderBy: { field: 'creation', order: 'desc' },
        limit: 100,
      });
      
      const processedCommunications = communications.message?.map((comm: any) => ({
        name: comm.name,
        communication_type: comm.communication_type,
        subject: comm.subject,
        content: comm.content,
        status: comm.status,
        reference_doctype: doctype,
        reference_name: name,
        creation: comm.creation,
        modified: comm.modified,
        owner: comm.owner
      })) || [];
      
      return { communications: processedCommunications };
    }),
    { requireAuth: true }
  );
}

// POST - Create a new communication for a reference
export async function POST(request: NextRequest) {
  return handleApiRequest<{ communication: Communication }>(
    withEndpointLogging('/api/crm/communications/by-reference - POST')(async () => {
      const { searchParams } = new URL(request.url);
      const doctype = searchParams.get('doctype');
      const name = searchParams.get('name');
      const data = await request.json();
      
      if (!doctype || !name) {
        throw new Error('Doctype and name are required');
      }
      
      // Validate required fields
      if (!data.subject || !data.content) {
        throw new Error('Subject and content are required');
      }
      
      // Prepare communication data with reference
      const communicationData = {
        doctype: "Communication",
        communication_type: data.communication_type || "Communication",
        subject: data.subject,
        content: data.content,
        status: data.status || "Open",
        reference_doctype: doctype,
        reference_name: name
      };
      
      // Use frappe.client.insert to create the document
      const result = await frappeClient.call.post("frappe.client.insert", {
        doc: communicationData
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to create communication");
      }

      // Fetch the complete document
      const completeCommunication = await frappeClient.call.get("frappe.client.get", {
        doctype: "Communication",
        name: result.message.name
      });
      
      if (!completeCommunication || !completeCommunication.message) {
        throw new Error("Failed to fetch created communication");
      }
      
      const doc = completeCommunication.message;
      const communication: Communication = {
        name: doc.name,
        communication_type: doc.communication_type,
        subject: doc.subject,
        content: doc.content,
        status: doc.status,
        reference_doctype: doc.reference_doctype,
        reference_name: doc.reference_name,
        creation: doc.creation,
        modified: doc.modified,
        owner: doc.owner
      };
      
      return { communication };
    }),
    { requireAuth: true }
  );
}