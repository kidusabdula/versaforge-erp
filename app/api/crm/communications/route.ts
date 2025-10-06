// app/api/crm/communications/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { Communication } from '@/types/crm';

// GET - Fetch all communications
export async function GET(request: NextRequest) {
  return handleApiRequest<{ communications: Communication[] }>(
    withEndpointLogging('/api/crm/communications - GET')(async () => {
      const { searchParams } = new URL(request.url);
      const filters: Record<string, any> = {};
      
      // Build filters from query parameters
      if (searchParams.get('communication_type')) filters.communication_type = searchParams.get('communication_type');
      if (searchParams.get('status')) filters.status = searchParams.get('status');
      if (searchParams.get('reference_doctype')) filters.reference_doctype = searchParams.get('reference_doctype');
      if (searchParams.get('reference_name')) filters.reference_name = searchParams.get('reference_name');
      if (searchParams.get('date_from')) filters.creation = ['>=', searchParams.get('date_from')];
      if (searchParams.get('date_to')) filters.creation = ['<=', searchParams.get('date_to')];
      
      // Step 1: Get just the list of communication names
      const communicationNames = await frappeClient.db.getDocList<{ name: string }>(
        "Communication",
        {
          fields: ["name"],
          filters: Object.entries(filters).map(([key, value]) => {
            if (key === 'creation' && Array.isArray(value)) {
              return [value[0], value[1], value[2]];
            }
            return [key, '=', value];
          }),
          orderBy: { field: 'creation', order: 'desc' },
          limit: 1000,
        }
      );
      
      console.log(`Found ${communicationNames.length} communications`);
      
      // Step 2: For each communication, get the full document
      const communicationsWithDetails = await Promise.all(
        communicationNames.map(async (communication) => {
          try {
            // Use frappe.client.get to get the entire document
            const fullCommunication = await frappeClient.call.get("frappe.client.get", {
              doctype: "Communication",
              name: communication.name
            });
            
            if (fullCommunication && fullCommunication.message) {
              const doc = fullCommunication.message;
              return {
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
            }
            return null;
          } catch (error) {
            console.error(`Error fetching communication ${communication.name}:`, error);
            return null;
          }
        })
      );
      
      // Filter out any null results
      const validCommunications = communicationsWithDetails.filter(communication => communication !== null) as Communication[];
      
      return { communications: validCommunications };
    })
  );
}

// POST - Create a new communication
export async function POST(request: NextRequest) {
  return handleApiRequest<{ communication: Communication }>(
    withEndpointLogging('/api/crm/communications - POST')(async () => {
      const data = await request.json();
      
      // Validate required fields
      if (!data.subject || !data.content) {
        throw new Error('Subject and content are required');
      }
      
      // Prepare communication data
      const communicationData = {
        doctype: "Communication",
        communication_type: data.communication_type || "Communication",
        subject: data.subject,
        content: data.content,
        status: data.status || "Open",
        reference_doctype: data.reference_doctype || "",
        reference_name: data.reference_name || ""
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