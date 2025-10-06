// app/stock/item/page.tsx
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
} from "lucide-react";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { type VariantProps } from "class-variance-authority";
import { useRouter } from "next/navigation";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

interface Item {
  name: string;
  item_code: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  is_stock_item: number;
  brand?: string;
  disabled?: number;
  modified?: string;
}

interface ItemsApiResponse {
  success: boolean;
  data: {
    items: Item[];
  };
  message?: string;
}

interface Filters {
  name: string;
  group: string;
  status: string;
  id: string;
}

interface FormData {
  item_name: string;
  item_group: string;
  stock_uom: string;
  disabled: boolean;
}

interface ApiError extends Error {
  message: string;
}

const fetcher = async (url: string): Promise<ItemsApiResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.details || "Failed to fetch items");
  }
  return response.json();
};

export default function ItemPage() {
  const { push: toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [filters, setFilters] = useState<Filters>({
    name: "",
    group: "all",
    status: "all",
    id: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<FormData>({
    item_name: "",
    item_group: "",
    stock_uom: "",
    disabled: false,
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);
      setRefreshing(true);

      try {
        const response = await fetch(`/api/items`);
        if (!response.ok) {
          throw new Error("Failed to fetch items");
        }

        const data = await response.json();
        setItems(data.data.items);
      } catch (error: unknown) {
        toast({
          variant: "error",
          title: "Error",
          description: `Failed to load items: ${(error as Error).message}`,
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const itemGroups = [...new Set(items.map((item) => item.item_group).filter(Boolean))];

  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    fetchData();
  };

  const handleRefresh = () => {
    fetchData(false);
  };

  const getStatusColor = (disabled?: number) => {
    return disabled ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800";
  };

  const getStatusText = (disabled?: number) => {
    return disabled ? "Disabled" : "Enabled";
  };

  const filteredItems = items.filter(
    (item) =>
      (filters.name
        ? item.item_name.toLowerCase().includes(filters.name.toLowerCase())
        : true) &&
      (filters.group !== "all" ? item.item_group === filters.group : true) &&
      (filters.status !== "all"
        ? filters.status === "Enabled"
          ? !item.disabled
          : item.disabled
        : true) &&
      (filters.id
        ? item.name.toLowerCase().includes(filters.id.toLowerCase())
        : true) &&
      (searchQuery
        ? item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.item_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase()))
        : true)
  );

  // Form handlers
  const handleFormChange = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof FormData
  ) => {
    handleFormChange(field, e.target.value);
  };

  const handleSelectChange = (field: keyof FormData, value: string) => {
    if (field === "disabled") {
      handleFormChange(field, value === "Disabled");
    } else {
      handleFormChange(field, value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.item_name || !form.item_group || !form.stock_uom) {
      toast({
        variant: "error",
        title: "Error",
        description: "All fields except status are required.",
      });
      return;
    }
    setFormLoading(true);
    try {
      const payload = {
        item_name: form.item_name,
        item_group: form.item_group,
        stock_uom: form.stock_uom,
        disabled: form.disabled,
      };

      const url = editId ? `/api/items?name=${editId}` : "/api/items";
      const method = editId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.details || `Failed to ${editId ? "update" : "create"} item`
        );
      }

      toast({
        title: "Success",
        description: `Item ${editId ? "updated" : "added"} successfully.`,
      });

      fetchData();
      setForm({
        item_name: "",
        item_group: "",
        stock_uom: "",
        disabled: false,
      });
      setEditId(null);
      setIsFormOpen(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save item.";
      toast({ variant: "error", title: "Error", description: errorMessage });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (item: Item) => {
    setForm({
      item_name: item.item_name,
      item_group: item.item_group,
      stock_uom: item.stock_uom,
      disabled: Boolean(item.disabled),
    });
    setEditId(item.name);
    setIsFormOpen(true);
  };

  const handleDelete = async (name: string) => {
    try {
      const response = await fetch(`/api/items?name=${name}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Failed to delete item");
      }

      toast({ title: "Success", description: "Item deleted successfully." });
      fetchData();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete item.";
      toast({ variant: "error", title: "Error", description: errorMessage });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Items</h1>
            <p className="text-muted-foreground">
              Manage inventory items and stock
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
            Items
          </h1>
          <p className="text-muted-foreground">
            Manage inventory items and stock
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
          <Button onClick={() => router.push("/stock/item/add-item")}>
            <Plus className="w-4 h-4 mr-2" />
            New Item
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
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                placeholder="Filter by name"
                value={filters.name}
                onChange={(e) => handleFilterChange("name", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="group">Item Group</Label>
              <Select
                value={filters.group}
                onValueChange={(value) => handleFilterChange("group", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {itemGroups.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
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
                  <SelectItem value="Enabled">Enabled</SelectItem>
                  <SelectItem value="Disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="id">ID</Label>
              <Input
                id="id"
                placeholder="Filter by ID"
                value={filters.id}
                onChange={(e) => handleFilterChange("id", e.target.value)}
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
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full max-w-md"
          />
        </div>
      </div>

      {/* Add/Edit Item Form */}
      {isFormOpen && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editId ? "Edit Item" : "Add New Item"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="item_name">Item Name *</Label>
                  <Input
                    id="item_name"
                    placeholder="Enter item name"
                    value={form.item_name}
                    onChange={(e) => handleInputChange(e, "item_name")}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="item_group">Item Group *</Label>
                  <Select
                    value={form.item_group}
                    onValueChange={(value) =>
                      handleSelectChange("item_group", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Item Group" />
                    </SelectTrigger>
                    <SelectContent>
                      {itemGroups.map((group) => (
                        <SelectItem key={group} value={group}>
                          {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="stock_uom">Stock Unit of Measure *</Label>
                  <Input
                    id="stock_uom"
                    placeholder="e.g., Nos, Kg, Unit"
                    value={form.stock_uom}
                    onChange={(e) => handleInputChange(e, "stock_uom")}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={form.disabled ? "Disabled" : "Enabled"}
                    onValueChange={(value) =>
                      handleSelectChange("disabled", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Enabled">Enabled</SelectItem>
                      <SelectItem value="Disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditId(null);
                    setForm({
                      item_name: "",
                      item_group: "",
                      stock_uom: "",
                      disabled: false,
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading
                    ? "Processing..."
                    : editId
                    ? "Update Item"
                    : "Create Item"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Items Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inventory Items</CardTitle>
              <CardDescription>
                {filteredItems.length} items found
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
                  <TableHead>Item Code</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Item Group</TableHead>
                  <TableHead>UOM</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow
                    key={item.name}
                    className="cursor-pointer"
                    onClick={() => {
                      const encodedCode = encodeURIComponent(item.item_code);
                      router.push(`/stock/item/${encodedCode}`);
                    }}
                  >
                    <TableCell className="font-mono text-sm">
                      {item.item_code}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.item_name}
                    </TableCell>
                    <TableCell>{item.item_group}</TableCell>
                    <TableCell>{item.stock_uom}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(item.disabled)}>
                        {getStatusText(item.disabled)}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const encodedCode = encodeURIComponent(item.item_code);
                            router.push(`/stock/item/${encodedCode}`);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No items found</p>
              <Button
                className="mt-4"
                onClick={() => {
                  setIsFormOpen(true);
                  setEditId(null);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Item
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}