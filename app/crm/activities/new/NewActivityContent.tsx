// app/crm/activities/new/NewActivityContent.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  SelectValue 
} from "@/components/ui/select";
import { 
  Activity, 
  Save, 
  X,
  ArrowLeft,
  Calendar,
  User,
  AlertCircle,
  Users,
  FileText,
  ShoppingCart,
  TrendingUp
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";

interface CRMOptions {
  users: Array<{ name: string; full_name: string }>;
}
export default function NewActivityContent() {
  const { push: toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [options, setOptions] = useState<CRMOptions | null>(null);
  
  // Get reference doctype and name from URL params if available
  const referenceDoctype = searchParams.get('doctype') || '';
  const referenceName = searchParams.get('name') || '';
  
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    activity_type: "Task",
    status: "Open",
    priority: "Medium",
    due_date: new Date().toISOString().split('T')[0],
    assigned_to: "",
    reference_doctype: referenceDoctype,
    reference_name: referenceName
  });

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    setOptionsLoading(true);
    try {
      // In a real implementation, you would have an API to get users
      // For now, we'll use mock data
      setOptions({
        users: [
          { name: "user@example.com", full_name: "John Doe" },
          { name: "manager@example.com", full_name: "Jane Smith" },
          { name: "admin@example.com", full_name: "Admin User" }
        ]
      });
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.subject) {
      toast({
        variant: "error",
        title: "Error",
        description: "Subject is required"
      });
      return;
    }

    setLoading(true);
    try {
      // If we have reference doctype and name, use the by-reference API
      if (formData.reference_doctype && formData.reference_name) {
        const params = new URLSearchParams();
        params.set('doctype', formData.reference_doctype);
        params.set('name', formData.reference_name);
        
        const response = await fetch(`/api/crm/activities/by-reference?${params}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'Failed to create activity');
        }

        const data = await response.json();
        toast({
          title: "Success",
          description: `Activity ${data.data.activity.name} created successfully`
        });

        // Navigate back to the reference entity
        router.push(`/crm/${formData.reference_doctype.toLowerCase()}/${formData.reference_name}`);
      } else {
        // Use the general activities API
        const response = await fetch('/api/crm/activities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'Failed to create activity');
        }

        const data = await response.json();
        toast({
          title: "Success",
          description: `Activity ${data.data.activity.name} created successfully`
        });

        router.push('/crm/activities');
      }
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to create activity: ${(error as Error).message}`
      });
    } finally {
      setLoading(false);
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
            onClick={() => referenceDoctype && referenceName 
              ? router.push(`/crm/${referenceDoctype.toLowerCase()}/${referenceName}`)
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
              New Activity
            </h1>
            <p className="text-muted-foreground">Create a new activity</p>
          </div>
        </div>
        <Button 
          onClick={handleSubmit} 
          disabled={loading}
          className="flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Creating...' : 'Create Activity'}
        </Button>
      </div>

      {referenceDoctype && referenceName && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              {getReferenceIcon(referenceDoctype)}
              <div>
                <p className="font-medium">Creating activity for:</p>
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
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Enter the details for this activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder="Activity subject"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Detailed description of the activity"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="activity_type">Activity Type</Label>
                  <Select
                    value={formData.activity_type}
                    onValueChange={(value) => handleInputChange('activity_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Task">Task</SelectItem>
                      <SelectItem value="Event">Event</SelectItem>
                      <SelectItem value="Call">Call</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Meeting">Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value)}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => handleInputChange('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="due_date">Due Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => handleInputChange('due_date', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="assigned_to">Assigned To</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  <Select
                    value={formData.assigned_to}
                    onValueChange={(value) => handleInputChange('assigned_to', value)}
                  >
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Select User" />
                    </SelectTrigger>
                    <SelectContent>
                      {options?.users.map(user => (
                        <SelectItem key={user.name} value={user.name}>
                          {user.full_name}
                        </SelectItem>
                      ))}
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
                      onValueChange={(value) => handleInputChange('reference_doctype', value)}
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
                      onChange={(e) => handleInputChange('reference_name', e.target.value)}
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
              <CardTitle>Activity Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subject</span>
                  <span>{formData.subject || "Not specified"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type</span>
                  <Badge variant="outline">{formData.activity_type}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <Badge variant="outline">{formData.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Priority</span>
                  <Badge variant="outline">{formData.priority}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Due Date</span>
                  <span>{new Date(formData.due_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Assigned To</span>
                  <span>
                    {options?.users.find(u => u.name === formData.assigned_to)?.full_name || 
                     (formData.assigned_to || "Unassigned")}
                  </span>
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

              <Button 
                onClick={handleSubmit} 
                disabled={loading || !formData.subject}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Creating...' : 'Create Activity'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

}