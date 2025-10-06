// app/crm/opportunities/[name]/page.tsx
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
  TrendingUp, 
  ArrowLeft, 
  Edit, 
  Calendar,
  DollarSign,
  Percent,
  MapPin,
  Users,
  FileText,
  ShoppingCart,
  Plus,
  CheckCircle,
  Clock
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Opportunity } from "@/types/crm";

export default function OpportunityDetailPage() {
  const { push: toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "activities" | "communications">("details");

  useEffect(() => {
    fetchOpportunity();
  }, [params.name]);

  const fetchOpportunity = async () => {
    try {
      const response = await fetch(`/api/crm/opportunities/${params.name}`);
      if (!response.ok) {
        throw new Error('Failed to fetch opportunity');
      }

      const data = await response.json();
      setOpportunity(data.data.opportunity);
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to load opportunity: ${(error as Error).message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "quoted":
        return "bg-yellow-100 text-yellow-800";
      case "lost":
        return "bg-red-100 text-red-800";
      case "closed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStageColor = (stage: string) => {
    const stages = ["Qualification", "Proposal", "Negotiation", "Closing"];
    const index = stages.indexOf(stage);
    if (index >= 0) {
      const colors = ["bg-purple-100 text-purple-800", "bg-blue-100 text-blue-800", "bg-orange-100 text-orange-800", "bg-green-100 text-green-800"];
      return colors[index] || "bg-gray-100 text-gray-800";
    }
    return "bg-gray-100 text-gray-800";
  };

  const toggleStatus = async () => {
    if (!opportunity) return;
    
    try {
      let newStatus = opportunity.status;
      
      if (opportunity.status === "Open") {
        newStatus = "Quoted";
      } else if (opportunity.status === "Quoted") {
        newStatus = "Closed";
      } else if (opportunity.status === "Closed") {
        newStatus = "Open";
      }
      
      const response = await fetch(`/api/crm/opportunities/${opportunity.name}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...opportunity,
          status: newStatus
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update opportunity status');
      }

      const data = await response.json();
      setOpportunity(data.data.opportunity);
      
      toast({
        title: "Success",
        description: `Opportunity status updated to ${newStatus}`
      });
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to update opportunity status: ${(error as Error).message}`
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

  if (!opportunity) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Opportunity Not Found</h2>
          <p className="text-muted-foreground mb-4">The opportunity you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/crm/opportunities')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Opportunities
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
              onClick={() => router.push('/crm/opportunities')}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <TrendingUp className="w-8 h-8 mr-3 text-primary" />
                Opportunity Details
              </h1>
              <p className="text-muted-foreground">View and manage opportunity information</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={toggleStatus}
            >
              {opportunity.status === "Open" ? (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Mark Quoted
                </>
              ) : opportunity.status === "Quoted" ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Closed
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
              onClick={() => router.push(`/crm/opportunities/${opportunity.name}/edit`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b mb-6">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "details"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("details")}
          >
            Details
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "activities"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("activities")}
          >
            Activities
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "communications"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("communications")}
          >
            Communications
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2">
            {activeTab === "details" && (
              <Card>
                <CardHeader>
                  <CardTitle>Opportunity Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Opportunity Name</p>
                          <p className="font-medium text-lg">{opportunity.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Type</p>
                          <p className="font-medium">{opportunity.opportunity_type}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <Badge className={getStatusColor(opportunity.status)}>
                            {opportunity.status}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Sales Stage</p>
                          <Badge className={getStageColor(opportunity.sales_stage)}>
                            {opportunity.sales_stage}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Customer/Lead</p>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                            {opportunity.customer || opportunity.lead}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Probability</p>
                          <div className="flex items-center">
                            <Percent className="w-4 h-4 mr-2 text-muted-foreground" />
                            {opportunity.probability}%
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Expected Closing Date</p>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                            {opportunity.expected_closing_date
                              ? new Date(opportunity.expected_closing_date).toLocaleDateString()
                              : "Not set"}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Territory</p>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                            {opportunity.territory || "Not specified"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Opportunity Amount</p>
                      <p className="text-2xl font-bold">
                        {new Intl.NumberFormat("en-ET", {
                          style: "currency",
                          currency: "ETB",
                          minimumFractionDigits: 2,
                        }).format(opportunity.opportunity_amount)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "activities" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Activities</CardTitle>
                      <CardDescription>
                        Tasks and follow-ups related to this opportunity
                      </CardDescription>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => router.push(`/crm/activities/new?doctype=Opportunity&name=${opportunity.name}`)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Activity
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Activities would be loaded here from the Activities API</p>
                    <Button className="mt-4" onClick={() => router.push(`/crm/activities/new?doctype=Opportunity&name=${opportunity.name}`)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Activity
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "communications" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Communications</CardTitle>
                      <CardDescription>
                        Emails, calls, and meetings with this opportunity
                      </CardDescription>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => router.push(`/crm/communications/new?doctype=Opportunity&name=${opportunity.name}`)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Communication
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Communications would be loaded here from the Communications API</p>
                    <Button className="mt-4" onClick={() => router.push(`/crm/communications/new?doctype=Opportunity&name=${opportunity.name}`)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Communication
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
                <CardTitle>Opportunity Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Name</span>
                    <span className="font-medium">{opportunity.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type</span>
                    <Badge variant="outline">{opportunity.opportunity_type}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Status</span>
                    <Badge className={getStatusColor(opportunity.status)}>
                      {opportunity.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Stage</span>
                    <Badge className={getStageColor(opportunity.sales_stage)}>
                      {opportunity.sales_stage}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Probability</span>
                    <span>{opportunity.probability}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('en-ET', {
                        style: 'currency',
                        currency: 'ETB',
                        minimumFractionDigits: 2
                      }).format(opportunity.opportunity_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expected Closing</span>
                    <span>
                      {opportunity.expected_closing_date 
                        ? new Date(opportunity.expected_closing_date).toLocaleDateString()
                        : "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Territory</span>
                    <span>{opportunity.territory || "Not specified"}</span>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={toggleStatus}
                  >
                    {opportunity.status === "Open" ? (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Mark Quoted
                      </>
                    ) : opportunity.status === "Quoted" ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Closed
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 mr-2" />
                        Reopen Opportunity
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push(`/crm/opportunities/${opportunity.name}/edit`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Opportunity
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push(`/crm/quotations/new?opportunity=${opportunity.name}`)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Quotation
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