// app/api/asset/categories/[name]/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { AssetCategory } from '@/types/asset';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ category: AssetCategory }>(
    withEndpointLogging('/api/asset/categories/[name] - GET')(async () => {
      // Await the params as required by Next.js 15
      const { name } = await params;
      
      // Get the asset category
      const fullCategory = await frappeClient.call.get("frappe.client.get", {
        doctype: "Asset Category",
        name: name,
      });
      
      if (!fullCategory || !fullCategory.message) {
        throw new Error("Asset category not found");
      }
      
      const doc = fullCategory.message;
      
      // Map to our interface
      const category: AssetCategory = {
        name: doc.name,
        asset_category_name: doc.asset_category_name,
        company: doc.company || "",
        parent_category: doc.parent_category || "",
        is_group: doc.is_group,
        creation: doc.creation,
        modified: doc.modified,
        owner: doc.owner,
        accounts: doc.accounts || []
      };
      
      return { category };
    }),
    { requireAuth: true }
  );
}

// PUT - Update an asset category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ category: AssetCategory }>(
    withEndpointLogging('/api/asset/categories/[name] - PUT')(async () => {
      const { name } = await params;
      const data = await request.json();
      
      // Get the current category
      const currentCategory = await frappeClient.call.get("frappe.client.get", {
        doctype: "Asset Category",
        name: name,
      });
      
      if (!currentCategory || !currentCategory.message) {
        throw new Error("Asset category not found");
      }
      
      // Prepare updated category data
      const categoryData = {
        ...currentCategory.message,
        asset_category_name: data.asset_category_name || currentCategory.message.asset_category_name,
        company: data.company || currentCategory.message.company,
        parent_category: data.parent_category || currentCategory.message.parent_category,
        is_group: data.is_group !== undefined ? data.is_group : currentCategory.message.is_group,
        accounts: data.accounts || currentCategory.message.accounts
      };
      
      // Use frappe.client.save to update the document
      const result = await frappeClient.call.post("frappe.client.save", {
        doc: categoryData
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to update asset category");
      }

      // Fetch the updated document
      const updatedCategory = await frappeClient.call.get("frappe.client.get", {
        doctype: "Asset Category",
        name: result.message.name
      });
      
      if (!updatedCategory || !updatedCategory.message) {
        throw new Error("Failed to fetch updated asset category");
      }
      
      const doc = updatedCategory.message;
      const category: AssetCategory = {
        name: doc.name,
        asset_category_name: doc.asset_category_name,
        company: doc.company || "",
        parent_category: doc.parent_category || "",
        is_group: doc.is_group,
        creation: doc.creation,
        modified: doc.modified,
        owner: doc.owner,
        accounts: doc.accounts || []
      };
      
      return { category };
    }),
    { requireAuth: true }
  );
}

// DELETE - Delete an asset category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return handleApiRequest<{ success: boolean }>(
    withEndpointLogging('/api/asset/categories/[name] - DELETE')(async () => {
      const { name } = await params;
      
      // Use frappe.client.delete to delete the document
      const result = await frappeClient.call.post("frappe.client.delete", {
        doctype: "Asset Category",
        name: name
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to delete asset category");
      }
      
      return { success: true };
    }),
    { requireAuth: true }
  );
}