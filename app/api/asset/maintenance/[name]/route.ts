// app/api/asset/maintenance/[name]/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { AssetMaintenance } from '@/types/asset';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ maintenance: AssetMaintenance }>(
    withEndpointLogging('/api/asset/maintenance/[name] - GET')(async () => {
      // Await the params as required by Next.js 15
      const { name } = await params;
      
      // Get the asset maintenance record
      const fullMaintenance = await frappeClient.call.get("frappe.client.get", {
        doctype: "Asset Maintenance",
        name: name,
      });
      
      if (!fullMaintenance || !fullMaintenance.message) {
        throw new Error("Asset maintenance record not found");
      }
      
      const doc = fullMaintenance.message;
      
      // Map to our interface
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

// PUT - Update an asset maintenance record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ maintenance: AssetMaintenance }>(
    withEndpointLogging('/api/asset/maintenance/[name] - PUT')(async () => {
      const { name } = await params;
      const data = await request.json();
      
      // Get the current maintenance record
      const currentMaintenance = await frappeClient.call.get("frappe.client.get", {
        doctype: "Asset Maintenance",
        name: name,
      });
      
      if (!currentMaintenance || !currentMaintenance.message) {
        throw new Error("Asset maintenance record not found");
      }
      
      // Calculate proper dates for tasks if status is changing
      let taskEndDate: string;
      if (data.status === "Completed") {
        const maintenanceDate = new Date(data.maintenance_date || currentMaintenance.message.maintenance_date);
        const endDate = new Date(maintenanceDate);
        endDate.setDate(endDate.getDate() + 1);
        taskEndDate = endDate.toISOString().split('T')[0];
      } else {
        taskEndDate = data.next_maintenance_date || currentMaintenance.message.next_maintenance_date;
      }
      
      // Prepare updated maintenance data
      const maintenanceData = {
        ...currentMaintenance.message,
        asset_name: data.asset_name || currentMaintenance.message.asset_name,
        asset: data.asset || currentMaintenance.message.asset,
        maintenance_type: data.maintenance_type || currentMaintenance.message.maintenance_type,
        maintenance_date: data.maintenance_date || currentMaintenance.message.maintenance_date,
        description: data.description || currentMaintenance.message.description,
        cost: data.cost || currentMaintenance.message.cost,
        next_maintenance_date: data.next_maintenance_date || currentMaintenance.message.next_maintenance_date,
        status: data.status || currentMaintenance.message.status,
        maintenance_team: data.maintenance_team || currentMaintenance.message.maintenance_team,
        asset_maintenance_tasks: data.asset_maintenance_tasks || currentMaintenance.message.asset_maintenance_tasks?.map((task: any) => ({
          ...task,
          maintenance_status: data.status === "Completed" ? "Completed" : task.maintenance_status,
          end_date: taskEndDate
        })) || []
      };
      
      // Use frappe.client.save to update the document
      const result = await frappeClient.call.post("frappe.client.save", {
        doc: maintenanceData
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to update asset maintenance record");
      }

      // Fetch the updated document
      const updatedMaintenance = await frappeClient.call.get("frappe.client.get", {
        doctype: "Asset Maintenance",
        name: result.message.name
      });
      
      if (!updatedMaintenance || !updatedMaintenance.message) {
        throw new Error("Failed to fetch updated asset maintenance record");
      }
      
      const doc = updatedMaintenance.message;
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

// DELETE - Delete an asset maintenance record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ success: boolean }>(
    withEndpointLogging('/api/asset/maintenance/[name] - DELETE')(async () => {
      const { name } = await params;
      
      // Use frappe.client.delete to delete the document
      const result = await frappeClient.call.post("frappe.client.delete", {
        doctype: "Asset Maintenance",
        name: name
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to delete asset maintenance record");
      }
      
      return { success: true };
    }),
    { requireAuth: true }
  );
}