import { NextRequest } from "next/server";
import { frappeClient } from "@/lib/frappe-client";
import { handleApiRequest, withEndpointLogging } from "@/lib/api-template";
import { StockBalance, DashboardFilters } from "@/types/stock-dashboard";
import { Filter } from "frappe-js-sdk/lib/db/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  return handleApiRequest<{ stockBalance: StockBalance[] }>(
    withEndpointLogging("/api/stock-balance - GET")(async () => {
      const filters: Partial<DashboardFilters> = {};
      const frappeFilters: Filter[] = [];

      // Extract filter parameters
      searchParams.forEach((value, key) => {
        if (value && value !== "all") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          filters[key as keyof DashboardFilters] = value as any;
        }
      });

      if (filters.warehouse) {
        frappeFilters.push(["warehouse", "=", filters.warehouse]);
      }

      if (filters.item_group) {
        frappeFilters.push(["item_group", "=", filters.item_group]);
      }

      if (filters.show_low_stock === true) {
        frappeFilters.push(["actual_qty", ">", 0]);
        frappeFilters.push(["actual_qty", "<", 10]); // Adjust threshold as needed
      }

      if (filters.show_out_of_stock === true) {
        frappeFilters.push(["actual_qty", "=", 0]);
      }

      const stockBalance = await frappeClient.db.getDocList<StockBalance>(
        "Bin",
        {
          fields: [
            "item_code",
            "warehouse",
            "actual_qty",
            "reserved_qty",
            "ordered_qty",
            "projected_qty",
            "valuation_rate",
            "stock_value",
            "stock_uom"
          ],
          filters: frappeFilters.length > 0 ? frappeFilters : undefined,
          orderBy: {
            field: "modified",
            order: "desc",
          },
          limit: 1000,
        }
      );

      // Fetch item names separately
      const itemCodes = [
        ...new Set(stockBalance.map((item) => item.item_code)),
      ];
      const items = await frappeClient.db.getDocList("Item", {
        fields: ["item_code", "item_name"],
        filters: [["item_code", "in", itemCodes]],
        limit: 1000,
      });

      // Create a map of item codes to item names
      const itemNameMap = items.reduce((map, item) => {
        map[item.item_code] = item.item_name;
        return map;
      }, {} as Record<string, string>);

      // Add item names to stock balance data
      const stockBalanceWithNames = stockBalance.map((item) => ({
        ...item,
        item_name: itemNameMap[item.item_code] || "",
      }));

      return { stockBalance: stockBalanceWithNames };
    })
  );
}
