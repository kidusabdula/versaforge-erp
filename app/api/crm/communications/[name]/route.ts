// app/api/crm/communications/[name]/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { Communication } from '@/types/crm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ communication: Communication }>(
    withEndpointLogging('/api/crm/communications/[name] - GET')(async () => {
      // Await the params as required by Next.js 15
      const { name } = await params;
      
      // Get the communication
      const fullCommunication = await frappeClient.call.get("frappe.client.get", {
        doctype: "Communication",
        name: name,
      });
      
      if (!fullCommunication || !fullCommunication.message) {
        throw new Error("Communication not found");
      }
      
      const doc = fullCommunication.message;
      
      // Map to our interface
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

// PUT - Update a communication
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ communication: Communication }>(
    withEndpointLogging('/api/crm/communications/[name] - PUT')(async () => {
      const { name } = await params;
      const data = await request.json();
      
      // Get the current communication
      const currentCommunication = await frappeClient.call.get("frappe.client.get", {
        doctype: "Communication",
        name: name,
      });
      
      if (!currentCommunication || !currentCommunication.message) {
        throw new Error("Communication not found");
      }
      
      // Prepare updated communication data
      const communicationData = {
        ...currentCommunication.message,
        communication_type: data.communication_type || currentCommunication.message.communication_type,
        subject: data.subject || currentCommunication.message.subject,
        content: data.content || currentCommunication.message.content,
        status: data.status || currentCommunication.message.status,
        reference_doctype: data.reference_doctype || currentCommunication.message.reference_doctype,
        reference_name: data.reference_name || currentCommunication.message.reference_name
      };
      
      // Use frappe.client.save to update the document
      const result = await frappeClient.call.post("frappe.client.save", {
        doc: communicationData
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to update communication");
      }

      // Fetch the updated document
      const updatedCommunication = await frappeClient.call.get("frappe.client.get", {
        doctype: "Communication",
        name: result.message.name
      });
      
      if (!updatedCommunication || !updatedCommunication.message) {
        throw new Error("Failed to fetch updated communication");
      }
      
      const doc = updatedCommunication.message;
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

// DELETE - Delete a communication
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ success: boolean }>(
    withEndpointLogging('/api/crm/communications/[name] - DELETE')(async () => {
      const { name } = await params;
      
      // Use frappe.client.delete to delete the document
      const result = await frappeClient.call.post("frappe.client.delete", {
        doctype: "Communication",
        name: name
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to delete communication");
      }
      
      return { success: true };
    }),
    { requireAuth: true }
  );
}