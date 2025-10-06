// app/api/asset/repairs/asset/[assetName]/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { AssetRepair } from '@/types/asset';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assetName: string }> }
) {
  return handleApiRequest<{ repairs: AssetRepair[] }>(
    withEndpointLogging('/api/asset/repairs/asset/[assetName] - GET')(async () => {
      // Await the params as required by Next.js 15
      const { assetName } = await params;
      
      // Get repair records for this asset
      const repairRecords = await frappeClient.call.get("frappe.client.get_list", {
        doctype: "Asset Repair",
        fields: ["name", "asset", "repair_type", "repair_date", "failure_date", "description", "cost", "technician", "status", "creation", "modified", "owner", "company", "completion_date", "cause_of_failure", "actions_performed", "downtime", "repair_details"],
        filters: [["asset", "=", assetName]],
        orderBy: { field: 'repair_date', order: 'desc' },
        limit: 100,
      });
      
      const processedRepairs = repairRecords.message?.map((record: any) => ({
        name: record.name,
        asset: record.asset,
        repair_type: record.repair_type || "",
        repair_date: record.repair_date,
        failure_date: record.failure_date,
        description: record.description || "",
        cost: record.cost || 0,
        technician: record.technician || "",
        status: record.status,
        creation: record.creation,
        modified: record.modified,
        owner: record.owner,
        company: record.company,
        completion_date: record.completion_date,
        cause_of_failure: record.cause_of_failure,
        actions_performed: record.actions_performed,
        downtime: record.downtime || 0,
        repair_details: record.repair_details || ""
      })) || [];
      
      return { repairs: processedRepairs };
    }),
    { requireAuth: true }
  );
}

// POST - Create a new repair record for this asset
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assetName: string }> }
) {
  return handleApiRequest<{ repair: AssetRepair }>(
    withEndpointLogging('/api/asset/repairs/asset/[assetName] - POST')(async () => {
      const { assetName } = await params;
      const data = await request.json();
      
      // Validate required fields
      if (!data.repair_date) {
        throw new Error("Repair date is required");
      }
      
      // Get asset details
      const assetDetails = await frappeClient.call.get("frappe.client.get", {
        doctype: "Asset",
        name: assetName
      });
      
      if (!assetDetails || !assetDetails.message) {
        throw new Error("Asset not found");
      }
      
      // Prepare repair data
      const repairData = {
        doctype: "Asset Repair",
        asset: assetName,
        repair_type: data.repair_type || "",
        repair_date: data.repair_date,
        failure_date: data.failure_date,
        description: data.description || "",
        cost: data.cost || 0,
        technician: data.technician || "",
        status: data.status || "Reported",
        company: data.company || assetDetails.message.company,
        completion_date: data.completion_date,
        cause_of_failure: data.cause_of_failure,
        actions_performed: data.actions_performed,
        downtime: data.downtime || 0,
        repair_details: data.repair_details || ""
      };
      
      // Use frappe.client.insert to create the document
      const result = await frappeClient.call.post("frappe.client.insert", {
        doc: repairData
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to create asset repair record");
      }

      // Fetch the complete document
      const completeRepair = await frappeClient.call.get("frappe.client.get", {
        doctype: "Asset Repair",
        name: result.message.name
      });
      
      if (!completeRepair || !completeRepair.message) {
        throw new Error("Failed to fetch created asset repair record");
      }
      
      const doc = completeRepair.message;
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