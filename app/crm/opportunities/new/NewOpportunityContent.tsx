// app/crm/opportunities/new/NewOpportunityContent.tsx
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
import { useToast } from "@/components/ui/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  Save,
  X,
  ArrowLeft,
  Calendar,
  DollarSign,
  Percent,
  MapPin,
  Users,
  Building,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";

interface CRMOptions {
  territories: Array<{ name: string; territory_name: string }>;
  salesStages: Array<{ name: string; stage_name: string }>;
  customers: Array<{ name: string; customer_name: string }>;
  leads: Array<{ name: string; lead_name: string }>;
}

export default function NewOpportunityContent() {
  const { push: toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [options, setOptions] = useState<CRMOptions | null>(null);

  // Get customer or lead from URL params if available
  const customerParam = searchParams.get("customer") || "";
  const leadParam = searchParams.get("lead") || "";

  const [formData, setFormData] = useState({
    opportunity_from: customerParam ? "Customer" : leadParam ? "Lead" : "",
    customer: customerParam,
    lead: leadParam,
    opportunity_type: "Sales",
    status: "Open",
    probability: 50,
    expected_closing_date: "",
    opportunity_amount: 0,
    sales_stage: "",
    territory: "",
  });

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    setOptionsLoading(true);
    try {
      const response = await fetch("/api/crm/options");
      if (response.ok) {
        const data = await response.json();
        const opts = data.data.options;

        setOptions({
          territories: opts.territories ?? [],
          salesStages: opts.salesStages ?? [],
          customers: opts.customers ?? [],
          leads: opts.leads ?? [],
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

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleOpportunityFromChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      opportunity_from: value,
      customer: value === "Customer" ? prev.customer : "",
      lead: value === "Lead" ? prev.lead : "",
    }));
  };

  const handleSubmit = async () => {
    if (!formData.opportunity_from || (!formData.customer && !formData.lead)) {
      toast({
        variant: "error",
        title: "Error",
        description: "Please select a customer or lead",
      });
      return;
    }

    if (!formData.opportunity_amount || formData.opportunity_amount <= 0) {
      toast({
        variant: "error",
        title: "Error",
        description: "Opportunity amount must be greater than 0",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/crm/opportunities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Failed to create opportunity");
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: `Opportunity ${data.data.opportunity.name} created successfully`,
      });

      router.push("/crm/opportunities");
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to create opportunity: ${
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
            onClick={() => router.push("/crm/opportunities")}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <TrendingUp className="w-8 h-8 mr-3 text-primary" />
              New Opportunity
            </h1>
            <p className="text-muted-foreground">
              Create a new sales opportunity
            </p>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Creating..." : "Create Opportunity"}
        </Button>
      </div>

      {(customerParam || leadParam) && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              <div>
                <p className="font-medium">Creating opportunity for:</p>
                <p className="text-sm text-muted-foreground">
                  {customerParam
                    ? `Customer: ${customerParam}`
                    : `Lead: ${leadParam}`}
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
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the details for this opportunity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="opportunity_from">Opportunity From</Label>
                  <Select
                    value={formData.opportunity_from}
                    onValueChange={handleOpportunityFromChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Customer">Customer</SelectItem>
                      <SelectItem value="Lead">Lead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="opportunity_type">Opportunity Type</Label>
                  <Select
                    value={formData.opportunity_type}
                    onValueChange={(value) =>
                      handleInputChange("opportunity_type", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Support">Support</SelectItem>
                      <SelectItem value="Renewal">Renewal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="customer_lead">
                  {formData.opportunity_from === "Customer"
                    ? "Customer *"
                    : "Lead *"}
                </Label>
                <Select
                  value={
                    formData.opportunity_from === "Customer"
                      ? formData.customer
                      : formData.lead
                  }
                  onValueChange={(value) =>
                    handleInputChange(
                      formData.opportunity_from === "Customer"
                        ? "customer"
                        : "lead",
                      value
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={`Select ${
                        formData.opportunity_from === "Customer"
                          ? "Customer"
                          : "Lead"
                      }`}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.opportunity_from === "Customer"
                      ? options?.customers.map((customer) => (
                          <SelectItem key={customer.name} value={customer.name}>
                            {customer.customer_name}
                          </SelectItem>
                        ))
                      : options?.leads.map((lead) => (
                          <SelectItem key={lead.name} value={lead.name}>
                            {lead.lead_name}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                      <SelectItem value="Quoted">Quoted</SelectItem>
                      <SelectItem value="Lost">Lost</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sales_stage">Sales Stage</Label>
                  <Select
                    value={formData.sales_stage}
                    onValueChange={(value) =>
                      handleInputChange("sales_stage", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {options?.salesStages.map((stage) => (
                        <SelectItem key={stage.name} value={stage.name}>
                          {stage.stage_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="probability">Probability (%)</Label>
                  <div className="relative">
                    <Percent
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={20}
                    />
                    <Input
                      id="probability"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.probability}
                      onChange={(e) =>
                        handleInputChange(
                          "probability",
                          parseInt(e.target.value)
                        )
                      }
                      placeholder="50"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="expected_closing_date">
                    Expected Closing Date
                  </Label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={20}
                    />
                    <Input
                      id="expected_closing_date"
                      type="date"
                      value={formData.expected_closing_date}
                      onChange={(e) =>
                        handleInputChange(
                          "expected_closing_date",
                          e.target.value
                        )
                      }
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="opportunity_amount">
                    Opportunity Amount *
                  </Label>
                  <div className="relative">
                    <DollarSign
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={20}
                    />
                    <Input
                      id="opportunity_amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.opportunity_amount}
                      onChange={(e) =>
                        handleInputChange(
                          "opportunity_amount",
                          parseFloat(e.target.value)
                        )
                      }
                      placeholder="0.00"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="territory">Territory</Label>
                  <div className="relative">
                    <MapPin
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={20}
                    />
                    <Select
                      value={formData.territory}
                      onValueChange={(value) =>
                        handleInputChange("territory", value)
                      }
                    >
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Select Territory" />
                      </SelectTrigger>
                      <SelectContent>
                        {options?.territories.map((territory) => (
                          <SelectItem
                            key={territory.name}
                            value={territory.name}
                          >
                            {territory.territory_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
              <CardTitle>Opportunity Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>From</span>
                  <Badge variant="outline">{formData.opportunity_from}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Type</span>
                  <Badge variant="outline">{formData.opportunity_type}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <Badge variant="outline">{formData.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Stage</span>
                  <span>{formData.sales_stage || "Not specified"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Probability</span>
                  <span>{formData.probability}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount</span>
                  <span className="font-medium">
                    {formData.opportunity_amount > 0
                      ? new Intl.NumberFormat("en-ET", {
                          style: "currency",
                          currency: "ETB",
                          minimumFractionDigits: 2,
                        }).format(formData.opportunity_amount)
                      : "ETB 0.00"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Expected Closing</span>
                  <span>
                    {formData.expected_closing_date
                      ? new Date(
                          formData.expected_closing_date
                        ).toLocaleDateString()
                      : "Not set"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Territory</span>
                  <span>{formData.territory || "Not specified"}</span>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={
                  loading ||
                  !formData.opportunity_from ||
                  (!formData.customer && !formData.lead) ||
                  !formData.opportunity_amount ||
                  formData.opportunity_amount <= 0
                }
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Creating..." : "Create Opportunity"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
