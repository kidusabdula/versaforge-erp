// app/crm/customers/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Users, 
  Save, 
  X,
  ArrowLeft,
  MapPin,
  CreditCard,
  Building,
  User
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface CRMOptions {
  customerGroups: Array<{ name: string; customer_group_name: string }>;
  territories: Array<{ name: string; territory_name: string }>;
}

export default function NewCustomerPage() {
  const { push: toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [options, setOptions] = useState<CRMOptions | null>(null);
  
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_type: "Individual",
    customer_group: "",
    territory: "",
    default_currency: "ETB",
    credit_limit: 0
  });

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    setOptionsLoading(true);
    try {
      const response = await fetch('/api/crm/options');
      if (response.ok) {
        const data = await response.json();
        setOptions(data.data.options);
      }
    } catch (error) {
      toast({
        variant: "error",
        title: "Error",
        description: "Failed to load options"
      });
    } finally {
      setOptionsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.customer_name) {
      toast({
        variant: "error",
        title: "Error",
        description: "Customer name is required"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/crm/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to create customer');
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: `Customer ${data.data.customer.name} created successfully`
      });

      router.push('/crm/customers');
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to create customer: ${(error as Error).message}`
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
            onClick={() => router.push('/crm/customers')}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Users className="w-8 h-8 mr-3 text-primary" />
              New Customer
            </h1>
            <p className="text-muted-foreground">Create a new customer</p>
          </div>
        </div>
        <Button 
          onClick={handleSubmit} 
          disabled={loading}
          className="flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Creating...' : 'Create Customer'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Enter the basic details for this customer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => handleInputChange('customer_name', e.target.value)}
                  placeholder="Customer name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_type">Customer Type</Label>
                  <Select
                    value={formData.customer_type}
                    onValueChange={(value) => handleInputChange('customer_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Individual">Individual</SelectItem>
                      <SelectItem value="Company">Company</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="customer_group">Customer Group</Label>
                  <Select
                    value={formData.customer_group}
                    onValueChange={(value) => handleInputChange('customer_group', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Group" />
                    </SelectTrigger>
                    <SelectContent>
                      {options?.customerGroups.map(group => (
                        <SelectItem key={group.name} value={group.name}>
                          {group.customer_group_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="territory">Territory</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <Select
                      value={formData.territory}
                      onValueChange={(value) => handleInputChange('territory', value)}
                    >
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Select Territory" />
                      </SelectTrigger>
                      <SelectContent>
                        {options?.territories.map(territory => (
                          <SelectItem key={territory.name} value={territory.name}>
                            {territory.territory_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="default_currency">Default Currency</Label>
                  <Select
                    value={formData.default_currency}
                    onValueChange={(value) => handleInputChange('default_currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ETB">ETB - Ethiopian Birr</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="credit_limit">Credit Limit</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input
                    id="credit_limit"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.credit_limit}
                    onChange={(e) => handleInputChange('credit_limit', parseFloat(e.target.value))}
                    placeholder="0.00"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter 0 for no credit limit
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary */}
        <div>
          {/* Summary Card */}
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Customer Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Name</span>
                  <span>{formData.customer_name || "Not specified"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type</span>
                  <Badge variant="outline">{formData.customer_type}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Group</span>
                  <span>{formData.customer_group || "Not specified"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Territory</span>
                  <span>{formData.territory || "Not specified"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Currency</span>
                  <span>{formData.default_currency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Credit Limit</span>
                  <span>
                    {formData.credit_limit > 0 
                      ? new Intl.NumberFormat('en-ET', {
                          style: 'currency',
                          currency: formData.default_currency,
                          minimumFractionDigits: 2
                        }).format(formData.credit_limit)
                      : "No limit"}
                  </span>
                </div>
              </div>

              <Button 
                onClick={handleSubmit} 
                disabled={loading || !formData.customer_name}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Creating...' : 'Create Customer'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}