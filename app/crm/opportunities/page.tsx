// app/crm/opportunities/page.tsx
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
  TrendingUp,
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
  MapPin,
  Percent,
} from "lucide-react";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { type VariantProps } from "class-variance-authority";
import { useRouter } from "next/navigation";
import { Opportunity } from "@/types/crm";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

interface DashboardFilters {
  status: string;
  sales_stage: string;
  territory: string;
  date_from: string;
  date_to: string;
}

export default function OpportunitiesPage() {
  const { push: toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [filters, setFilters] = useState<DashboardFilters>({
    status: "all",
    sales_stage: "all",
    territory: "all",
    date_from: "",
    date_to: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [options, setOptions] = useState<{
    territories: Array<{ name: string; territory_name: string }>;
    salesStages: Array<{ name: string; stage_name: string }>;
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

        const response = await fetch(`/api/crm/opportunities?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch opportunities");
        }

        const data = await response.json();
        setOpportunities(data.data.opportunities);
      } catch (error: unknown) {
        toast({
          variant: "error",
          title: "Error",
          description: `Failed to load opportunities: ${(error as Error).message}`,
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
          territories: data.data.options.territories,
          salesStages: data.data.options.salesStages,
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
      case "open":
        return "bg-blue-100 text-blue-800";
      case "quoted":
        return "bg-yellow-100 text-yellow-800";
      case "lost":
        return "bg-red-100 text-red-800";
      case "closed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStageColor = (stage: string) => {
    const stages = ["Qualification", "Proposal", "Negotiation", "Closing"];
    const index = stages.indexOf(stage);
    if (index >= 0) {
      const colors = ["bg-purple-100 text-purple-800", "bg-blue-100 text-blue-800", "bg-orange-100 text-orange-800", "bg-green-100 text-green-800"];
      return colors[index] || "bg-gray-100 text-gray-800";
    }
    return "bg-gray-100 text-gray-800";
  };

  const filteredOpportunities = opportunities.filter((opportunity) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        opportunity.name.toLowerCase().includes(query) ||
        opportunity.customer.toLowerCase().includes(query) ||
        opportunity.lead.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Calculate total opportunity value
  const totalValue = opportunities.reduce((sum, opp) => sum + opp.opportunity_amount, 0);
  const openValue = opportunities
    .filter(opp => opp.status === "Open")
    .reduce((sum, opp) => sum + opp.opportunity_amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Opportunities</h1>
            <p className="text-muted-foreground">
              Track sales opportunities and pipeline
            </p>
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
            <TrendingUp className="w-8 h-8 mr-3 text-primary" />
            Opportunities
          </h1>
          <p className="text-muted-foreground">
            Track sales opportunities and pipeline
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
          <Button onClick={() => router.push("/crm/opportunities/new")}>
            <Plus className="w-4 h-4 mr-2" />
            New Opportunity
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Pipeline Value
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
                  Open Opportunities Value
                </p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat("en-ET", {
                    style: "currency",
                    currency: "ETB",
                    minimumFractionDigits: 2,
                  }).format(openValue)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <TrendingUp className="w-6 h-6" />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Quoted">Quoted</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sales_stage">Sales Stage</Label>
              <Select
                value={filters.sales_stage}
                onValueChange={(value) => handleFilterChange("sales_stage", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {options?.salesStages.map(stage => (
                    <SelectItem key={stage.name} value={stage.name}>
                      {stage.stage_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="territory">Territory</Label>
              <Select
                value={filters.territory}
                onValueChange={(value) => handleFilterChange("territory", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Territories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Territories</SelectItem>
                  {options?.territories.map(territory => (
                    <SelectItem key={territory.name} value={territory.name}>
                      {territory.territory_name}
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
            placeholder="Search opportunities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full max-w-md"
          />
        </div>
      </div>

      {/* Opportunities Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Opportunities</CardTitle>
              <CardDescription>
                {filteredOpportunities.length} opportunity records found
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
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Customer/Lead</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Probability</TableHead>
                  <TableHead>Expected Closing</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOpportunities.map((opportunity) => (
                  <TableRow key={opportunity.name}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{opportunity.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {opportunity.opportunity_type}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {opportunity.customer || opportunity.lead}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {opportunity.customer ? "Customer" : "Lead"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStageColor(opportunity.sales_stage)}>
                        {opportunity.sales_stage}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Percent className="w-4 h-4 mr-1 text-muted-foreground" />
                        {opportunity.probability}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                        {opportunity.expected_closing_date
                          ? new Date(opportunity.expected_closing_date).toLocaleDateString()
                          : "Not set"}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {new Intl.NumberFormat("en-ET", {
                        style: "currency",
                        currency: "ETB",
                        minimumFractionDigits: 2,
                      }).format(opportunity.opportunity_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(opportunity.status)}>
                        {opportunity.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/crm/opportunities/${opportunity.name}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/crm/opportunities/${opportunity.name}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredOpportunities.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No opportunity records found</p>
              <Button
                className="mt-4"
                onClick={() => router.push("/crm/opportunities/new")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Opportunity
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}