// app/api/asset/dashboard/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { AssetDashboardData } from '@/types/asset';

export async function GET() {
  return handleApiRequest<{ dashboard: AssetDashboardData }>(
    withEndpointLogging('/api/asset/dashboard - GET')(async () => {
      try {
        console.log('Starting dashboard data fetch...');

        // Get total assets count
        const totalAssets = await frappeClient.db.getDocList("Asset", {
          fields: ["name"],
          limit: 100000,
        });
        console.log(`Total assets found: ${totalAssets.length}`);

        // Get assets under maintenance
        const underMaintenanceAssets = await frappeClient.db.getDocList("Asset", {
          fields: ["name"],
        //   filters: { status: "Under Maintenance" },
          limit: 100000,
        });
        console.log(`Assets under maintenance: ${underMaintenanceAssets.length}`);

        // Get maintenance records (only names first)
        const maintenanceList = await frappeClient.db.getDocList("Asset Maintenance", {
          fields: ["name"],
          limit: 100,
        });
        console.log(`Maintenance records found: ${maintenanceList.length}`);

        // Fetch full docs individually to get fields not permitted in query
        const maintenanceRecords = [];
        for (const item of maintenanceList) {
          try {
            const doc = await frappeClient.call.get("frappe.client.get", {
              doctype: "Asset Maintenance",
              name: item.name
            });
            if (doc.message) {
              maintenanceRecords.push(doc.message);
            }
          } catch (err) {
            console.warn("Failed to fetch maintenance doc:", item.name, err);
          }
        }

        // Calculate requiring attention
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        const assetsRequiringAttention = maintenanceRecords.filter((record: any) => {
          if (!record.next_maintenance_date) return false;
          const maintenanceDate = new Date(record.next_maintenance_date);
          return maintenanceDate >= today &&
                 maintenanceDate <= thirtyDaysFromNow &&
                 record.status === "Scheduled";
        }).length;
        console.log(`Assets requiring attention: ${assetsRequiringAttention}`);

        // Get assets by category and location
        const allAssets = await frappeClient.db.getDocList("Asset", {
          fields: ["name", "asset_category", "gross_purchase_amount", "opening_accumulated_depreciation", "location"],
          limit: 100000,
        });

        const assetsByCategoryMap = new Map<string, { count: number; value: number }>();
        const assetsByLocationMap = new Map<string, { count: number; value: number }>();

        allAssets.forEach((asset: any) => {
          const category = asset.asset_category || "Uncategorized";
          const location = asset.location || "Unspecified";
          const grossAmount = asset.gross_purchase_amount || 0;
          const depreciation = asset.opening_accumulated_depreciation || 0;
          const value = Math.max(0, grossAmount - depreciation);

          // Category grouping
          if (assetsByCategoryMap.has(category)) {
            const existing = assetsByCategoryMap.get(category)!;
            assetsByCategoryMap.set(category, {
              count: existing.count + 1,
              value: existing.value + value
            });
          } else {
            assetsByCategoryMap.set(category, { count: 1, value });
          }

          // Location grouping
          if (assetsByLocationMap.has(location)) {
            const existing = assetsByLocationMap.get(location)!;
            assetsByLocationMap.set(location, {
              count: existing.count + 1,
              value: existing.value + value
            });
          } else {
            assetsByLocationMap.set(location, { count: 1, value });
          }
        });

        const assetsByCategory = Array.from(assetsByCategoryMap.entries()).map(([category, data]) => ({
          category,
          count: data.count,
          value: data.value
        }));

        const assetsByLocation = Array.from(assetsByLocationMap.entries()).map(([location, data]) => ({
          location,
          count: data.count,
          value: data.value
        }));

        // Recent activities
        const recentMaintenanceList = await frappeClient.db.getDocList("Asset Maintenance", {
          fields: ["name"],
          orderBy: { field: "modified", order: "desc" },
          limit: 5,
        });

        const recentRepairsList = await frappeClient.db.getDocList("Asset Repair", {
          fields: ["name"],
          orderBy: { field: "modified", order: "desc" },
          limit: 5,
        });

        const recentMovements = await frappeClient.db.getDocList("Asset Movement", {
          fields: ["name", "purpose",],
          orderBy: { field: "purpose", order: "desc" },
          limit: 5,
        });

        // Expand maintenance + repair with full docs
        const expandDocs = async (doctype: string, list: any[]) => {
          const expanded: any[] = [];
          for (const item of list) {
            try {
              const doc = await frappeClient.call.get("frappe.client.get", {
                doctype,
                name: item.name
              });
              if (doc.message) expanded.push(doc.message);
            } catch (err) {
              console.warn(`Failed to expand ${doctype}:`, item.name);
            }
          }
          return expanded;
        };

        const recentMaintenance = await expandDocs("Asset Maintenance", recentMaintenanceList);
        const recentRepairs = await expandDocs("Asset Repair", recentRepairsList);

        const recentActivities = [
          ...recentMaintenance.map((item: any) => ({
            type: "maintenance" as const,
            asset: item.asset || "Unknown Asset",
            date: item.maintenance_date,
            description: item.description || `Maintenance: ${item.maintenance_type || "Completed"}`,
            status: item.status
          })),
          ...recentMovements.map((item: any) => ({
            type: "movement" as const,
            asset: "Multiple Assets",
            date: item.movement_date,
            description: `Movement: ${item.purpose || "Asset transfer"}`,
            status: item.status
          })),
          ...recentRepairs.map((item: any) => ({
            type: "repair" as const,
            asset: item.asset || "Unknown Asset",
            date: item.completion_date || item.repair_date,
            description: item.description || "Repair completed",
            status: item.status
          }))
        ]
          .filter(activity => activity.date && activity.status !== "Cancelled")
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10);

        // Maintenance due
        const maintenanceDue = maintenanceRecords
          .filter((record: any) => record.next_maintenance_date && record.status === "Scheduled")
          .map((record: any) => {
            const maintenanceDate = new Date(record.next_maintenance_date);
            const daysRemaining = Math.ceil((maintenanceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return {
              asset: record.asset || "Unknown Asset",
              due_date: record.next_maintenance_date,
              days_remaining: daysRemaining,
              status: record.status
            };
          })
          .sort((a: any, b: any) => a.days_remaining - b.days_remaining)
          .slice(0, 10);

        const dashboard: AssetDashboardData = {
          total_assets: totalAssets.length,
          assets_under_maintenance: underMaintenanceAssets.length,
          assets_requiring_attention: assetsRequiringAttention,
          assets_by_category: assetsByCategory,
          assets_by_location: assetsByLocation,
          recent_activities: recentActivities,
          maintenance_due: maintenanceDue
        };

        console.log("Final dashboard data:", dashboard);

        return { dashboard };
      } catch (error) {
        console.error("Error in dashboard API:", error);

        return {
          dashboard: {
            total_assets: 0,
            assets_under_maintenance: 0,
            assets_requiring_attention: 0,
            assets_by_category: [],
            assets_by_location: [],
            recent_activities: [],
            maintenance_due: []
          }
        };
      }
    })
  );
}
