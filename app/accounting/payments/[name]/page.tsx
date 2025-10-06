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
  CreditCard, 
  ArrowLeft, 
  Edit, 
  Download,
  Printer,
  Share,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Building2,
  User
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

interface PaymentEntry {
  name: string;
  payment_type: "Receive" | "Pay";
  party_type: "Customer" | "Supplier" | "Employee";
  party: string;
  party_name: string | { customer_name?: string; supplier_name?: string; employee_name?: string };
  posting_date: string;
  paid_amount: number;
  received_amount: number;
  reference_no: string;
  reference_date: string;
  status: string;
  payment_method: string;
  company: string;
  currency: string;
  mode_of_payment: string;
  paid_from: string;
  paid_to: string;
  paid_from_account_name: string | { account_name: string };
  paid_to_account_name: string | { account_name: string };
}

export default function PaymentDetailPage() {
  const { push: toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<PaymentEntry | null>(null);

  const fetchPayment = useCallback(async () => {
    try {
      const response = await fetch(`/api/accounting/payments/${params.name}`);
      if (!response.ok) {
        throw new Error('Failed to fetch payment');
      }

      const data = await response.json();
      setPayment(data.data.payment);
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to load payment: ${(error as Error).message}`
      });
    } finally {
      setLoading(false);
    }
  }, [params.name]);

  useEffect(() => {
    fetchPayment();
  }, [fetchPayment]);

  const getAccountName = (accountName: string | { account_name: string }): string => {
    if (typeof accountName === 'string') {
      return accountName;
    }
    return accountName.account_name || 'Unknown';
  };

  const getPartyName = (partyName: string | { customer_name?: string; supplier_name?: string; employee_name?: string }): string => {
    if (typeof partyName === 'string') {
      return partyName;
    }
    
    // Handle object case
    if (partyName.customer_name) {
      return partyName.customer_name;
    }
    if (partyName.supplier_name) {
      return partyName.supplier_name;
    }
    if (partyName.employee_name) {
      return partyName.employee_name;
    }
    
    return 'Unknown';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'submitted':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'reconciled':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentTypeColor = (type: string) => {
    return type === 'Receive' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
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

  if (!payment) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <CreditCard className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Payment Not Found</h2>
          <p className="text-muted-foreground mb-4">The payment entry you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push('/accounting/payments')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Payments
          </Button>
        </div>
      </div>
    );
  }

  const amount = payment.payment_type === 'Receive' ? payment.received_amount : payment.paid_amount;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/accounting/payments')}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <CreditCard className="w-8 h-8 mr-3 text-primary" />
                Payment Entry
              </h1>
              <p className="text-muted-foreground">View and manage payment entry details</p>
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
              onClick={() => router.push(`/accounting/payments/${payment.name}/edit`)}
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
                        <p className="text-sm text-muted-foreground">Payment Number</p>
                        <p className="font-medium text-lg">{payment.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Payment Type</p>
                        <Badge className={getPaymentTypeColor(payment.payment_type)}>
                          {payment.payment_type === 'Receive' ? (
                            <div className="flex items-center">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Receive
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <TrendingDown className="w-3 h-3 mr-1" />
                              Pay
                            </div>
                          )}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status}
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
                          <p className="font-medium">{new Date(payment.posting_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Party</p>
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-muted-foreground" />
                          <p className="font-medium">{getPartyName(payment.party_name)}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Party Type</p>
                        <p className="font-medium">{payment.party_type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Company</p>
                        <p className="font-medium">{payment.company}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
                        <p className="font-bold text-lg">{formatCurrency(amount)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Currency</p>
                      <p className="font-medium">{payment.currency}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Method</p>
                      <div className="flex items-center">
                        <CreditCard className="w-4 h-4 mr-2 text-muted-foreground" />
                        <p className="font-medium">{payment.mode_of_payment}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Reference Number</p>
                      <p className="font-medium">{payment.reference_no || 'N/A'}</p>
                    </div>
                  </div>

                  {payment.reference_date && (
                    <div>
                      <p className="text-sm text-muted-foreground">Reference Date</p>
                      <p className="font-medium">{new Date(payment.reference_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Account Information */}
           <Card>
  <CardHeader>
    <CardTitle>Account Information</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 gap-6">
      <div>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Paid From</p>
            <div className="flex items-center">
              <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
              <p className="font-medium">{getAccountName(payment.paid_from_account_name)}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Paid From Account</p>
            <p className="font-mono text-sm">{payment.paid_from}</p>
          </div>
        </div>
      </div>
      <div>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Paid To</p>
            <div className="flex items-center">
              <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
              <p className="font-medium">{getAccountName(payment.paid_to_account_name)}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Paid To Account</p>
            <p className="font-mono text-sm">{payment.paid_to}</p>
          </div>
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
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Payment Type</span>
                    <Badge className={getPaymentTypeColor(payment.payment_type)}>
                      {payment.payment_type === 'Receive' ? (
                        <div className="flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Receive
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          Pay
                        </div>
                      )}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount</span>
                    <span className="font-bold text-lg">{formatCurrency(amount)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Currency:</span>
                      <span>{payment.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment Method:</span>
                      <span>{payment.mode_of_payment}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant="outline">{payment.status}</Badge>
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