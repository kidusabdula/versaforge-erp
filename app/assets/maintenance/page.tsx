// app/assets/maintenance/page.tsx
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

/* ----------  TYPES  ---------- */
interface AssetMaintenance {
  name: string;
  asset: string;
  maintenance_type: string;
  maintenance_date: string;
  description: string;
  cost: number;
  next_maintenance_date: string;
  status: string;
  creation: string;
  modified: string;
  owner: string;
}
interface AssetOptions {
  assets: Array<{ name: string; asset_name: string }>;
  maintenanceTypes: Array<{ name: string; type_name: string }>;
}
interface DashboardFilters {
  asset: string;
  maintenance_type: string;
  status: string;
  date_from: string;
  date_to: string;
}

/* ----------  PAGE  ---------- */
export default function MaintenancePage() {
  const { push: toast } = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [maintenance, setMaintenance] = useState<AssetMaintenance[]>([]);
  const [options, setOptions] = useState<AssetOptions | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({
    asset: "all", // ← sentinel
    maintenance_type: "all",
    status: "all",
    date_from: "",
    date_to: "",
  });
  const [searchQuery, setSearchQuery] = useState("");

  /* ----------  DATA FETCHING  ---------- */
  const fetchData = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);
      setRefreshing(true);
      try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(
          ([k, v]) => v && v !== "all" && params.set(k, v)
        );
        const res = await fetch(`/api/asset/maintenance?${params}`);
        if (!res.ok) throw new Error("Failed to fetch maintenance records");
        const { data } = await res.json();
        setMaintenance(data.maintenance);
      } catch (e) {
        toast({
          variant: "error",
          title: "Error",
          description: `Failed to load maintenance records: ${
            (e as Error).message
          }`,
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
      const res = await fetch("/api/asset/options");
      if (!res.ok) return;
      const { data } = await res.json();
      setOptions({
        assets: data.options.assets || [], // ← fallback
        maintenanceTypes: data.options.maintenanceTypes || [],
      });
    } catch {
      toast({
        variant: "error",
        title: "Error",
        description: "Failed to load options",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchOptions();
    fetchData();
  }, [fetchData, fetchOptions]);

  /* ----------  HELPERS  ---------- */
  const handleFilterChange = (key: keyof DashboardFilters, value: string) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const applyFilters = () => fetchData();
  const handleRefresh = () => fetchData(false);

  const formatCurrency = (amount: unknown) => {
    const n = Number(amount);
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 2,
    }).format(Number.isFinite(n) ? n : 0);
  };

  const getStatusColor = (status?: string | null) => {
    if (!status) return "bg-gray-100 text-gray-800"; // ← handle undefined / null
    switch (status.toLowerCase()) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "in progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredMaintenance = maintenance.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.asset.toLowerCase().includes(q) ||
      r.maintenance_type.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
    );
  });

  /* ----------  SUMMARY CARDS  ---------- */
  const totalCost = maintenance.reduce((s, r) => s + r.cost, 0);
  const inProgressCount = maintenance.filter(
    (r) => r.status === "In Progress"
  ).length;
  const today = new Date();
  const sevenDays = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const dueSoon = maintenance.filter(
    (r) =>
      r.next_maintenance_date &&
      new Date(r.next_maintenance_date) <= sevenDays &&
      r.status !== "Completed"
  );
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v && v !== "all") params.set(k, v); // ← skip sentinel
  });

  /* ----------  RENDER  ---------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Asset Maintenance</h1>
            <p className="text-muted-foreground">
              Track and manage asset maintenance activities
            </p>
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
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
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Wrench className="w-8 h-8 text-primary" />
            Asset Maintenance
          </h1>
          <p className="text-muted-foreground">
            Track and manage asset maintenance activities
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={refreshing}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button onClick={() => router.push("/assets/maintenance/new")}>
            <Plus className="w-4 h-4 mr-2" />
            New Maintenance
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Maintenance Cost
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
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{inProgressCount}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <Wrench className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {dueSoon.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-800">
                    Maintenance Due Soon
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {dueSoon.length}
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
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
            <Button onClick={applyFilters} size="sm">
              Apply Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Asset */}
            <div>
              <Label htmlFor="asset">Asset</Label>
              <Select
                value={filters.asset}
                onValueChange={(v) => handleFilterChange("asset", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Assets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assets</SelectItem>{" "}
                  {/* ← real value */}
                  {options?.assets?.map((a) => (
                    <SelectItem key={a.name} value={a.name}>
                      {a.asset_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Maintenance Type */}
            {/* Maintenance Type */}
            <div>
              <Label htmlFor="maintenance_type">Maintenance Type</Label>
              <Select
                value={filters.maintenance_type}
                onValueChange={(v) => handleFilterChange("maintenance_type", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>{" "}
                  {/* ← real value */}
                  {options?.maintenanceTypes?.map((t) => (
                    <SelectItem key={t.name} value={t.name}>
                      {t.type_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(v) => handleFilterChange("status", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>{" "}
                  {/* ← real value */}
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Date From */}
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

            {/* Date To */}
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
            placeholder="Search maintenance records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full max-w-md"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Maintenance Records</CardTitle>
              <CardDescription>
                {filteredMaintenance.length} records found
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
                  <TableHead>Maintenance ID</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Next Maintenance</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaintenance.map((r) => {
                  const dueSoon =
                    r.next_maintenance_date &&
                    new Date(r.next_maintenance_date) <= sevenDays &&
                    r.status !== "Completed";
                  return (
                    <TableRow
                      key={r.name}
                      className={dueSoon ? "bg-orange-50" : ""}
                    >
                      <TableCell className="font-mono text-sm">
                        {r.name}
                      </TableCell>
                      <TableCell>{r.asset}</TableCell>
                      <TableCell>{r.maintenance_type}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {new Date(r.maintenance_date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {r.next_maintenance_date
                            ? new Date(
                                r.next_maintenance_date
                              ).toLocaleDateString()
                            : "N/A"}
                          {dueSoon && (
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(r.cost)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(r.status)}>
                          {r.status ?? "N/A"}
                        </Badge>
                        {dueSoon && (
                          <Badge className="ml-2 bg-orange-100 text-orange-800">
                            Due Soon
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/assets/maintenance/${r.name}`)
                            }
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/assets/maintenance/${r.name}/edit`)
                            }
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredMaintenance.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No maintenance records found</p>
              <Button
                className="mt-4"
                onClick={() => router.push("/assets/maintenance/new")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Maintenance Record
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
