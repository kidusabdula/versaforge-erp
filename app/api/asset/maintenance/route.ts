// app/api/asset/maintenance/route.ts
import { NextRequest } from "next/server";
import { frappeClient } from "@/lib/frappe-client";
import { handleApiRequest, withEndpointLogging } from "@/lib/api-template";
import { AssetMaintenance } from "@/types/asset";

// GET - Fetch all asset maintenance records
export async function GET(request: NextRequest) {
  return handleApiRequest<{ maintenance: AssetMaintenance[] }>(
    withEndpointLogging("/api/asset/maintenance - GET")(async () => {
      const { searchParams } = new URL(request.url);
      const filters: Record<string, any> = {};

      // Build filters from query parameters
      if (searchParams.get("asset")) filters.asset = searchParams.get("asset");
      if (searchParams.get("status"))
        filters.status = searchParams.get("status");
      if (searchParams.get("date_from"))
        filters.maintenance_date = [">=", searchParams.get("date_from")];
      if (searchParams.get("date_to"))
        filters.maintenance_date = ["<=", searchParams.get("date_to")];

      // Step 1: Get just the list of maintenance names
      const maintenanceNames = await frappeClient.db.getDocList<{
        name: string;
      }>("Asset Maintenance", {
        fields: ["name"],
        filters: Object.entries(filters).map(([key, value]) => {
          if (key === "maintenance_date" && Array.isArray(value)) {
            return [value[0], value[1], value[2]];
          }
          return [key, "=", value];
        }),
        orderBy: { field: "creation", order: "desc" },
        limit: 1000,
      });

      console.log(`Found ${maintenanceNames.length} asset maintenance records`);

      // Step 2: For each maintenance record, get the full document
      const maintenanceWithDetails = await Promise.all(
        maintenanceNames.map(async (maintenance) => {
          try {
            // Use frappe.client.get to get the entire document
            const fullMaintenance = await frappeClient.call.get(
              "frappe.client.get",
              {
                doctype: "Asset Maintenance",
                name: maintenance.name,
              }
            );

            if (fullMaintenance && fullMaintenance.message) {
              const doc = fullMaintenance.message;
              return {
                name: doc.name,
                asset: doc.asset,
                maintenance_type: doc.maintenance_type || "",
                maintenance_date: doc.maintenance_date,
                description: doc.description || "",
                cost: doc.cost || 0,
                next_maintenance_date: doc.next_maintenance_date,
                status: doc.status,
                creation: doc.creation,
                modified: doc.modified,
                owner: doc.owner,
              };
            }
            return null;
          } catch (error) {
            console.error(
              `Error fetching asset maintenance ${maintenance.name}:`,
              error
            );
            return null;
          }
        })
      );

      // Filter out any null results
      const validMaintenance = maintenanceWithDetails.filter(
        (maintenance) => maintenance !== null
      ) as AssetMaintenance[];

      return { maintenance: validMaintenance };
    })
  );
}

// POST - Create a new asset maintenance record
export async function POST(request: NextRequest) {
    return handleApiRequest<{ maintenance: AssetMaintenance }>(
      withEndpointLogging("/api/asset/maintenance - POST")(async () => {
        const data = await request.json();
  
        // Validate required fields
        if (!data.asset || !data.maintenance_date) {
          throw new Error("Asset and maintenance date are required");
        }
  
        // Calculate proper dates for tasks
        const maintenanceDate = new Date(data.maintenance_date);
        let taskEndDate: string;
        
        if (data.status === "Completed") {
          // For completed tasks, end date should be after start date
          const endDate = new Date(maintenanceDate);
          endDate.setDate(endDate.getDate() + 1); // Add one day
          taskEndDate = endDate.toISOString().split('T')[0];
        } else {
          // For scheduled tasks, use next maintenance date or add 30 days
          taskEndDate = data.next_maintenance_date || new Date(maintenanceDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        }
  
        // Prepare maintenance data with required fields
        const maintenanceData = {
          doctype: "Asset Maintenance",
          asset_name: data.asset_name,
          asset: data.asset,
          maintenance_type: data.maintenance_type || "",
          maintenance_date: data.maintenance_date,
          description: data.description || "",
          cost: data.cost || 0,
          next_maintenance_date: data.next_maintenance_date,
          status: data.status || "Scheduled",
          maintenance_team: data.maintenance_team || "PC Maintainers",
          asset_maintenance_tasks: data.asset_maintenance_tasks || [
            {
              maintenance_task: data.maintenance_task || "General Maintenance",
              maintenance_status: data.status === "Completed" ? "Completed" : "Planned",
              start_date: data.maintenance_date,
              end_date: taskEndDate,
              assign_to: data.assign_to || "",
              periodicity: data.periodicity
            }
          ]
        };
  
        // Use frappe.client.insert to create the document
        const result = await frappeClient.call.post("frappe.client.insert", {
          doc: maintenanceData,
        });
  
        if (!result.message || !result.message.name) {
          throw new Error("Failed to create asset maintenance record");
        }
  
        // Fetch the complete document
        const completeMaintenance = await frappeClient.call.get(
          "frappe.client.get",
          {
            doctype: "Asset Maintenance",
            name: result.message.name,
          }
        );
  
        if (!completeMaintenance || !completeMaintenance.message) {
          throw new Error("Failed to fetch created asset maintenance record");
        }
  
        const doc = completeMaintenance.message;
        const maintenance: AssetMaintenance = {
          name: doc.name,
          asset: doc.asset,
          maintenance_type: doc.maintenance_type || "",
          maintenance_date: doc.maintenance_date,
          description: doc.description || "",
          cost: doc.cost || 0,
          next_maintenance_date: doc.next_maintenance_date,
          status: doc.status,
          creation: doc.creation,
          modified: doc.modified,
          owner: doc.owner,
          maintenance_team: doc.maintenance_team,
          asset_maintenance_tasks: doc.asset_maintenance_tasks || []
        };
  
        return { maintenance };
      }),
      { requireAuth: true }
    );
  }