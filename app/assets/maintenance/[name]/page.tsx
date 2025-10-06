// app/assets/maintenance/[name]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
  Share,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

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
  maintenance_team: string;
  asset_maintenance_tasks: Array<{
    maintenance_task: string;
    maintenance_status: string;
    start_date: string;
    end_date: string;
    assign_to: string;
    periodicity: string;
  }>;
}

export default function MaintenanceDetailPage() {
  const { push: toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [maintenance, setMaintenance] = useState<AssetMaintenance | null>(null);

  useEffect(() => {
    fetchMaintenance();
  }, [params.name]);

  const fetchMaintenance = async () => {
    try {
      const response = await fetch(`/api/asset/maintenance/${params.name}`);
      if (!response.ok) {
        throw new Error("Failed to fetch maintenance record");
      }

      const data = await response.json();
      setMaintenance(data.data.maintenance);
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to load maintenance record: ${
          (error as Error).message
        }`,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string | null) => {
    if (!status) return "bg-gray-100 text-gray-800"; // ← handle undefined / null
    switch (status.toLowerCase()) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
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

  const isDueSoon = () => {
    if (!maintenance || !maintenance.next_maintenance_date) return false;
    const today = new Date();
    const sevenDaysFromNow = new Date(
      today.getTime() + 7 * 24 * 60 * 60 * 1000
    );
    return (
      new Date(maintenance.next_maintenance_date) <= sevenDaysFromNow &&
      maintenance.status !== "Completed"
    );
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

  if (!maintenance) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <Wrench className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">
            Maintenance Record Not Found
          </h2>
          <p className="text-muted-foreground mb-4">
            The maintenance record you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.push("/assets/maintenance")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Maintenance Records
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
              onClick={() => router.push("/assets/maintenance")}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Wrench className="w-8 h-8 mr-3 text-primary" />
                Maintenance Record Details
              </h1>
              <p className="text-muted-foreground">
                View and manage maintenance information
              </p>
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
              onClick={() =>
                router.push(`/assets/maintenance/${maintenance.name}/edit`)
              }
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
                <CardTitle>Maintenance Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Maintenance ID
                        </p>
                        <p className="font-medium">{maintenance.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Asset</p>
                        <div className="flex items-center">
                          <Package className="w-4 h-4 mr-2 text-muted-foreground" />
                          {maintenance.asset}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Maintenance Type
                        </p>
                        <p className="font-medium">
                          {maintenance.maintenance_type}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <div className="flex items-center">
                          <Badge className={getStatusColor(maintenance.status)}>
                            {maintenance.status}
                          </Badge>
                          {isDueSoon() && (
                            <Badge className="ml-2 bg-orange-100 text-orange-800">
                              Due Soon
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Maintenance Date
                        </p>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                          {formatDate(maintenance.maintenance_date)}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Next Maintenance Date
                        </p>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                          {maintenance.next_maintenance_date
                            ? formatDate(maintenance.next_maintenance_date)
                            : "N/A"}
                          {isDueSoon() && (
                            <AlertTriangle className="w-4 h-4 ml-2 text-orange-500" />
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Maintenance Team
                        </p>
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-muted-foreground" />
                          {maintenance.maintenance_team || "N/A"}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cost</p>
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
                          {formatCurrency(maintenance.cost)}
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
                <p className="text-sm">
                  {maintenance.description || "No description provided"}
                </p>
              </CardContent>
            </Card>

            {/* Maintenance Tasks */}
            {maintenance.asset_maintenance_tasks &&
              maintenance.asset_maintenance_tasks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Maintenance Tasks</CardTitle>
                    <CardDescription>
                      Tasks associated with this maintenance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Task</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead>Assigned To</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {maintenance.asset_maintenance_tasks.map(
                            (task, index) => (
                              <TableRow key={index}>
                                <TableCell>{task.maintenance_task}</TableCell>
                                <TableCell>
                                  <Badge
                                    className={getStatusColor(
                                      task.maintenance_status
                                    )}
                                  >
                                    {task.maintenance_status ?? "N/A"}
                                  </Badge>
                                </TableCell>{" "}
                                <TableCell>
                                  {formatDate(task.start_date)}
                                </TableCell>
                                <TableCell>
                                  {formatDate(task.end_date)}
                                </TableCell>
                                <TableCell>{task.assign_to || "N/A"}</TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
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
                    <span>Maintenance ID</span>
                    <span className="font-medium">{maintenance.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Asset</span>
                    <span>{maintenance.asset}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type</span>
                    <span>{maintenance.maintenance_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status</span>
                    <Badge className={getStatusColor(maintenance.status)}>
                      {maintenance.status}
                    </Badge>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between">
                    <span>Maintenance Date</span>
                    <span>{formatDate(maintenance.maintenance_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Next Maintenance</span>
                    <span>
                      {maintenance.next_maintenance_date
                        ? formatDate(maintenance.next_maintenance_date)
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost</span>
                    <span>{formatCurrency(maintenance.cost)}</span>
                  </div>
                </div>

                {maintenance.maintenance_team && (
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Maintenance Team:</span>
                      <span className="font-medium">
                        {maintenance.maintenance_team}
                      </span>
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
                    onClick={() =>
                      router.push(
                        `/assets/maintenance/${maintenance.name}/edit`
                      )
                    }
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Maintenance
                  </Button>

                  {maintenance.status === "Scheduled" && (
                    <Button
                      variant="outline"
                      className="w-full text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                    >
                      Start Maintenance
                    </Button>
                  )}

                  {maintenance.status === "In Progress" && (
                    <Button
                      variant="outline"
                      className="w-full text-green-600 border-green-600 hover:bg-green-50"
                    >
                      Complete Maintenance
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
