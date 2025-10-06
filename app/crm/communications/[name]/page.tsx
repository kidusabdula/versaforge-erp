// app/crm/communications/[name]/page.tsx
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
  MessageSquare,
  ArrowLeft,
  Edit,
  Calendar,
  Mail,
  Phone,
  Users,
  FileText,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Communication } from "@/types/crm";

export default function CommunicationDetailPage() {
  const { push: toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [communication, setCommunication] = useState<Communication | null>(
    null
  );

  useEffect(() => {
    fetchCommunication();
  }, [params.name]);

  const fetchCommunication = async () => {
    try {
      const response = await fetch(`/api/crm/communications/${params.name}`);
      if (!response.ok) {
        throw new Error("Failed to fetch communication");
      }

      const data = await response.json();
      setCommunication(data.data.communication);
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to load communication: ${
          (error as Error).message
        }`,
      });
    } finally {
      setLoading(false);
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

  const getCommunicationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "email":
        return <Mail className="w-4 h-4 mr-2" />;
      case "phone":
        return <Phone className="w-4 h-4 mr-2" />;
      case "meeting":
        return <Users className="w-4 h-4 mr-2" />;
      default:
        return <MessageSquare className="w-4 h-4 mr-2" />;
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
    if (!communication) return;

    try {
      const newStatus = communication.status === "Open" ? "Closed" : "Open";

      const response = await fetch(
        `/api/crm/communications/${communication.name}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...communication,
            status: newStatus,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update communication status");
      }

      const data = await response.json();
      setCommunication(data.data.communication);

      toast({
        title: "Success",
        description: `Communication status updated to ${newStatus}`,
      });
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to update communication status: ${
          (error as Error).message
        }`,
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

  if (!communication) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">
            Communication Not Found
          </h2>
          <p className="text-muted-foreground mb-4">
            The communication you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.push("/crm/communications")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Communications
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
              onClick={() => router.push("/crm/communications")}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <MessageSquare className="w-8 h-8 mr-3 text-primary" />
                Communication Details
              </h1>
              <p className="text-muted-foreground">
                View and manage communication information
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={toggleStatus}>
              {communication.status === "Open" ? (
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
              onClick={() =>
                router.push(`/crm/communications/${communication.name}/edit`)
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
                <CardTitle>Communication Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Subject</p>
                        <p className="font-medium text-lg">
                          {communication.subject}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Communication ID
                        </p>
                        <p className="font-medium">{communication.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Type</p>
                        <div className="flex items-center">
                          {getCommunicationIcon(
                            communication.communication_type
                          )}
                          <span className="ml-2 capitalize">
                            {communication.communication_type}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge className={getStatusColor(communication.status)}>
                          {communication.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Created On
                        </p>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                          {new Date(
                            communication.creation
                          ).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Last Modified
                        </p>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                          {new Date(
                            communication.modified
                          ).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Created By
                        </p>
                        <p>{communication.owner}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Content</p>
                  <div className="bg-muted/50 p-4 rounded-lg whitespace-pre-wrap">
                    {communication.content}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Related Information */}
            {communication.reference_doctype &&
              communication.reference_name && (
                <Card>
                  <CardHeader>
                    <CardTitle>Related Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center p-4 bg-muted/50 rounded-lg">
                      {getReferenceIcon(communication.reference_doctype)}
                      <div>
                        <p className="font-medium">
                          {communication.reference_doctype}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {communication.reference_name}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto"
                        onClick={() =>
                          router.push(
                            `/crm/${communication.reference_doctype.toLowerCase()}/${
                              communication.reference_name
                            }`
                          )
                        }
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
                <CardTitle>Communication Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Type</span>
                    <div className="flex items-center">
                      {getCommunicationIcon(communication.communication_type)}
                      <span className="ml-1 capitalize">
                        {communication.communication_type}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Status</span>
                    <Badge className={getStatusColor(communication.status)}>
                      {communication.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Created On</span>
                    <span>
                      {new Date(communication.creation).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Created By</span>
                    <span>{communication.owner}</span>
                  </div>
                </div>

                {communication.reference_doctype &&
                  communication.reference_name && (
                    <div className="pt-4 border-t space-y-2">
                      <div className="flex justify-between">
                        <span>Related To</span>
                        <span>{communication.reference_doctype}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reference</span>
                        <span>{communication.reference_name}</span>
                      </div>
                    </div>
                  )}

                <div className="pt-4 border-t space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={toggleStatus}
                  >
                    {communication.status === "Open" ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Closed
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 mr-2" />
                        Reopen Communication
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      router.push(
                        `/crm/communications/${communication.name}/edit`
                      )
                    }
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Communication
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
