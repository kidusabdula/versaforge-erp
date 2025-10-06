// app/stock/delivery-notes/[name]/page.tsx
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
  TruckIcon, 
  ArrowLeft, 
  Edit, 
  FileText,
  Download,
  Printer,
  Share
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

interface DeliveryNoteItem {
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
  amount: number;
  warehouse?: string;
  batch_no?: string;
  serial_no?: string;
  against_sales_order?: string;
}

interface DeliveryNoteDetail {
  name: string;
  customer: string;
  customer_name?: string;
  posting_date: string;
  posting_time?: string;
  items: DeliveryNoteItem[];
  company: string;
  set_warehouse?: string;
  territory?: string;
  tax_id?: string;
  docstatus: 0 | 1 | 2;
  sales_order?: string;
  customer_address?: string;
  contact_person?: string;
  modified?: string;
  owner?: string;
}

interface DeliveryNoteDetailResponse {
  success: boolean;
  data: {
    deliveryNote: DeliveryNoteDetail;
  };
  message?: string;
}

interface ApiError extends Error {
  message: string;
}

const fetcher = async (url: string): Promise<DeliveryNoteDetailResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.details || "Failed to fetch delivery note details");
  }
  return response.json();
};

export default function DeliveryNoteDetailPage() {
  const { push: toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [deliveryNote, setDeliveryNote] = useState<DeliveryNoteDetail | null>(null);

  useEffect(() => {
    fetchDeliveryNote();
  }, [params.name]);

  const fetchDeliveryNote = async () => {
    try {
      const response = await fetch(`/api/delivery-notes/${params.name}`);
      if (!response.ok) {
        throw new Error('Failed to fetch delivery note');
      }

      const data = await response.json();
      setDeliveryNote(data.data.deliveryNote);
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to load delivery note: ${(error as Error).message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusColor = (docstatus: number) => {
    switch (docstatus) {
      case 0:
        return 'bg-yellow-100 text-yellow-800';
      case 1:
        return 'bg-green-100 text-green-800';
      case 2:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (docstatus: number) => {
    switch (docstatus) {
      case 0:
        return "Draft";
      case 1:
        return "Submitted";
      case 2:
        return "Cancelled";
      default:
        return "Unknown";
    }
  };

  const calculateTotal = () => {
    if (!deliveryNote?.items) return 0;
    return deliveryNote.items.reduce((total, item) => total + item.amount, 0);
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

  if (!deliveryNote) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <TruckIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Delivery Note Not Found</h2>
          <p className="text-muted-foreground mb-4">The delivery note you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/stock/delivery-notes')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Delivery Notes
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
              onClick={() => router.push('/stock/delivery-notes')}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <TruckIcon className="w-8 h-8 mr-3 text-primary" />
                Delivery Note
              </h1>
              <p className="text-muted-foreground">View and manage delivery note details</p>
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
              onClick={() => router.push(`/stock/delivery-notes/${deliveryNote.name}/edit`)}
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
                        <p className="text-sm text-muted-foreground">Note Number</p>
                        <p className="font-medium text-lg">{deliveryNote.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Customer</p>
                        <p className="font-medium">{deliveryNote.customer}</p>
                        {deliveryNote.customer_name && (
                          <p className="text-sm text-muted-foreground">{deliveryNote.customer_name}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge className={getStatusColor(deliveryNote.docstatus)}>
                          {getStatusText(deliveryNote.docstatus)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Posting Date</p>
                        <p className="font-medium">
                          {new Date(deliveryNote.posting_date).toLocaleDateString()}
                          {deliveryNote.posting_time && ` ${deliveryNote.posting_time}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Company</p>
                        <p className="font-medium">{deliveryNote.company}</p>
                      </div>
                      {deliveryNote.set_warehouse && (
                        <div>
                          <p className="text-sm text-muted-foreground">Warehouse</p>
                          <p className="font-medium">{deliveryNote.set_warehouse}</p>
                        </div>
                      )}
                      {deliveryNote.territory && (
                        <div>
                          <p className="text-sm text-muted-foreground">Territory</p>
                          <p className="font-medium">{deliveryNote.territory}</p>
                        </div>
                      )}
                      {deliveryNote.sales_order && (
                        <div>
                          <p className="text-sm text-muted-foreground">Sales Order</p>
                          <p className="font-medium">{deliveryNote.sales_order}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader>
                <CardTitle>Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Code</TableHead>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Batch No</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deliveryNote.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-sm">{item.item_code}</TableCell>
                          <TableCell className="font-medium">{item.item_name}</TableCell>
                          <TableCell>{item.qty} {item.uom}</TableCell>
                          <TableCell>{formatCurrency(item.rate)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(item.amount)}</TableCell>
                          <TableCell>{item.warehouse || '-'}</TableCell>
                          <TableCell>{item.batch_no || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
                    <span>Subtotal</span>
                    <span>{formatCurrency(calculateTotal() * 0.87)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (15%)</span>
                    <span>{formatCurrency(calculateTotal() * 0.13)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>{formatCurrency(calculateTotal())}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Total Items:</span>
                      <span>{deliveryNote.items.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Quantity:</span>
                      <span>{deliveryNote.items.reduce((sum, item) => sum + item.qty, 0)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <Button variant="outline" className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    View Ledger
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
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