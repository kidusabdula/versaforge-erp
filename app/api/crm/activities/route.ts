// app/api/crm/activities/route.ts
import { NextRequest } from "next/server";
import { frappeClient } from "@/lib/frappe-client";
import { handleApiRequest, withEndpointLogging } from "@/lib/api-template";
import { Activity } from "@/types/crm";

// GET - Fetch all activities
export async function GET(request: NextRequest) {
  return handleApiRequest<{ activities: Activity[] }>(
    withEndpointLogging("/api/crm/activities - GET")(async () => {
      const { searchParams } = new URL(request.url);
      const filters: Record<string, any> = {};

      // Build filters from query parameters
      if (searchParams.get("activity_type"))
        filters.activity_type = searchParams.get("activity_type");
      if (searchParams.get("status"))
        filters.status = searchParams.get("status");
      if (searchParams.get("priority"))
        filters.priority = searchParams.get("priority");
      if (searchParams.get("assigned_to"))
        filters.assigned_to = searchParams.get("assigned_to");
      if (searchParams.get("reference_doctype"))
        filters.reference_doctype = searchParams.get("reference_doctype");
      if (searchParams.get("reference_name"))
        filters.reference_name = searchParams.get("reference_name");
      if (searchParams.get("date_from"))
        filters.due_date = [">=", searchParams.get("date_from")];
      if (searchParams.get("date_to"))
        filters.due_date = ["<=", searchParams.get("date_to")];

      // Step 1: Get just the list of activity names
      const activityNames = await frappeClient.db.getDocList<{ name: string }>(
        "ToDo",
        {
          fields: ["name"],
          filters: Object.entries(filters).map(([key, value]) => {
            if (key === "due_date" && Array.isArray(value)) {
              return [value[0], value[1], value[2]];
            }
            return [key, "=", value];
          }),
          orderBy: { field: "creation", order: "desc" },
          limit: 1000,
        }
      );

      console.log(`Found ${activityNames.length} activities`);

      // Step 2: For each activity, get the full document
      const activitiesWithDetails = await Promise.all(
        activityNames.map(async (activity) => {
          try {
            // Use frappe.client.get to get the entire document
            const fullActivity = await frappeClient.call.get(
              "frappe.client.get",
              {
                doctype: "ToDo",
                name: activity.name,
              }
            );

            if (fullActivity && fullActivity.message) {
              const doc = fullActivity.message;
              return {
                name: doc.name,
                activity_type: doc.activity_type || "Task",
                subject: doc.description,
                description: doc.description,
                status: doc.status,
                priority: doc.priority,
                due_date: doc.date,
                assigned_to: doc.allocated_to,
                reference_doctype: doc.reference_type, // Changed from reference_doctype to reference_type
                reference_name: doc.reference_name,
                creation: doc.creation,
                modified: doc.modified,
                owner: doc.owner,
              };
            }
            return null;
          } catch (error) {
            console.error(`Error fetching activity ${activity.name}:`, error);
            return null;
          }
        })
      );

      // Filter out any null results
      const validActivities = activitiesWithDetails.filter(
        (activity) => activity !== null
      ) as Activity[];

      return { activities: validActivities };
    })
  );
}

// POST - Create a new activity
export async function POST(request: NextRequest) {
  return handleApiRequest<{ activity: Activity }>(
    withEndpointLogging("/api/crm/activities - POST")(async () => {
      const data = await request.json();

      // Validate required fields
      if (!data.subject) {
        throw new Error("Subject is required");
      }

      // Validate reference relationship
      if (data.reference_name && !data.reference_doctype) {
        throw new Error(
          "Reference doctype is required when reference name is provided"
        );
      }

      // If reference is provided, verify the referenced document exists
      if (data.reference_doctype && data.reference_name) {
        try {
          const referencedDoc = await frappeClient.call.get(
            "frappe.client.get",
            {
              doctype: data.reference_doctype,
              name: data.reference_name,
            }
          );

          if (!referencedDoc || !referencedDoc.message) {
            throw new Error(
              `Referenced ${data.reference_doctype} document not found`
            );
          }
        } catch (error) {
          throw new Error(
            `Referenced ${data.reference_doctype} document not found: ${data.reference_name}`
          );
        }
      }

      // Validate assigned_to user exists if provided
      let assignedTo = data.assigned_to || "";
      if (assignedTo) {
        try {
          const userExists = await frappeClient.call.get("frappe.client.get", {
            doctype: "User",
            name: assignedTo,
          });

          if (!userExists || !userExists.message) {
            console.warn(
              `User ${assignedTo} not found, falling back to current user`
            );
            assignedTo = ""; // Fall back to current user
          }
        } catch (error) {
          console.warn(
            `Error validating user ${assignedTo}, falling back to current user:`,
            error
          );
          assignedTo = ""; // Fall back to current user
        }
      }

      // Prepare activity data with proper field names for Frappe
      const activityData: any = {
        doctype: "ToDo",
        description: data.subject, // Frappe uses 'description' for subject
        status: data.status || "Open",
        priority: data.priority || "Medium",
        date: data.due_date || new Date().toISOString().split("T")[0],
        allocated_to: assignedTo, // Use validated assigned_to or empty string
        activity_type: data.activity_type || "Task",
      };

      // Only add reference fields if both are provided and valid
      if (data.reference_doctype && data.reference_name) {
        activityData.reference_type = data.reference_doctype;
        activityData.reference_name = data.reference_name;
      }

      // Use frappe.client.insert to create the document
      const result = await frappeClient.call.post("frappe.client.insert", {
        doc: activityData,
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to create activity");
      }

      // Fetch the complete document
      const completeActivity = await frappeClient.call.get(
        "frappe.client.get",
        {
          doctype: "ToDo",
          name: result.message.name,
        }
      );

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
        reference_doctype: doc.reference_type,
        reference_name: doc.reference_name,
        creation: doc.creation,
        modified: doc.modified,
        owner: doc.owner,
      };

      return { activity };
    }),
    { requireAuth: true }
  );
}
