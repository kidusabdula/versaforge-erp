// app/assets/repairs/[name]/page.tsx
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
  Wrench, 
  ArrowLeft, 
  Edit, 
  Calendar,
  DollarSign,
  Package,
  User,
  AlertTriangle,
  Download,
  Printer,
  Share
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function RepairDetailPage() {
  const { push: toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [repair, setRepair] = useState<AssetRepair | null>(null);

  useEffect(() => {
    fetchRepair();
  }, [params.name]);

  const fetchRepair = async () => {
    try {
      const response = await fetch(`/api/asset/repairs/${params.name}`);
      if (!response.ok) {
        throw new Error('Failed to fetch repair record');
      }

      const data = await response.json();
      setRepair(data.data.repair);
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to load repair record: ${(error as Error).message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string | null) => {
    if (!status) return "bg-gray-100 text-gray-800";
    switch (status.toLowerCase()) {
      case "reported":
        return "bg-red-100 text-red-800";
      case "in progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = () => {
    if (!repair || !repair.repair_date) return false;
    const today = new Date();
    return repair.status !== "Completed" && new Date(repair.repair_date) < today;
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

  if (!repair) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <Wrench className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Repair Record Not Found</h2>
          <p className="text-muted-foreground mb-4">The repair record you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/assets/repairs')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Repair Records
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
              onClick={() => router.push('/assets/repairs')}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Wrench className="w-8 h-8 mr-3 text-primary" />
                Repair Record Details
              </h1>
              <p className="text-muted-foreground">View and manage repair information</p>
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
              onClick={() => router.push(`/assets/repairs/${repair.name}/edit`)}
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
                <CardTitle>Repair Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Repair ID</p>
                        <p className="font-medium">{repair.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Asset</p>
                        <div className="flex items-center">
                          <Package className="w-4 h-4 mr-2 text-muted-foreground" />
                          {repair.asset}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Repair Type</p>
                        <p className="font-medium">{repair.repair_type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <div className="flex items-center">
                          <Badge className={getStatusColor(repair.status)}>
                            {repair.status ?? "N/A"}
                          </Badge>
                          {isOverdue() && (
                            <Badge className="ml-2 bg-red-100 text-red-800">Overdue</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Failure Date</p>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                          {repair.failure_date ? formatDate(repair.failure_date) : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Repair Date</p>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                          {repair.repair_date ? formatDate(repair.repair_date) : 'N/A'}
                          {isOverdue() && (
                            <AlertTriangle className="w-4 h-4 ml-2 text-red-500" />
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Completion Date</p>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                          {repair.completion_date ? formatDate(repair.completion_date) : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Technician</p>
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-muted-foreground" />
                          {repair.technician || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{repair.description || 'No description provided'}</p>
              </CardContent>
            </Card>

            {/* Actions Performed */}
            {repair.actions_performed && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions Performed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{repair.actions_performed}</p>
                </CardContent>
              </Card>
            )}

            {/* Repair Details */}
            {repair.repair_details && (
              <Card>
                <CardHeader>
                  <CardTitle>Repair Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{repair.repair_details}</p>
                </CardContent>
              </Card>
            )}
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
                    <span>Repair ID</span>
                    <span className="font-medium">{repair.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Asset</span>
                    <span>{repair.asset}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type</span>
                    <span>{repair.repair_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status</span>
                    <Badge className={getStatusColor(repair.status)}>
                      {repair.status ?? "N/A"}
                    </Badge>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between">
                    <span>Failure Date</span>
                    <span>{repair.failure_date ? formatDate(repair.failure_date) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Repair Date</span>
                    <span>{repair.repair_date ? formatDate(repair.repair_date) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completion Date</span>
                    <span>{repair.completion_date ? formatDate(repair.completion_date) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost</span>
                    <span>{formatCurrency(repair.cost)}</span>
                  </div>
                </div>

                {repair.technician && (
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Technician:</span>
                      <span className="font-medium">{repair.technician}</span>
                    </div>
                  </div>
                )}

                {repair.downtime && (
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Downtime:</span>
                      <span className="font-medium">{repair.downtime}</span>
                    </div>
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
                    onClick={() => router.push(`/assets/repairs/${repair.name}/edit`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Repair
                  </Button>
                  
                  {repair.status === "Reported" && (
                    <Button 
                      variant="outline" 
                      className="w-full text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                    >
                      Start Repair
                    </Button>
                  )}
                  
                  {repair.status === "In Progress" && (
                    <Button 
                      variant="outline" 
                      className="w-full text-green-600 border-green-600 hover:bg-green-50"
                    >
                      Complete Repair
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}