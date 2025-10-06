"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  DollarSign,
  Save,
  ArrowLeft,
  Calendar,
  Package,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AssetOptions {
  assets: Array<{ name: string; asset_name: string }>;
}

export default function NewValueAdjustmentForm() {
    const { push: toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const assetParam = searchParams.get("asset") || "";
    
    const [loading, setLoading] = useState(false);
    const [optionsLoading, setOptionsLoading] = useState(true);
    const [options, setOptions] = useState<AssetOptions | null>(null);
    const [currentAssetValue, setCurrentAssetValue] = useState<number>(0);
  
    const [formData, setFormData] = useState({
      asset: assetParam,
      adjustment_date: new Date().toISOString().split("T")[0],
      current_value: 0,
      new_value: 0,
      reason: "",
      approved_by: "",
    });
  
    useEffect(() => {
      fetchOptions();
    }, []);
  
    useEffect(() => {
      if (formData.asset) {
        fetchAssetValue();
      }
    }, [formData.asset]);
  
    const fetchOptions = async () => {
      setOptionsLoading(true);
      try {
        const response = await fetch("/api/asset/options");
        if (response.ok) {
          const data = await response.json();
          setOptions({
            assets: data.data.options.categories || [], // Using categories as assets for now
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
  
    const fetchAssetValue = async () => {
      if (!formData.asset) return;
      
      try {
        const response = await fetch(`/api/asset/assets/${formData.asset}`);
        if (response.ok) {
          const data = await response.json();
          const assetValue = data.data.asset.current_value;
          setCurrentAssetValue(assetValue);
          setFormData(prev => ({ ...prev, current_value: assetValue }));
        }
      } catch (error) {
        toast({
          variant: "error",
          title: "Error",
          description: "Failed to fetch asset value",
        });
      }
    };
  
    const handleInputChange = (field: string, value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    };
  
    const handleSubmit = async () => {
      if (!formData.asset || !formData.adjustment_date || !formData.new_value) {
        toast({
          variant: "error",
          title: "Error",
          description: "Please fill in all required fields",
        });
        return;
      }
  
      setLoading(true);
      try {
        const response = await fetch(`/api/asset/value-adjustments/asset/${formData.asset}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || "Failed to create value adjustment record");
        }
  
        const data = await response.json();
        toast({
          title: "Success",
          description: `Value adjustment record ${data.data.adjustment.name} created successfully`,
        });
  
        router.push("/assets/value-adjustments");
      } catch (error: unknown) {
        toast({
          variant: "error",
          title: "Error",
          description: `Failed to create value adjustment record: ${
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
  
    const difference = formData.new_value - formData.current_value;
    const isAppreciation = difference >= 0;
  
    return (
      <div className="min-h-screen bg-background p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => router.push("/assets/value-adjustments")}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <DollarSign className="w-8 h-8 mr-3 text-primary" />
                New Value Adjustment
              </h1>
              <p className="text-muted-foreground">Create a new value adjustment record</p>
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Creating..." : "Create Adjustment Record"}
          </Button>
        </div>
  
        {assetParam && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Package className="w-4 h-4 mr-2" />
                <div>
                  <p className="font-medium">Creating value adjustment for:</p>
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
                  Enter the basic details for this value adjustment
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
                        {options?.assets?.map((asset) => (
                          <SelectItem key={asset.name} value={asset.name}>
                            {asset.asset_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="adjustment_date">Adjustment Date *</Label>
                    <div className="relative">
                      <Calendar
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        size={20}
                      />
                      <Input
                        id="adjustment_date"
                        type="date"
                        value={formData.adjustment_date}
                        onChange={(e) => handleInputChange("adjustment_date", e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
  
                <div>
                  <Label htmlFor="approved_by">Approved By</Label>
                  <Input
                    id="approved_by"
                    value={formData.approved_by}
                    onChange={(e) => handleInputChange("approved_by", e.target.value)}
                    placeholder="Enter approver name"
                  />
                </div>
  
                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => handleInputChange("reason", e.target.value)}
                    placeholder="Enter reason for adjustment"
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
                  Enter the financial details for this adjustment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="current_value">Current Value</Label>
                    <div className="relative">
                      <DollarSign
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        size={20}
                      />
                      <Input
                        id="current_value"
                        type="number"
                        step="0.01"
                        value={formData.current_value}
                        onChange={(e) => handleInputChange("current_value", parseFloat(e.target.value))}
                        className="pl-10"
                        placeholder="0.00"
                        disabled
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Current asset value (auto-populated)
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="new_value">New Value *</Label>
                    <div className="relative">
                      <DollarSign
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        size={20}
                      />
                      <Input
                        id="new_value"
                        type="number"
                        step="0.01"
                        value={formData.new_value}
                        onChange={(e) => handleInputChange("new_value", parseFloat(e.target.value))}
                        className="pl-10"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
  
                {formData.new_value > 0 && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Difference:</span>
                      <div className="flex items-center">
                        {isAppreciation ? (
                          <span className="text-green-600 mr-2">Appreciation</span>
                        ) : (
                          <span className="text-red-600 mr-2">Depreciation</span>
                        )}
                        <span className="font-bold">
                          {new Intl.NumberFormat("en-ET", {
                            style: "currency",
                            currency: "ETB",
                            minimumFractionDigits: 2,
                          }).format(difference)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
  
          {/* Right Column - Summary */}
          <div>
            {/* Summary Card */}
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Adjustment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Asset</span>
                    <span className="font-medium">
                      {options?.assets?.find((a) => a.name === formData.asset)?.asset_name || "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Adjustment Date</span>
                    <span>{formData.adjustment_date || "Not set"}</span>
                  </div>
                </div>
  
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between">
                    <span>Current Value</span>
                    <span>{formData.current_value ? new Intl.NumberFormat("en-ET", {
                      style: "currency",
                      currency: "ETB",
                      minimumFractionDigits: 2,
                    }).format(formData.current_value) : "Not set"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>New Value</span>
                    <span>{formData.new_value ? new Intl.NumberFormat("en-ET", {
                      style: "currency",
                      currency: "ETB",
                      minimumFractionDigits: 2,
                    }).format(formData.new_value) : "Not set"}</span>
                  </div>
                  {formData.new_value > 0 && (
                    <div className="flex justify-between">
                      <span>Difference</span>
                      <div className="flex items-center">
                        {isAppreciation ? (
                          <span className="text-green-600 mr-2">+</span>
                        ) : (
                          <span className="text-red-600 mr-2">-</span>
                        )}
                        <span className="font-medium">
                          {new Intl.NumberFormat("en-ET", {
                            style: "currency",
                            currency: "ETB",
                            minimumFractionDigits: 2,
                          }).format(Math.abs(difference))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
  
                <div className="pt-4 border-t space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Approved By:</span>
                    <span className="font-medium">
                      {formData.approved_by || "Not set"}
                    </span>
                  </div>
                </div>
  
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !formData.asset || !formData.adjustment_date || !formData.new_value}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Creating..." : "Create Adjustment Record"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }