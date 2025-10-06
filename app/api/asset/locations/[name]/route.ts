// app/api/asset/locations/[name]/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { AssetLocation } from '@/types/asset';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ location: AssetLocation }>(
    withEndpointLogging('/api/asset/locations/[name] - GET')(async () => {
      // Await the params as required by Next.js 15
      const { name } = await params;
      
      // Get the asset location
      const fullLocation = await frappeClient.call.get("frappe.client.get", {
        doctype: "Location",
        name: name,
      });
      
      if (!fullLocation || !fullLocation.message) {
        throw new Error("Asset location not found");
      }
      
      const doc = fullLocation.message;
      
      // Map to our interface
      const location: AssetLocation = {
        name: doc.name,
        location_name: doc.location_name,
        parent_location: doc.parent_location || "",
        is_group: doc.is_group,
        address: doc.address || "",
        creation: doc.creation,
        modified: doc.modified,
        owner: doc.owner
      };
      
      return { location };
    }),
    { requireAuth: true }
  );
}

// PUT - Update an asset location
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ location: AssetLocation }>(
    withEndpointLogging('/api/asset/locations/[name] - PUT')(async () => {
      const { name } = await params;
      const data = await request.json();
      
      // Get the current location
      const currentLocation = await frappeClient.call.get("frappe.client.get", {
        doctype: "Location",
        name: name,
      });
      
      if (!currentLocation || !currentLocation.message) {
        throw new Error("Asset location not found");
      }
      
      // Prepare updated location data
      const locationData = {
        ...currentLocation.message,
        location_name: data.location_name || currentLocation.message.location_name,
        parent_location: data.parent_location || currentLocation.message.parent_location,
        is_group: data.is_group !== undefined ? data.is_group : currentLocation.message.is_group,
        address: data.address || currentLocation.message.address
      };
      
      // Use frappe.client.save to update the document
      const result = await frappeClient.call.post("frappe.client.save", {
        doc: locationData
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to update asset location");
      }

      // Fetch the updated document
      const updatedLocation = await frappeClient.call.get("frappe.client.get", {
        doctype: "Location",
        name: result.message.name
      });
      
      if (!updatedLocation || !updatedLocation.message) {
        throw new Error("Failed to fetch updated asset location");
      }
      
      const doc = updatedLocation.message;
      const location: AssetLocation = {
        name: doc.name,
        location_name: doc.location_name,
        parent_location: doc.parent_location || "",
        is_group: doc.is_group,
        address: doc.address || "",
        creation: doc.creation,
        modified: doc.modified,
        owner: doc.owner
      };
      
      return { location };
    }),
    { requireAuth: true }
  );
}

// DELETE - Delete an asset location
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ success: boolean }>(
    withEndpointLogging('/api/asset/locations/[name] - DELETE')(async () => {
      const { name } = await params;
      
      // Use frappe.client.delete to delete the document
      const result = await frappeClient.call.post("frappe.client.delete", {
        doctype: "Location",
        name: name
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to delete asset location");
      }
      
      return { success: true };
    }),
    { requireAuth: true }
  );
}