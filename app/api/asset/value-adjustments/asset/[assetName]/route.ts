// app/api/asset/value-adjustments/asset/[assetName]/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { AssetValueAdjustment } from '@/types/asset';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assetName: string }> }
) {
  return handleApiRequest<{ adjustments: AssetValueAdjustment[] }>(
    withEndpointLogging('/api/asset/value-adjustments/asset/[assetName] - GET')(async () => {
      // Await the params as required by Next.js 15
      const { assetName } = await params;
      
      // Get value adjustment records for this asset
      const adjustmentRecords = await frappeClient.call.get("frappe.client.get_list", {
        doctype: "Asset Value Adjustment",
        fields: ["name", "asset", "date", "current_asset_value", "new_asset_value", "reason", "approved_by", "creation", "modified", "owner"],
        filters: [["asset", "=", assetName]],
        orderBy: { field: 'date', order: 'desc' },
        limit: 100,
      });
      
      const processedAdjustments = adjustmentRecords.message?.map((record: any) => ({
        name: record.name,
        asset: record.asset,
        adjustment_date: record.date,
        current_value: record.current_asset_value,
        new_value: record.new_asset_value,
        reason: record.reason || "",
        approved_by: record.approved_by || "",
        creation: record.creation,
        modified: record.modified,
        owner: record.owner
      })) || [];
      
      return { adjustments: processedAdjustments };
    }),
    { requireAuth: true }
  );
}

// POST - Create a new value adjustment record for this asset
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assetName: string }> }
) {
  return handleApiRequest<{ adjustment: AssetValueAdjustment }>(
    withEndpointLogging('/api/asset/value-adjustments/asset/[assetName] - POST')(async () => {
      const { assetName } = await params;
      const data = await request.json();
      
      // Validate required fields
      if (!data.date || !data.current_asset_value || !data.new_asset_value) {
        throw new Error("Date, current asset value, and new asset value are required");
      }
      
      // Get asset details
      const assetDetails = await frappeClient.call.get("frappe.client.get", {
        doctype: "Asset",
        name: assetName
      });
      
      if (!assetDetails || !assetDetails.message) {
        throw new Error("Asset not found");
      }
      
      // Calculate difference amount
      const currentAssetValue = data.current_asset_value;
      const newAssetValue = data.new_asset_value;
      const differenceAmount = newAssetValue - currentAssetValue;
      
      // Prepare adjustment data
      const adjustmentData = {
        doctype: "Asset Value Adjustment",
        asset: assetName,
        date: data.date,
        current_asset_value: currentAssetValue,
        new_asset_value: newAssetValue,
        difference_amount: differenceAmount,
        difference_account: data.difference_account || "Asset Value Adjustment - Ma Beignet (Demo)",
        company: data.company || assetDetails.message.company,
        finance_book: data.finance_book || "",
        reason: data.reason || "",
        approved_by: data.approved_by || "",
        amended_from: data.amended_from || ""
      };
      
      // Use frappe.client.insert to create the document
      const result = await frappeClient.call.post("frappe.client.insert", {
        doc: adjustmentData
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to create asset value adjustment record");
      }

      // Fetch the complete document
      const completeAdjustment = await frappeClient.call.get("frappe.client.get", {
        doctype: "Asset Value Adjustment",
        name: result.message.name
      });
      
      if (!completeAdjustment || !completeAdjustment.message) {
        throw new Error("Failed to fetch created asset value adjustment record");
      }
      
      const doc = completeAdjustment.message;
      const adjustment: AssetValueAdjustment = {
        name: doc.name,
        asset: doc.asset,
        adjustment_date: doc.date,
        current_value: doc.current_asset_value,
        new_value: doc.new_asset_value,
        reason: doc.reason || "",
        approved_by: doc.approved_by || "",
        creation: doc.creation,
        modified: doc.modified,
        owner: doc.owner
      };
      
      return { adjustment };
    }),
    { requireAuth: true }
  );
}