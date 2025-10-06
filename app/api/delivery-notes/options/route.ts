// import { NextRequest } from "next/server";
import { frappeClient } from "@/lib/frappe-client";
import { handleApiRequest, withEndpointLogging } from "@/lib/api-template";

export async function GET() {
  return handleApiRequest<{
    customers: string[];
    companies: string[];
    warehouses: string[];
    territories: string[];
    items: Array<{
      item_code: string;
      item_name: string;
      stock_uom: string;
      valuation_rate: number;
    }>;
    uoms: string[];
  }>(
    withEndpointLogging("/api/delivery-notes/options - GET")(async () => {
      // Fetch customers
      const customers = await frappeClient.db.getDocList("Customer", {
        fields: ["name"],
        limit: 1000,
      });

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

      // Fetch territories
      const territories = await frappeClient.db.getDocList("Territory", {
        fields: ["name"],
        limit: 1000,
      });

      // Fetch items
      const items = await frappeClient.db.getDocList("Item", {
        fields: ["item_code", "item_name", "stock_uom", "valuation_rate"],
        limit: 1000,
      });

      // Fetch UOMs
      const uoms = await frappeClient.db.getDocList("UOM", {
        fields: ["name"],
        limit: 1000,
      });

      return {
        customers: customers.map((customer) => customer.name),
        companies: companies.map((company) => company.name),
        warehouses: warehouses.map((warehouse) => warehouse.name),
        territories: territories.map((territory) => territory.name),
        items: items.map((item) => ({
          item_code: item.item_code,
          item_name: item.item_name,
          stock_uom: item.stock_uom,
          valuation_rate: item.valuation_rate || 0,
        })),
        uoms: uoms.map((uom) => uom.name),
      };
    })
  );
}