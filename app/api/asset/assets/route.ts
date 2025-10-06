// app/api/asset/assets/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { Asset } from '@/types/asset';

// GET - Fetch all assets
export async function GET(request: NextRequest) {
  return handleApiRequest<{ assets: Asset[] }>(
    withEndpointLogging('/api/asset/assets - GET')(async () => {
      const { searchParams } = new URL(request.url);
      const filters: Record<string, any> = {};
      
      // Build filters from query parameters
      if (searchParams.get('asset_category')) filters.asset_category = searchParams.get('asset_category');
      if (searchParams.get('location')) filters.location = searchParams.get('location');
      if (searchParams.get('status')) filters.status = searchParams.get('status');
      if (searchParams.get('assigned_to')) filters.assigned_to = searchParams.get('assigned_to');
      
      // Step 1: Get just the list of asset names
      const assetNames = await frappeClient.db.getDocList<{ name: string }>(
        "Asset",
        {
          fields: ["name"],
          filters: Object.entries(filters).map(([key, value]) => [key, '=', value]),
          orderBy: { field: 'creation', order: 'desc' },
          limit: 1000,
        }
      );
      
      console.log(`Found ${assetNames.length} assets`);
      
      // Step 2: For each asset, get the full document
      const assetsWithDetails = await Promise.all(
        assetNames.map(async (asset) => {
          try {
            // Use frappe.client.get to get the entire document
            const fullAsset = await frappeClient.call.get("frappe.client.get", {
              doctype: "Asset",
              name: asset.name
            });
            
            if (fullAsset && fullAsset.message) {
              const doc = fullAsset.message;
              return {
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
            }
            return null;
          } catch (error) {
            console.error(`Error fetching asset ${asset.name}:`, error);
            return null;
          }
        })
      );
      
      // Filter out any null results
      const validAssets = assetsWithDetails.filter(asset => asset !== null) as Asset[];
      
      return { assets: validAssets };
    })
  );
}

// POST - Create a new asset
export async function POST(request: NextRequest) {
  return handleApiRequest<{ asset: Asset }>(
    withEndpointLogging('/api/asset/assets - POST')(async () => {
      const data = await request.json();
      
      // Validate required fields
      if (!data.asset_name || !data.asset_category || !data.purchase_date || !data.purchase_value) {
        throw new Error('Asset name, category, purchase date, and purchase value are required');
      }
      
      // Prepare asset data
      const assetData = {
        doctype: "Asset",
        asset_name: data.asset_name,
        asset_category: data.asset_category,
        item_code: data.item_code || "",
        serial_no: data.serial_no || "",
        purchase_date: data.purchase_date,
        purchase_value: data.purchase_value,
        gross_purchase_amount: data.gross_purchase_amount,
        current_value: data.purchase_value, // Initially same as purchase value
        location: data.location || "",
        status: data.status || "Available",
        warranty_expiry_date: data.warranty_expiry_date,
        assigned_to: data.assigned_to || ""
      };
      
      // Use frappe.client.insert to create the document
      const result = await frappeClient.call.post("frappe.client.insert", {
        doc: assetData
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to create asset");
      }

      // Fetch the complete document
      const completeAsset = await frappeClient.call.get("frappe.client.get", {
        doctype: "Asset",
        name: result.message.name
      });
      
      if (!completeAsset || !completeAsset.message) {
        throw new Error("Failed to fetch created asset");
      }
      
      const doc = completeAsset.message;
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