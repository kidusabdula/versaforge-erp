// app/api/asset/maintenance/asset/[assetName]/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { AssetMaintenance } from '@/types/asset';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assetName: string }> }
) {
  return handleApiRequest<{ maintenance: AssetMaintenance[] }>(
    withEndpointLogging('/api/asset/maintenance/asset/[assetName] - GET')(async () => {
      // Await the params as required by Next.js 15
      const { assetName } = await params;
      
      // Get maintenance records for this asset
      const maintenanceRecords = await frappeClient.call.get("frappe.client.get_list", {
        doctype: "Asset Maintenance",
        fields: ["name", "asset", "maintenance_type", "maintenance_date", "description", "cost", "next_maintenance_date", "status", "creation", "modified", "owner", "maintenance_team"],
        filters: [["asset", "=", assetName]],
        orderBy: { field: 'maintenance_date', order: 'desc' },
        limit: 100,
      });
      
      const processedMaintenance = maintenanceRecords.message?.map((record: any) => ({
        name: record.name,
        asset: record.asset,
        maintenance_type: record.maintenance_type || "",
        maintenance_date: record.maintenance_date,
        description: record.description || "",
        cost: record.cost || 0,
        next_maintenance_date: record.next_maintenance_date,
        status: record.status,
        creation: record.creation,
        modified: record.modified,
        owner: record.owner,
        maintenance_team: record.maintenance_team
      })) || [];
      
      return { maintenance: processedMaintenance };
    }),
    { requireAuth: true }
  );
}

// POST - Create a new maintenance record for this asset
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assetName: string }> }
) {
  return handleApiRequest<{ maintenance: AssetMaintenance }>(
    withEndpointLogging('/api/asset/maintenance/asset/[assetName] - POST')(async () => {
      const { assetName } = await params;
      const data = await request.json();
      
      // Validate required fields
      if (!data.maintenance_date) {
        throw new Error("Maintenance date is required");
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
      
      // Get asset details
      const assetDetails = await frappeClient.call.get("frappe.client.get", {
        doctype: "Asset",
        name: assetName
      });
      
      if (!assetDetails || !assetDetails.message) {
        throw new Error("Asset not found");
      }
      
      // Prepare maintenance data with required fields
      const maintenanceData = {
        doctype: "Asset Maintenance",
        asset_name: assetDetails.message.asset_name,
        asset: assetName,
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
        doc: maintenanceData
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to create asset maintenance record");
      }

      // Fetch the complete document
      const completeMaintenance = await frappeClient.call.get("frappe.client.get", {
        doctype: "Asset Maintenance",
        name: result.message.name
      });
      
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