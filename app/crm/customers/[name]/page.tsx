// app/crm/customers/[name]/page.tsx
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
  Users, 
  ArrowLeft, 
  Edit, 
  MapPin,
  CreditCard,
  Building,
  User,
  Mail,
  Phone,
  Plus,
  FileText,
  ShoppingCart,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Customer, Contact, Address } from "@/types/crm";

interface CustomerWithDetails {
  customer: Customer;
  contacts: Contact[];
  addresses: Address[];
}

export default function CustomerDetailPage() {
  const { push: toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState<CustomerWithDetails | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "contacts" | "addresses">("details");

  useEffect(() => {
    fetchCustomer();
  }, [params.name]);

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/crm/customers/${params.name}`);
      if (!response.ok) {
        throw new Error('Failed to fetch customer');
      }

      const data = await response.json();
      setCustomerData(data.data);
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to load customer: ${(error as Error).message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const getCustomerTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "company":
        return "bg-blue-100 text-blue-800";
      case "individual":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
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

  if (!customerData) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Customer Not Found</h2>
          <p className="text-muted-foreground mb-4">The customer you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/crm/customers')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Customers
          </Button>
        </div>
      </div>
    );
  }

  const { customer, contacts = [], addresses = [] } = customerData;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
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
                Customer Details
              </h1>
              <p className="text-muted-foreground">View and manage customer information</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              size="sm"
              onClick={() => router.push(`/crm/customers/${customer.name}/edit`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button 
              size="sm"
              onClick={() => router.push(`/crm/opportunities/new?customer=${customer.name}`)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Opportunity
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
              activeTab === "contacts"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("contacts")}
          >
            Contacts ({contacts.length})
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "addresses"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("addresses")}
          >
            Addresses ({addresses.length})
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2">
            {activeTab === "details" && (
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Customer Name</p>
                          <p className="font-medium text-lg">{customer.customer_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Customer ID</p>
                          <p className="font-medium">{customer.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Customer Type</p>
                          <Badge className={getCustomerTypeColor(customer.customer_type)}>
                            {customer.customer_type}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Customer Group</p>
                          <p className="font-medium">{customer.customer_group}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Territory</p>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                            {customer.territory || "Not specified"}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Default Currency</p>
                          <p className="font-medium">{customer.default_currency}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Credit Limit</p>
                          <div className="flex items-center">
                            <CreditCard className="w-4 h-4 mr-2 text-muted-foreground" />
                            {customer.credit_limit > 0 
                              ? new Intl.NumberFormat('en-ET', {
                                  style: 'currency',
                                  currency: customer.default_currency,
                                  minimumFractionDigits: 2
                                }).format(customer.credit_limit)
                              : "No limit"}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Created On</p>
                          <p className="font-medium">{new Date(customer.creation).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "contacts" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Contacts</CardTitle>
                      <CardDescription>
                        Contact persons for this customer
                      </CardDescription>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => router.push(`/crm/customers/${customer.name}/contacts/new`)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Contact
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {contacts.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Primary</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {contacts.map((contact) => (
                            <TableRow key={contact.name}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">
                                    {contact.first_name} {contact.last_name}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                                  {contact.email_id || "Not specified"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                                  {contact.mobile_no || "Not specified"}
                                </div>
                              </TableCell>
                              <TableCell>
                                {contact.is_primary_contact ? (
                                  <Badge className="bg-green-100 text-green-800">Primary</Badge>
                                ) : (
                                  <span className="text-muted-foreground">No</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push(`/crm/customers/${customer.name}/contacts/${contact.name}`)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No contacts found</p>
                      <Button className="mt-4" onClick={() => router.push(`/crm/customers/${customer.name}/contacts/new`)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Contact
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "addresses" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Addresses</CardTitle>
                      <CardDescription>
                        Billing and shipping addresses for this customer
                      </CardDescription>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => router.push(`/crm/customers/${customer.name}/addresses/new`)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Address
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {addresses.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>City</TableHead>
                            <TableHead>Primary</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {addresses.map((address) => (
                            <TableRow key={address.name}>
                              <TableCell>
                                <Badge variant="outline">{address.address_type}</Badge>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{address.address_line1}</p>
                                  {address.address_line2 && (
                                    <p className="text-sm text-muted-foreground">{address.address_line2}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{address.city}</TableCell>
                              <TableCell>
                                {address.is_primary_address ? (
                                  <Badge className="bg-green-100 text-green-800">Primary</Badge>
                                ) : (
                                  <span className="text-muted-foreground">No</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push(`/crm/customers/${customer.name}/addresses/${address.name}`)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No addresses found</p>
                      <Button className="mt-4" onClick={() => router.push(`/crm/customers/${customer.name}/addresses/new`)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Address
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
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
                    <span className="font-medium">{customer.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type</span>
                    <Badge className={getCustomerTypeColor(customer.customer_type)}>
                      {customer.customer_type}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Group</span>
                    <span>{customer.customer_group}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Territory</span>
                    <span>{customer.territory || "Not specified"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Currency</span>
                    <span>{customer.default_currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Credit Limit</span>
                    <span>
                      {customer.credit_limit > 0 
                        ? new Intl.NumberFormat('en-ET', {
                            style: 'currency',
                            currency: customer.default_currency,
                            minimumFractionDigits: 2
                          }).format(customer.credit_limit)
                        : "No limit"}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between">
                    <span>Contacts</span>
                    <span>{contacts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Addresses</span>
                    <span>{addresses.length}</span>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <Button variant="outline" className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    View History
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push(`/crm/customers/${customer.name}/edit`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Customer
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push(`/crm/opportunities/new?customer=${customer.name}`)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Opportunity
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push(`/crm/quotations/new?customer=${customer.name}`)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Quotation
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