// app/api/asset/repairs/[name]/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { AssetRepair } from '@/types/asset';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ repair: AssetRepair }>(
    withEndpointLogging('/api/asset/repairs/[name] - GET')(async () => {
      // Await the params as required by Next.js 15
      const { name } = await params;
      
      // Get the asset repair record
      const fullRepair = await frappeClient.call.get("frappe.client.get", {
        doctype: "Asset Repair",
        name: name,
      });
      
      if (!fullRepair || !fullRepair.message) {
        throw new Error("Asset repair record not found");
      }
      
      const doc = fullRepair.message;
      
      // Map to our interface
      const repair: AssetRepair = {
        name: doc.name,
        asset: doc.asset,
        repair_type: doc.repair_type || "",
        repair_date: doc.repair_date,
        failure_date: doc.failure_date,
        description: doc.description || "",
        cost: doc.cost || 0,
        technician: doc.technician || "",
        status: doc.status,
        creation: doc.creation,
        modified: doc.modified,
        owner: doc.owner,
        company: doc.company,
        completion_date: doc.completion_date,
        cause_of_failure: doc.cause_of_failure,
        actions_performed: doc.actions_performed,
        downtime: doc.downtime || 0,
        repair_details: doc.repair_details || ""
      };
      
      return { repair };
    }),
    { requireAuth: true }
  );
}

// PUT - Update an asset repair record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ repair: AssetRepair }>(
    withEndpointLogging('/api/asset/repairs/[name] - PUT')(async () => {
      const { name } = await params;
      const data = await request.json();
      
      // Get the current repair record
      const currentRepair = await frappeClient.call.get("frappe.client.get", {
        doctype: "Asset Repair",
        name: name,
      });
      
      if (!currentRepair || !currentRepair.message) {
        throw new Error("Asset repair record not found");
      }
      
      // Prepare updated repair data
      const repairData = {
        ...currentRepair.message,
        asset: data.asset || currentRepair.message.asset,
        repair_type: data.repair_type || currentRepair.message.repair_type,
        repair_date: data.repair_date || currentRepair.message.repair_date,
        failure_date: data.failure_date || currentRepair.message.failure_date,
        description: data.description || currentRepair.message.description,
        cost: data.cost || currentRepair.message.cost,
        technician: data.technician || currentRepair.message.technician,
        status: data.status || currentRepair.message.status,
        company: data.company || currentRepair.message.company,
        completion_date: data.completion_date || currentRepair.message.completion_date,
        cause_of_failure: data.cause_of_failure || currentRepair.message.cause_of_failure,
        actions_performed: data.actions_performed || currentRepair.message.actions_performed,
        downtime: data.downtime || currentRepair.message.downtime,
        repair_details: data.repair_details || currentRepair.message.repair_details
      };
      
      // Use frappe.client.save to update the document
      const result = await frappeClient.call.post("frappe.client.save", {
        doc: repairData
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to update asset repair record");
      }

      // Fetch the updated document
      const updatedRepair = await frappeClient.call.get("frappe.client.get", {
        doctype: "Asset Repair",
        name: result.message.name
      });
      
      if (!updatedRepair || !updatedRepair.message) {
        throw new Error("Failed to fetch updated asset repair record");
      }
      
      const doc = updatedRepair.message;
      const repair: AssetRepair = {
        name: doc.name,
        asset: doc.asset,
        repair_type: doc.repair_type || "",
        repair_date: doc.repair_date,
        failure_date: doc.failure_date,
        description: doc.description || "",
        cost: doc.cost || 0,
        technician: doc.technician || "",
        status: doc.status,
        creation: doc.creation,
        modified: doc.modified,
        owner: doc.owner,
        company: doc.company,
        completion_date: doc.completion_date,
        cause_of_failure: doc.cause_of_failure,
        actions_performed: doc.actions_performed,
        downtime: doc.downtime || 0,
        repair_details: doc.repair_details || ""
      };
      
      return { repair };
    }),
    { requireAuth: true }
  );
}

// DELETE - Delete an asset repair record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ success: boolean }>(
    withEndpointLogging('/api/asset/repairs/[name] - DELETE')(async () => {
      const { name } = await params;
      
      // Use frappe.client.delete to delete the document
      const result = await frappeClient.call.post("frappe.client.delete", {
        doctype: "Asset Repair",
        name: name
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to delete asset repair record");
      }
      
      return { success: true };
    }),
    { requireAuth: true }
  );
}