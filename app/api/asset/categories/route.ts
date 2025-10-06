// app/api/asset/categories/route.ts
import { NextRequest } from "next/server";
import { frappeClient } from "@/lib/frappe-client";
import { handleApiRequest, withEndpointLogging } from "@/lib/api-template";
import { AssetCategory } from "@/types/asset";

// GET - Fetch all asset categories
export async function GET(request: NextRequest) {
  return handleApiRequest<{ categories: AssetCategory[] }>(
    withEndpointLogging("/api/asset/categories - GET")(async () => {
      // Step 1: Get just the list of category names
      const categoryNames = await frappeClient.db.getDocList<{ name: string }>(
        "Asset Category",
        {
          fields: ["name"],
          orderBy: { field: "name", order: "asc" },
          limit: 1000,
        }
      );

      console.log(`Found ${categoryNames.length} asset categories`);

      // Step 2: For each category, get the full document
      const categoriesWithDetails = await Promise.all(
        categoryNames.map(async (category) => {
          try {
            // Use frappe.client.get to get the entire document
            const fullCategory = await frappeClient.call.get(
              "frappe.client.get",
              {
                doctype: "Asset Category",
                name: category.name,
              }
            );

            if (fullCategory && fullCategory.message) {
              const doc = fullCategory.message;
              return {
                name: doc.name,
                asset_category_name: doc.category_name,
                company: doc.company || "",
                parent_category: doc.parent_category || "",
                is_group: doc.is_group,
                creation: doc.creation,
                modified: doc.modified,
                owner: doc.owner,
                accounts: doc.accounts || [],
              };
            }
            return null;
          } catch (error) {
            console.error(
              `Error fetching asset category ${category.name}:`,
              error
            );
            return null;
          }
        })
      );

      // Filter out any null results
      const validCategories = categoriesWithDetails.filter(
        (category) => category !== null
      ) as AssetCategory[];

      return { categories: validCategories };
    })
  );
}

// POST - Create a new asset category
export async function POST(request: NextRequest) {
  return handleApiRequest<{ category: AssetCategory }>(
    withEndpointLogging("/api/asset/categories - POST")(async () => {
      const data = await request.json();

      // Validate required fields
      if (!data.asset_category_name) {
        throw new Error("Asset Category name is required");
      }

      if (!data.company) {
        throw new Error("Company is required");
      }

      // Prepare category data with required accounts array
      const categoryData = {
        doctype: "Asset Category",
        asset_category_name: data.asset_category_name,
        parent_category: data.parent_category || "",
        is_group: data.is_group || 0,
        company: data.company,
        accounts: [
          {
            company: data.company,
            fixed_asset_account: data.accounts?.[0]?.fixed_asset_account,
            accumulated_depreciation_account:
              data.accounts?.[0]?.accumulated_depreciation_account,
            depreciation_expense_account:
              data.accounts?.[0]?.depreciation_expense_account,
            capital_work_in_progress_account:
              data.accounts?.[0]?.capital_work_in_progress_account,
          },
        ],
      };

      // Use frappe.client.insert to create the document
      const result = await frappeClient.call.post("frappe.client.insert", {
        doc: categoryData,
      });

      if (!result.message || !result.message.name) {
        throw new Error("Failed to create asset category");
      }

      // Fetch the complete document
      const completeCategory = await frappeClient.call.get(
        "frappe.client.get",
        {
          doctype: "Asset Category",
          name: result.message.name,
        }
      );

      if (!completeCategory || !completeCategory.message) {
        throw new Error("Failed to fetch created asset category");
      }

      const doc = completeCategory.message;
      const category: AssetCategory = {
        name: doc.name,
        asset_category_name: doc.asset_category_name,
        parent_category: doc.parent_category || "",
        is_group: doc.is_group,
        company: doc.company,
        creation: doc.creation,
        modified: doc.modified,
        owner: doc.owner,
        accounts: doc.accounts || [],
      };

      return { category };
    }),
    { requireAuth: true }
  );
}
