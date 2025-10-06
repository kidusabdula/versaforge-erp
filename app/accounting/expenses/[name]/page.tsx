// app/accounting/expenses/[name]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  FileText, 
  ArrowLeft, 
  Edit, 
  Download,
  Printer,
  Share,
  Paperclip,
  DollarSign,
  Calendar,
  User
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

interface ExpenseRecord {
  name: string;
  expense_type: string;
  posting_date: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  description: string;
  paid_by: string;
  status: string;
  employee: string;
  company: string;
  currency: string;
  approval_status: string;
  remark: string;
  attachments?: Array<{
    file_name: string;
    file_url: string;
    file_size: number;
  }>;
}

export default function ExpenseDetailPage() {
  const { push: toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [expense, setExpense] = useState<ExpenseRecord | null>(null);

  const fetchExpense = useCallback(async () => {
    try {
      const response = await fetch(`/api/accounting/expenses/${params.name}`);
      if (!response.ok) {
        throw new Error('Failed to fetch expense');
      }

      const data = await response.json();
      setExpense(data.data.expense);
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to load expense: ${(error as Error).message}`
      });
    } finally {
      setLoading(false);
    }
  }, [params.name, toast]);

  useEffect(() => {
    fetchExpense();
  }, [params.name, fetchExpense]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'unpaid':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'claimed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getApprovalStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  if (!expense) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Expense Not Found</h2>
          <p className="text-muted-foreground mb-4">The expense claim you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push('/accounting/expenses')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Expenses
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
              onClick={() => router.push('/accounting/expenses')}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <FileText className="w-8 h-8 mr-3 text-primary" />
                Expense Claim
              </h1>
              <p className="text-muted-foreground">View and manage expense claim details</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm">
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button 
              size="sm"
              onClick={() => router.push(`/accounting/expenses/${expense.name}/edit`)}
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
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Expense Number</p>
                        <p className="font-medium text-lg">{expense.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Expense Type</p>
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
                          <p className="font-medium">{expense.expense_type}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge className={getStatusColor(expense.status)}>
                          {expense.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Approval Status</p>
                        <Badge className={getApprovalStatusColor(expense.approval_status)}>
                          {expense.approval_status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Posting Date</p>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                          <p className="font-medium">{new Date(expense.posting_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Employee</p>
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-muted-foreground" />
                          <p className="font-medium">{expense.employee}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Paid By</p>
                        <p className="font-medium">{expense.paid_by}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Company</p>
                        <p className="font-medium">{expense.company}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expense Details */}
            <Card>
              <CardHeader>
                <CardTitle>Expense Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-medium">{expense.description}</p>
                  </div>
                  
                  {expense.remark && (
                    <div>
                      <p className="text-sm text-muted-foreground">Remarks</p>
                      <p className="font-medium">{expense.remark}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-medium">{formatCurrency(expense.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tax Amount</p>
                      <p className="font-medium">{formatCurrency(expense.tax_amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="font-bold text-lg">{formatCurrency(expense.total_amount)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attachments */}
            {expense.attachments && expense.attachments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Attachments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {expense.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center">
                          <Paperclip className="w-4 h-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">{attachment.file_name}</span>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {(attachment.file_size / 1024).toFixed(1)} KB
                          </Badge>
                        </div>
                        <Button variant="outline" size="sm">
                          Download
                        </Button>
                      </div>
                    ))}
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
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Amount</span>
                    <span>{formatCurrency(expense.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax Amount</span>
                    <span>{formatCurrency(expense.tax_amount)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Amount</span>
                      <span>{formatCurrency(expense.total_amount)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Currency:</span>
                      <span>{expense.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Attachments:</span>
                      <span>{expense.attachments?.length || 0} files</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Printer className="w-4 h-4 mr-2" />
                    Print Receipt
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