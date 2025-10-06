// app/api/asset/movements/[name]/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { AssetMovement } from '@/types/asset';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ movement: AssetMovement }>(
    withEndpointLogging('/api/asset/movements/[name] - GET')(async () => {
      // Await the params as required by Next.js 15
      const { name } = await params;
      
      // Get the asset movement record
      const fullMovement = await frappeClient.call.get("frappe.client.get", {
        doctype: "Asset Movement",
        name: name,
      });
      
      if (!fullMovement || !fullMovement.message) {
        throw new Error("Asset movement record not found");
      }
      
      const doc = fullMovement.message;
      
      // Map to our interface
      const movement: AssetMovement = {
        name: doc.name,
        asset: doc.assets?.[0]?.asset || "",
        assets: doc.assets || [],
        from_location: doc.assets?.[0]?.source_location || "",
        to_location: doc.assets?.[0]?.target_location || "",
        from_employee: doc.assets?.[0]?.from_employee || "",
        to_employee: doc.assets?.[0]?.to_employee || "",
        movement_date: doc.movement_date,
        purpose: doc.purpose as "Issue" | "Receipt" | "Transfer",
        status: doc.status as "Requested" | "Approved" | "Completed",
        company: doc.company,
        creation: doc.creation,
        modified: doc.modified,
        owner: doc.owner
      };
      
      return { movement };
    }),
    { requireAuth: true }
  );
}

// PUT - Update an asset movement record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ movement: AssetMovement }>(
    withEndpointLogging('/api/asset/movements/[name] - PUT')(async () => {
      const { name } = await params;
      const data = await request.json();
      
      // Get the current movement record
      const currentMovement = await frappeClient.call.get("frappe.client.get", {
        doctype: "Asset Movement",
        name: name,
      });
      
      if (!currentMovement || !currentMovement.message) {
        throw new Error("Asset movement record not found");
      }
      
      // Validate purpose is one of the allowed values
      const allowedPurposes = ["Issue", "Receipt", "Transfer"];
      if (data.purpose && !allowedPurposes.includes(data.purpose)) {
        throw new Error(`Purpose must be one of: ${allowedPurposes.join(', ')}`);
      }
      
      // Validate that we have assets in the child table
      if (!data.assets || !Array.isArray(data.assets) || data.assets.length === 0) {
        // If no assets provided, use existing assets
        data.assets = currentMovement.message.assets;
      }
      
      // Validate each asset based on movement purpose
      for (const asset of data.assets) {
        if (!asset.asset) {
          throw new Error('Each asset must have an asset ID');
        }
        
        // Validate fields based on purpose
        const purpose = data.purpose || currentMovement.message.purpose;
        switch (purpose) {
          case "Issue":
            // For Issue: from_location is required, to_employee is required
            if (!asset.from_location) {
              throw new Error('For Issue purpose, from_location is required for each asset');
            }
            if (!asset.to_employee) {
              throw new Error('For Issue purpose, to_employee is required for each asset (cannot issue to location)');
            }
            if (asset.to_location) {
              throw new Error('For Issue purpose, cannot issue to a location. Use to_employee instead');
            }
            break;
            
          case "Receipt":
            // For Receipt: from_employee is required, to_location is required
            if (!asset.from_employee) {
              throw new Error('For Receipt purpose, from_employee is required for each asset');
            }
            if (!asset.to_location) {
              throw new Error('For Receipt purpose, to_location is required for each asset');
            }
            if (asset.from_location) {
              throw new Error('For Receipt purpose, cannot receive from a location. Use from_employee instead');
            }
            break;
            
          case "Transfer":
            // For Transfer: from_location is required, to_location is required
            if (!asset.from_location) {
              throw new Error('For Transfer purpose, from_location is required for each asset');
            }
            if (!asset.to_location) {
              throw new Error('For Transfer purpose, to_location is required for each asset');
            }
            if (asset.from_employee || asset.to_employee) {
              throw new Error('For Transfer purpose, cannot use employee fields. Use from_location and to_location only');
            }
            break;
            
          default:
            throw new Error(`Unknown purpose: ${purpose}`);
        }
      }
      
      // Prepare updated movement data
      const movementData = {
        ...currentMovement.message,
        company: data.company || currentMovement.message.company,
        purpose: data.purpose || currentMovement.message.purpose,
        movement_date: data.movement_date || currentMovement.message.movement_date,
        reference_doctype: data.reference_doctype || currentMovement.message.reference_doctype,
        reference_name: data.reference_name || currentMovement.message.reference_name,
        status: data.status || currentMovement.message.status,
        assets: data.assets.map((asset: any) => ({
          asset: asset.asset,
          asset_name: asset.asset_name || "",
          source_location: asset.from_location || "",
          target_location: asset.to_location || "",
          from_employee: asset.from_employee || "",
          to_employee: asset.to_employee || "",
        }))
      };
      
      // Use frappe.client.save to update the document
      const result = await frappeClient.call.post("frappe.client.save", {
        doc: movementData
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to update asset movement record");
      }

      // Fetch the updated document
      const updatedMovement = await frappeClient.call.get("frappe.client.get", {
        doctype: "Asset Movement",
        name: result.message.name
      });
      
      if (!updatedMovement || !updatedMovement.message) {
        throw new Error("Failed to fetch updated asset movement record");
      }
      
      const doc = updatedMovement.message;
      const movement: AssetMovement = {
        name: doc.name,
        asset: doc.assets?.[0]?.asset || "",
        assets: doc.assets || [],
        from_location: doc.assets?.[0]?.source_location || "",
        to_location: doc.assets?.[0]?.target_location || "",
        from_employee: doc.assets?.[0]?.from_employee || "",
        to_employee: doc.assets?.[0]?.to_employee || "",
        movement_date: doc.movement_date,
        purpose: doc.purpose as "Issue" | "Receipt" | "Transfer",
        status: doc.status as "Requested" | "Approved" | "Completed",
        company: doc.company,
        creation: doc.creation,
        modified: doc.modified,
        owner: doc.owner
      };
      
      return { movement };
    }),
    { requireAuth: true }
  );
}

// DELETE - Delete an asset movement record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ success: boolean }>(
    withEndpointLogging('/api/asset/movements/[name] - DELETE')(async () => {
      const { name } = await params;
      
      // Use frappe.client.delete to delete the document
      const result = await frappeClient.call.post("frappe.client.delete", {
        doctype: "Asset Movement",
        name: name
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to delete asset movement record");
      }
      
      return { success: true };
    }),
    { requireAuth: true }
  );
}