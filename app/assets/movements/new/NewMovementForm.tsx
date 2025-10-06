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
  Truck,
  Save,
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Plus,
  X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AssetOptions {
  assets: Array<{ name: string; asset_name: string }>;
  locations: Array<{ name: string; location_name: string }>;
  movementPurposes: Array<{ name: string; purpose_name: string }>;
}

interface AssetItem {
  asset: string;
  asset_name: string;
  source_location: string;
  target_location: string;
  from_employee: string;
  to_employee: string;
}



export default function NewMovementForm() {
    const { push: toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const assetParam = searchParams.get("asset") || "";
    
    const [loading, setLoading] = useState(false);
    const [optionsLoading, setOptionsLoading] = useState(true);
    const [options, setOptions] = useState<AssetOptions | null>(null);
  
    const [formData, setFormData] = useState({
      purpose: "Transfer",
      movement_date: new Date().toISOString().split("T")[0],
      company: "Ma Beignet (Demo)",
      status: "Requested",
    });
  
    const [assets, setAssets] = useState<AssetItem[]>([]);
    const [newAsset, setNewAsset] = useState<AssetItem>({
      asset: assetParam,
      asset_name: "",
      source_location: "",
      target_location: "",
      from_employee: "",
      to_employee: "",
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
            locations: data.data.options.locations || [],
            movementPurposes: data.data.options.movementPurposes || [],
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
  
    const handleInputChange = (field: string, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    };
  
    const handleAssetChange = (field: keyof AssetItem, value: string) => {
      setNewAsset((prev) => ({ ...prev, [field]: value }));
    };
  
    const addAsset = () => {
      if (!newAsset.asset) {
        toast({
          variant: "error",
          title: "Error",
          description: "Please select an asset",
        });
        return;
      }
  
      // Validate fields based on purpose
      const purpose = formData.purpose;
      let isValid = true;
      let errorMessage = "";
  
      switch (purpose) {
        case "Issue":
          if (!newAsset.source_location) {
            errorMessage = "Source location is required for Issue purpose";
            isValid = false;
          } else if (!newAsset.to_employee) {
            errorMessage = "To employee is required for Issue purpose";
            isValid = false;
          } else if (newAsset.target_location) {
            errorMessage = "Cannot issue to a location. Use to_employee instead";
            isValid = false;
          }
          break;
        case "Receipt":
          if (!newAsset.from_employee) {
            errorMessage = "From employee is required for Receipt purpose";
            isValid = false;
          } else if (!newAsset.target_location) {
            errorMessage = "Target location is required for Receipt purpose";
            isValid = false;
          } else if (newAsset.source_location) {
            errorMessage = "Cannot receive from a location. Use from_employee instead";
            isValid = false;
          }
          break;
        case "Transfer":
          if (!newAsset.source_location) {
            errorMessage = "Source location is required for Transfer purpose";
            isValid = false;
          } else if (!newAsset.target_location) {
            errorMessage = "Target location is required for Transfer purpose";
            isValid = false;
          } else if (newAsset.from_employee || newAsset.to_employee) {
            errorMessage = "Cannot use employee fields for Transfer. Use locations only";
            isValid = false;
          }
          break;
      }
  
      if (!isValid) {
        toast({
          variant: "error",
          title: "Error",
          description: errorMessage,
        });
        return;
      }
  
      // Get asset name if not already set
      if (!newAsset.asset_name && options?.assets) {
        const asset = options.assets.find(a => a.name === newAsset.asset);
        if (asset) {
          setNewAsset(prev => ({ ...prev, asset_name: asset.asset_name }));
        }
      }
  
      setAssets((prev) => [...prev, { ...newAsset }]);
      setNewAsset({
        asset: "",
        asset_name: "",
        source_location: "",
        target_location: "",
        from_employee: "",
        to_employee: "",
      });
    };
  
    const removeAsset = (index: number) => {
      setAssets((prev) => prev.filter((_, i) => i !== index));
    };
  
    const handleSubmit = async () => {
      if (assets.length === 0) {
        toast({
          variant: "error",
          title: "Error",
          description: "Please add at least one asset",
        });
        return;
      }
  
      setLoading(true);
      try {
        const response = await fetch("/api/asset/movements", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            assets: assets.map(asset => ({
              asset: asset.asset,
              asset_name: asset.asset_name,
              source_location: asset.source_location,
              target_location: asset.target_location,
              from_employee: asset.from_employee,
              to_employee: asset.to_employee,
            })),
          }),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || "Failed to create movement record");
        }
  
        const data = await response.json();
        toast({
          title: "Success",
          description: `Movement record ${data.data.movement.name} created successfully`,
        });
  
        router.push("/assets/movements");
      } catch (error: unknown) {
        toast({
          variant: "error",
          title: "Error",
          description: `Failed to create movement record: ${
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
              onClick={() => router.push("/assets/movements")}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Truck className="w-8 h-8 mr-3 text-primary" />
                New Movement Record
              </h1>
              <p className="text-muted-foreground">Create a new movement record</p>
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Creating..." : "Create Movement Record"}
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
                  Enter the basic details for this movement record
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="purpose">Purpose *</Label>
                    <Select
                      value={formData.purpose}
                      onValueChange={(value) => handleInputChange("purpose", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a purpose" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Issue">Issue</SelectItem>
                        <SelectItem value="Receipt">Receipt</SelectItem>
                        <SelectItem value="Transfer">Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="movement_date">Movement Date *</Label>
                    <div className="relative">
                      <Calendar
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        size={20}
                      />
                      <Input
                        id="movement_date"
                        type="date"
                        value={formData.movement_date}
                        onChange={(e) => handleInputChange("movement_date", e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
  
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleInputChange("company", e.target.value)}
                      placeholder="Enter company name"
                    />
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
                        <SelectItem value="Requested">Requested</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
  
            {/* Assets */}
            <Card>
              <CardHeader>
                <CardTitle>Assets</CardTitle>
                <CardDescription>Add assets to this movement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Asset Form */}
                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor="asset">Asset *</Label>
                      <Select
                        value={newAsset.asset}
                        onValueChange={(value) => handleAssetChange("asset", value)}
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
                  </div>
  
                  {formData.purpose === "Issue" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label htmlFor="source_location">Source Location *</Label>
                        <Select
                          value={newAsset.source_location}
                          onValueChange={(value) => handleAssetChange("source_location", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a location" />
                          </SelectTrigger>
                          <SelectContent>
                            {options?.locations?.map((location) => (
                              <SelectItem key={location.name} value={location.name}>
                                {location.location_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="to_employee">To Employee *</Label>
                        <Input
                          id="to_employee"
                          value={newAsset.to_employee}
                          onChange={(e) => handleAssetChange("to_employee", e.target.value)}
                          placeholder="Enter employee name"
                        />
                      </div>
                    </div>
                  )}
  
                  {formData.purpose === "Receipt" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label htmlFor="from_employee">From Employee *</Label>
                        <Input
                          id="from_employee"
                          value={newAsset.from_employee}
                          onChange={(e) => handleAssetChange("from_employee", e.target.value)}
                          placeholder="Enter employee name"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="target_location">Target Location *</Label>
                        <Select
                          value={newAsset.target_location}
                          onValueChange={(value) => handleAssetChange("target_location", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a location" />
                          </SelectTrigger>
                          <SelectContent>
                            {options?.locations?.map((location) => (
                              <SelectItem key={location.name} value={location.name}>
                                {location.location_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
  
                  {formData.purpose === "Transfer" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label htmlFor="source_location">Source Location *</Label>
                        <Select
                          value={newAsset.source_location}
                          onValueChange={(value) => handleAssetChange("source_location", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a location" />
                          </SelectTrigger>
                          <SelectContent>
                            {options?.locations?.map((location) => (
                              <SelectItem key={location.name} value={location.name}>
                                {location.location_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="target_location">Target Location *</Label>
                        <Select
                          value={newAsset.target_location}
                          onValueChange={(value) => handleAssetChange("target_location", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a location" />
                          </SelectTrigger>
                          <SelectContent>
                            {options?.locations?.map((location) => (
                              <SelectItem key={location.name} value={location.name}>
                                {location.location_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
  
                  <Button onClick={addAsset} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Asset
                  </Button>
                </div>
  
                {/* Assets Table */}
                {assets.length > 0 && (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Asset</TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assets.map((asset, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{asset.asset_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {asset.asset}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                {asset.source_location ? (
                                  <>
                                    <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                                    {asset.source_location}
                                  </>
                                ) : asset.from_employee ? (
                                  <>
                                    <User className="w-4 h-4 mr-2 text-muted-foreground" />
                                    {asset.from_employee}
                                  </>
                                ) : (
                                  "N/A"
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                {asset.target_location ? (
                                  <>
                                    <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                                    {asset.target_location}
                                  </>
                                ) : asset.to_employee ? (
                                  <>
                                    <User className="w-4 h-4 mr-2 text-muted-foreground" />
                                    {asset.to_employee}
                                  </>
                                ) : (
                                  "N/A"
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAsset(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
                <CardTitle>Movement Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Purpose</span>
                    <span className="font-medium">{formData.purpose}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Movement Date</span>
                    <span>{formData.movement_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status</span>
                    <span>{formData.status}</span>
                  </div>
                </div>
  
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between">
                    <span>Company</span>
                    <span>{formData.company}</span>
                  </div>
                </div>
  
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between">
                    <span>Total Assets</span>
                    <span className="font-medium">{assets.length}</span>
                  </div>
                </div>
  
                <Button
                  onClick={handleSubmit}
                  disabled={loading || assets.length === 0}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Creating..." : "Create Movement Record"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
