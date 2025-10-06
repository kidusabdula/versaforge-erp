// app/api/crm/activities/[name]/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { Activity } from '@/types/crm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ activity: Activity }>(
    withEndpointLogging('/api/crm/activities/[name] - GET')(async () => {
      // Await the params as required by Next.js 15
      const { name } = await params;
      
      // Get the activity
      const fullActivity = await frappeClient.call.get("frappe.client.get", {
        doctype: "ToDo",
        name: name,
      });
      
      if (!fullActivity || !fullActivity.message) {
        throw new Error("Activity not found");
      }
      
      const doc = fullActivity.message;
      
      // Map to our interface
      const activity: Activity = {
        name: doc.name,
        activity_type: doc.activity_type || "Task",
        subject: doc.description,
        description: doc.description,
        status: doc.status,
        priority: doc.priority,
        due_date: doc.date,
        assigned_to: doc.allocated_to,
        reference_doctype: doc.reference_doctype,
        reference_name: doc.reference_name,
        creation: doc.creation,
        modified: doc.modified,
        owner: doc.owner
      };
      
      return { activity };
    }),
    { requireAuth: true }
  );
}

// PUT - Update an activity
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ activity: Activity }>(
    withEndpointLogging('/api/crm/activities/[name] - PUT')(async () => {
      const { name } = await params;
      const data = await request.json();
      
      // Get the current activity
      const currentActivity = await frappeClient.call.get("frappe.client.get", {
        doctype: "ToDo",
        name: name,
      });
      
      if (!currentActivity || !currentActivity.message) {
        throw new Error("Activity not found");
      }
      
      // Prepare updated activity data
      const activityData = {
        ...currentActivity.message,
        description: data.subject || currentActivity.message.description, // Frappe uses 'description' for subject
        status: data.status || currentActivity.message.status,
        priority: data.priority || currentActivity.message.priority,
        date: data.due_date || currentActivity.message.date,
        allocated_to: data.assigned_to || currentActivity.message.allocated_to,
        reference_doctype: data.reference_doctype || currentActivity.message.reference_doctype,
        reference_name: data.reference_name || currentActivity.message.reference_name,
        activity_type: data.activity_type || currentActivity.message.activity_type || "Task"
      };
      
      // Use frappe.client.save to update the document
      const result = await frappeClient.call.post("frappe.client.save", {
        doc: activityData
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to update activity");
      }

      // Fetch the updated document
      const updatedActivity = await frappeClient.call.get("frappe.client.get", {
        doctype: "ToDo",
        name: result.message.name
      });
      
      if (!updatedActivity || !updatedActivity.message) {
        throw new Error("Failed to fetch updated activity");
      }
      
      const doc = updatedActivity.message;
      const activity: Activity = {
        name: doc.name,
        activity_type: doc.activity_type || "Task",
        subject: doc.description,
        description: doc.description,
        status: doc.status,
        priority: doc.priority,
        due_date: doc.date,
        assigned_to: doc.allocated_to,
        reference_doctype: doc.reference_doctype,
        reference_name: doc.reference_name,
        creation: doc.creation,
        modified: doc.modified,
        owner: doc.owner
      };
      
      return { activity };
    }),
    { requireAuth: true }
  );
}

// DELETE - Delete an activity
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ success: boolean }>(
    withEndpointLogging('/api/crm/activities/[name] - DELETE')(async () => {
      const { name } = await params;
      
      // Use frappe.client.delete to delete the document
      const result = await frappeClient.call.post("frappe.client.delete", {
        doctype: "ToDo",
        name: name
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to delete activity");
      }
      
      return { success: true };
    }),
    { requireAuth: true }
  );
}