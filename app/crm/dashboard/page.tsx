// app/crm/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  Users,
  TrendingUp,
  FileText,
  Calendar,
  RefreshCw,
  Filter,
  Plus,
  Eye,
  Edit,
  User,
  Activity,
  AlertCircle,
} from "lucide-react";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { type VariantProps } from "class-variance-authority";
import { useRouter } from "next/navigation";
import { CRMDashboardData } from "@/types/crm";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

export default function CRMDashboard() {
  const { push: toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<CRMDashboardData | null>(null);
  const [territoryFilter, setTerritoryFilter] = useState("all");
  const [territories, setTerritories] = useState<Array<{ name: string; territory_name: string }>>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "activities" | "performance">("overview");

  const fetchData = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);
      setRefreshing(true);

      try {
        // Build query params from filters
        const params = new URLSearchParams();
        if (territoryFilter && territoryFilter !== "all") {
          params.set("territory", territoryFilter);
        }

        const response = await fetch(`/api/crm/dashboard?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const data = await response.json();
        setDashboardData(data.data.dashboard);
      } catch (error: unknown) {
        toast({
          variant: "error",
          title: "Error",
          description: `Failed to load dashboard data: ${
            (error as Error).message
          }`,
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [territoryFilter, toast]
  );

  const fetchTerritories = useCallback(async () => {
    try {
      const response = await fetch('/api/crm/options');
      if (response.ok) {
        const data = await response.json();
        setTerritories(data.data.options.territories);
      }
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to load territories: ${(error as Error).message}`,
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchTerritories();
    fetchData();
  }, [fetchData, fetchTerritories]);

  const handleTerritoryChange = (value: string) => {
    setTerritoryFilter(value);
  };

  const applyFilters = () => {
    fetchData();
  };

  const handleRefresh = () => {
    fetchData(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-ET").format(num);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "closed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    className = "",
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    trend?: "up" | "down" | "neutral";
    className?: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
              <p className="text-2xl font-bold">{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
            <div
              className={`p-3 rounded-full ${
                trend === "up"
                  ? "bg-green-100 text-green-600"
                  : trend === "down"
                  ? "bg-red-100 text-red-600"
                  : "bg-blue-100 text-blue-600"
              }`}
            >
              <Icon className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">CRM Dashboard</h1>
            <p className="text-muted-foreground">
              Customer relationship management overview
            </p>
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-primary" />
            CRM Dashboard
          </h1>
          <p className="text-muted-foreground">
            Customer relationship management overview
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={refreshing}
            className="flex items-center"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button onClick={() => router.push("/crm/leads/new")}>
            <Plus className="w-4 h-4 mr-2" />
            New Lead
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </CardTitle>
            <Button onClick={applyFilters} size="sm">
              Apply Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="territory">Territory</Label>
              <Select
                value={territoryFilter}
                onValueChange={handleTerritoryChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Territories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Territories</SelectItem>
                  {territories.map(territory => (
                    <SelectItem key={territory.name} value={territory.name}>
                      {territory.territory_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Leads"
          value={formatNumber(dashboardData?.total_leads || 0)}
          icon={Users}
          trend="up"
        />

        <StatCard
          title="Open Opportunities"
          value={formatNumber(dashboardData?.open_opportunities || 0)}
          icon={TrendingUp}
          trend="up"
        />

        <StatCard
          title="Quotations to Follow Up"
          value={formatNumber(dashboardData?.quotations_to_follow_up || 0)}
          icon={FileText}
          trend="neutral"
        />

        <StatCard
          title="Lead Conversion Rate"
          value={`${dashboardData?.leadConversionRate || 0}%`}
          icon={TrendingUp}
          trend={dashboardData?.leadConversionRate && dashboardData.leadConversionRate >= 20 ? "up" : "neutral"}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "overview"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "activities"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("activities")}
        >
          Recent Activities
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "performance"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("performance")}
        >
          Sales Performance
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Opportunities by Stage */}
              <Card>
                <CardHeader>
                  <CardTitle>Opportunities by Stage</CardTitle>
                  <CardDescription>Breakdown of opportunities in each sales stage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData?.opportunities_by_stage.map((stage, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${
                            index === 0 ? "bg-red-500" : 
                            index === 1 ? "bg-orange-500" : 
                            index === 2 ? "bg-yellow-500" : 
                            index === 3 ? "bg-green-500" : "bg-blue-500"
                          }`}></div>
                          <span className="font-medium">{stage.stage}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatNumber(stage.count)} opps</div>
                          <div className="text-sm text-muted-foreground">{formatCurrency(stage.amount)}</div>
                        </div>
                      </div>
                    ))}
                    {(!dashboardData?.opportunities_by_stage || dashboardData.opportunities_by_stage.length === 0) && (
                      <div className="text-center py-4 text-muted-foreground">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No opportunity data available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common CRM tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      className="h-20 flex-col"
                      onClick={() => router.push("/crm/leads/new")}
                    >
                      <Users className="h-6 w-6 mb-2" />
                      New Lead
                    </Button>
                    <Button
                      className="h-20 flex-col"
                      onClick={() => router.push("/crm/opportunities/new")}
                    >
                      <TrendingUp className="h-6 w-6 mb-2" />
                      New Opportunity
                    </Button>
                    <Button
                      className="h-20 flex-col"
                      onClick={() => router.push("/crm/quotations/new")}
                    >
                      <FileText className="h-6 w-6 mb-2" />
                      New Quotation
                    </Button>
                    <Button
                      className="h-20 flex-col"
                      onClick={() => router.push("/crm/activities")}
                    >
                      <Activity className="h-6 w-6 mb-2" />
                      Activities
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "activities" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Activities</CardTitle>
                    <CardDescription>
                      Latest tasks and follow-ups
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => router.push("/crm/activities")}
                    >
                      View All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assigned To</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboardData?.recent_activities.map((activity) => (
                        <TableRow key={activity.name}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{activity.subject}</p>
                              <p className="text-sm text-muted-foreground">
                                {activity.reference_doctype} - {activity.reference_name}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {activity.activity_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(activity.due_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(activity.priority)}>
                              {activity.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(activity.status)}>
                              {activity.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-2 text-muted-foreground" />
                              {activity.assigned_to || "Unassigned"}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {(!dashboardData?.recent_activities || dashboardData.recent_activities.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No recent activities found</p>
                    <Button className="mt-4" onClick={() => router.push("/crm/activities/new")}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Activity
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "performance" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Top Sales Persons</CardTitle>
                    <CardDescription>
                      Sales performance by team members
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sales Person</TableHead>
                        <TableHead>Opportunities</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Average Deal Size</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboardData?.top_sales_persons.map((person, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{person.name}</TableCell>
                          <TableCell>{formatNumber(person.opportunities)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(person.amount)}</TableCell>
                          <TableCell>
                            {person.opportunities > 0 
                              ? formatCurrency(person.amount / person.opportunities) 
                              : formatCurrency(0)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {(!dashboardData?.top_sales_persons || dashboardData.top_sales_persons.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No sales performance data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}