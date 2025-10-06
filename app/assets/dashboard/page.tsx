// app/assets/dashboard/page.tsx
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
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  Filter,
  Download,
  Wrench,
  Truck,
  Plus,
  Eye,
  Edit,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface AssetSummary {
  total_assets: number;
  assets_under_maintenance: number;
  assets_requiring_attention: number;
  total_value: number;
}

interface RecentActivity {
  type: "maintenance" | "movement" | "repair";
  asset: string;
  date: string;
  description: string;
}

interface MaintenanceDue {
  asset: string;
  due_date: string;
  days_remaining: number;
}

interface AssetByCategory {
  category: string;
  count: number;
  value: number;
}

interface AssetByLocation {
  location: string;
  count: number;
  value: number;
}

interface DashboardFilters {
  company: string;
  date_from: string;
  date_to: string;
}

export default function AssetDashboard() {
  const { push: toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<AssetSummary | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [maintenanceDue, setMaintenanceDue] = useState<MaintenanceDue[]>([]);
  const [assetsByCategory, setAssetsByCategory] = useState<AssetByCategory[]>([]);
  const [assetsByLocation, setAssetsByLocation] = useState<AssetByLocation[]>([]);
  const [filters, setFilters] = useState<DashboardFilters>({
    company: "Ma Beignet (Demo)",
    date_from: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
    date_to: new Date().toISOString().split("T")[0],
  });
  const [activeTab, setActiveTab] = useState<"overview" | "activities" | "maintenance">("overview");

  const fetchData = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);
      setRefreshing(true);

      try {
        // Build query params from filters
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== "all") {
            params.set(key, value.toString());
          }
        });

        // Fetch dashboard data
        const response = await fetch(`/api/asset/dashboard?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const data = await response.json();
        const dashboardData = data.data.dashboard;
        
        setSummary({
          total_assets: dashboardData.total_assets,
          assets_under_maintenance: dashboardData.assets_under_maintenance,
          assets_requiring_attention: dashboardData.assets_requiring_attention,
          total_value: dashboardData.assets_by_category.reduce((sum: number, item: AssetByCategory) => sum + item.value, 0)
        });
        
        setRecentActivities(dashboardData.recent_activities);
        setMaintenanceDue(dashboardData.maintenance_due);
        setAssetsByCategory(dashboardData.assets_by_category);
        setAssetsByLocation(dashboardData.assets_by_location);
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
    [filters, toast]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (key: keyof DashboardFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
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

  const getActivityIcon = (type: RecentActivity["type"]) => {
    switch (type) {
      case "maintenance":
        return <Wrench className="h-4 w-4" />;
      case "movement":
        return <Truck className="h-4 w-4" />;
      case "repair":
        return <Wrench className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getDaysRemainingVariant = (days: number) => {
    if (days <= 0) return "bg-red-100 text-red-800";
    if (days <= 7) return "bg-orange-100 text-orange-800";
    if (days <= 30) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const AssetCard = ({
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
            <h1 className="text-3xl font-bold">Asset Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your organization's assets
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
            <Package className="w-8 h-8 mr-3 text-primary" />
            Asset Dashboard
          </h1>
          <p className="text-muted-foreground">
            Overview of your organization's assets
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
          <Button onClick={() => router.push("/assets/assets/new")}>
            <Plus className="w-4 h-4 mr-2" />
            New Asset
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
              <Label htmlFor="company">Company</Label>
              <Select
                value={filters.company}
                onValueChange={(value) => handleFilterChange("company", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ma Beignet (Demo)">
                    Ma Beignet (Demo)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date_from">From Date</Label>
              <Input
                type="date"
                value={filters.date_from}
                onChange={(e) =>
                  handleFilterChange("date_from", e.target.value)
                }
              />
            </div>

            <div>
              <Label htmlFor="date_to">To Date</Label>
              <Input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange("date_to", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <AssetCard
          title="Total Assets"
          value={summary?.total_assets || 0}
          icon={Package}
          trend="up"
        />

        <AssetCard
          title="Under Maintenance"
          value={summary?.assets_under_maintenance || 0}
          icon={Wrench}
          trend="neutral"
        />

        <AssetCard
          title="Require Attention"
          value={summary?.assets_requiring_attention || 0}
          icon={AlertTriangle}
          trend="down"
          className={
            summary?.assets_requiring_attention && summary.assets_requiring_attention > 0
              ? "border-orange-200 bg-orange-50"
              : ""
          }
        />

        <AssetCard
          title="Total Value"
          value={formatCurrency(summary?.total_value || 0)}
          icon={TrendingUp}
          trend="up"
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
            activeTab === "maintenance"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("maintenance")}
        >
          Maintenance Due
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
              {/* Assets by Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Assets by Category</CardTitle>
                  <CardDescription>Distribution of assets across categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assetsByCategory.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                          <span>{item.category}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{item.count} assets</div>
                          <div className="text-sm text-muted-foreground">{formatCurrency(item.value)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Assets by Location */}
              <Card>
                <CardHeader>
                  <CardTitle>Assets by Location</CardTitle>
                  <CardDescription>Distribution of assets across locations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assetsByLocation.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                          <span>{item.location}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{item.count} assets</div>
                          <div className="text-sm text-muted-foreground">{formatCurrency(item.value)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "activities" && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Latest maintenance, movements, and repairs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No recent activities found</p>
                    </div>
                  ) : (
                    recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border">
                        <div className="p-2 rounded-full bg-muted">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{activity.asset}</p>
                            <Badge variant="outline" className="capitalize">
                              {activity.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(activity.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "maintenance" && (
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Due</CardTitle>
                <CardDescription>Assets requiring maintenance soon</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {maintenanceDue.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No maintenance due</p>
                    </div>
                  ) : (
                    maintenanceDue.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium">{item.asset}</p>
                          <p className="text-sm text-muted-foreground">
                            Due: {new Date(item.due_date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={getDaysRemainingVariant(item.days_remaining)}>
                          {item.days_remaining <= 0 ? 'Overdue' : `${item.days_remaining} days`}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}