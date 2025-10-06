// app/api/asset/locations/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { AssetLocation } from '@/types/asset';

// GET - Fetch all asset locations
export async function GET(request: NextRequest) {
  return handleApiRequest<{ locations: AssetLocation[] }>(
    withEndpointLogging('/api/asset/locations - GET')(async () => {
      // Step 1: Get just the list of location names
      const locationNames = await frappeClient.db.getDocList<{ name: string }>(
        "Location",
        {
          fields: ["name"],
          orderBy: { field: 'location_name', order: 'asc' },
          limit: 1000,
        }
      );
      
      console.log(`Found ${locationNames.length} asset locations`);
      
      // Step 2: For each location, get the full document
      const locationsWithDetails = await Promise.all(
        locationNames.map(async (location) => {
          try {
            // Use frappe.client.get to get the entire document
            const fullLocation = await frappeClient.call.get("frappe.client.get", {
              doctype: "Location",
              name: location.name
            });
            
            if (fullLocation && fullLocation.message) {
              const doc = fullLocation.message;
              return {
                name: doc.name,
                location_name: doc.location_name,
                parent_location: doc.parent_location || "",
                is_group: doc.is_group,
                address: doc.address || "",
                creation: doc.creation,
                modified: doc.modified,
                owner: doc.owner
              };
            }
            return null;
          } catch (error) {
            console.error(`Error fetching asset location ${location.name}:`, error);
            return null;
          }
        })
      );
      
      // Filter out any null results
      const validLocations = locationsWithDetails.filter(location => location !== null) as AssetLocation[];
      
      return { locations: validLocations };
    })
  );
}

// POST - Create a new asset location
export async function POST(request: NextRequest) {
  return handleApiRequest<{ location: AssetLocation }>(
    withEndpointLogging('/api/asset/locations - POST')(async () => {
      const data = await request.json();
      
      // Validate required fields
      if (!data.location_name) {
        throw new Error('Location name is required');
      }
      
      // Prepare location data
      const locationData = {
        doctype: "Location",
        location_name: data.location_name,
        parent_location: data.parent_location || "",
        is_group: data.is_group || 0,
        address: data.address || ""
      };
      
      // Use frappe.client.insert to create the document
      const result = await frappeClient.call.post("frappe.client.insert", {
        doc: locationData
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to create asset location");
      }

      // Fetch the complete document
      const completeLocation = await frappeClient.call.get("frappe.client.get", {
        doctype: "Location",
        name: result.message.name
      });
      
      if (!completeLocation || !completeLocation.message) {
        throw new Error("Failed to fetch created asset location");
      }
      
      const doc = completeLocation.message;
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