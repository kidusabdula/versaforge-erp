"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Wrench,
  Save,
  ArrowLeft,
  Calendar,
  DollarSign,
  Package,
  User,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AssetOptions {
  assets: Array<{ name: string; asset_name: string }>;
  maintenanceTypes: Array<{ name: string; type_name: string }>;
}

export default function NewMaintenanceForm() {
  const { push: toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const assetParam = searchParams.get("asset") || "";

  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [options, setOptions] = useState<AssetOptions | null>(null);

  const [formData, setFormData] = useState({
    asset: assetParam,
    maintenance_type: "",
    maintenance_date: new Date().toISOString().split("T")[0],
    description: "",
    cost: 0,
    next_maintenance_date: "",
    status: "Scheduled",
    maintenance_team: "",
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
          assets: data.data.options.categories, // Using categories as assets for now
          maintenanceTypes: data.data.options.maintenanceTypes,
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
    if (!formData.asset || !formData.maintenance_date) {
      toast({
        variant: "error",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/asset/maintenance/asset/${formData.asset}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.details || "Failed to create maintenance record"
        );
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: `Maintenance record ${data.data.maintenance.name} created successfully`,
      });

      router.push("/assets/maintenance");
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to create maintenance record: ${
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
            onClick={() => router.push("/assets/maintenance")}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Wrench className="w-8 h-8 mr-3 text-primary" />
              New Maintenance Record
            </h1>
            <p className="text-muted-foreground">
              Create a new maintenance record
            </p>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Creating..." : "Create Maintenance Record"}
        </Button>
      </div>

      {assetParam && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Package className="w-4 h-4 mr-2" />
              <div>
                <p className="font-medium">Creating maintenance record for:</p>
                <p className="text-sm text-muted-foreground">
                  Asset: {assetParam}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the basic details for this maintenance record
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="asset">Asset *</Label>
                  <Select
                    value={formData.asset}
                    onValueChange={(value) => handleInputChange("asset", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Asset */}
                      {options?.assets?.map(
                        (
                          asset // ← optional chain
                        ) => (
                          <SelectItem key={asset.name} value={asset.name}>
                            {asset.asset_name}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="maintenance_type">Maintenance Type</Label>
                  <Select
                    value={formData.maintenance_type}
                    onValueChange={(value) =>
                      handleInputChange("maintenance_type", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Maintenance Type */}
                      {options?.maintenanceTypes?.map(
                        (
                          type // ← optional chain
                        ) => (
                          <SelectItem key={type.name} value={type.name}>
                            {type.type_name}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maintenance_date">Maintenance Date *</Label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={20}
                    />
                    <Input
                      id="maintenance_date"
                      type="date"
                      value={formData.maintenance_date}
                      onChange={(e) =>
                        handleInputChange("maintenance_date", e.target.value)
                      }
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="next_maintenance_date">
                    Next Maintenance Date
                  </Label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={20}
                    />
                    <Input
                      id="next_maintenance_date"
                      type="date"
                      value={formData.next_maintenance_date}
                      onChange={(e) =>
                        handleInputChange(
                          "next_maintenance_date",
                          e.target.value
                        )
                      }
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      handleInputChange("status", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Scheduled">Scheduled</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="maintenance_team">Maintenance Team</Label>
                  <Input
                    id="maintenance_team"
                    value={formData.maintenance_team}
                    onChange={(e) =>
                      handleInputChange("maintenance_team", e.target.value)
                    }
                    placeholder="Enter team name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Enter maintenance description"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Information</CardTitle>
              <CardDescription>
                Enter the financial details for this maintenance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cost">Cost</Label>
                <div className="relative">
                  <DollarSign
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={20}
                  />
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) =>
                      handleInputChange("cost", parseFloat(e.target.value))
                    }
                    className="pl-10"
                    placeholder="0.00"
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
              <CardTitle>Maintenance Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Asset</span>
                  <span className="font-medium">
                    {options?.assets?.find((a) => a.name === formData.asset)
                      ?.asset_name || "Not set"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Type</span>
                  <span>
                    {options?.maintenanceTypes?.find(
                      (t) => t.name === formData.maintenance_type
                    )?.type_name || "Not set"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <span>{formData.status}</span>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between">
                  <span>Maintenance Date</span>
                  <span>{formData.maintenance_date || "Not set"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Next Maintenance</span>
                  <span>{formData.next_maintenance_date || "Not set"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cost</span>
                  <span>
                    {formData.cost
                      ? new Intl.NumberFormat("en-ET", {
                          style: "currency",
                          currency: "ETB",
                          minimumFractionDigits: 2,
                        }).format(formData.cost)
                      : "Not set"}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Maintenance Team:</span>
                  <span className="font-medium">
                    {formData.maintenance_team || "Not set"}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={
                  loading || !formData.asset || !formData.maintenance_date
                }
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Creating..." : "Create Maintenance Record"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
