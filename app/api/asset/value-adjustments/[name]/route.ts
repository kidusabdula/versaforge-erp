// app/api/asset/value-adjustments/[name]/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { AssetValueAdjustment } from '@/types/asset';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ adjustment: AssetValueAdjustment }>(
    withEndpointLogging('/api/asset/value-adjustments/[name] - GET')(async () => {
      // Await the params as required by Next.js 15
      const { name } = await params;
      
      // Get the asset value adjustment record
      const fullAdjustment = await frappeClient.call.get("frappe.client.get", {
        doctype: "Asset Value Adjustment",
        name: name,
      });
      
      if (!fullAdjustment || !fullAdjustment.message) {
        throw new Error("Asset value adjustment record not found");
      }
      
      const doc = fullAdjustment.message;
      
      // Map to our interface
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

// PUT - Update an asset value adjustment record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ adjustment: AssetValueAdjustment }>(
    withEndpointLogging('/api/asset/value-adjustments/[name] - PUT')(async () => {
      const { name } = await params;
      const data = await request.json();
      
      // Get the current adjustment record
      const currentAdjustment = await frappeClient.call.get("frappe.client.get", {
        doctype: "Asset Value Adjustment",
        name: name,
      });
      
      if (!currentAdjustment || !currentAdjustment.message) {
        throw new Error("Asset value adjustment record not found");
      }
      
      // Calculate difference amount
      const currentAssetValue = data.current_asset_value || currentAdjustment.message.current_asset_value;
      const newAssetValue = data.new_asset_value || currentAdjustment.message.new_asset_value;
      const differenceAmount = newAssetValue - currentAssetValue;
      
      // Prepare updated adjustment data
      const adjustmentData = {
        ...currentAdjustment.message,
        asset: data.asset || currentAdjustment.message.asset,
        date: data.date || currentAdjustment.message.date,
        current_asset_value: currentAssetValue,
        new_asset_value: newAssetValue,
        difference_amount: differenceAmount,
        difference_account: data.difference_account || currentAdjustment.message.difference_account,
        company: data.company || currentAdjustment.message.company,
        finance_book: data.finance_book || currentAdjustment.message.finance_book,
        reason: data.reason || currentAdjustment.message.reason,
        approved_by: data.approved_by || currentAdjustment.message.approved_by,
        amended_from: data.amended_from || currentAdjustment.message.amended_from
      };
      
      // Use frappe.client.save to update the document
      const result = await frappeClient.call.post("frappe.client.save", {
        doc: adjustmentData
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to update asset value adjustment record");
      }

      // Fetch the updated document
      const updatedAdjustment = await frappeClient.call.get("frappe.client.get", {
        doctype: "Asset Value Adjustment",
        name: result.message.name
      });
      
      if (!updatedAdjustment || !updatedAdjustment.message) {
        throw new Error("Failed to fetch updated asset value adjustment record");
      }
      
      const doc = updatedAdjustment.message;
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

// DELETE - Delete an asset value adjustment record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ success: boolean }>(
    withEndpointLogging('/api/asset/value-adjustments/[name] - DELETE')(async () => {
      const { name } = await params;
      
      // Use frappe.client.delete to delete the document
      const result = await frappeClient.call.post("frappe.client.delete", {
        doctype: "Asset Value Adjustment",
        name: name
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to delete asset value adjustment record");
      }
      
      return { success: true };
    }),
    { requireAuth: true }
  );
}