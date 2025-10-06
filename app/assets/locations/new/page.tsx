// app/assets/locations/new/page.tsx
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
  MapPin,
  Save,
  ArrowLeft,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AssetOptions {
  locations: Array<{ name: string; location_name: string }>;
}

export default function NewLocationPage() {
  const { push: toast } = useToast();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [options, setOptions] = useState<AssetOptions | null>(null);

  const [formData, setFormData] = useState({
    location_name: "",
    parent_location: "none",
    is_group: 0,
    address: "",
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
          locations: data.data.options.locations || [],
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
    if (!formData.location_name) {
      toast({
        variant: "error",
        title: "Error",
        description: "Location name is required",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        parent_location: formData.parent_location === "none" ? "" : formData.parent_location,
      };

      const response = await fetch("/api/asset/locations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Failed to create location");
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: `Location ${data.data.location.name} created successfully`,
      });

      router.push("/assets/locations");
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to create location: ${
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
            onClick={() => router.push("/assets/locations")}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <MapPin className="w-8 h-8 mr-3 text-primary" />
              New Location
            </h1>
            <p className="text-muted-foreground">Create a new asset location</p>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Creating..." : "Create Location"}
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
                Enter the basic details for this location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="location_name">Location Name *</Label>
                <Input
                  id="location_name"
                  value={formData.location_name}
                  onChange={(e) => handleInputChange("location_name", e.target.value)}
                  placeholder="Enter location name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parent_location">Parent Location</Label>
                  <Select
                    value={formData.parent_location}
                    onValueChange={(value) => handleInputChange("parent_location", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No parent location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Parent</SelectItem>
                      {options?.locations?.map((location) => (
                        <SelectItem key={location.name} value={location.name}>
                          {location.location_name}
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
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Enter address"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary */}
        <div>
          {/* Summary Card */}
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Location Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Location Name</span>
                  <span className="font-medium">{formData.location_name || "Not set"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Parent Location</span>
                  <span>
                    {formData.parent_location === "none" 
                      ? "None" 
                      : options?.locations?.find(l => l.name === formData.parent_location)?.location_name || "Not set"
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
                  <span>Address</span>
                  <span>{formData.address || "Not set"}</span>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading || !formData.location_name}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Creating..." : "Create Location"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}