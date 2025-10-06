// app/api/crm/dashboard/route.ts
import { NextRequest } from "next/server";
import { frappeClient } from "@/lib/frappe-client";
import { handleApiRequest, withEndpointLogging } from "@/lib/api-template";
import { CRMDashboardData } from "@/types/crm";

export async function GET(request: NextRequest) {
  return handleApiRequest<{ dashboard: CRMDashboardData }>(
    withEndpointLogging("/api/crm/dashboard - GET")(async () => {
      const { searchParams } = new URL(request.url);
      const territory = searchParams.get("territory") || "";

      // Get total leads count
      const totalLeads = await frappeClient.call.get("frappe.client.get_list", {
        doctype: "Lead",
        fields: ["name"],
        filters: territory ? [["territory", "=", territory]] : [],
        limit: 1000,
      });

      // Get open opportunities count
      const openOpportunities = await frappeClient.call.get(
        "frappe.client.get_list",
        {
          doctype: "Opportunity",
          fields: ["name", "opportunity_amount"],
          filters: [
            ["status", "=", "Open"],
            ...(territory ? [["territory", "=", territory]] : []),
          ],
          limit: 1000,
        }
      );

      // Get quotations to follow up (submitted but not accepted/expired)
      const quotationsToFollowUp = await frappeClient.call.get(
        "frappe.client.get_list",
        {
          doctype: "Quotation",
          fields: ["name"],
          filters: [
            ["status", "=", "Submitted"],
            ["valid_till", ">=", new Date().toISOString().split("T")[0]],
            ...(territory ? [["territory", "=", territory]] : []),
          ],
          limit: 1000,
        }
      );

      // Get lead conversion rate
      const convertedLeads = await frappeClient.call.get(
        "frappe.client.get_list",
        {
          doctype: "Lead",
          fields: ["name"],
          filters: [
            ["status", "=", "Converted"],
            ...(territory ? [["territory", "=", territory]] : []),
          ],
          limit: 1000,
        }
      );

      const totalLeadsCount = totalLeads.message?.length || 0;
      const convertedLeadsCount = convertedLeads.message?.length || 0;
      const leadConversionRate =
        totalLeadsCount > 0
          ? Math.round((convertedLeadsCount / totalLeadsCount) * 100)
          : 0;

      // Get opportunities by stage
      const opportunitiesByStage = await frappeClient.call.get(
        "frappe.client.get_list",
        {
          doctype: "Opportunity",
          fields: ["sales_stage", "opportunity_amount"],
          filters: territory ? [["territory", "=", territory]] : [],
          limit: 1000,
        }
      );

      // Process opportunities by stage
      const stageMap = new Map<string, { count: number; amount: number }>();
      opportunitiesByStage.message?.forEach((opp: any) => {
        const stage = opp.sales_stage || "Unknown";
        const amount = parseFloat(opp.opportunity_amount) || 0;

        if (!stageMap.has(stage)) {
          stageMap.set(stage, { count: 0, amount: 0 });
        }

        const stageData = stageMap.get(stage)!;
        stageData.count += 1;
        stageData.amount += amount;
      });

      const opportunitiesByStageData = Array.from(stageMap.entries()).map(
        ([stage, data]) => ({
          stage,
          count: data.count,
          amount: data.amount,
        })
      );

      // Get recent activities
      const recentActivities = await frappeClient.call.get(
        "frappe.client.get_list",
        {
          doctype: "ToDo",
          fields: [
            "name",
            // "activity_type",
            "description",
            "status",
            "priority",
            "date",
            "allocated_to",
            "creation",
            "modified",
            "owner",
          ],
          filters: [
            ["status", "=", "Open"],
            ["date", ">=", new Date().toISOString().split("T")[0]],
          ],
          orderBy: { field: "date", order: "asc" },
          limit: 10,
        }
      );

      const processedActivities =
        recentActivities.message?.map((activity: any) => ({
          name: activity.name,
          activity_type: activity.activity_type || "Task",
          subject: activity.description,
          description: activity.description,
          status: activity.status,
          priority: activity.priority,
          due_date: activity.date,
          assigned_to: activity.allocated_to,
          reference_doctype: activity.reference_doctype,
          reference_name: activity.reference_name,
          creation: activity.creation,
          modified: activity.modified,
          owner: activity.owner,
        })) || [];

      // Get top sales persons
      const topSalesPersons = await frappeClient.call.get(
        "frappe.client.get_list",
        {
          doctype: "Opportunity",
          fields: ["opportunity_amount"],
          filters: [
            ["status", "in", ["Open", "Quoted"]],
            ...(territory ? [["territory", "=", territory]] : []),
          ],
          limit: 1000,
        }
      );

      // Process top sales persons
      const salesPersonMap = new Map<
        string,
        { opportunities: number; amount: number }
      >();
      topSalesPersons.message?.forEach((opp: any) => {
        const salesPerson = opp.contact_by || "Unassigned";
        const amount = parseFloat(opp.opportunity_amount) || 0;

        if (!salesPersonMap.has(salesPerson)) {
          salesPersonMap.set(salesPerson, { opportunities: 0, amount: 0 });
        }

        const personData = salesPersonMap.get(salesPerson)!;
        personData.opportunities += 1;
        personData.amount += amount;
      });

      const topSalesPersonsData = Array.from(salesPersonMap.entries())
        .map(([name, data]) => ({
          name,
          opportunities: data.opportunities,
          amount: data.amount,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      const dashboardData: CRMDashboardData = {
        total_leads: totalLeadsCount,
        open_opportunities: openOpportunities.message?.length || 0,
        quotations_to_follow_up: quotationsToFollowUp.message?.length || 0,
        leadConversionRate,
        opportunities_by_stage: opportunitiesByStageData,
        recent_activities: processedActivities,
        top_sales_persons: topSalesPersonsData,
      };

      return { dashboard: dashboardData };
    })
  );
}
