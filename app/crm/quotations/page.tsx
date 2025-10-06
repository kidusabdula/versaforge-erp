// app/crm/quotations/page.tsx
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
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Users,
  AlertTriangle,
} from "lucide-react";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { type VariantProps } from "class-variance-authority";
import { useRouter } from "next/navigation";
import { Quotation } from "@/types/crm";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

interface DashboardFilters {
  customer: string;
  status: string;
  date_from: string;
  date_to: string;
}

export default function QuotationsPage() {
  const { push: toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [filters, setFilters] = useState<DashboardFilters>({
    customer: "all",
    status: "all",
    date_from: "",
    date_to: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [options, setOptions] = useState<{
    customers: Array<{ name: string; customer_name: string }>;
  } | null>(null);

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

        const response = await fetch(`/api/crm/quotations?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch quotations");
        }

        const data = await response.json();
        setQuotations(data.data.quotations);
      } catch (error: unknown) {
        toast({
          variant: "error",
          title: "Error",
          description: `Failed to load quotations: ${(error as Error).message}`,
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filters, toast]
  );

  const fetchOptions = useCallback(async () => {
    try {
      const response = await fetch('/api/crm/options');
      if (response.ok) {
        const data = await response.json();
        setOptions({
          customers: data.data.options.customers,
        });
      }
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to load options: ${(error as Error).message}`,
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchOptions();
    fetchData();
  }, [fetchData, fetchOptions]);

  const handleFilterChange = (key: keyof DashboardFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchData();
  };

  const handleRefresh = () => {
    fetchData(false);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "lost":
        return "bg-red-100 text-red-800";
      case "expired":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredQuotations = quotations.filter((quotation) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        quotation.name.toLowerCase().includes(query) ||
        quotation.customer.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Calculate total quotation value
  const totalValue = quotations.reduce((sum, quote) => sum + quote.total, 0);
  const pendingValue = quotations
    .filter(quote => quote.status === "Submitted")
    .reduce((sum, quote) => sum + quote.total, 0);
    
  // Check for expired quotations
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiredQuotations = quotations.filter(quote => 
    quote.status === "Submitted" && new Date(quote.valid_till) < today
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Quotations</h1>
            <p className="text-muted-foreground">
              Manage price quotes for customers
            </p>
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[...Array(3)].map((_, i) => (
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
            <FileText className="w-8 h-8 mr-3 text-primary" />
            Quotations
          </h1>
          <p className="text-muted-foreground">
            Manage price quotes for customers
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
          <Button onClick={() => router.push("/crm/quotations/new")}>
            <Plus className="w-4 h-4 mr-2" />
            New Quotation
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Quotations Value
                </p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat("en-ET", {
                    style: "currency",
                    currency: "ETB",
                    minimumFractionDigits: 2,
                  }).format(totalValue)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pending Quotations
                </p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat("en-ET", {
                    style: "currency",
                    currency: "ETB",
                    minimumFractionDigits: 2,
                  }).format(pendingValue)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {expiredQuotations.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-800">
                    Expired Quotations
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {expiredQuotations.length}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="customer">Customer</Label>
              <Select
                value={filters.customer}
                onValueChange={(value) => handleFilterChange("customer", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {options?.customers.map(customer => (
                    <SelectItem key={customer.name} value={customer.name}>
                      {customer.customer_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
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
            placeholder="Search quotations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full max-w-md"
          />
        </div>
      </div>

      {/* Quotations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quotations</CardTitle>
              <CardDescription>
                {filteredQuotations.length} quotation records found
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
                  <TableHead>Quotation #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Valid Till</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.map((quotation) => {
                  const isExpired = quotation.status === "Submitted" && new Date(quotation.valid_till) < today;
                  
                  return (
                    <TableRow key={quotation.name} className={isExpired ? "bg-orange-50" : ""}>
                      <TableCell className="font-mono text-sm">
                        {quotation.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                          {quotation.customer}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(quotation.transaction_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                          {new Date(quotation.valid_till).toLocaleDateString()}
                          {isExpired && (
                            <Badge className="ml-2 bg-orange-100 text-orange-800">Expired</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {new Intl.NumberFormat("en-ET", {
                          style: "currency",
                          currency: "ETB",
                          minimumFractionDigits: 2,
                        }).format(quotation.total)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(quotation.status)}>
                          {quotation.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/crm/quotations/${quotation.name}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/crm/quotations/${quotation.name}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredQuotations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No quotation records found</p>
              <Button
                className="mt-4"
                onClick={() => router.push("/crm/quotations/new")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Quotation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}