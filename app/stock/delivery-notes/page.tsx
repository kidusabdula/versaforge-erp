// app/stock/delivery-notes/page.tsx
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
  TruckIcon,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  FileText,
} from "lucide-react";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { type VariantProps } from "class-variance-authority";
import { useRouter } from "next/navigation";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

interface DeliveryNote {
  name: string;
  customer: string;
  customer_name?: string;
  posting_date: string;
  posting_time?: string;
  set_warehouse?: string;
  territory?: string;
  docstatus: 0 | 1 | 2;
  company: string;
  modified?: string;
}

interface DeliveryNotesApiResponse {
  success: boolean;
  data: {
    deliveryNotes: DeliveryNote[];
  };
  message?: string;
}

interface Filters {
  customer: string;
  posting_date_from: string;
  posting_date_to: string;
  docstatus: string;
  territory: string;
}

interface ApiError extends Error {
  message: string;
}

const fetcher = async (url: string): Promise<DeliveryNotesApiResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.details || "Failed to fetch delivery notes");
  }
  return response.json();
};

export default function DeliveryNotesPage() {
  const { push: toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [filters, setFilters] = useState<Filters>({
    customer: "all",
    posting_date_from: "",
    posting_date_to: "",
    docstatus: "all",
    territory: "all",
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

        const response = await fetch(`/api/delivery-notes?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch delivery notes");
        }

        const data = await response.json();
        setDeliveryNotes(data.data.deliveryNotes);
      } catch (error: unknown) {
        toast({
          variant: "error",
          title: "Error",
          description: `Failed to load delivery notes: ${(error as Error).message}`,
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

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchData();
  };

  const handleRefresh = () => {
    fetchData(false);
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

  const filteredDeliveryNotes = deliveryNotes.filter((note) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        note.name.toLowerCase().includes(query) ||
        note.customer.toLowerCase().includes(query) ||
        (note.customer_name && note.customer_name.toLowerCase().includes(query)) ||
        (note.set_warehouse && note.set_warehouse.toLowerCase().includes(query)) ||
        (note.territory && note.territory.toLowerCase().includes(query))
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Delivery Notes</h1>
            <p className="text-muted-foreground">
              Manage delivery notes and transactions
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
            <TruckIcon className="w-8 h-8 mr-3 text-primary" />
            Delivery Notes
          </h1>
          <p className="text-muted-foreground">
            Manage delivery notes and transactions
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
          <Button onClick={() => router.push("/stock/delivery-notes/add-delivery-note")}>
            <Plus className="w-4 h-4 mr-2" />
            New Delivery Note
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="customer">Customer</Label>
              <Input
                id="customer"
                value={filters.customer !== "all" ? filters.customer : ""}
                onChange={(e) => handleFilterChange("customer", e.target.value)}
                placeholder="Filter by customer"
              />
            </div>

            <div>
              <Label htmlFor="docstatus">Status</Label>
              <Select
                value={filters.docstatus}
                onValueChange={(value) => handleFilterChange("docstatus", value)}
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
              <Input
                type="date"
                value={filters.posting_date_from}
                onChange={(e) =>
                  handleFilterChange("posting_date_from", e.target.value)
                }
              />
            </div>

            <div>
              <Label htmlFor="posting_date_to">To Date</Label>
              <Input
                type="date"
                value={filters.posting_date_to}
                onChange={(e) => handleFilterChange("posting_date_to", e.target.value)}
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
            placeholder="Search delivery notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full max-w-md"
          />
        </div>
      </div>

      {/* Delivery Notes Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Delivery Notes</CardTitle>
              <CardDescription>
                {filteredDeliveryNotes.length} delivery notes found
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
                  <TableHead>Note #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Territory</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeliveryNotes.map((note) => (
                  <TableRow key={note.name}>
                    <TableCell className="font-mono text-sm">
                      {note.name}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{note.customer}</p>
                        {note.customer_name && (
                          <p className="text-sm text-muted-foreground">
                            {note.customer_name}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(note.posting_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {note.set_warehouse || "-"}
                    </TableCell>
                    <TableCell>
                      {note.territory || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(note.docstatus)}>
                        {getStatusText(note.docstatus)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/stock/delivery-notes/${note.name}`)
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/stock/delivery-notes/${note.name}/edit`)
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

          {filteredDeliveryNotes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <TruckIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No delivery notes found</p>
              <Button
                className="mt-4"
                onClick={() => router.push("/stock/delivery-notes/add-delivery-note")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Delivery Note
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}