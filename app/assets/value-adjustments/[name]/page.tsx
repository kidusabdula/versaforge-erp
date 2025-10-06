// app/assets/value-adjustments/[name]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  ArrowLeft, 
  Edit, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Download,
  Printer,
  Share
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function ValueAdjustmentDetailPage() {
  const { push: toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [adjustment, setAdjustment] = useState<AssetValueAdjustment | null>(null);

  useEffect(() => {
    fetchAdjustment();
  }, [params.name]);

  const fetchAdjustment = async () => {
    try {
      const response = await fetch(`/api/asset/value-adjustments/${params.name}`);
      if (!response.ok) {
        throw new Error('Failed to fetch value adjustment record');
      }

      const data = await response.json();
      setAdjustment(data.data.adjustment);
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to load value adjustment record: ${(error as Error).message}`
      });
    } finally {
      setLoading(false);
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

  if (!adjustment) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <DollarSign className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Value Adjustment Record Not Found</h2>
          <p className="text-muted-foreground mb-4">The value adjustment record you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/assets/value-adjustments')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Value Adjustment Records
          </Button>
        </div>
      </div>
    );
  }

  const difference = adjustment.new_value - adjustment.current_value;
  const isAppreciation = difference >= 0;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/assets/value-adjustments')}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <DollarSign className="w-8 h-8 mr-3 text-primary" />
                Value Adjustment Details
              </h1>
              <p className="text-muted-foreground">View and manage value adjustment information</p>
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
              onClick={() => router.push(`/assets/value-adjustments/${adjustment.name}/edit`)}
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
                <CardTitle>Adjustment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Adjustment ID</p>
                        <p className="font-medium">{adjustment.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Asset</p>
                        <p className="font-medium">{adjustment.asset}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Adjustment Date</p>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                          {formatDate(adjustment.adjustment_date)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Previous Value</p>
                        <p className="font-medium">{formatCurrency(adjustment.current_value)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">New Value</p>
                        <p className="font-medium">{formatCurrency(adjustment.new_value)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Difference</p>
                        <div className="flex items-center">
                          {isAppreciation ? (
                            <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 mr-2 text-red-600" />
                          )}
                          <Badge variant={isAppreciation ? 'default' : 'destructive'}>
                            {formatCurrency(difference)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reason */}
            <Card>
              <CardHeader>
                <CardTitle>Reason for Adjustment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{adjustment.reason || 'No reason provided'}</p>
              </CardContent>
            </Card>

            {/* Approval Information */}
            <Card>
              <CardHeader>
                <CardTitle>Approval Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Approved By</span>
                    <span>{adjustment.approved_by || 'Not approved yet'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Created On</span>
                    <span>{new Date(adjustment.creation).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Last Modified</span>
                    <span>{new Date(adjustment.modified).toLocaleDateString()}</span>
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
                <CardTitle>Adjustment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Adjustment ID</span>
                    <span className="font-medium">{adjustment.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Asset</span>
                    <span>{adjustment.asset}</span>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between">
                    <span>Adjustment Date</span>
                    <span>{formatDate(adjustment.adjustment_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Previous Value</span>
                    <span>{formatCurrency(adjustment.current_value)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>New Value</span>
                    <span>{formatCurrency(adjustment.new_value)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Difference</span>
                    <div className="flex items-center">
                      {isAppreciation ? (
                        <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 mr-2 text-red-600" />
                      )}
                      <Badge variant={isAppreciation ? 'default' : 'destructive'}>
                        {formatCurrency(difference)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {adjustment.approved_by && (
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Approved By:</span>
                      <span className="font-medium">{adjustment.approved_by}</span>
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
                    onClick={() => router.push(`/assets/value-adjustments/${adjustment.name}/edit`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Adjustment
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