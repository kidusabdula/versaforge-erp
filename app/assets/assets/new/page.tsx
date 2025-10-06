// app/assets/assets/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Save,
  ArrowLeft,
  Calendar,
  DollarSign,
  MapPin,
  User,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AssetOptions {
  categories: Array<{ name: string; category_name: string }>;
  locations: Array<{ name: string; location_name: string }>;
  assetStatuses: Array<{ value: string; label: string }>;
}

export default function NewAssetPage() {
  const { push: toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [options, setOptions] = useState<AssetOptions | null>(null);

  const [formData, setFormData] = useState({
    asset_name: "",
    asset_category: "",
    item_code: "",
    serial_no: "",
    purchase_date: new Date().toISOString().split("T")[0],
    purchase_value: 0,
    gross_purchase_amount: 0,
    location: "none",          // ← sentinel instead of ""
    status: "Available",
    warranty_expiry_date: "",
    assigned_to: "",
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
        setOptions(data.data.options);
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
    if (!formData.asset_name || !formData.asset_category || !formData.purchase_date || !formData.purchase_value) {
      toast({
        variant: "error",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    setLoading(true);
    try {
      // strip sentinel before sending to backend
      const payload = {
        ...formData,
        location: formData.location === "none" ? "" : formData.location,
      };

      const response = await fetch("/api/asset/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Failed to create asset");
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: `Asset ${data.data.asset.name} created successfully`,
      });

      router.push("/assets/assets");
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to create asset: ${(error as Error).message}`,
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

  /* ---------- helper ---------- */
  const formatCurrency = (amount: unknown) => {
    const num = Number(amount);
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 2,
    }).format(Number.isFinite(num) ? num : 0);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => router.push("/assets/assets")} className="mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Package className="w-8 h-8 mr-3 text-primary" />
              New Asset
            </h1>
            <p className="text-muted-foreground">Create a new asset</p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={loading} className="flex items-center">
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Creating..." : "Create Asset"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Enter the basic details for this asset</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="asset_name">Asset Name *</Label>
                  <Input
                    id="asset_name"
                    value={formData.asset_name}
                    onChange={(e) => handleInputChange("asset_name", e.target.value)}
                    placeholder="Enter asset name"
                  />
                </div>

                <div>
                  <Label htmlFor="asset_category">Asset Category *</Label>
                  <Select
                    value={formData.asset_category}
                    onValueChange={(value) => handleInputChange("asset_category", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {options?.categories.map((category) => (
                        <SelectItem key={category.name} value={category.name}>
                          {category.category_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="item_code">Item Code</Label>
                  <Input
                    id="item_code"
                    value={formData.item_code}
                    onChange={(e) => handleInputChange("item_code", e.target.value)}
                    placeholder="Enter item code"
                  />
                </div>

                <div>
                  <Label htmlFor="serial_no">Serial Number</Label>
                  <Input
                    id="serial_no"
                    value={formData.serial_no}
                    onChange={(e) => handleInputChange("serial_no", e.target.value)}
                    placeholder="Enter serial number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Select
                    value={formData.location}
                    onValueChange={(value) => handleInputChange("location", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No location</SelectItem>
                      {options?.locations.map((location) => (
                        <SelectItem key={location.name} value={location.name}>
                          {location.location_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {options?.assetStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="assigned_to">Assigned To</Label>
                <Input
                  id="assigned_to"
                  value={formData.assigned_to}
                  onChange={(e) => handleInputChange("assigned_to", e.target.value)}
                  placeholder="Enter assignee name"
                />
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Information</CardTitle>
              <CardDescription>Enter the financial details for this asset</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="purchase_date">Purchase Date *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <Input
                      id="purchase_date"
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => handleInputChange("purchase_date", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="warranty_expiry_date">Warranty Expiry Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <Input
                      id="warranty_expiry_date"
                      type="date"
                      value={formData.warranty_expiry_date}
                      onChange={(e) => handleInputChange("warranty_expiry_date", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="purchase_value">Purchase Value *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <Input
                      id="purchase_value"
                      type="number"
                      step="0.01"
                      value={formData.purchase_value}
                      onChange={(e) => handleInputChange("purchase_value", parseFloat(e.target.value))}
                      className="pl-10"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="gross_purchase_amount">Gross Purchase Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <Input
                      id="gross_purchase_amount"
                      type="number"
                      step="0.01"
                      value={formData.gross_purchase_amount}
                      onChange={(e) => handleInputChange("gross_purchase_amount", parseFloat(e.target.value))}
                      className="pl-10"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary */}
        <div>
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Asset Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Asset Name</span>
                  <span className="font-medium">{formData.asset_name || "Not set"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Category</span>
                  <span>{options?.categories.find((c) => c.name === formData.asset_category)?.category_name || "Not set"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Location</span>
                  <span>{options?.locations.find((l) => l.name === formData.location)?.location_name || "Not set"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <span>{options?.assetStatuses.find((s) => s.value === formData.status)?.label || "Not set"}</span>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between">
                  <span>Purchase Value</span>
                  <span>{formatCurrency(formData.purchase_value)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Purchase Date</span>
                  <span>{formData.purchase_date || "Not set"}</span>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Warranty Expiry:</span>
                  <span className="font-medium">{formData.warranty_expiry_date || "Not set"}</span>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading || !formData.asset_name || !formData.asset_category || !formData.purchase_date || !formData.purchase_value}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Creating..." : "Create Asset"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}