// app/assets/value-adjustments/page.tsx
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
  DollarSign,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

interface AssetValueAdjustment {
  name: string;
  asset: string;
  adjustment_date: string;
  current_value: number;
  new_value: number;
  reason: string;
  approved_by: string;
  creation: string;
  modified: string;
  owner: string;
}

interface AssetOptions {
  assets: Array<{ name: string; asset_name: string }>;
}

interface DashboardFilters {
  asset: string;
  date_from: string;
  date_to: string;
}

export default function ValueAdjustmentsPage() {
  const { push: toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adjustments, setAdjustments] = useState<AssetValueAdjustment[]>([]);
  const [options, setOptions] = useState<AssetOptions | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({
    asset: "all",
    date_from: "",
    date_to: "",
  });
  const [searchQuery, setSearchQuery] = useState("");

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

        const response = await fetch(`/api/asset/value-adjustments?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch value adjustment records");
        }

        const data = await response.json();
        setAdjustments(data.data.adjustments);
      } catch (error: unknown) {
        toast({
          variant: "error",
          title: "Error",
          description: `Failed to load value adjustment records: ${(error as Error).message}`,
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
      const response = await fetch('/api/asset/options');
      if (response.ok) {
        const data = await response.json();
        setOptions({
          assets: data.data.options.categories || [], // Using categories as assets for now
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const filteredAdjustments = adjustments.filter((record) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        record.name.toLowerCase().includes(query) ||
        record.asset.toLowerCase().includes(query) ||
        record.reason.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Calculate total adjustment amount
  const totalAdjustment = adjustments.reduce((sum, record) => sum + (record.new_value - record.current_value), 0);
  const appreciationCount = adjustments.filter(record => record.new_value > record.current_value).length;
  const depreciationCount = adjustments.filter(record => record.new_value < record.current_value).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Asset Value Adjustments</h1>
            <p className="text-muted-foreground">
              Track and manage asset value adjustments
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
            <DollarSign className="w-8 h-8 mr-3 text-primary" />
            Asset Value Adjustments
          </h1>
          <p className="text-muted-foreground">
            Track and manage asset value adjustments
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
          <Button onClick={() => router.push("/assets/value-adjustments/new")}>
            <Plus className="w-4 h-4 mr-2" />
            New Adjustment
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
                  Total Adjustment
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalAdjustment)}
                </p>
              </div>
              <div className={`p-3 rounded-full ${
                totalAdjustment >= 0
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}>
                {totalAdjustment >= 0 ? (
                  <TrendingUp className="w-6 h-6" />
                ) : (
                  <TrendingDown className="w-6 h-6" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Appreciations
                </p>
                <p className="text-2xl font-bold">{appreciationCount}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Depreciations
                </p>
                <p className="text-2xl font-bold">{depreciationCount}</p>
              </div>
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                <TrendingDown className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
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
              <Label htmlFor="asset">Asset</Label>
              <Select
                value={filters.asset}
                onValueChange={(value) => handleFilterChange("asset", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Assets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assets</SelectItem>
                  {options?.assets?.map(asset => (
                    <SelectItem key={asset.name} value={asset.name}>
                      {asset.asset_name}
                    </SelectItem>
                  ))}
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
            placeholder="Search adjustment records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full max-w-md"
          />
        </div>
      </div>

      {/* Adjustments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Value Adjustment Records</CardTitle>
              <CardDescription>
                {filteredAdjustments.length} adjustment records found
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
                  <TableHead>Adjustment ID</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Adjustment Date</TableHead>
                  <TableHead>Previous Value</TableHead>
                  <TableHead>New Value</TableHead>
                  <TableHead>Difference</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdjustments.map((record) => {
                  const difference = record.new_value - record.current_value;
                  
                  return (
                    <TableRow key={record.name}>
                      <TableCell className="font-mono text-sm">{record.name}</TableCell>
                      <TableCell>{record.asset}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                          {new Date(record.adjustment_date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(record.current_value)}</TableCell>
                      <TableCell>{formatCurrency(record.new_value)}</TableCell>
                      <TableCell>
                        <Badge variant={difference >= 0 ? 'default' : 'destructive'}>
                          {formatCurrency(difference)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{record.reason}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/assets/value-adjustments/${record.name}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/assets/value-adjustments/${record.name}/edit`)}
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

          {filteredAdjustments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No value adjustment records found</p>
              <Button
                className="mt-4"
                onClick={() => router.push("/assets/value-adjustments/new")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Adjustment Record
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}