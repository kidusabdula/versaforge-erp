// app/accounting/payments/new/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
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
  CreditCard, 
  Save, 
  ArrowLeft,
  Calculator,
  TrendingUp,
  TrendingDown,
  Search
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface AccountingOptions {
  companies: Array<{ name: string; company_name: string }>;
  customers: Array<{ name: string; customer_name: string }>;
  suppliers: Array<{ name: string; supplier_name: string }>;
  employees: Array<{ name: string; employee_name: string }>;
  paymentMethods: Array<{ name: string; mode_of_payment: string }>;
  accounts: Array<{
    name: string;
    account_name: string;
    account_type: string;
    root_type: string;
  }>;
}

interface Party {
  name: string;
  display_name: string;
  type: string;
}

export default function NewPaymentPage() {
  const { push: toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [options, setOptions] = useState<AccountingOptions | null>(null);
  const [partySearchQuery, setPartySearchQuery] = useState("");
  const [filteredParties, setFilteredParties] = useState<Party[]>([]);
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    company: "Ma Beignet (Demo)",
    payment_type: "Receive",
    party_type: "Customer",
    party: "",
    posting_date: new Date().toISOString().split('T')[0],
    amount: 0,
    currency: "ETB",
    reference_no: "",
    reference_date: new Date().toISOString().split('T')[0],
    payment_method: "",
    paid_from: "",
    paid_to: "",
    status: "Draft"
  });

  const fetchOptions = useCallback(async () => {
    setOptionsLoading(true);
    try {
      const response = await fetch('/api/accounting/options?module=payments');
      if (response.ok) {
        const data = await response.json();
        setOptions(data.data.options);
      }
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: "Failed to load options"
      });
    } finally {
      setOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  useEffect(() => {
    if (options && partySearchQuery) {
      const query = partySearchQuery.toLowerCase();
      const parties: Party[] = [];
      
      if (formData.party_type === "Customer") {
        options.customers.forEach(customer => {
          if (customer.customer_name.toLowerCase().includes(query) || customer.name.toLowerCase().includes(query)) {
            parties.push({
              name: customer.name,
              display_name: customer.customer_name,
              type: "Customer"
            });
          }
        });
      } else if (formData.party_type === "Supplier") {
        options.suppliers.forEach(supplier => {
          if (supplier.supplier_name.toLowerCase().includes(query) || supplier.name.toLowerCase().includes(query)) {
            parties.push({
              name: supplier.name,
              display_name: supplier.supplier_name,
              type: "Supplier"
            });
          }
        });
      } else if (formData.party_type === "Employee") {
        options.employees.forEach(employee => {
          if (employee.employee_name.toLowerCase().includes(query) || employee.name.toLowerCase().includes(query)) {
            parties.push({
              name: employee.name,
              display_name: employee.employee_name,
              type: "Employee"
            });
          }
        });
      }
      
      setFilteredParties(parties);
      setShowPartyDropdown(true);
    } else {
      setFilteredParties([]);
      setShowPartyDropdown(false);
    }
  }, [partySearchQuery, formData.party_type, options]);

  

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Reset party when party type changes
    if (field === 'party_type') {
      setFormData(prev => ({ ...prev, party_type: value as string, party: "" }));
      setPartySearchQuery("");
    }
  };

  const handlePartySelect = (party: Party) => {
    setFormData(prev => ({ ...prev, party: party.name }));
    setPartySearchQuery("");
    setShowPartyDropdown(false);
  };

  const handleSubmit = async () => {
    const requiredFields = ['company', 'payment_type', 'party_type', 'party', 'posting_date', 'amount', 'payment_method', 'paid_from', 'paid_to'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      toast({
        variant: "error",
        title: "Error",
        description: `Missing required fields: ${missingFields.join(', ')}`
      });
      return;
    }

    setLoading(true);
    try {
      const paymentData = {
        ...formData,
        paid_amount: formData.payment_type === "Pay" ? formData.amount : 0,
        received_amount: formData.payment_type === "Receive" ? formData.amount : 0,
      };

      const response = await fetch('/api/accounting/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to create payment');
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: `Payment entry ${data.data.payment.name} created successfully`
      });

      router.push('/accounting/payments');
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to create payment: ${(error as Error).message}`
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
            onClick={() => router.push('/accounting/payments')}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <CreditCard className="w-8 h-8 mr-3 text-primary" />
              New Payment Entry
            </h1>
            <p className="text-muted-foreground">Create a new payment entry</p>
          </div>
        </div>
        <Button 
          onClick={handleSubmit} 
          disabled={loading}
          className="flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Creating...' : 'Create Payment'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Enter the basic details for this payment entry</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Select
                    value={formData.company}
                    onValueChange={(value) => handleInputChange('company', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {options?.companies.map(company => (
                        <SelectItem key={company.name} value={company.name}>
                          {company.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="payment_type">Payment Type *</Label>
                  <Select
                    value={formData.payment_type}
                    onValueChange={(value) => handleInputChange('payment_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Receive">
                        <div className="flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Receive
                        </div>
                      </SelectItem>
                      <SelectItem value="Pay">
                        <div className="flex items-center">
                          <TrendingDown className="w-4 h-4 mr-2" />
                          Pay
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="party_type">Party Type *</Label>
                  <Select
                    value={formData.party_type}
                    onValueChange={(value) => handleInputChange('party_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Customer">Customer</SelectItem>
                      <SelectItem value="Supplier">Supplier</SelectItem>
                      <SelectItem value="Employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="posting_date">Posting Date *</Label>
                  <Input
                    id="posting_date"
                    type="date"
                    value={formData.posting_date}
                    onChange={(e) => handleInputChange('posting_date', e.target.value)}
                  />
                </div>
              </div>

              {/* Party Search */}
              <div>
                <Label htmlFor="party">Party *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input
                    id="party"
                    placeholder={`Search for a ${formData.party_type.toLowerCase()}...`}
                    value={partySearchQuery}
                    onChange={(e) => setPartySearchQuery(e.target.value)}
                    className="pl-10"
                    onFocus={() => setShowPartyDropdown(true)}
                  />
                  
                  {showPartyDropdown && filteredParties.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-md max-h-60 overflow-y-auto">
                      {filteredParties.map((party) => (
                        <div
                          key={party.name}
                          className="p-3 hover:bg-muted cursor-pointer border-b"
                          onClick={() => handlePartySelect(party)}
                        >
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium">{party.display_name}</p>
                              <p className="text-sm text-muted-foreground">{party.type}</p>
                            </div>
                            <Badge variant="outline">{party.type}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {formData.party && (
                  <div className="mt-2">
                    <Badge variant="secondary">
                      Selected: {formData.party}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', parseFloat(e.target.value))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => handleInputChange('currency', value)}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reference_no">Reference Number</Label>
                  <Input
                    id="reference_no"
                    value={formData.reference_no}
                    onChange={(e) => handleInputChange('reference_no', e.target.value)}
                    placeholder="Check number, receipt number, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="reference_date">Reference Date</Label>
                  <Input
                    id="reference_date"
                    type="date"
                    value={formData.reference_date}
                    onChange={(e) => handleInputChange('reference_date', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>Configure payment method and accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="payment_method">Payment Method *</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) => handleInputChange('payment_method', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Payment Method" />
                    </SelectTrigger>
                    <SelectContent>
                      {options?.paymentMethods.map(method => (
                        <SelectItem key={method.name} value={method.mode_of_payment}>
                          {method.mode_of_payment}
                        </SelectItem>
                      ))}
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
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Submitted">Submitted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paid_from">Paid From Account *</Label>
                  <Select
                    value={formData.paid_from}
                    onValueChange={(value) => handleInputChange('paid_from', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                    <SelectContent>
                      {options?.accounts
                        .filter(account => account.root_type === 'Asset')
                        .map(account => (
                          <SelectItem key={account.name} value={account.name}>
                            {account.account_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="paid_to">Paid To Account *</Label>
                  <Select
                    value={formData.paid_to}
                    onValueChange={(value) => handleInputChange('paid_to', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                    <SelectContent>
                      {options?.accounts
                        .filter(account => account.root_type === 'Asset')
                        .map(account => (
                          <SelectItem key={account.name} value={account.name}>
                            {account.account_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
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
              <CardTitle className="flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Payment Type</span>
                  <Badge className={formData.payment_type === 'Receive' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {formData.payment_type === 'Receive' ? (
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
                  <span>Party Type</span>
                  <span>{formData.party_type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount</span>
                  <span className="font-bold text-lg">
                    {formData.amount.toFixed(2)} ETB
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Party:</span>
                    <span>{formData.party || 'Not selected'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span>{formData.payment_method || 'Not selected'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant="outline">{formData.status}</Badge>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSubmit} 
                disabled={loading || !formData.company || !formData.payment_type || !formData.party_type || !formData.party || !formData.amount || !formData.payment_method || !formData.paid_from || !formData.paid_to}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Creating...' : 'Create Payment Entry'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}