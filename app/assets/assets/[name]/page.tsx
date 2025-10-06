// app/assets/assets/[name]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Package, 
  ArrowLeft, 
  Edit, 
  Calendar,
  DollarSign,
  MapPin,
  User,
  Wrench,
  Truck,
  AlertTriangle,
  Download,
  Printer,
  Share,
  Eye,
  TrendingUp,
  Plus
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Asset {
  name: string;
  asset_name: string;
  asset_category: string;
  item_code: string;
  serial_no: string;
  purchase_date: string;
  purchase_value: number;
  current_value: number;
  location: string;
  status: "Available" | "In Use" | "Under Maintenance" | "Scrapped";
  warranty_expiry_date: string;
  assigned_to: string;
  creation: string;
  modified: string;
  owner: string;
}

interface AssetMaintenance {
  name: string;
  asset: string;
  maintenance_type: string;
  maintenance_date: string;
  description: string;
  cost: number;
  next_maintenance_date: string;
  status: string;
  creation: string;
  modified: string;
  owner: string;
}

interface AssetRepair {
  name: string;
  asset: string;
  repair_type: string;
  repair_date: string;
  failure_date: string;
  description: string;
  cost: number;
  technician: string;
  status: string;
  creation: string;
  modified: string;
  owner: string;
  company: string;
  completion_date: string;
  actions_performed: string;
  downtime: string;
  repair_details: string;
}

interface AssetMovement {
  name: string;
  asset: string;
  assets: Array<{
    asset: string;
    asset_name: string;
    source_location: string;
    target_location: string;
    from_employee: string;
    to_employee: string;
  }>;
  from_location: string;
  to_location: string;
  from_employee: string;
  to_employee: string;
  movement_date: string;
  purpose: "Issue" | "Receipt" | "Transfer";
  status: string;
  company: string;
  creation: string;
  modified: string;
  owner: string;
}

interface AssetValueAdjustment {
  name: string;
  asset: string;
  adjustment_date: string;
  current_value: number;
  new_value: number;
  reason: string;
  approved_by: string;
  creation: string;
  modified: string;
  owner: string;
}

export default function AssetDetailPage() {
  const { push: toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [maintenance, setMaintenance] = useState<AssetMaintenance[]>([]);
  const [repairs, setRepairs] = useState<AssetRepair[]>([]);
  const [movements, setMovements] = useState<AssetMovement[]>([]);
  const [valueAdjustments, setValueAdjustments] = useState<AssetValueAdjustment[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "maintenance" | "repairs" | "movements" | "value-adjustments">("overview");

  useEffect(() => {
    fetchAssetData();
  }, [params.name]);

  const fetchAssetData = async () => {
    try {
      // Fetch asset details
      const assetResponse = await fetch(`/api/asset/assets/${params.name}`);
      if (!assetResponse.ok) {
        throw new Error('Failed to fetch asset');
      }
      const assetData = await assetResponse.json();
      setAsset(assetData.data.asset);

      // Fetch related data in parallel
      const [maintenanceResponse, repairsResponse, movementsResponse, valueAdjustmentsResponse] = await Promise.all([
        fetch(`/api/asset/maintenance/asset/${params.name}`),
        fetch(`/api/asset/repairs/asset/${params.name}`),
        fetch(`/api/asset/movements/asset/${params.name}`),
        fetch(`/api/asset/value-adjustments/asset/${params.name}`)
      ]);

      if (maintenanceResponse.ok) {
        const maintenanceData = await maintenanceResponse.json();
        setMaintenance(maintenanceData.data.maintenance);
      }

      if (repairsResponse.ok) {
        const repairsData = await repairsResponse.json();
        setRepairs(repairsData.data.repairs);
      }

      if (movementsResponse.ok) {
        const movementsData = await movementsResponse.json();
        setMovements(movementsData.data.movements);
      }

      if (valueAdjustmentsResponse.ok) {
        const valueAdjustmentsData = await valueAdjustmentsResponse.json();
        setValueAdjustments(valueAdjustmentsData.data.adjustments);
      }
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to load asset data: ${(error as Error).message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "available":
        return "bg-green-100 text-green-800";
      case "in use":
        return "bg-blue-100 text-blue-800";
      case "under maintenance":
        return "bg-yellow-100 text-yellow-800";
      case "scrapped":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: unknown) => {
    const num = Number(amount);
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 2,
    }).format(Number.isFinite(num) ? num : 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isWarrantyExpiring = () => {
    if (!asset || !asset.warranty_expiry_date) return false;
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    return new Date(asset.warranty_expiry_date) <= thirtyDaysFromNow;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center mb-8">
            <Skeleton className="h-8 w-8 mr-3" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 rounded-lg" />
              <Skeleton className="h-96 rounded-lg" />
            </div>
            <div>
              <Skeleton className="h-80 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Asset Not Found</h2>
          <p className="text-muted-foreground mb-4">The asset you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/assets/assets')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/assets/assets')}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Package className="w-8 h-8 mr-3 text-primary" />
                Asset Details
              </h1>
              <p className="text-muted-foreground">View and manage asset information</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" size="sm">
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button 
              size="sm"
              onClick={() => router.push(`/assets/assets/${asset.name}/edit`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Asset Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Asset Name</p>
                        <p className="font-medium text-lg">{asset.asset_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Asset ID</p>
                        <p className="font-medium">{asset.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Category</p>
                        <p className="font-medium">{asset.asset_category}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <div className="flex items-center">
                          <Badge className={getStatusColor(asset.status)}>
                            {asset.status}
                          </Badge>
                          {isWarrantyExpiring() && (
                            <Badge className="ml-2 bg-orange-100 text-orange-800">Warranty Expiring</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Item Code</p>
                        <p className="font-medium">{asset.item_code || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Serial Number</p>
                        <p className="font-medium">{asset.serial_no || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                          {asset.location || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Assigned To</p>
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-muted-foreground" />
                          {asset.assigned_to || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Purchase Date</p>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                          {formatDate(asset.purchase_date)}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Purchase Value</p>
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
                          {formatCurrency(asset.purchase_value)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Current Value</p>
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
                          {formatCurrency(asset.current_value)}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Depreciation</p>
                        <div className="flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2 text-muted-foreground" />
                          {formatCurrency(asset.purchase_value - asset.current_value)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Warranty Information */}
            {asset.warranty_expiry_date && (
              <Card>
                <CardHeader>
                  <CardTitle>Warranty Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Warranty Expiry Date</p>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                        {formatDate(asset.warranty_expiry_date)}
                        {isWarrantyExpiring() && (
                          <AlertTriangle className="w-4 h-4 ml-2 text-orange-500" />
                        )}
                      </div>
                    </div>
                    {isWarrantyExpiring() && (
                      <Badge className="bg-orange-100 text-orange-800">
                        Expiring Soon
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs */}
            <div className="flex border-b mb-6">
              <button
                className={`px-4 py-2 font-medium ${
                  activeTab === "overview"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground"
                }`}
                onClick={() => setActiveTab("overview")}
              >
                Overview
              </button>
              <button
                className={`px-4 py-2 font-medium ${
                  activeTab === "maintenance"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground"
                }`}
                onClick={() => setActiveTab("maintenance")}
              >
                Maintenance
              </button>
              <button
                className={`px-4 py-2 font-medium ${
                  activeTab === "repairs"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground"
                }`}
                onClick={() => setActiveTab("repairs")}
              >
                Repairs
              </button>
              <button
                className={`px-4 py-2 font-medium ${
                  activeTab === "movements"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground"
                }`}
                onClick={() => setActiveTab("movements")}
              >
                Movements
              </button>
              <button
                className={`px-4 py-2 font-medium ${
                  activeTab === "value-adjustments"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground"
                }`}
                onClick={() => setActiveTab("value-adjustments")}
              >
                Value Adjustments
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <Card>
                <CardHeader>
                  <CardTitle>Asset Overview</CardTitle>
                  <CardDescription>Summary of asset information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Asset Details</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Asset Name:</span>
                          <span>{asset.asset_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Asset ID:</span>
                          <span>{asset.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Category:</span>
                          <span>{asset.asset_category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge className={getStatusColor(asset.status)}>
                            {asset.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-4">Financial Summary</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Purchase Value:</span>
                          <span>{formatCurrency(asset.purchase_value)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Current Value:</span>
                          <span>{formatCurrency(asset.current_value)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Depreciation:</span>
                          <span>{formatCurrency(asset.purchase_value - asset.current_value)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Depreciation %:</span>
                          <span>{((asset.purchase_value - asset.current_value) / asset.purchase_value * 100).toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "maintenance" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Maintenance Records</CardTitle>
                      <CardDescription>History of maintenance activities</CardDescription>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => router.push(`/assets/maintenance/new?asset=${asset.name}`)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Maintenance
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {maintenance.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No maintenance records found</p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Cost</TableHead>
                            <TableHead>Next Maintenance</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {maintenance.map((record) => (
                            <TableRow key={record.name}>
                              <TableCell>{formatDate(record.maintenance_date)}</TableCell>
                              <TableCell>{record.maintenance_type}</TableCell>
                              <TableCell className="max-w-xs truncate">{record.description}</TableCell>
                              <TableCell>{formatCurrency(record.cost)}</TableCell>
                              <TableCell>
                                {record.next_maintenance_date ? formatDate(record.next_maintenance_date) : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Badge variant={record.status === 'Completed' ? 'default' : 'outline'}>
                                  {record.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push(`/assets/maintenance/${record.name}`)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "repairs" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Repair Records</CardTitle>
                      <CardDescription>History of repair activities</CardDescription>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => router.push(`/assets/repairs/new?asset=${asset.name}`)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Repair
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {repairs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No repair records found</p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Repair Date</TableHead>
                            <TableHead>Failure Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Cost</TableHead>
                            <TableHead>Technician</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {repairs.map((record) => (
                            <TableRow key={record.name}>
                              <TableCell>{formatDate(record.repair_date)}</TableCell>
                              <TableCell>{record.failure_date ? formatDate(record.failure_date) : 'N/A'}</TableCell>
                              <TableCell>{record.repair_type}</TableCell>
                              <TableCell className="max-w-xs truncate">{record.description}</TableCell>
                              <TableCell>{formatCurrency(record.cost)}</TableCell>
                              <TableCell>{record.technician}</TableCell>
                              <TableCell>
                                <Badge variant={record.status === 'Completed' ? 'default' : 'outline'}>
                                  {record.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push(`/assets/repairs/${record.name}`)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "movements" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Movement Records</CardTitle>
                      <CardDescription>History of asset movements</CardDescription>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => router.push(`/assets/movements/new?asset=${asset.name}`)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Movement
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {movements.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Truck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No movement records found</p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Movement Date</TableHead>
                            <TableHead>Purpose</TableHead>
                            <TableHead>From</TableHead>
                            <TableHead>To</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {movements.map((record) => (
                            <TableRow key={record.name}>
                              <TableCell>{formatDate(record.movement_date)}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {record.purpose}
                                </Badge>
                              </TableCell>
                              <TableCell>{record.from_location || record.from_employee || 'N/A'}</TableCell>
                              <TableCell>{record.to_location || record.to_employee || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge variant={record.status === 'Completed' ? 'default' : 'outline'}>
                                  {record.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push(`/assets/movements/${record.name}`)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "value-adjustments" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Value Adjustments</CardTitle>
                      <CardDescription>History of value adjustments</CardDescription>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => router.push(`/assets/value-adjustments/new?asset=${asset.name}`)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Adjustment
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {valueAdjustments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No value adjustment records found</p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Adjustment Date</TableHead>
                            <TableHead>Previous Value</TableHead>
                            <TableHead>New Value</TableHead>
                            <TableHead>Difference</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Approved By</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {valueAdjustments.map((record) => {
                            const difference = record.new_value - record.current_value;
                            return (
                              <TableRow key={record.name}>
                                <TableCell>{formatDate(record.adjustment_date)}</TableCell>
                                <TableCell>{formatCurrency(record.current_value)}</TableCell>
                                <TableCell>{formatCurrency(record.new_value)}</TableCell>
                                <TableCell>
                                  <Badge variant={difference >= 0 ? 'default' : 'destructive'}>
                                    {formatCurrency(difference)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="max-w-xs truncate">{record.reason}</TableCell>
                                <TableCell>{record.approved_by || 'N/A'}</TableCell>
                                <TableCell>
                                  <div className="flex space-x-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => router.push(`/assets/value-adjustments/${record.name}`)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Summary */}
          <div>
            {/* Summary Card */}
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Asset Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Asset Name</span>
                    <span className="font-medium">{asset.asset_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Asset ID</span>
                    <span className="font-medium">{asset.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Category</span>
                    <span>{asset.asset_category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status</span>
                    <Badge className={getStatusColor(asset.status)}>
                      {asset.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Location</span>
                    <span>{asset.location || 'N/A'}</span>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between">
                    <span>Purchase Value</span>
                    <span>{formatCurrency(asset.purchase_value)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Value</span>
                    <span>{formatCurrency(asset.current_value)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Depreciation</span>
                    <span>{formatCurrency(asset.purchase_value - asset.current_value)}</span>
                  </div>
                </div>

                {asset.warranty_expiry_date && (
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Warranty Expiry:</span>
                      <span className="font-medium">
                        {formatDate(asset.warranty_expiry_date)}
                      </span>
                    </div>
                    {isWarrantyExpiring() && (
                      <Badge className="w-full justify-center bg-orange-100 text-orange-800">
                        Warranty Expiring Soon
                      </Badge>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t space-y-2">
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push(`/assets/assets/${asset.name}/edit`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Asset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}