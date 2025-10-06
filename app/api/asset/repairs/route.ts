// app/api/asset/repairs/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { AssetRepair } from '@/types/asset';

// GET - Fetch all asset repair records
export async function GET(request: NextRequest) {
  return handleApiRequest<{ repairs: AssetRepair[] }>(
    withEndpointLogging('/api/asset/repairs - GET')(async () => {
      const { searchParams } = new URL(request.url);
      const filters: Record<string, any> = {};
      
      // Build filters from query parameters
      if (searchParams.get('asset')) filters.asset = searchParams.get('asset');
      if (searchParams.get('status')) filters.status = searchParams.get('status');
      if (searchParams.get('date_from')) filters.repair_date = ['>=', searchParams.get('date_from')];
      if (searchParams.get('date_to')) filters.repair_date = ['<=', searchParams.get('date_to')];
      
      // Step 1: Get just the list of repair names
      const repairNames = await frappeClient.db.getDocList<{ name: string }>(
        "Asset Repair",
        {
          fields: ["name"],
          filters: Object.entries(filters).map(([key, value]) => {
            if (key === 'repair_date' && Array.isArray(value)) {
              return [value[0], value[1], value[2]];
            }
            return [key, '=', value];
          }),
          orderBy: { field: 'creation', order: 'desc' },
          limit: 1000,
        }
      );
      
      console.log(`Found ${repairNames.length} asset repair records`);
      
      // Step 2: For each repair record, get the full document
      const repairsWithDetails = await Promise.all(
        repairNames.map(async (repair) => {
          try {
            // Use frappe.client.get to get the entire document
            const fullRepair = await frappeClient.call.get("frappe.client.get", {
              doctype: "Asset Repair",
              name: repair.name
            });
            
            if (fullRepair && fullRepair.message) {
              const doc = fullRepair.message;
              return {
                name: doc.name,
                asset: doc.asset,
                repair_type: doc.repair_type || "",
                repair_date: doc.repair_date,
                description: doc.description || "",
                cost: doc.cost || 0,
                technician: doc.technician || "",
                status: doc.status,
                creation: doc.creation,
                modified: doc.modified,
                owner: doc.owner
              };
            }
            return null;
          } catch (error) {
            console.error(`Error fetching asset repair ${repair.name}:`, error);
            return null;
          }
        })
      );
      
      // Filter out any null results
      const validRepairs = repairsWithDetails.filter(repair => repair !== null) as AssetRepair[];
      
      return { repairs: validRepairs };
    })
  );
}

// POST - Create a new asset repair record
export async function POST(request: NextRequest) {
    return handleApiRequest<{ repair: AssetRepair }>(
      withEndpointLogging('/api/asset/repairs - POST')(async () => {
        const data = await request.json();
        
        // Validate required fields
        if (!data.asset || !data.repair_date || !data.failure_date) {
          throw new Error('Asset, repair date, and failure date are required');
        }
        
        // Prepare repair data with all required fields
        const repairData = {
          doctype: "Asset Repair",
          asset: data.asset,
          asset_name: data.asset_name || "",
          repair_type: data.repair_type || "",
          repair_date: data.repair_date,
          failure_date: data.failure_date,
          description: data.description || "",
          cause_of_failure: data.cause_of_failure || "",
          actions_performed: data.actions_performed || "",
          cost: data.cost || 0,
          technician: data.technician || "",
          status: data.status || "Reported",
          company: data.company || "Ma Beignet (Demo)",
          completion_date: data.completion_date || (data.status === "Completed" ? data.repair_date : ""),
          // Add other commonly required fields
          downtime: data.downtime || 0,
          repair_details: data.repair_details || ""
        };
        
        console.log('Creating asset repair with data:', JSON.stringify(repairData, null, 2));
        
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