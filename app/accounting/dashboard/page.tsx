// app/accounting/page.tsx
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
  Plus,
  Eye,
  Edit,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
// @ts-nocheck
import { type VariantProps } from "class-variance-authority";
import { useRouter } from "next/navigation";

// type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  cashBalance: number;
  pendingPayments: number;
  overduePayments: number;
}

interface RecentTransaction {
  id: string;
  type: "purchase" | "expense" | "payment" | "sale";
  date: string;
  description: string;
  amount: number;
  status: string;
}

interface FinancialReport {
  report_type: "Income" | "CashFlow" | "Balance";
  from_date: string;
  to_date: string;
  company: string;
  data: Record<string, number>;
  details: any[];
}

interface DashboardFilters {
  company: string;
  date_from: string;
  date_to: string;
  report_type: string;
}

export default function AccountingDashboard() {
  const { push: toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<
    RecentTransaction[]
  >([]);
  const [reportData, setReportData] = useState<FinancialReport | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({
    company: "Ma Beignet (Demo)",
    date_from: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
    date_to: new Date().toISOString().split("T")[0],
    report_type: "Income",
  });
  const [activeTab, setActiveTab] = useState<
    "overview" | "transactions" | "reports"
  >("overview");

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

        // Fetch all data in parallel
        const [summaryRes, transactionsRes] = await Promise.all([
          fetch(`/api/accounting/summary?${params}`),
          fetch(`/api/accounting/transactions/recent?${params}&limit=10`),
        ]);

        if (!summaryRes.ok || !transactionsRes.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const [summaryData, transactionsData] = await Promise.all([
          summaryRes.json(),
          transactionsRes.json(),
        ]);

        setSummary(summaryData.data.summary);
        setRecentTransactions(transactionsData.data.transactions);
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

  const fetchReportData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") {
          params.set(key, value.toString());
        }
      });

      const reportRes = await fetch(`/api/accounting/reports?${params}`);
      if (!reportRes.ok) {
        throw new Error("Failed to fetch report data");
      }

      const reportData = await reportRes.json();
      setReportData(reportData.data.report);
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to load report data: ${(error as Error).message}`,
      });
    }
  }, [filters, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === "reports") {
      fetchReportData();
    }
  }, [activeTab, fetchReportData]);

  const handleFilterChange = (key: keyof DashboardFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchData();
    if (activeTab === "reports") {
      fetchReportData();
    }
  };

  const handleRefresh = () => {
    fetchData(false);
    if (activeTab === "reports") {
      fetchReportData();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 2,
    }).format(amount);
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
            <h1 className="text-3xl font-bold">Accounting Dashboard</h1>
            <p className="text-muted-foreground">
              Financial overview and analytics
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
            Accounting Dashboard
          </h1>
          <p className="text-muted-foreground">
            Financial overview and analytics
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
          <Button onClick={() => router.push("/accounting/reports")}>
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

            <div>
              <Label htmlFor="report_type">Report Type</Label>
              <Select
                value={filters.report_type}
                onValueChange={(value) =>
                  handleFilterChange("report_type", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Report Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Income">Income Statement</SelectItem>
                  <SelectItem value="CashFlow">Cash Flow</SelectItem>
                  <SelectItem value="Balance">Balance Sheet</SelectItem>
                </SelectContent>
              </Select>
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

      {/* Payment Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
              Pending Payments
            </CardTitle>
            <CardDescription>Payments awaiting collection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {formatCurrency(summary?.pendingPayments || 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
              Overdue Payments
            </CardTitle>
            <CardDescription>
              Payments that require immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {formatCurrency(summary?.overduePayments || 0)}
            </div>
          </CardContent>
        </Card>
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
          Recent Transactions
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "reports"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("reports")}
        >
          Financial Reports
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
                  <CardDescription>Latest financial activities</CardDescription>
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

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common accounting tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      className="h-20 flex-col"
                      onClick={() => router.push("/accounting/purchases/new")}
                    >
                      <ShoppingCart className="h-6 w-6 mb-2" />
                      New Purchase
                    </Button>
                    <Button
                      className="h-20 flex-col"
                      onClick={() => router.push("/accounting/expenses/new")}
                    >
                      <FileText className="h-6 w-6 mb-2" />
                      New Expense
                    </Button>
                    <Button
                      className="h-20 flex-col"
                      onClick={() => router.push("/accounting/payments/new")}
                    >
                      <CreditCard className="h-6 w-6 mb-2" />
                      New Payment
                    </Button>
                    <Button
                      className="h-20 flex-col"
                      onClick={() => router.push("/accounting/reports")}
                    >
                      <BarChart3 className="h-6 w-6 mb-2" />
                      Generate Reports
                    </Button>
                  </div>
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
                      onClick={() =>
                        router.push("/accounting/transactions/new")
                      }
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

          {activeTab === "reports" && reportData && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{reportData.report_type} Statement</CardTitle>
                    <CardDescription>
                      {new Date(reportData.from_date).toLocaleDateString()} -{" "}
                      {new Date(reportData.to_date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export Excel
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(reportData.data).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between items-center py-2 border-b"
                    >
                      <span className="font-medium">{key}</span>
                      <span className="font-bold text-lg">
                        {formatCurrency(value as number)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
