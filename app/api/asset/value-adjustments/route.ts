// app/api/asset/value-adjustments/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { AssetValueAdjustment } from '@/types/asset';

// GET - Fetch all asset value adjustment records
// GET - Fetch all asset value adjustment records
export async function GET(request: NextRequest) {
    return handleApiRequest<{ adjustments: AssetValueAdjustment[] }>(
      withEndpointLogging('/api/asset/value-adjustments - GET')(async () => {
        const { searchParams } = new URL(request.url);
        const filters: Record<string, any> = {};
        
        // Build filters from query parameters
        if (searchParams.get('asset')) filters.asset = searchParams.get('asset');
        if (searchParams.get('date_from')) filters.date = ['>=', searchParams.get('date_from')];
        if (searchParams.get('date_to')) filters.date = ['<=', searchParams.get('date_to')];
        
        // Step 1: Get just the list of adjustment names
        const adjustmentNames = await frappeClient.db.getDocList<{ name: string }>(
          "Asset Value Adjustment",
          {
            fields: ["name"],
            filters: Object.entries(filters).map(([key, value]) => {
              if (key === 'date' && Array.isArray(value)) {
                return [value[0], value[1], value[2]];
              }
              return [key, '=', value];
            }),
            orderBy: { field: 'creation', order: 'desc' },
            limit: 1000,
          }
        );
        
        console.log(`Found ${adjustmentNames.length} asset value adjustment records`);
        
        // Step 2: For each adjustment record, get the full document
        const adjustmentsWithDetails = await Promise.all(
          adjustmentNames.map(async (adjustment) => {
            try {
              // Use frappe.client.get to get the entire document
              const fullAdjustment = await frappeClient.call.get("frappe.client.get", {
                doctype: "Asset Value Adjustment",
                name: adjustment.name
              });
              
              if (fullAdjustment && fullAdjustment.message) {
                const doc = fullAdjustment.message;
                return {
                  name: doc.name,
                  asset: doc.asset,
                  adjustment_date: doc.date, // Map from 'date' field
                  current_value: doc.current_asset_value,
                  new_value: doc.new_asset_value,
                  difference_amount: doc.difference_amount,
                  difference_account: doc.difference_account,
                  reason: doc.reason || "",
                  approved_by: doc.approved_by || "",
                  company: doc.company,
                  creation: doc.creation,
                  modified: doc.modified,
                  owner: doc.owner
                };
              }
              return null;
            } catch (error) {
              console.error(`Error fetching asset value adjustment ${adjustment.name}:`, error);
              return null;
            }
          })
        );
        
        // Filter out any null results
        const validAdjustments = adjustmentsWithDetails.filter(adjustment => adjustment !== null) as AssetValueAdjustment[];
        
        return { adjustments: validAdjustments };
      })
    );
  }

// POST - Create a new asset value adjustment record
export async function POST(request: NextRequest) {
    return handleApiRequest<{ adjustment: AssetValueAdjustment }>(
      withEndpointLogging('/api/asset/value-adjustments - POST')(async () => {
        const data = await request.json();
        
        // Validate required fields based on the form structure
        if (!data.asset || !data.date || !data.new_asset_value) {
          throw new Error('Asset, date, and new asset value are required');
        }
        
        // Calculate the difference amount
        const currentAssetValue = data.current_asset_value || 0;
        const newAssetValue = data.new_asset_value;
        const differenceAmount = newAssetValue - currentAssetValue;
        
        // Prepare adjustment data with correct field names
        const adjustmentData = {
          doctype: "Asset Value Adjustment",
          asset: data.asset,
          date: data.date,
          current_asset_value: currentAssetValue,
          new_asset_value: newAssetValue,
          difference_amount: differenceAmount,
          difference_account: data.difference_account || "Asset Value Adjustment - Ma Beignet (Demo)",
          company: data.company || "Ma Beignet (Demo)",
          finance_book: data.finance_book || "",
          reason: data.reason || "",
          amended_from: data.amended_from || ""
        };
        
        console.log('Creating asset value adjustment with data:', JSON.stringify(adjustmentData, null, 2));
        
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
          adjustment_date: doc.date, // Map back to our interface
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