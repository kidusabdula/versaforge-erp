// app/assets/repairs/page.tsx
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
  Wrench,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Calendar,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

interface AssetRepair {
  name: string;
  asset: string;
  repair_type: string;
  repair_date: string;
  failure_date: string;
  description: string;
  cost: number;
  technician: string;
  status: string;
  creation: string;
  modified: string;
  owner: string;
  company: string;
  completion_date: string;
  actions_performed: string;
  downtime: string;
  repair_details: string;
}

interface AssetOptions {
  assets: Array<{ name: string; asset_name: string }>;
  repairTypes: Array<{ name: string; type_name: string }>;
}

interface DashboardFilters {
  asset: string;
  repair_type: string;
  status: string;
  date_from: string;
  date_to: string;
}

export default function RepairsPage() {
  const { push: toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [repairs, setRepairs] = useState<AssetRepair[]>([]);
  const [options, setOptions] = useState<AssetOptions | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({
    asset: "all",
    repair_type: "all",
    status: "all",
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

        const response = await fetch(`/api/asset/repairs?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch repair records");
        }

        const data = await response.json();
        setRepairs(data.data.repairs);
      } catch (error: unknown) {
        toast({
          variant: "error",
          title: "Error",
          description: `Failed to load repair records: ${(error as Error).message}`,
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
          repairTypes: data.data.options.repairTypes || [],
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

  const getStatusColor = (status?: string | null) => {
    if (!status) return "bg-gray-100 text-gray-800";
    switch (status.toLowerCase()) {
      case "reported":
        return "bg-red-100 text-red-800";
      case "in progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredRepairs = repairs.filter((record) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        record.name.toLowerCase().includes(query) ||
        record.asset.toLowerCase().includes(query) ||
        record.repair_type.toLowerCase().includes(query) ||
        record.description.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Calculate total repair cost
  const totalCost = repairs.reduce((sum, record) => sum + record.cost, 0);
  const inProgressCount = repairs.filter(record => record.status === "In Progress").length;
    
  // Check for repairs overdue
  const today = new Date();
  const overdueRepairs = repairs.filter(record => 
    record.status !== "Completed" && record.repair_date && new Date(record.repair_date) < today
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Asset Repairs</h1>
            <p className="text-muted-foreground">
              Track and manage asset repair activities
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
            <Wrench className="w-8 h-8 mr-3 text-primary" />
            Asset Repairs
          </h1>
          <p className="text-muted-foreground">
            Track and manage asset repair activities
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
          <Button onClick={() => router.push("/assets/repairs/new")}>
            <Plus className="w-4 h-4 mr-2" />
            New Repair
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
                  Total Repair Cost
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalCost)}
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
                  In Progress
                </p>
                <p className="text-2xl font-bold">{inProgressCount}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <Wrench className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {overdueRepairs.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Overdue Repairs
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {overdueRepairs.length}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-red-100 text-red-600">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              <Label htmlFor="repair_type">Repair Type</Label>
              <Select
                value={filters.repair_type}
                onValueChange={(value) => handleFilterChange("repair_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {options?.repairTypes?.map(type => (
                    <SelectItem key={type.name} value={type.name}>
                      {type.type_name}
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
                  <SelectItem value="Reported">Reported</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
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
            placeholder="Search repair records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full max-w-md"
          />
        </div>
      </div>

      {/* Repairs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Repair Records</CardTitle>
              <CardDescription>
                {filteredRepairs.length} repair records found
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
                  <TableHead>Repair ID</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Repair Date</TableHead>
                  <TableHead>Failure Date</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRepairs.map((record) => {
                  const isOverdue = record.status !== "Completed" && record.repair_date && new Date(record.repair_date) < today;
                  
                  return (
                    <TableRow key={record.name} className={isOverdue ? "bg-red-50" : ""}>
                      <TableCell className="font-mono text-sm">{record.name}</TableCell>
                      <TableCell>{record.asset}</TableCell>
                      <TableCell>{record.repair_type}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                          {record.repair_date ? new Date(record.repair_date).toLocaleDateString() : 'N/A'}
                          {isOverdue && (
                            <AlertTriangle className="w-4 h-4 ml-2 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                          {record.failure_date ? new Date(record.failure_date).toLocaleDateString() : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(record.cost)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(record.status)}>
                          {record.status ?? "N/A"}
                        </Badge>
                        {isOverdue && (
                          <Badge className="ml-2 bg-red-100 text-red-800">Overdue</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/assets/repairs/${record.name}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/assets/repairs/${record.name}/edit`)}
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

          {filteredRepairs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No repair records found</p>
              <Button
                className="mt-4"
                onClick={() => router.push("/assets/repairs/new")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Repair Record
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}