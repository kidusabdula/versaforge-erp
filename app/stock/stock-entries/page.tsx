// app/stock/stock-entries/page.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
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
  Package,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  FileText,
  ArrowRightIcon,
  MinusIcon,
  CalendarIcon,
} from "lucide-react";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { type VariantProps } from "class-variance-authority";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

interface StockEntry {
  name: string;
  stock_entry_type: string;
  posting_date: string;
  posting_time?: string;
  purpose: string;
  docstatus: 0 | 1 | 2;
  company: string;
  from_warehouse?: string;
  to_warehouse?: string;
  modified?: string;
}

interface StockEntriesApiResponse {
  success: boolean;
  data: {
    stockEntries: StockEntry[];
  };
  message?: string;
}

interface Filters {
  stock_entry_type: string;
  purpose: string;
  from_warehouse: string;
  to_warehouse: string;
  posting_date_from: string;
  posting_date_to: string;
  docstatus: string;
}

interface ApiError extends Error {
  message: string;
}

const fetcher = async (url: string): Promise<StockEntriesApiResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.details || "Failed to fetch stock entries");
  }
  return response.json();
};

export default function StockEntriesPage() {
  const { push: toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [filters, setFilters] = useState<Filters>({
    stock_entry_type: "all",
    purpose: "all",
    from_warehouse: "all",
    to_warehouse: "all",
    posting_date_from: "",
    posting_date_to: "",
    docstatus: "all",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("material-receipt");

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

        const response = await fetch(`/api/stock-entries?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch stock entries");
        }

        const data = await response.json();
        setStockEntries(data.data.stockEntries);
      } catch (error: unknown) {
        toast({
          variant: "error",
          title: "Error",
          description: `Failed to load stock entries: ${(error as Error).message}`,
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

  // Filter entries based on active tab
  const filteredEntries = stockEntries.filter((entry) => {
    if (activeTab === "material-receipt") {
      return entry.stock_entry_type === "Material Receipt";
    } else if (activeTab === "material-issue") {
      return entry.stock_entry_type === "Material Issue";
    } else if (activeTab === "manufacturing") {
      return entry.stock_entry_type === "Manufacture";
    }
    return true; // For "view-ledger" tab, show all entries
  });

  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    fetchData();
  };

  const handleRefresh = () => {
    fetchData(false);
  };

  const clearFilters = () => {
    setFilters({
      stock_entry_type: "all",
      purpose: "all",
      from_warehouse: "all",
      to_warehouse: "all",
      posting_date_from: "",
      posting_date_to: "",
      docstatus: "all",
    });
    fetchData();
    setShowFilters(false);
  };

  const getStatusColor = (docstatus: number) => {
    switch (docstatus) {
      case 0:
        return "bg-yellow-100 text-yellow-800";
      case 1:
        return "bg-green-100 text-green-800";
      case 2:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (docstatus: number) => {
    switch (docstatus) {
      case 0:
        return "Draft";
      case 1:
        return "Submitted";
      case 2:
        return "Cancelled";
      default:
        return "Unknown";
    }
  };

  const filteredStockEntries = filteredEntries.filter((entry) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        entry.name.toLowerCase().includes(query) ||
        entry.stock_entry_type.toLowerCase().includes(query) ||
        entry.purpose.toLowerCase().includes(query) ||
        (entry.from_warehouse && entry.from_warehouse.toLowerCase().includes(query)) ||
        (entry.to_warehouse && entry.to_warehouse.toLowerCase().includes(query))
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Stock Entries</h1>
            <p className="text-muted-foreground">
              Manage stock entries and transactions
            </p>
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-lg" />
          ))}
        </div>

        <Skeleton className="h-96 rounded-lg" />
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
            Stock Entries
          </h1>
          <p className="text-muted-foreground">
            Manage stock entries and transactions
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
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger
            value="material-receipt"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Material Receipt</span>
          </TabsTrigger>
          <TabsTrigger
            value="material-issue"
            className="flex items-center gap-2"
          >
            <MinusIcon className="w-4 h-4" />
            <span>Material Issue</span>
          </TabsTrigger>
          <TabsTrigger
            value="manufacturing"
            className="flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            <span>Manufacturing</span>
          </TabsTrigger>
          <TabsTrigger
            value="view-ledger"
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>View Ledger</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Content with Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mt-4"
          >
            <TabsContent value="material-receipt" className="mt-0">
              <div className="bg-muted/30 p-6 rounded-lg border border-border mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-medium">Material Receipt</h3>
                    <p className="text-sm text-muted-foreground">
                      Record incoming materials from suppliers or production returns
                    </p>
                  </div>
                  <Button
                    onClick={() =>
                      router.push("/stock/stock-entries/add-material-receipt")
                    }
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Material Receipt
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="material-issue" className="mt-0">
              <div className="bg-muted/30 p-6 rounded-lg border border-border mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-medium">Material Issue</h3>
                    <p className="text-sm text-muted-foreground">
                      Issue materials to production or other departments
                    </p>
                  </div>
                  <Button
                    onClick={() =>
                      router.push("/stock/stock-entries/add-material-issue")
                    }
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <MinusIcon className="w-4 h-4 mr-2" />
                    New Material Issue
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="manufacturing" className="mt-0">
              <div className="bg-muted/30 p-6 rounded-lg border border-border mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-medium">Manufacturing</h3>
                    <p className="text-sm text-muted-foreground">
                      Record finished goods from production
                    </p>
                  </div>
                  <Button
                    onClick={() =>
                      router.push("/stock/stock-entries/add-manufacture")
                    }
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    New Manufacturing Entry
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="view-ledger" className="mt-0">
              <div className="bg-muted/30 p-6 rounded-lg border border-border mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-medium">Stock Ledger</h3>
                    <p className="text-sm text-muted-foreground">
                      View all stock entries and transactions
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear
              </Button>
              <Button onClick={applyFilters} size="sm">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="stock_entry_type">Stock Entry Type</Label>
              <Select
                value={filters.stock_entry_type}
                onValueChange={(value) =>
                  handleFilterChange("stock_entry_type", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Material Receipt">
                    Material Receipt
                  </SelectItem>
                  <SelectItem value="Material Issue">Material Issue</SelectItem>
                  <SelectItem value="Material Transfer">
                    Material Transfer
                  </SelectItem>
                  <SelectItem value="Manufacture">Manufacture</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="purpose">Purpose</Label>
              <Select
                value={filters.purpose}
                onValueChange={(value) =>
                  handleFilterChange("purpose", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Purposes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Purposes</SelectItem>
                  <SelectItem value="Material Receipt">
                    Material Receipt
                  </SelectItem>
                  <SelectItem value="Material Issue">Material Issue</SelectItem>
                  <SelectItem value="Material Transfer">
                    Material Transfer
                  </SelectItem>
                  <SelectItem value="Manufacture">Manufacture</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="docstatus">Document Status</Label>
              <Select
                value={filters.docstatus}
                onValueChange={(value) =>
                  handleFilterChange("docstatus", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="0">Draft</SelectItem>
                  <SelectItem value="1">Submitted</SelectItem>
                  <SelectItem value="2">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="posting_date_from">From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.posting_date_from
                      ? format(new Date(filters.posting_date_from), "PPP")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      filters.posting_date_from
                        ? new Date(filters.posting_date_from)
                        : undefined
                    }
                    onSelect={(date: Date | undefined) =>
                      handleFilterChange(
                        "posting_date_from",
                        date ? date.toISOString().split("T")[0] : ""
                      )
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="posting_date_to">To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.posting_date_to
                      ? format(new Date(filters.posting_date_to), "PPP")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      filters.posting_date_to
                        ? new Date(filters.posting_date_to)
                        : undefined
                    }
                    onSelect={(date: Date | undefined) =>
                      handleFilterChange(
                        "posting_date_to",
                        date ? date.toISOString().split("T")[0] : ""
                      )
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={20}
          />
          <Input
            placeholder="Search stock entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full max-w-md"
          />
        </div>
      </div>

      {/* Stock Entries Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Stock Entries</CardTitle>
              <CardDescription>
                {filteredStockEntries.length} stock entries found
              </CardDescription>
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
                  <TableHead>Entry #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>From Warehouse</TableHead>
                  <TableHead>To Warehouse</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStockEntries.map((entry) => (
                  <TableRow key={entry.name}>
                    <TableCell className="font-mono text-sm">
                      {entry.name}
                    </TableCell>
                    <TableCell>{entry.stock_entry_type}</TableCell>
                    <TableCell>{entry.purpose}</TableCell>
                    <TableCell>
                      {new Date(entry.posting_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{entry.from_warehouse || "-"}</TableCell>
                    <TableCell>{entry.to_warehouse || "-"}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(entry.docstatus)}>
                        {getStatusText(entry.docstatus)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/stock/stock-entries/${entry.name}`)
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/stock/stock-entries/${entry.name}/edit`)
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredStockEntries.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No stock entries found</p>
              {activeTab === "material-receipt" && (
                <Button
                  className="mt-4"
                  onClick={() =>
                    router.push("/stock/stock-entries/add-material-receipt")
                  }
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Material Receipt
                </Button>
              )}
              {activeTab === "material-issue" && (
                <Button
                  className="mt-4"
                  onClick={() =>
                    router.push("/stock/stock-entries/add-material-issue")
                  }
                >
                  <MinusIcon className="w-4 h-4 mr-2" />
                  Create Material Issue
                </Button>
              )}
              {activeTab === "manufacturing" && (
                <Button
                  className="mt-4"
                  onClick={() =>
                    router.push("/stock/stock-entries/add-manufacture")
                  }
                >
                  <Package className="w-4 h-4 mr-2" />
                  Create Manufacturing Entry
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}