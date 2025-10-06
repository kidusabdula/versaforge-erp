// app/api/asset/options/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { AssetOptions } from '@/types/asset';

export async function GET() {
  return handleApiRequest<{ options: AssetOptions }>(
    withEndpointLogging('/api/asset/options - GET')(async () => {
      try {
        // Fetch asset categories
        const categories = await frappeClient.call.get("frappe.client.get_list", {
          doctype: "Asset Category",
          fields: ["name", "asset_category_name"],
          limit: 100,
        });

        // Try to fetch asset locations, but handle if the doctype doesn't exist
        let processedLocations: any[] = [];
        try {
          const locations = await frappeClient.call.get("frappe.client.get_list", {
            doctype: "Location",
            fields: ["*"],
            limit: 100,
          });
          processedLocations = locations.message?.map((location: any) => ({
            name: location.name,
            location_name: location.location_name,
          })) || [];
        } catch (locationError) {
          console.warn('Asset Location doctype not found, using empty array');
          processedLocations = [];
        }

        // Try to fetch maintenance types, but handle if the doctype doesn't exist
        let processedMaintenanceTypes: any[] = [];
        try {
          const assetMaintenances = await frappeClient.call.get("frappe.client.get_list", {
            doctype: "Asset Maintenance",
            fields: ["*"],
            limit: 100,
          });
          processedMaintenanceTypes = assetMaintenances.message?.map((type: any) => ({
            name: type.name,
            type_name: type.type_name,
          })) || [];
        } catch (maintenanceError) {
          console.warn('Maintenance Type doctype not found, using empty array');
          processedMaintenanceTypes = [];
        }

        // Try to fetch repair types, but handle if the doctype doesn't exist
        let processedAssetRepairs: any[] = [];
        try {
          const assetRepairs = await frappeClient.call.get("frappe.client.get_list", {
            doctype: "Asset Repair",
            fields: ["*"],
            limit: 100,
          });
          processedAssetRepairs = assetRepairs.message?.map((type: any) => ({
            name: type.name,
            type_name: type.type_name,
          })) || [];
        } catch (repairError) {
          console.warn('Repair Type doctype not found, using empty array');
          processedAssetRepairs = [];
        }

        // Try to fetch movement purposes, but handle if the doctype doesn't exist
        let processedAssetMovements: any[] = [];
        try {
          const assetMovements = await frappeClient.call.get("frappe.client.get_list", {
            doctype: "Asset Movement",
            fields: ["*"],
            limit: 100,
          });
          processedAssetMovements = assetMovements.message?.map((purpose: any) => ({
            name: purpose.name,
            purpose_name: purpose.purpose_name,
          })) || [];
        } catch (movementError) {
          console.warn('Movement Purpose doctype not found, using empty array');
          processedAssetMovements = [];
        }

        // Process categories (this should work since Asset Category exists)
        const processedCategories = categories.message?.map((category: any) => ({
          name: category.name,
          category_name: category.asset_category_name, // Fixed: use asset_category_name instead of category_name
        })) || [];

        // Asset statuses
        const assetStatuses = [
          { value: "Available", label: "Available" },
          { value: "In Use", label: "In Use" },
          { value: "Under Maintenance", label: "Under Maintenance" },
          { value: "Scrapped", label: "Scrapped" },
        ];

        const options: AssetOptions = {
          categories: processedCategories,
          locations: processedLocations,
          AssetMaintenances: processedMaintenanceTypes,
          assetRepairs: processedAssetRepairs,
          assetMovements: processedAssetMovements,
          assetStatuses,
        };

        return { options };
      } catch (error) {
        console.error('Error in asset options API:', error);
        // Return empty options if anything fails
        return {
          options: {
            categories: [],
            locations: [],
            AssetMaintenances: [],
            assetRepairs: [],
            assetMovements: [],
            assetStatuses: [
              { value: "Available", label: "Available" },
              { value: "In Use", label: "In Use" },
              { value: "Under Maintenance", label: "Under Maintenance" },
              { value: "Scrapped", label: "Scrapped" },
            ],
          }
        };
      }
    })
  );
}