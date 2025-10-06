import { NextRequest } from "next/server";
import { frappeClient } from "@/lib/frappe-client";
import { handleApiRequest, withEndpointLogging } from "@/lib/api-template";

export async function GET(request: NextRequest) {
  return handleApiRequest<{
    companies: string[];
    warehouses: string[];
    stockEntryTypes: string[];
    purposes: string[];
    uoms: string[];
  }>(
    withEndpointLogging("/api/stock-entries/options - GET")(async () => {
      // Fetch companies
      const companies = await frappeClient.db.getDocList("Company", {
        fields: ["name"],
        limit: 1000,
      });

      // Fetch warehouses
      const warehouses = await frappeClient.db.getDocList("Warehouse", {
        fields: ["name"],
        limit: 1000,
      });

      // Fetch stock entry types
      const stockEntries = await frappeClient.db.getDocList("Stock Entry", {
        fields: ["stock_entry_type"],
        limit: 1000,
      });
      const stockEntryTypes = [
        ...new Set(
          stockEntries.map((entry) => entry.stock_entry_type).filter(Boolean)
        ),
      ];

      // Fetch purposes
      const purposes = [
        ...new Set(
          stockEntries.map((entry) => entry.purpose).filter(Boolean)
        ),
      ];

      // Fetch UOMs
      const uoms = await frappeClient.db.getDocList("UOM", {
        fields: ["name"],
        limit: 1000,
      });

      const items = await frappeClient.db.getDocList("Item", {
        fields: ["item_code", "item_name", "stock_uom", "valuation_rate"],
        limit: 1000,
      });
      
      // Update the return object
      return {
        companies: companies.map((company) => company.name),
        warehouses: warehouses.map((warehouse) => warehouse.name),
        stockEntryTypes,
        purposes,
        uoms: uoms.map((uom) => uom.name),
        items: items.map(item => ({
          item_code: item.item_code,
          item_name: item.item_name,
          stock_uom: item.stock_uom,
          valuation_rate: item.valuation_rate || 0
        }))
      };
    })
  );
}