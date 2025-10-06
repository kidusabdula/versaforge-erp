// app/assets/categories/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Folder,
  Save,
  ArrowLeft,
  Building,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AssetOptions {
  categories: Array<{ name: string; category_name: string }>;
}

export default function NewCategoryPage() {
  const { push: toast } = useToast();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [options, setOptions] = useState<AssetOptions | null>(null);

  const [formData, setFormData] = useState({
    category_name: "",
    parent_category: "none",
    is_group: 0,
    company: "Ma Beignet (Demo)",
  });

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    setOptionsLoading(true);
    try {
      const response = await fetch("/api/asset/options");
      if (response.ok) {
        const data = await response.json();
        setOptions({
          categories: data.data.options.categories || [],
        });
      }
    } catch (error) {
      toast({
        variant: "error",
        title: "Error",
        description: "Failed to load options",
      });
    } finally {
      setOptionsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.category_name) {
      toast({
        variant: "error",
        title: "Error",
        description: "Category name is required",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        parent_category: formData.parent_category === "none" ? "" : formData.parent_category,
      };

      const response = await fetch("/api/asset/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Failed to create category");
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: `Category ${data.data.category.name} created successfully`,
      });

      router.push("/assets/categories");
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to create category: ${
          (error as Error).message
        }`,
      });
    } finally {
      setLoading(false);
    }
  };

  if (optionsLoading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => router.push("/assets/categories")}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Folder className="w-8 h-8 mr-3 text-primary" />
              New Category
            </h1>
            <p className="text-muted-foreground">Create a new asset category</p>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Creating..." : "Create Category"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the basic details for this category
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="category_name">Category Name *</Label>
                <Input
                  id="category_name"
                  value={formData.category_name}
                  onChange={(e) => handleInputChange("category_name", e.target.value)}
                  placeholder="Enter category name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parent_category">Parent Category</Label>
                  <Select
                    value={formData.parent_category}
                    onValueChange={(value) => handleInputChange("parent_category", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No parent category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Parent</SelectItem>
                      {options?.categories?.map((category) => (
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
                    value={formData.is_group.toString()}
                    onValueChange={(value) => handleInputChange("is_group", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Item</SelectItem>
                      <SelectItem value="1">Group</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="company">Company</Label>
                <div className="relative">
                  <Building
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={20}
                  />
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => handleInputChange("company", e.target.value)}
                    className="pl-10"
                    placeholder="Enter company name"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary */}
        <div>
          {/* Summary Card */}
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Category Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Category Name</span>
                  <span className="font-medium">{formData.category_name || "Not set"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Parent Category</span>
                  <span>
                    {formData.parent_category === "none" 
                      ? "None" 
                      : options?.categories?.find(c => c.name === formData.parent_category)?.category_name || "Not set"
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Type</span>
                  <span>{formData.is_group === 1 ? "Group" : "Item"}</span>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between">
                  <span>Company</span>
                  <span>{formData.company}</span>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading || !formData.category_name}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Creating..." : "Create Category"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}