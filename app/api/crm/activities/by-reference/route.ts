// app/api/crm/activities/by-reference/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { Activity } from '@/types/crm';

export async function GET(request: NextRequest) {
  return handleApiRequest<{ activities: Activity[] }>(
    withEndpointLogging('/api/crm/activities/by-reference - GET')(async () => {
      const { searchParams } = new URL(request.url);
      const doctype = searchParams.get('doctype');
      const name = searchParams.get('name');
      
      if (!doctype || !name) {
        throw new Error('Doctype and name are required');
      }
      
      // Get activities linked to this reference
      const activities = await frappeClient.call.get("frappe.client.get_list", {
        doctype: "ToDo",
        fields: ["name", "activity_type", "description", "status", "priority", "date", "allocated_to", "creation", "modified", "owner"],
        filters: [
          ["reference_type", "=", doctype],
          ["reference_name", "=", name]
        ],
        orderBy: { field: 'date', order: 'asc' },
        limit: 100,
      });
      
      const processedActivities = activities.message?.map((activity: any) => ({
        name: activity.name,
        activity_type: activity.activity_type || "Task",
        subject: activity.description,
        description: activity.description,
        status: activity.status,
        priority: activity.priority,
        due_date: activity.date,
        assigned_to: activity.allocated_to,
        reference_doctype: doctype,
        reference_name: name,
        creation: activity.creation,
        modified: activity.modified,
        owner: activity.owner
      })) || [];
      
      return { activities: processedActivities };
    }),
    { requireAuth: true }
  );
}

// POST - Create a new activity for a reference
export async function POST(request: NextRequest) {
  return handleApiRequest<{ activity: Activity }>(
    withEndpointLogging('/api/crm/activities/by-reference - POST')(async () => {
      const { searchParams } = new URL(request.url);
      const doctype = searchParams.get('doctype');
      const name = searchParams.get('name');
      const data = await request.json();
      
      if (!doctype || !name) {
        throw new Error('Doctype and name are required');
      }
      
      // Validate required fields
      if (!data.subject) {
        throw new Error('Subject is required');
      }
      
      // Prepare activity data with reference
      const activityData = {
        doctype: "ToDo",
        description: data.subject, // Frappe uses 'description' for subject
        status: data.status || "Open",
        priority: data.priority || "Medium",
        date: data.due_date || new Date().toISOString().split('T')[0],
        allocated_to: data.assigned_to || "",
        reference_type: doctype, // Changed to reference_type
        reference_name: name,
        activity_type: data.activity_type || "Task"
      };
      
      // Use frappe.client.insert to create the document
      const result = await frappeClient.call.post("frappe.client.insert", {
        doc: activityData
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to create activity");
      }

      // Fetch the complete document
      const completeActivity = await frappeClient.call.get("frappe.client.get", {
        doctype: "ToDo",
        name: result.message.name
      });
      
      if (!completeActivity || !completeActivity.message) {
        throw new Error("Failed to fetch created activity");
      }
      
      const doc = completeActivity.message;
      const activity: Activity = {
        name: doc.name,
        activity_type: doc.activity_type || "Task",
        subject: doc.description,
        description: doc.description,
        status: doc.status,
        priority: doc.priority,
        due_date: doc.date,
        assigned_to: doc.allocated_to,
        reference_doctype: doc.reference_type, // Changed to reference_type
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