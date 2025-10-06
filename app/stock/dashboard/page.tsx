"use client";

import { useState, useEffect, useCallback } from "react";
// import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  BarChart3, 
  Package, 
  Warehouse, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw,
  Filter,
  Download
} from "lucide-react";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { type VariantProps } from "class-variance-authority";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

interface StockSummary {
  total_items: number;
  total_warehouses: number;
  total_stock_value: number;
  low_stock_items: number;
  out_of_stock_items: number;
  recent_transactions: number;
}

interface StockBalance {
  item_code: string;
  item_name: string;
  warehouse: string;
  actual_qty: number;
  reserved_qty: number;
  ordered_qty: number;
  projected_qty: number;
  valuation_rate: number;
  stock_value: number;
  stock_uom: string;
  item_group: string;
}

interface StockLedgerEntry {
  name: string;
  item_code: string;
  item_name: string;
  warehouse: string;
  posting_date: string;
  posting_time: string;
  voucher_type: string;
  voucher_no: string;
  actual_qty: number;
  qty_after_transaction: number;
  stock_uom: string;
}

interface DashboardFilters {
  warehouse: string;
  item_group: string;
  date_from: string;
  date_to: string;
  show_low_stock: boolean;
  show_out_of_stock: boolean;
}

export default function StockDashboard() {
  const { push: toast } = useToast();
//   const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [stockBalance, setStockBalance] = useState<StockBalance[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<StockLedgerEntry[]>([]);
  const [filters, setFilters] = useState<DashboardFilters>({
    warehouse: "all",
    item_group: "all",
    date_from: "",
    date_to: "",
    show_low_stock: false,
    show_out_of_stock: false
  });
  const [activeTab, setActiveTab] = useState<"overview" | "balance" | "ledger">("overview");

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setRefreshing(true);

    try {
      // Build query params from filters
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all" && value !== false) {
          params.set(key, value.toString());
        }
      });

      // Fetch all data in parallel
      const [summaryRes, balanceRes, ledgerRes] = await Promise.all([
        fetch('/api/stock-summary'),
        fetch(`/api/stock-balance?${params}`),
        fetch(`/api/stock-ledger?${params}&limit=10`)
      ]);

      if (!summaryRes.ok || !balanceRes.ok || !ledgerRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const [summaryData, balanceData, ledgerData] = await Promise.all([
        summaryRes.json(),
        balanceRes.json(),
        ledgerRes.json()
      ]);

      setSummary(summaryData.data.summary);
      setStockBalance(balanceData.data.stockBalance);
      setLedgerEntries(ledgerData.data.ledgerEntries);
    } catch (error: unknown) { // Change error type to unknown
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to load dashboard data: ${(error as Error).message}`
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, toast]); // Add fetchData to dependency array

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Add fetchData to dependency array

  const handleFilterChange = (key: keyof DashboardFilters, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchData();
  };

  const handleRefresh = () => {
    fetchData(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return "out-of-stock";
    if (quantity < 10) return "low-stock";
    return "in-stock";
  };

  const StockCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend, 
    className = "" 
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType; // Change type from any to React.ElementType
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
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            <div className={`p-3 rounded-full ${trend === 'up' ? 'bg-green-100 text-green-600' : trend === 'down' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
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
            <h1 className="text-3xl font-bold">Stock Dashboard</h1>
            <p className="text-muted-foreground">Real-time inventory overview</p>
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
            Stock Dashboard
          </h1>
          <p className="text-muted-foreground">Real-time inventory overview and analytics</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          disabled={refreshing}
          className="flex items-center"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
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
              <Label htmlFor="warehouse">Warehouse</Label>
              <Select
                value={filters.warehouse}
                onValueChange={(value) => handleFilterChange("warehouse", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Warehouses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Warehouses</SelectItem>
                  <SelectItem value="main">Main Warehouse</SelectItem>
                  <SelectItem value="production">Production Warehouse</SelectItem>
                  <SelectItem value="finished-goods">Finished Goods</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="item_group">Item Group</Label>
              <Select
                value={filters.item_group}
                onValueChange={(value) => handleFilterChange("item_group", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  <SelectItem value="raw-material">Raw Materials</SelectItem>
                  <SelectItem value="finished-goods">Finished Goods</SelectItem>
                  <SelectItem value="consumables">Consumables</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="date_from">From Date</Label>
              <Input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange("date_from", e.target.value)}
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
          
          <div className="flex space-x-4 mt-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="low-stock"
                checked={filters.show_low_stock}
                onChange={(e) => handleFilterChange("show_low_stock", e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="low-stock">Show Low Stock Only</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="out-of-stock"
                checked={filters.show_out_of_stock}
                onChange={(e) => handleFilterChange("show_out_of_stock", e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="out-of-stock">Show Out of Stock Only</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StockCard
          title="Total Items"
          value={formatNumber(summary?.total_items || 0)}
          icon={Package}
          trend="up"
        />
        
        <StockCard
          title="Total Warehouses"
          value={formatNumber(summary?.total_warehouses || 0)}
          icon={Warehouse}
          trend="neutral"
        />
        
        <StockCard
          title="Total Stock Value"
          value={formatCurrency(summary?.total_stock_value || 0)}
          icon={TrendingUp}
          trend="up"
        />
        
        <StockCard
          title="Attention Needed"
          value={formatNumber((summary?.low_stock_items || 0) + (summary?.out_of_stock_items || 0))}
          subtitle={`${summary?.low_stock_items} low, ${summary?.out_of_stock_items} out`}
          icon={AlertTriangle}
          trend="down"
          className="border-orange-200 bg-orange-50"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 font-medium ${activeTab === "overview" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === "balance" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
          onClick={() => setActiveTab("balance")}
        >
          Stock Balance
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === "ledger" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
          onClick={() => setActiveTab("ledger")}
        >
          Recent Transactions
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
              {/* Low Stock Alert */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                    Low Stock Alert
                  </CardTitle>
                  <CardDescription>Items that need immediate attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Current Stock</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockBalance
                        .filter(item => getStockStatus(item.actual_qty) !== "in-stock")
                        .slice(0, 5)
                        .map((item) => (
                          <TableRow key={`${item.item_code}-${item.warehouse}`}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.item_name}</p>
                                <p className="text-sm text-muted-foreground">{item.item_code}</p>
                              </div>
                            </TableCell>
                            <TableCell>{item.warehouse}</TableCell>
                            <TableCell>
                              {formatNumber(item.actual_qty)} {item.stock_uom}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  (getStockStatus(item.actual_qty) === "out-of-stock"
                                    ? "destructive"
                                    : "warning") as BadgeVariant
                                }
                              >
                                {getStockStatus(item.actual_qty) === "out-of-stock"
                                  ? "Out of Stock"
                                  : "Low Stock"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Latest stock movements</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ledgerEntries.slice(0, 5).map((entry) => (
                        <TableRow key={entry.name}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{entry.item_name}</p>
                              <p className="text-sm text-muted-foreground">{entry.item_code}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{entry.voucher_type}</Badge>
                          </TableCell>
                          <TableCell
                            className={
                              entry.actual_qty > 0
                                ? "text-green-600 font-medium"
                                : "text-red-600 font-medium"
                            }
                          >
                            {entry.actual_qty > 0 ? "+" : ""}
                            {formatNumber(entry.actual_qty)} {entry.stock_uom}
                          </TableCell>
                          <TableCell>
                            {new Date(entry.posting_date).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "balance" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Stock Balance Report</CardTitle>
                    <CardDescription>Current inventory levels across all warehouses</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Code</TableHead>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Current Stock</TableHead>
                        <TableHead>Reserved</TableHead>
                        <TableHead>Ordered</TableHead>
                        <TableHead>Projected</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockBalance.map((item) => (
                        <TableRow key={`${item.item_code}-${item.warehouse}`}>
                          <TableCell className="font-mono text-sm">{item.item_code}</TableCell>
                          <TableCell className="font-medium">{item.item_name}</TableCell>
                          <TableCell>{item.warehouse}</TableCell>
                          <TableCell>
                            {formatNumber(item.actual_qty)} {item.stock_uom}
                          </TableCell>
                          <TableCell className="text-orange-600">
                            {formatNumber(item.reserved_qty)} {item.stock_uom}
                          </TableCell>
                          <TableCell className="text-blue-600">
                            {formatNumber(item.ordered_qty)} {item.stock_uom}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatNumber(item.projected_qty)} {item.stock_uom}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(item.stock_value)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                (getStockStatus(item.actual_qty) === "out-of-stock"
                                  ? "destructive"
                                  : getStockStatus(item.actual_qty) === "low-stock"
                                  ? "warning"
                                  : "default") as BadgeVariant
                              }
                            >
                              {getStockStatus(item.actual_qty) === "out-of-stock"
                                ? "Out of Stock"
                                : getStockStatus(item.actual_qty) === "low-stock"
                                ? "Low Stock"
                                : "In Stock"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "ledger" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Stock Ledger Entries</CardTitle>
                    <CardDescription>Complete transaction history</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Transaction Type</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ledgerEntries.map((entry) => (
                        <TableRow key={entry.name}>
                          <TableCell>
                            <div>
                              <p>{new Date(entry.posting_date).toLocaleDateString()}</p>
                              <p className="text-sm text-muted-foreground">{entry.posting_time}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{entry.item_name}</p>
                              <p className="text-sm text-muted-foreground">{entry.item_code}</p>
                            </div>
                          </TableCell>
                          <TableCell>{entry.warehouse}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{entry.voucher_type}</Badge>
                          </TableCell>
                          <TableCell
                            className={
                              entry.actual_qty > 0
                                ? "text-green-600 font-medium"
                                : "text-red-600 font-medium"
                            }
                          >
                            {entry.actual_qty > 0 ? "+" : ""}
                            {formatNumber(entry.actual_qty)} {entry.stock_uom}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatNumber(entry.qty_after_transaction)} {entry.stock_uom}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}