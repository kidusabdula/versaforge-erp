// app/crm/activities/[name]/page.tsx
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
  Activity, 
  ArrowLeft, 
  Edit, 
  Calendar,
  User,
  AlertCircle,
  Users,
  FileText,
  ShoppingCart,
  TrendingUp,
  CheckCircle,
  Clock
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity as ActivityType } from "@/types/crm";

export default function ActivityDetailPage() {
  const { push: toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<ActivityType | null>(null);

  useEffect(() => {
    fetchActivity();
  }, [params.name]);

  const fetchActivity = async () => {
    try {
      const response = await fetch(`/api/crm/activities/${params.name}`);
      if (!response.ok) {
        throw new Error('Failed to fetch activity');
      }

      const data = await response.json();
      setActivity(data.data.activity);
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to load activity: ${(error as Error).message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "closed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getReferenceIcon = (doctype: string) => {
    switch (doctype.toLowerCase()) {
      case "lead":
        return <Users className="w-4 h-4 mr-2" />;
      case "customer":
        return <Users className="w-4 h-4 mr-2" />;
      case "opportunity":
        return <TrendingUp className="w-4 h-4 mr-2" />;
      case "quotation":
        return <FileText className="w-4 h-4 mr-2" />;
      case "sales order":
        return <ShoppingCart className="w-4 h-4 mr-2" />;
      default:
        return <AlertCircle className="w-4 h-4 mr-2" />;
    }
  };

  const toggleStatus = async () => {
    if (!activity) return;
    
    try {
      const newStatus = activity.status === "Open" ? "Closed" : "Open";
      
      const response = await fetch(`/api/crm/activities/${activity.name}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...activity,
          status: newStatus
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update activity status');
      }

      const data = await response.json();
      setActivity(data.data.activity);
      
      toast({
        title: "Success",
        description: `Activity status updated to ${newStatus}`
      });
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to update activity status: ${(error as Error).message}`
      });
    }
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

  if (!activity) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Activity Not Found</h2>
          <p className="text-muted-foreground mb-4">The activity you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/crm/activities')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Activities
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
              onClick={() => activity.reference_doctype && activity.reference_name
                ? router.push(`/crm/${activity.reference_doctype.toLowerCase()}/${activity.reference_name}`)
                : router.push('/crm/activities')
              }
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Activity className="w-8 h-8 mr-3 text-primary" />
                Activity Details
              </h1>
              <p className="text-muted-foreground">View and manage activity information</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={toggleStatus}
            >
              {activity.status === "Open" ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Complete
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Reopen
                </>
              )}
            </Button>
            <Button 
              size="sm"
              onClick={() => router.push(`/crm/activities/${activity.name}/edit`)}
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
                <CardTitle>Activity Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Subject</p>
                        <p className="font-medium text-lg">{activity.subject}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Activity ID</p>
                        <p className="font-medium">{activity.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Type</p>
                        <Badge variant="outline" className="capitalize">
                          {activity.activity_type}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge className={getStatusColor(activity.status)}>
                          {activity.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Priority</p>
                        <Badge className={getPriorityColor(activity.priority)}>
                          {activity.priority}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Due Date</p>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                          {new Date(activity.due_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Assigned To</p>
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-muted-foreground" />
                          {activity.assigned_to || "Unassigned"}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Created On</p>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                          {new Date(activity.creation).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {activity.description && (
                  <div className="mt-6 pt-6 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Description</p>
                    <p className="text-sm">{activity.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related Information */}
            {activity.reference_doctype && activity.reference_name && (
              <Card>
                <CardHeader>
                  <CardTitle>Related Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center p-4 bg-muted/50 rounded-lg">
                    {getReferenceIcon(activity.reference_doctype)}
                    <div>
                      <p className="font-medium">{activity.reference_doctype}</p>
                      <p className="text-sm text-muted-foreground">{activity.reference_name}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="ml-auto"
                      onClick={() => router.push(`/crm/${activity.reference_doctype.toLowerCase()}/${activity.reference_name}`)}
                    >
                      View Details
                    </Button>
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
                <CardTitle>Activity Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Type</span>
                    <Badge variant="outline" className="capitalize">
                      {activity.activity_type}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Status</span>
                    <Badge className={getStatusColor(activity.status)}>
                      {activity.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Priority</span>
                    <Badge className={getPriorityColor(activity.priority)}>
                      {activity.priority}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Due Date</span>
                    <span>{new Date(activity.due_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Assigned To</span>
                    <span>{activity.assigned_to || "Unassigned"}</span>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={toggleStatus}
                  >
                    {activity.status === "Open" ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Complete
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 mr-2" />
                        Reopen Activity
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push(`/crm/activities/${activity.name}/edit`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Activity
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