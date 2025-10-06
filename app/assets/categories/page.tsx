// app/assets/categories/page.tsx
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
  Folder,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

interface AssetCategory {
  name: string;
  asset_category_name: string;
  company: string;
  parent_category: string;
  is_group: number;
  creation: string;
  modified: string;
  owner: string;
  accounts: any[];
}

interface AssetOptions {
  categories: Array<{ name: string; category_name: string }>;
}

interface DashboardFilters {
  parent_category: string;
  is_group: string;
}

export default function CategoriesPage() {
  const { push: toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [options, setOptions] = useState<AssetOptions | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({
    parent_category: "all",
    is_group: "all",
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

        const response = await fetch(`/api/asset/categories?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }

        const data = await response.json();
        setCategories(data.data.categories);
      } catch (error: unknown) {
        toast({
          variant: "error",
          title: "Error",
          description: `Failed to load categories: ${(error as Error).message}`,
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
          categories: data.data.options.categories || [],
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

  const handleDelete = async (name: string) => {
    if (!confirm("Are you sure you want to delete this category?")) {
      return;
    }

    try {
      const response = await fetch(`/api/asset/categories/${name}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete category");
      }

      toast({
        title: "Success",
        description: "Category deleted successfully",
      });

      fetchData(false);
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to delete category: ${(error as Error).message}`,
      });
    }
  };

  const filteredCategories = categories.filter((category) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        category.name.toLowerCase().includes(query) ||
        category.asset_category_name.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Count categories by type
  const groupCount = categories.filter(category => category.is_group === 1).length;
  const itemCount = categories.filter(category => category.is_group === 0).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Asset Categories</h1>
            <p className="text-muted-foreground">
              Manage asset categories
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
            <Folder className="w-8 h-8 mr-3 text-primary" />
            Asset Categories
          </h1>
          <p className="text-muted-foreground">
            Manage asset categories
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
          <Button onClick={() => router.push("/assets/categories/new")}>
            <Plus className="w-4 h-4 mr-2" />
            New Category
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
                  Group Categories
                </p>
                <p className="text-2xl font-bold">{groupCount}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Folder className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Item Categories
                </p>
                <p className="text-2xl font-bold">{itemCount}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <Folder className="w-6 h-6" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="parent_category">Parent Category</Label>
              <Select
                value={filters.parent_category}
                onValueChange={(value) => handleFilterChange("parent_category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="none">No Parent</SelectItem>
                  {options?.categories?.map(category => (
                    <SelectItem key={category.name} value={category.name}>
                      {category.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="is_group">Type</Label>
              <Select
                value={filters.is_group}
                onValueChange={(value) => handleFilterChange("is_group", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="1">Group</SelectItem>
                  <SelectItem value="0">Item</SelectItem>
                </SelectContent>
              </Select>
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
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full max-w-md"
          />
        </div>
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Categories</CardTitle>
              <CardDescription>
                {filteredCategories.length} categories found
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
                  <TableHead>Category Name</TableHead>
                  <TableHead>Parent Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Created On</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.name}>
                    <TableCell className="font-medium">{category.asset_category_name}</TableCell>
                    <TableCell>
                      {category.parent_category ? (
                        <Badge variant="outline">{category.parent_category}</Badge>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={category.is_group === 1 ? "default" : "secondary"}>
                        {category.is_group === 1 ? "Group" : "Item"}
                      </Badge>
                    </TableCell>
                    <TableCell>{category.company}</TableCell>
                    <TableCell>{new Date(category.creation).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/assets/categories/${category.name}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/assets/categories/${category.name}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(category.name)}
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

          {filteredCategories.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No categories found</p>
              <Button
                className="mt-4"
                onClick={() => router.push("/assets/categories/new")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Category
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}