// app/api/asset/assets/[name]/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { Asset } from '@/types/asset';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ asset: Asset }>(
    withEndpointLogging('/api/asset/assets/[name] - GET')(async () => {
      // Await the params as required by Next.js 15
      const { name } = await params;
      
      // Get the asset
      const fullAsset = await frappeClient.call.get("frappe.client.get", {
        doctype: "Asset",
        name: name,
      });
      
      if (!fullAsset || !fullAsset.message) {
        throw new Error("Asset not found");
      }
      
      const doc = fullAsset.message;
      
      // Map to our interface
      const asset: Asset = {
        name: doc.name,
        asset_name: doc.asset_name,
        asset_category: doc.asset_category,
        item_code: doc.item_code || "",
        serial_no: doc.serial_no || "",
        purchase_date: doc.purchase_date,
        purchase_value: doc.purchase_value,
        current_value: doc.current_value,
        location: doc.location,
        status: doc.status,
        warranty_expiry_date: doc.warranty_expiry_date,
        assigned_to: doc.assigned_to || "",
        creation: doc.creation,
        modified: doc.modified,
        owner: doc.owner
      };
      
      return { asset };
    }),
    { requireAuth: true }
  );
}

// PUT - Update an asset
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ asset: Asset }>(
    withEndpointLogging('/api/asset/assets/[name] - PUT')(async () => {
      const { name } = await params;
      const data = await request.json();
      
      // Get the current asset
      const currentAsset = await frappeClient.call.get("frappe.client.get", {
        doctype: "Asset",
        name: name,
      });
      
      if (!currentAsset || !currentAsset.message) {
        throw new Error("Asset not found");
      }
      
      // Prepare updated asset data
      const assetData = {
        ...currentAsset.message,
        asset_name: data.asset_name || currentAsset.message.asset_name,
        asset_category: data.asset_category || currentAsset.message.asset_category,
        item_code: data.item_code || currentAsset.message.item_code,
        serial_no: data.serial_no || currentAsset.message.serial_no,
        purchase_date: data.purchase_date || currentAsset.message.purchase_date,
        purchase_value: data.purchase_value || currentAsset.message.purchase_value,
        current_value: data.current_value || currentAsset.message.current_value,
        location: data.location || currentAsset.message.location,
        status: data.status || currentAsset.message.status,
        warranty_expiry_date: data.warranty_expiry_date || currentAsset.message.warranty_expiry_date,
        assigned_to: data.assigned_to || currentAsset.message.assigned_to
      };
      
      // Use frappe.client.save to update the document
      const result = await frappeClient.call.post("frappe.client.save", {
        doc: assetData
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to update asset");
      }

      // Fetch the updated document
      const updatedAsset = await frappeClient.call.get("frappe.client.get", {
        doctype: "Asset",
        name: result.message.name
      });
      
      if (!updatedAsset || !updatedAsset.message) {
        throw new Error("Failed to fetch updated asset");
      }
      
      const doc = updatedAsset.message;
      const asset: Asset = {
        name: doc.name,
        asset_name: doc.asset_name,
        asset_category: doc.asset_category,
        item_code: doc.item_code || "",
        serial_no: doc.serial_no || "",
        purchase_date: doc.purchase_date,
        purchase_value: doc.purchase_value,
        current_value: doc.current_value,
        location: doc.location,
        status: doc.status,
        warranty_expiry_date: doc.warranty_expiry_date,
        assigned_to: doc.assigned_to || "",
        creation: doc.creation,
        modified: doc.modified,
        owner: doc.owner
      };
      
      return { asset };
    }),
    { requireAuth: true }
  );
}

// DELETE - Delete an asset
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ success: boolean }>(
    withEndpointLogging('/api/asset/assets/[name] - DELETE')(async () => {
      const { name } = await params;
      
      // Use frappe.client.delete to delete the document
      const result = await frappeClient.call.post("frappe.client.delete", {
        doctype: "Asset",
        name: name
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to delete asset");
      }
      
      return { success: true };
    }),
    { requireAuth: true }
  );
}