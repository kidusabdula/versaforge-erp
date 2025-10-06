// app/api/crm/options/route.ts
import { NextRequest } from "next/server";
import { frappeClient } from "@/lib/frappe-client";
import { handleApiRequest, withEndpointLogging } from "@/lib/api-template";

interface CRMOptions {
  territories: Array<{ name: string; territory_name: string }>;
  salesPersons: Array<{ name: string; sales_person_name: string }>;
  customerGroups: Array<{ name: string; customer_group_name: string }>;
  leadSources: Array<{ name: string; source_name: string }>;
  salesStages: Array<{ name: string; stage_name: string }>;
  customers: Array<{ name: string; customer_name: string }>;
  leads: Array<{ name: string; lead_name: string }>;
  items: Array<{
    name: string;
    item_code: string;
    item_name: string;
    description: string;
    stock_uom: string;
    standard_rate: number;
    is_stock_item: number;
  }>;
}

export async function GET() {
  return handleApiRequest<{ options: CRMOptions }>(
    withEndpointLogging("/api/crm/options - GET")(async () => {
      // Fetch territories
      const territories = await frappeClient.call.get(
        "frappe.client.get_list",
        {
          doctype: "Territory",
          fields: ["name", "territory_name"],
          limit: 100,
        }
      );

      // Fetch sales persons
      const salesPersons = await frappeClient.call.get(
        "frappe.client.get_list",
        {
          doctype: "Sales Person",
          fields: ["name", "sales_person_name"],
          limit: 100,
        }
      );

      // Fetch customer groups
      const customerGroups = await frappeClient.call.get(
        "frappe.client.get_list",
        {
          doctype: "Customer Group",
          fields: ["name", "customer_group_name"],
          limit: 100,
        }
      );

      // Fetch lead sources
      const leadSources = await frappeClient.call.get(
        "frappe.client.get_list",
        {
          doctype: "Lead Source",
          fields: ["name", "source_name"],
          limit: 100,
        }
      );

      // Fetch sales stages
      const salesStages = await frappeClient.call.get(
        "frappe.client.get_list",
        {
          doctype: "Sales Stage",
          fields: ["name", "stage_name"],
          limit: 100,
        }
      );

      // Fetch customers
      const customers = await frappeClient.call.get("frappe.client.get_list", {
        doctype: "Customer",
        fields: ["name", "customer_name"],
        limit: 100,
      });

      // Fetch leads
      const leads = await frappeClient.call.get("frappe.client.get_list", {
        doctype: "Lead",
        fields: ["name", "lead_name"],
        limit: 100,
      });

      // Fetch items
      const items = await frappeClient.call.get("frappe.client.get_list", {
        doctype: "Item",
        fields: [
          "name",
          "item_code",
          "item_name",
          "description",
          "stock_uom",
          "standard_rate",
          "is_stock_item",
        ],
        limit: 100,
      });

      // Process the data
      const processedTerritories =
        territories.message?.map((territory: any) => ({
          name: territory.name,
          territory_name: territory.territory_name,
        })) || [];

      const processedSalesPersons =
        salesPersons.message?.map((person: any) => ({
          name: person.name,
          sales_person_name: person.sales_person_name,
        })) || [];

      const processedCustomerGroups =
        customerGroups.message?.map((group: any) => ({
          name: group.name,
          customer_group_name: group.customer_group_name,
        })) || [];

      const processedLeadSources =
        leadSources.message?.map((source: any) => ({
          name: source.name,
          source_name: source.source_name,
        })) || [];

      const processedSalesStages =
        salesStages.message?.map((stage: any) => ({
          name: stage.name,
          stage_name: stage.stage_name,
        })) || [];

      const processedCustomers =
        customers.message?.map((cust: any) => ({
          name: cust.name,
          customer_name: cust.customer_name,
        })) || [];

      const processedLeads =
        leads.message?.map((lead: any) => ({
          name: lead.name,
          lead_name: lead.lead_name,
        })) || [];

      const processedItems =
        items.message?.map((item: any) => ({
          name: item.name,
          item_code: item.item_code,
          item_name: item.item_name,
          description: item.description || "",
          stock_uom: item.stock_uom || "",
          standard_rate: item.standard_rate || 0,
          is_stock_item: item.is_stock_item || 0,
        })) || [];

      const options: CRMOptions = {
        territories: processedTerritories,
        salesPersons: processedSalesPersons,
        customerGroups: processedCustomerGroups,
        leadSources: processedLeadSources,
        salesStages: processedSalesStages,
        customers: processedCustomers,
        leads: processedLeads,
        items: processedItems,
      };

      return { options };
    })
  );
}
