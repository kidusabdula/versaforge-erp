// app/dashboard/page.tsx
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
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  Filter,
  Download,
  FileText,
  CreditCard,
  ShoppingCart,
  Package,
  Users,
  Truck,
  Plus,
  Eye,
  Edit,
  Trash2,
  PieChart,
  Activity,
} from "lucide-react";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { type VariantProps } from "class-variance-authority";
import { useRouter } from "next/navigation";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

interface DashboardSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  cashBalance: number;
  pendingPayments: number;
  overduePayments: number;
  salesCount: number;
  purchaseCount: number;
  inventoryValue: number;
  customerCount: number;
  supplierCount: number;
}

interface RecentTransaction {
  id: string;
  type: "sale" | "purchase" | "expense" | "payment";
  date: string;
  description: string;
  amount: number;
  status: string;
  customer?: string;
  supplier?: string;
}

interface TopItem {
  item_code: string;
  item_name: string;
  quantity: number;
  amount: number;
}

interface CustomerMetric {
  name: string;
  total_purchases: number;
  last_purchase_date: string;
}

interface SupplierMetric {
  name: string;
  total_purchases: number;
  last_purchase_date: string;
}

interface InventoryAlert {
  item_code: string;
  item_name: string;
  current_stock: number;
  reorder_level: number;
  status: "low" | "out";
}

interface ExpenseBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

interface SalesTrend {
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface DashboardOptions {
  companies: { name: string; label: string }[];
  warehouses: { name: string; label: string }[];
  dateRanges: { value: string; label: string }[];
  reportTypes: { value: string; label: string }[];
  itemGroups: { name: string; label: string }[];
}

interface DashboardFilters {
  company: string;
  warehouse: string;
  date_from: string;
  date_to: string;
  date_range: string;
}

export default function DashboardPage() {
  const { push: toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [topSellingItems, setTopSellingItems] = useState<TopItem[]>([]);
  const [salesByCategory, setSalesByCategory] = useState<{ category: string; amount: number }[]>([]);
  const [customerMetrics, setCustomerMetrics] = useState<CustomerMetric[]>([]);
  const [supplierMetrics, setSupplierMetrics] = useState<SupplierMetric[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseBreakdown[]>([]);
  const [salesTrends, setSalesTrends] = useState<SalesTrend[]>([]);
  const [options, setOptions] = useState<DashboardOptions | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({
    company: "Ma Beignet (Demo)",
    warehouse: "Stores - MB",
    date_from: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
    date_to: new Date().toISOString().split("T")[0],
    date_range: "this_month",
  });
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "analytics">("overview");

  const fetchOptions = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/options');
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard options");
      }
      const data = await response.json();
      setOptions(data.data);
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to load dashboard options: ${(error as Error).message}`,
      });
    }
  }, [toast]);

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
        const response = await fetch(`/api/dashboard?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const data = await response.json();
        setSummary(data.data.summary);
        setRecentTransactions(data.data.recentTransactions);
        setTopSellingItems(data.data.topSellingItems);
        setSalesByCategory(data.data.salesByCategory);
        setCustomerMetrics(data.data.customerMetrics);
        setSupplierMetrics(data.data.supplierMetrics);
        setInventoryAlerts(data.data.inventoryAlerts);
        setExpenseBreakdown(data.data.expenseBreakdown);
        setSalesTrends(data.data.salesTrends);
      } catch (error: unknown) {
        toast({
          variant: "error",
          title: "Error",
          description: `Failed to load dashboard data: ${(error as Error).message}`,
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filters, toast]
  );

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  useEffect(() => {
    if (options) {
      fetchData();
    }
  }, [options, fetchData]);

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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-ET").format(num);
  };

  const getTransactionIcon = (type: RecentTransaction["type"]) => {
    switch (type) {
      case "purchase":
        return <ShoppingCart className="h-4 w-4" />;
      case "expense":
        return <FileText className="h-4 w-4" />;
      case "payment":
        return <CreditCard className="h-4 w-4" />;
      case "sale":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
      case "submitted":
        return "bg-green-100 text-green-800";
      case "unpaid":
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const FinanceCard = ({
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
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Business overview and analytics
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
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Business overview and analytics
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
          <Button onClick={() => router.push("/reports")}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Generate Reports
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
                  {options?.companies.map((company) => (
                    <SelectItem key={company.name} value={company.name}>
                      {company.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="warehouse">Warehouse</Label>
              <Select
                value={filters.warehouse}
                onValueChange={(value) => handleFilterChange("warehouse", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {options?.warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.name} value={warehouse.name}>
                      {warehouse.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date_range">Date Range</Label>
              <Select
                value={filters.date_range}
                onValueChange={(value) => handleFilterChange("date_range", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Date Range" />
                </SelectTrigger>
                <SelectContent>
                  {options?.dateRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        <FinanceCard
          title="Total Revenue"
          value={formatCurrency(summary?.totalRevenue || 0)}
          icon={TrendingUp}
          trend="up"
        />

        <FinanceCard
          title="Total Expenses"
          value={formatCurrency(summary?.totalExpenses || 0)}
          icon={TrendingDown}
          trend="down"
        />

        <FinanceCard
          title="Net Profit"
          value={formatCurrency(summary?.netProfit || 0)}
          icon={DollarSign}
          trend={summary?.netProfit && summary.netProfit >= 0 ? "up" : "down"}
          className={
            summary?.netProfit && summary.netProfit >= 0
              ? ""
              : "border-red-200 bg-red-50"
          }
        />

        <FinanceCard
          title="Cash Balance"
          value={formatCurrency(summary?.cashBalance || 0)}
          icon={DollarSign}
          trend="neutral"
        />
      </div>

      {/* Additional Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <FinanceCard
          title="Sales Count"
          value={formatNumber(summary?.salesCount || 0)}
          icon={ShoppingCart}
          trend="up"
        />

        <FinanceCard
          title="Purchase Count"
          value={formatNumber(summary?.purchaseCount || 0)}
          icon={FileText}
          trend="neutral"
        />

        <FinanceCard
          title="Inventory Value"
          value={formatCurrency(summary?.inventoryValue || 0)}
          icon={Package}
          trend="neutral"
        />

        <FinanceCard
          title="Pending Payments"
          value={formatCurrency(summary?.pendingPayments || 0)}
          icon={AlertTriangle}
          trend="down"
          className="border-orange-200 bg-orange-50"
        />
      </div>

      {/* Additional Summary Cards - Row 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <FinanceCard
          title="Customers"
          value={formatNumber(summary?.customerCount || 0)}
          icon={Users}
          trend="up"
        />

        <FinanceCard
          title="Suppliers"
          value={formatNumber(summary?.supplierCount || 0)}
          icon={Truck}
          trend="neutral"
        />

        <FinanceCard
          title="Overdue Payments"
          value={formatCurrency(summary?.overduePayments || 0)}
          icon={AlertTriangle}
          trend="down"
          className="border-red-200 bg-red-50"
        />

        <FinanceCard
          title="Inventory Alerts"
          value={formatNumber(inventoryAlerts.length || 0)}
          icon={AlertTriangle}
          trend={inventoryAlerts.length > 0 ? "down" : "neutral"}
          className={inventoryAlerts.length > 0 ? "border-red-200 bg-red-50" : ""}
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
            activeTab === "transactions"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("transactions")}
        >
          Transactions
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "analytics"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("analytics")}
        >
          Analytics
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
              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Latest business activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentTransactions.slice(0, 5).map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="p-1 rounded-full bg-muted mr-2">
                                {getTransactionIcon(transaction.type)}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {transaction.description}
                                </p>
                                <p className="text-sm text-muted-foreground capitalize">
                                  {transaction.type}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(transaction.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={getStatusColor(transaction.status)}
                            >
                              {transaction.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Top Selling Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Items</CardTitle>
                  <CardDescription>Most popular products</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topSellingItems.map((item) => (
                        <TableRow key={item.item_code}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.item_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.item_code}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{formatNumber(item.quantity)}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(item.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "transactions" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Transactions</CardTitle>
                    <CardDescription>
                      Complete transaction history
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => router.push("/transactions/new")}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Transaction
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="p-1 rounded-full bg-muted mr-2">
                                {getTransactionIcon(transaction.type)}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {transaction.description}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {transaction.id}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {transaction.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(transaction.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={getStatusColor(transaction.status)}
                            >
                              {transaction.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "analytics" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Customers</CardTitle>
                  <CardDescription>Customers by purchase value</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Total Purchases</TableHead>
                        <TableHead>Last Purchase</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerMetrics.map((customer) => (
                        <TableRow key={customer.name}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{customer.name}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(customer.total_purchases)}
                          </TableCell>
                          <TableCell>
                            {new Date(customer.last_purchase_date).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Supplier Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Suppliers</CardTitle>
                  <CardDescription>Suppliers by purchase value</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Total Purchases</TableHead>
                        <TableHead>Last Purchase</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supplierMetrics.map((supplier) => (
                        <TableRow key={supplier.name}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{supplier.name}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(supplier.total_purchases)}
                          </TableCell>
                          <TableCell>
                            {new Date(supplier.last_purchase_date).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Inventory Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Alerts</CardTitle>
                  <CardDescription>Items that need attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Current Stock</TableHead>
                        <TableHead>Reorder Level</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryAlerts.map((alert) => (
                        <TableRow key={alert.item_code}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{alert.item_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {alert.item_code}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatNumber(alert.current_stock)}
                          </TableCell>
                          <TableCell>
                            {formatNumber(alert.reorder_level)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                alert.status === "out"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {alert.status === "out" ? "Out of Stock" : "Low Stock"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Expense Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Expense Breakdown</CardTitle>
                  <CardDescription>Expenses by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {expenseBreakdown.map((expense) => (
                      <div key={expense.category} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{expense.category}</span>
                          <span className="font-bold">{formatCurrency(expense.amount)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-primary h-2.5 rounded-full"
                            style={{ width: `${expense.percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          {expense.percentage.toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}