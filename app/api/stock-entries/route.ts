import { NextRequest } from "next/server";
import { frappeClient } from "@/lib/frappe-client";
import { handleApiRequest, withEndpointLogging } from "@/lib/api-template";
import {
  StockEntry,
  StockEntryCreateRequest,
  StockEntryUpdateRequest,
  StockEntryFilters,
} from "@/types/stock-entry";
import { Filter } from "frappe-js-sdk/lib/db/types";
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  if (action === "get-stock-entry-types") {
    return handleApiRequest<{ stock_entry_types: string[] }>(
      withEndpointLogging("/api/stock-entries - GET Types")(async () => {
        const entries = await frappeClient.db.getDocList("Stock Entry", {
          fields: ["stock_entry_type"],
          limit: 1000,
        });
        const types = [
          ...new Set(
            entries.map((entry) => entry.stock_entry_type).filter(Boolean)
          ),
        ];
        return { stock_entry_types: types };
      })
    );
  }
  // Handle filtered requests
  if (action === "filter") {
    return handleApiRequest<{ stockEntries: StockEntry[] }>(
      withEndpointLogging("/api/stock-entries - GET Filtered")(async () => {
        const filters: StockEntryFilters = {};
        // Extract filter parameters
        searchParams.forEach((value, key) => {
          if (value && key !== "action") {
            if (key === "docstatus") {
              filters[key as "docstatus"] =
                value as StockEntryFilters["docstatus"];
            } else {
              filters[key as Exclude<keyof StockEntryFilters, "docstatus">] =
                value;
            }
          }
        });
        // Build Frappe filters
        const frappeFilters: Filter[] = [];
        if (filters.stock_entry_type && filters.stock_entry_type !== "all") {
          frappeFilters.push([
            "stock_entry_type",
            "=",
            filters.stock_entry_type,
          ]);
        }
        if (filters.purpose && filters.purpose !== "all") {
          frappeFilters.push(["purpose", "=", filters.purpose]);
        }
        if (filters.from_warehouse && filters.from_warehouse !== "all") {
          frappeFilters.push(["from_warehouse", "=", filters.from_warehouse]);
        }
        if (filters.to_warehouse && filters.to_warehouse !== "all") {
          frappeFilters.push(["to_warehouse", "=", filters.to_warehouse]);
        }
        if (filters.posting_date_from) {
          frappeFilters.push(["posting_date", ">=", filters.posting_date_from]);
        }
        if (filters.posting_date_to) {
          frappeFilters.push(["posting_date", "<=", filters.posting_date_to]);
        }
        if (filters.docstatus && filters.docstatus !== "all") {
          frappeFilters.push(["docstatus", "=", parseInt(filters.docstatus)]);
        }
        const limit = searchParams.get("limit") || "100";
        const fields: (keyof StockEntry | "*")[] = [
          "name",
          "stock_entry_type",
          "posting_date",
          "posting_time",
          "purpose",
          "docstatus",
          "company",
          "from_warehouse",
          "to_warehouse",
          "modified",
        ];
        const stockEntries = await frappeClient.db.getDocList<StockEntry>(
          "Stock Entry",
          {
            fields: fields,
            filters: frappeFilters.length > 0 ? frappeFilters : undefined,
            orderBy: {
              field: "modified",
              order: "desc",
            },
            limit: parseInt(limit),
          }
        );
        return { stockEntries: stockEntries as StockEntry[] };
      })
    );
  }
  // Default: return all stock entries
  return handleApiRequest<{ stockEntries: StockEntry[] }>(
    withEndpointLogging("/api/stock-entries - GET")(async () => {
      const limit = searchParams.get("limit") || "100";
      const fields = [
        "name",
        "stock_entry_type",
        "posting_date",
        "posting_time",
        "purpose",
        "docstatus",
        "company",
        "from_warehouse",
        "to_warehouse",
        "modified",
      ];
      const stockEntries = await frappeClient.db.getDocList("Stock Entry", {
        fields: fields,
        orderBy: {
          field: "modified",
          order: "desc",
        },
        limit: parseInt(limit),
      });
      return { stockEntries: stockEntries as StockEntry[] };
    })
  );
}
export async function POST(request: NextRequest) {
  return handleApiRequest<{ stockEntry: StockEntry }>(
    withEndpointLogging("/api/stock-entries - POST")(async () => {
      const data: StockEntryCreateRequest = await request.json();
      if (
        !data.stock_entry_type ||
        !data.posting_date ||
        !data.items ||
        data.items.length === 0
      ) {
        throw new Error(
          "Missing required fields: stock_entry_type, posting_date, and items"
        );
      }
      // Validate specific requirements based on purpose
      if (data.purpose === "Material Issue" && !data.from_warehouse) {
        throw new Error("From Warehouse is required for Material Issue");
      }
      if (data.purpose === "Material Receipt" && !data.to_warehouse) {
        throw new Error("To Warehouse is required for Material Receipt");
      }
      // In the POST method, add this validation for manufacturing
      if (data.purpose === "Manufacture") {
        if (!data.to_warehouse) {
          throw new Error("To Warehouse is required for Manufacturing");
        }
        // Check if we have both raw materials and finished goods
        const hasRawMaterials = data.items.some(
          (item) => !item.is_finished_item
        );
        const hasFinishedGoods = data.items.some(
          (item) => item.is_finished_item
        );
        if (!hasRawMaterials) {
          throw new Error(
            "At least one raw material is required for Manufacturing"
          );
        }
        if (!hasFinishedGoods) {
          throw new Error(
            "At least one finished good is required for Manufacturing"
          );
        }
      }
      // Generate name if not provided
      if (!data.name) {
        const prefix = data.purpose === "Material Issue" ? "STE-MI" : "STE-MR";
        data.name = `${prefix}-${Date.now()}`;
      }
      
      // Add allow_zero_valuation_rate to all items to bypass valuation rate validation
      if (data.items) {
        data.items = data.items.map(item => ({
          ...item,
          allow_zero_valuation_rate: 1
        }));
      }
      
      const stockEntry =
        await frappeClient.db.createDoc<StockEntryCreateRequest>(
          "Stock Entry",
          data
        );
      return { stockEntry: stockEntry as StockEntry };
    }),
    { requireAuth: true }
  );
}
// PUT - Update stock entry
export async function PUT(request: NextRequest) {
  return handleApiRequest<{ stockEntry: StockEntry }>(
    withEndpointLogging("/api/stock-entries - PUT")(async () => {
      const { searchParams } = new URL(request.url);
      const name = searchParams.get("name");
      if (!name) throw new Error("Stock Entry name parameter is required");
      const data: StockEntryUpdateRequest = await request.json();
      
      // Add allow_zero_valuation_rate to all items if present
      if (data.items) {
        data.items = data.items.map(item => ({
          ...item,
          allow_zero_valuation_rate: 1
        }));
      }
      
      const stockEntry = await frappeClient.db.updateDoc(
        "Stock Entry",
        name,
        data
      );
      return { stockEntry: stockEntry as StockEntry };
    }),
    { requireAuth: true }
  );
}
// DELETE - Delete stock entry
export async function DELETE(request: NextRequest) {
  return handleApiRequest<{ message: string }>(
    withEndpointLogging("/api/stock-entries - DELETE")(async () => {
      const { searchParams } = new URL(request.url);
      const name = searchParams.get("name");
      if (!name) throw new Error("Stock Entry name parameter is required");
      await frappeClient.db.deleteDoc("Stock Entry", name);
      return { message: `Stock Entry ${name} deleted successfully` };
    }),
    { requireAuth: true }
  );
}