// app/crm/communications/new/NewCommunicationContent.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  MessageSquare,
  Save,
  X,
  ArrowLeft,
  Mail,
  Phone,
  Users,
  AlertCircle,
  FileText,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";

// Valid communication types from Frappe
const VALID_COMMUNICATION_TYPES = [
  "Communication",
  "Comment",
  "Chat",
  "Notification",
  "Feedback",
  "Automated Message",
] as const;

// Mapping for display names to valid types
const COMMUNICATION_TYPE_MAPPING = {
  General: "Communication",
  Email: "Communication", // Map to Communication since Email is not valid
  "Phone Call": "Communication", // Map to Communication since Phone is not valid
  Meeting: "Communication", // Map to Communication since Meeting is not valid
} as const;

export default function NewCommunicationContent() {
  const { push: toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  // Get reference doctype and name from URL params if available
  const referenceDoctype = searchParams.get("doctype") || "";
  const referenceName = searchParams.get("name") || "";

  const [formData, setFormData] = useState({
    subject: "",
    content: "",
    communication_type:
      "Communication" as (typeof VALID_COMMUNICATION_TYPES)[number],
    status: "Open",
    reference_doctype: referenceDoctype,
    reference_name: referenceName,
  });

  // Display type for UI (different from actual type sent to API)
  const [displayCommunicationType, setDisplayCommunicationType] =
    useState("General");

  const handleInputChange = (field: string, value: string) => {
    if (field === "communication_type") {
      // Update both display type and actual type
      setDisplayCommunicationType(value);
      const actualType =
        COMMUNICATION_TYPE_MAPPING[
          value as keyof typeof COMMUNICATION_TYPE_MAPPING
        ] || "Communication";
      setFormData((prev) => ({ ...prev, communication_type: actualType }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.subject || !formData.content) {
      toast({
        variant: "error",
        title: "Error",
        description: "Subject and content are required",
      });
      return;
    }

    setLoading(true);
    try {
      // Prepare the data for API - ensure communication_type is valid
      const apiData = {
        ...formData,
        // Ensure communication_type is one of the valid types
        communication_type: VALID_COMMUNICATION_TYPES.includes(
          formData.communication_type as any
        )
          ? formData.communication_type
          : "Communication",
      };

      // If we have reference doctype and name, use the by-reference API
      if (formData.reference_doctype && formData.reference_name) {
        const params = new URLSearchParams();
        params.set("doctype", formData.reference_doctype);
        params.set("name", formData.reference_name);

        const response = await fetch(
          `/api/crm/communications/by-reference?${params}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(apiData),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.details || "Failed to create communication"
          );
        }

        const data = await response.json();
        toast({
          title: "Success",
          description: `Communication ${data.data.communication.name} created successfully`,
        });

        // Navigate back to the reference entity
        router.push(
          `/crm/${formData.reference_doctype.toLowerCase()}/${
            formData.reference_name
          }`
        );
      } else {
        // Use the general communications API
        const response = await fetch("/api/crm/communications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.details || "Failed to create communication"
          );
        }

        const data = await response.json();
        toast({
          title: "Success",
          description: `Communication ${data.data.communication.name} created successfully`,
        });

        router.push("/crm/communications");
      }
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to create communication: ${
          (error as Error).message
        }`,
      });
    } finally {
      setLoading(false);
    }
  };

  const getCommunicationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "email":
      case "communication":
        return <Mail className="w-4 h-4 mr-2" />;
      case "phone":
        return <Phone className="w-4 h-4 mr-2" />;
      case "meeting":
        return <Users className="w-4 h-4 mr-2" />;
      case "comment":
        return <MessageSquare className="w-4 h-4 mr-2" />;
      case "chat":
        return <MessageSquare className="w-4 h-4 mr-2" />;
      case "notification":
        return <AlertCircle className="w-4 h-4 mr-2" />;
      case "feedback":
        return <MessageSquare className="w-4 h-4 mr-2" />;
      case "automated message":
        return <MessageSquare className="w-4 h-4 mr-2" />;
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

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() =>
              referenceDoctype && referenceName
                ? router.push(
                    `/crm/${referenceDoctype.toLowerCase()}/${referenceName}`
                  )
                : router.push("/crm/communications")
            }
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <MessageSquare className="w-8 h-8 mr-3 text-primary" />
              New Communication
            </h1>
            <p className="text-muted-foreground">Record a new communication</p>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Creating..." : "Create Communication"}
        </Button>
      </div>

      {referenceDoctype && referenceName && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              {getReferenceIcon(referenceDoctype)}
              <div>
                <p className="font-medium">Creating communication for:</p>
                <p className="text-sm text-muted-foreground">
                  {referenceDoctype} - {referenceName}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Communication Details</CardTitle>
              <CardDescription>
                Enter the details for this communication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => handleInputChange("subject", e.target.value)}
                  placeholder="Communication subject"
                />
              </div>

              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleInputChange("content", e.target.value)}
                  placeholder="Detailed content of the communication"
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="communication_type">Communication Type</Label>
                  <Select
                    value={displayCommunicationType}
                    onValueChange={(value) =>
                      handleInputChange("communication_type", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Phone Call">Phone Call</SelectItem>
                      <SelectItem value="Meeting">Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Displayed as {displayCommunicationType}, saved as{" "}
                    {formData.communication_type}
                  </p>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      handleInputChange("status", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!referenceDoctype && !referenceName && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reference_doctype">Related To Type</Label>
                    <Select
                      value={formData.reference_doctype}
                      onValueChange={(value) =>
                        handleInputChange("reference_doctype", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Lead">Lead</SelectItem>
                        <SelectItem value="Customer">Customer</SelectItem>
                        <SelectItem value="Opportunity">Opportunity</SelectItem>
                        <SelectItem value="Quotation">Quotation</SelectItem>
                        <SelectItem value="Sales Order">Sales Order</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="reference_name">Related To</Label>
                    <Input
                      id="reference_name"
                      value={formData.reference_name}
                      onChange={(e) =>
                        handleInputChange("reference_name", e.target.value)
                      }
                      placeholder="Reference name or ID"
                    />
                  </div>
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
              <CardTitle>Communication Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subject</span>
                  <span>{formData.subject || "Not specified"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Display Type</span>
                  <div className="flex items-center">
                    {getCommunicationIcon(displayCommunicationType)}
                    <span className="ml-1 capitalize">
                      {displayCommunicationType}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Actual Type</span>
                  <Badge variant="outline">{formData.communication_type}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <Badge variant="outline">{formData.status}</Badge>
                </div>
                {formData.reference_doctype && formData.reference_name && (
                  <>
                    <div className="flex justify-between">
                      <span>Related To</span>
                      <span>{formData.reference_doctype}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reference</span>
                      <span>{formData.reference_name}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Content Preview
                </p>
                <p className="text-sm line-clamp-4">
                  {formData.content || "No content provided"}
                </p>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading || !formData.subject || !formData.content}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Creating..." : "Create Communication"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
