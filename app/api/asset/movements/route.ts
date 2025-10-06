// app/api/asset/movements/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { AssetMovement } from '@/types/asset';

// GET - Fetch all asset movement records
export async function GET(request: NextRequest) {
    return handleApiRequest<{ movements: AssetMovement[] }>(
      withEndpointLogging('/api/asset/movements - GET')(async () => {
        const { searchParams } = new URL(request.url);
        const filters: Record<string, any> = {};
        
        // Build filters from query parameters
        if (searchParams.get('asset')) filters.asset = searchParams.get('asset');
        if (searchParams.get('status')) filters.status = searchParams.get('status');
        if (searchParams.get('date_from')) filters.movement_date = ['>=', searchParams.get('date_from')];
        if (searchParams.get('date_to')) filters.movement_date = ['<=', searchParams.get('date_to')];
        
        // Step 1: Get just the list of movement names
        const movementNames = await frappeClient.db.getDocList<{ name: string }>(
          "Asset Movement",
          {
            fields: ["name"],
            filters: Object.entries(filters).map(([key, value]) => {
              if (key === 'movement_date' && Array.isArray(value)) {
                return [value[0], value[1], value[2]];
              }
              return [key, '=', value];
            }),
            orderBy: { field: 'creation', order: 'desc' },
            limit: 1000,
          }
        );
        
        console.log(`Found ${movementNames.length} asset movement records`);
        
        // Step 2: For each movement record, get the full document
        const movementsWithDetails = await Promise.all(
          movementNames.map(async (movement) => {
            try {
              // Use frappe.client.get to get the entire document
              const fullMovement = await frappeClient.call.get("frappe.client.get", {
                doctype: "Asset Movement",
                name: movement.name
              });
              
              if (fullMovement && fullMovement.message) {
                const doc = fullMovement.message;
                return {
                  name: doc.name,
                  asset: doc.assets?.[0]?.asset || "", // Get from first asset in child table
                  assets: doc.assets || [],
                  from_location: doc.assets?.[0]?.from_location || "",
                  to_location: doc.assets?.[0]?.to_location || "",
                  from_employee: doc.assets?.[0]?.from_employee || "",
                  to_employee: doc.assets?.[0]?.to_employee || "",
                  movement_date: doc.movement_date,
                  purpose: doc.purpose,
                  status: doc.status,
                  company: doc.company,
                  creation: doc.creation,
                  modified: doc.modified,
                  owner: doc.owner
                };
              }
              return null;
            } catch (error) {
              console.error(`Error fetching asset movement ${movement.name}:`, error);
              return null;
            }
          })
        );
        
        // Filter out any null results
        const validMovements = movementsWithDetails.filter(movement => movement !== null) as AssetMovement[];
        
        return { movements: validMovements };
      })
    );
  }

// POST - Create a new asset movement record
export async function POST(request: NextRequest) {
    return handleApiRequest<{ movement: AssetMovement }>(
      withEndpointLogging('/api/asset/movements - POST')(async () => {
        const data = await request.json();
        
        console.log('Received movement data:', JSON.stringify(data, null, 2));
        
        // Validate required fields
        if (!data.movement_date || !data.purpose) {
          throw new Error('Movement date and purpose are required');
        }
        
        // Validate purpose is one of the allowed values
        const allowedPurposes = ["Issue", "Receipt", "Transfer"];
        if (!allowedPurposes.includes(data.purpose)) {
          throw new Error(`Purpose must be one of: ${allowedPurposes.join(', ')}`);
        }
        
        // Validate that we have assets in the child table
        if (!data.assets || !Array.isArray(data.assets) || data.assets.length === 0) {
          throw new Error('At least one asset is required in the assets array');
        }
        
        // Validate each asset based on movement purpose
        for (const asset of data.assets) {
          if (!asset.asset) {
            throw new Error('Each asset must have an asset ID');
          }
          
          // Validate fields based on purpose
          switch (data.purpose) {
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
              throw new Error(`Unknown purpose: ${data.purpose}`);
          }
        }
        
        // Check if assets exist and are submitted
        for (const asset of data.assets) {
          try {
            const assetDoc = await frappeClient.call.get("frappe.client.get", {
              doctype: "Asset",
              name: asset.asset
            });
            
            if (!assetDoc.message) {
              throw new Error(`Asset ${asset.asset} does not exist`);
            }
            
            // Check if asset is in draft status
            if (assetDoc.message.docstatus === 0) {
              console.log(`Asset ${asset.asset} is in draft status, submitting...`);
              
              try {
                await frappeClient.call.post("frappe.client.submit", {
                  doc: {
                    doctype: "Asset",
                    name: asset.asset
                  }
                });
                console.log(`Asset ${asset.asset} submitted successfully`);
              } catch (submitError) {
                throw new Error(`Asset ${asset.asset} is in draft status and cannot be submitted automatically. Please submit it first.`);
              }
            }
          } catch (error) {
            throw new Error(`Error checking asset ${asset.asset}: ${error}`);
          }
        }
        
        // Prepare movement data with correct field names based on the debug output
        const movementData = {
          doctype: "Asset Movement",
          company: data.company || "Ma Beignet (Demo)",
          purpose: data.purpose,
          movement_date: data.movement_date,
          reference_doctype: data.reference_doctype || "",
          reference_name: data.reference_name || "",
          status: data.status || "Draft",
          // Use the correct field names from the debug output
          assets: data.assets.map((asset: any) => ({
            asset: asset.asset,
            asset_name: asset.asset_name || "",
            // Use source_location and target_location based on successful payload
            source_location: asset.from_location || "",
            target_location: asset.to_location || "",
            from_employee: asset.from_employee || "",
            to_employee: asset.to_employee || "",
          }))
        };
        
        console.log('Sending validated movement data:', JSON.stringify(movementData, null, 2));
        
        // Use frappe.client.insert to create the document
        const result = await frappeClient.call.post("frappe.client.insert", {
          doc: movementData
        });
  
        if (!result.message || !result.message.name) {
          throw new Error("Failed to create asset movement record");
        }
  
        // Fetch the complete document
        const completeMovement = await frappeClient.call.get("frappe.client.get", {
          doctype: "Asset Movement",
          name: result.message.name
        });
        
        if (!completeMovement || !completeMovement.message) {
          throw new Error("Failed to fetch created asset movement record");
        }
        
        const doc = completeMovement.message;
        const movement: AssetMovement = {
          name: doc.name,
          asset: doc.assets?.[0]?.asset || "",
          assets: doc.assets || [],
          from_location: doc.assets?.[0]?.source_location || "", // Map back to our interface
          to_location: doc.assets?.[0]?.target_location || "", // Map back to our interface
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