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
  repairTypes: Array<{ name: string; type_name: string }>;
}
export default function NewRepairForm() {
    const { push: toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const assetParam = searchParams.get("asset") || "";
    
    const [loading, setLoading] = useState(false);
    const [optionsLoading, setOptionsLoading] = useState(true);
    const [options, setOptions] = useState<AssetOptions | null>(null);
  
    const [formData, setFormData] = useState({
      asset: assetParam,
      repair_type: "",
      repair_date: new Date().toISOString().split("T")[0],
      failure_date: new Date().toISOString().split("T")[0],
      description: "",
      cost: 0,
      technician: "",
      status: "Reported",
      completion_date: "",
      actions_performed: "",
      repair_details: "",
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
            assets: data.data.options.categories || [], // Using categories as assets for now
            repairTypes: data.data.options.repairTypes || [],
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
      if (!formData.asset || !formData.repair_date) {
        toast({
          variant: "error",
          title: "Error",
          description: "Please fill in all required fields",
        });
        return;
      }
  
      setLoading(true);
      try {
        const response = await fetch(`/api/asset/repairs/asset/${formData.asset}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || "Failed to create repair record");
        }
  
        const data = await response.json();
        toast({
          title: "Success",
          description: `Repair record ${data.data.repair.name} created successfully`,
        });
  
        router.push("/assets/repairs");
      } catch (error: unknown) {
        toast({
          variant: "error",
          title: "Error",
          description: `Failed to create repair record: ${
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
              onClick={() => router.push("/assets/repairs")}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Wrench className="w-8 h-8 mr-3 text-primary" />
                New Repair Record
              </h1>
              <p className="text-muted-foreground">Create a new repair record</p>
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Creating..." : "Create Repair Record"}
          </Button>
        </div>
  
        {assetParam && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Package className="w-4 h-4 mr-2" />
                <div>
                  <p className="font-medium">Creating repair record for:</p>
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
                  Enter the basic details for this repair record
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
                    <Label htmlFor="repair_type">Repair Type</Label>
                    <Select
                      value={formData.repair_type}
                      onValueChange={(value) => handleInputChange("repair_type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                      <SelectContent>
                        {options?.repairTypes?.map((type) => (
                          <SelectItem key={type.name} value={type.name}>
                            {type.type_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
  
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="failure_date">Failure Date</Label>
                    <div className="relative">
                      <Calendar
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        size={20}
                      />
                      <Input
                        id="failure_date"
                        type="date"
                        value={formData.failure_date}
                        onChange={(e) => handleInputChange("failure_date", e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="repair_date">Repair Date *</Label>
                    <div className="relative">
                      <Calendar
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        size={20}
                      />
                      <Input
                        id="repair_date"
                        type="date"
                        value={formData.repair_date}
                        onChange={(e) => handleInputChange("repair_date", e.target.value)}
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
                      onValueChange={(value) => handleInputChange("status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Reported">Reported</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="technician">Technician</Label>
                    <Input
                      id="technician"
                      value={formData.technician}
                      onChange={(e) => handleInputChange("technician", e.target.value)}
                      placeholder="Enter technician name"
                    />
                  </div>
                </div>
  
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Enter repair description"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
  
            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
                <CardDescription>
                  Enter additional details for this repair
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="actions_performed">Actions Performed</Label>
                  <Textarea
                    id="actions_performed"
                    value={formData.actions_performed}
                    onChange={(e) => handleInputChange("actions_performed", e.target.value)}
                    placeholder="Describe the actions performed during the repair"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="repair_details">Repair Details</Label>
                  <Textarea
                    id="repair_details"
                    value={formData.repair_details}
                    onChange={(e) => handleInputChange("repair_details", e.target.value)}
                    placeholder="Enter detailed repair information"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
  
            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Information</CardTitle>
                <CardDescription>
                  Enter the financial details for this repair
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
                      onChange={(e) => handleInputChange("cost", parseFloat(e.target.value))}
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
                <CardTitle>Repair Summary</CardTitle>
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
                    <span>Type</span>
                    <span>
                      {options?.repairTypes?.find((t) => t.name === formData.repair_type)?.type_name || "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status</span>
                    <span>{formData.status}</span>
                  </div>
                </div>
  
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between">
                    <span>Failure Date</span>
                    <span>{formData.failure_date || "Not set"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Repair Date</span>
                    <span>{formData.repair_date || "Not set"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost</span>
                    <span>{formData.cost ? new Intl.NumberFormat("en-ET", {
                      style: "currency",
                      currency: "ETB",
                      minimumFractionDigits: 2,
                    }).format(formData.cost) : "Not set"}</span>
                  </div>
                </div>
  
                <div className="pt-4 border-t space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Technician:</span>
                    <span className="font-medium">
                      {formData.technician || "Not set"}
                    </span>
                  </div>
                </div>
  
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !formData.asset || !formData.repair_date}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Creating..." : "Create Repair Record"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
