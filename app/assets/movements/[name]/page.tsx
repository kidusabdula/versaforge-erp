// app/assets/movements/[name]/page.tsx
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
  Truck, 
  ArrowLeft, 
  Edit, 
  Calendar,
  MapPin,
  User,
  AlertTriangle,
  Download,
  Printer,
  Share
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function MovementDetailPage() {
  const { push: toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [movement, setMovement] = useState<AssetMovement | null>(null);

  useEffect(() => {
    fetchMovement();
  }, [params.name]);

  const fetchMovement = async () => {
    try {
      const response = await fetch(`/api/asset/movements/${params.name}`);
      if (!response.ok) {
        throw new Error('Failed to fetch movement record');
      }

      const data = await response.json();
      setMovement(data.data.movement);
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to load movement record: ${(error as Error).message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string | null) => {
    if (!status) return "bg-gray-100 text-gray-800";
    switch (status.toLowerCase()) {
      case "requested":
        return "bg-blue-100 text-blue-800";
      case "approved":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = () => {
    if (!movement || !movement.movement_date) return false;
    const today = new Date();
    return movement.status !== "Completed" && new Date(movement.movement_date) < today;
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

  if (!movement) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <Truck className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Movement Record Not Found</h2>
          <p className="text-muted-foreground mb-4">The movement record you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/assets/movements')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Movement Records
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
              onClick={() => router.push('/assets/movements')}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Truck className="w-8 h-8 mr-3 text-primary" />
                Movement Record Details
              </h1>
              <p className="text-muted-foreground">View and manage movement information</p>
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
              onClick={() => router.push(`/assets/movements/${movement.name}/edit`)}
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
                <CardTitle>Movement Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Movement ID</p>
                        <p className="font-medium">{movement.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Purpose</p>
                        <div className="flex items-center">
                          <Badge variant="outline">
                            {movement.purpose}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <div className="flex items-center">
                          <Badge className={getStatusColor(movement.status)}>
                            {movement.status ?? "N/A"}
                          </Badge>
                          {isOverdue() && (
                            <Badge className="ml-2 bg-red-100 text-red-800">Overdue</Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Company</p>
                        <p className="font-medium">{movement.company}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Movement Date</p>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                          {movement.movement_date ? formatDate(movement.movement_date) : 'N/A'}
                          {isOverdue() && (
                            <AlertTriangle className="w-4 h-4 ml-2 text-red-500" />
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">From</p>
                        <div className="flex items-center">
                          {movement.from_location ? (
                            <>
                              <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                              {movement.from_location}
                            </>
                          ) : movement.from_employee ? (
                            <>
                              <User className="w-4 h-4 mr-2 text-muted-foreground" />
                              {movement.from_employee}
                            </>
                          ) : (
                            "N/A"
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">To</p>
                        <div className="flex items-center">
                          {movement.to_location ? (
                            <>
                              <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                              {movement.to_location}
                            </>
                          ) : movement.to_employee ? (
                            <>
                              <User className="w-4 h-4 mr-2 text-muted-foreground" />
                              {movement.to_employee}
                            </>
                          ) : (
                            "N/A"
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assets */}
            {movement.assets && movement.assets.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Assets</CardTitle>
                  <CardDescription>Assets included in this movement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Asset</TableHead>
                          <TableHead>Asset Name</TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {movement.assets.map((asset, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-sm">{asset.asset}</TableCell>
                            <TableCell>{asset.asset_name}</TableCell>
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
                          </TableRow>
                        ))}
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
                <CardTitle>Movement Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Movement ID</span>
                    <span className="font-medium">{movement.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Purpose</span>
                    <Badge variant="outline">
                      {movement.purpose}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Status</span>
                    <Badge className={getStatusColor(movement.status)}>
                      {movement.status ?? "N/A"}
                    </Badge>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between">
                    <span>Movement Date</span>
                    <span>{movement.movement_date ? formatDate(movement.movement_date) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>From</span>
                    <span>
                      {movement.from_location || movement.from_employee || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>To</span>
                    <span>
                      {movement.to_location || movement.to_employee || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Company:</span>
                    <span className="font-medium">{movement.company}</span>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push(`/assets/movements/${movement.name}/edit`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Movement
                  </Button>
                  
                  {movement.status === "Requested" && (
                    <Button 
                      variant="outline" 
                      className="w-full text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                    >
                      Approve Movement
                    </Button>
                  )}
                  
                  {movement.status === "Approved" && (
                    <Button 
                      variant="outline" 
                      className="w-full text-green-600 border-green-600 hover:bg-green-50"
                    >
                      Complete Movement
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