// app/stock/item/[code]/page.tsx
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
  Package, 
  ArrowLeft, 
  Edit, 
  FileText,
  Download,
  Printer,
  Share
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Item {
  name: string;
  item_code: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  is_stock_item: number;
  brand?: string;
  disabled?: number;
  modified?: string;
}

interface MovementHistoryItem {
  id: string;
  date: string;
  type: string;
  qty: number;
  uom?: string;
  reference?: string;
}

export default function ItemDetailPage() {
  const { push: toast } = useToast();
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<Item | null>(null);
  const [history, setHistory] = useState<MovementHistoryItem[]>([]);

  useEffect(() => {
    fetchItem();
  }, [params.code]);

  const fetchItem = async () => {
    try {
      const response = await fetch(`/api/items/${encodeURIComponent(params.code)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || "Failed to fetch item");
      }
      
      const data = await response.json();
      
      // Handle different possible response structures
      if (data.data && data.data.item) {
        setItem(data.data.item);
      } else if (data.item) {
        setItem(data.item);
      } else {
        throw new Error("Invalid response format: item data missing");
      }
      
      // For now, we'll use placeholder data for history
      // In a real implementation, you would fetch this from a separate API endpoint
      setHistory([]);
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to load item: ${(error as Error).message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (disabled?: number) => {
    return disabled ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800";
  };

  const getStatusText = (disabled?: number) => {
    return disabled ? "Disabled" : "Enabled";
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

  if (!item) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Item Not Found</h2>
          <p className="text-muted-foreground mb-4">The item you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/stock/item')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Items
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
              onClick={() => router.push('/stock/item')}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Package className="w-8 h-8 mr-3 text-primary" />
                Item Details
              </h1>
              <p className="text-muted-foreground">View and manage item details</p>
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
              onClick={() => router.push(`/stock/item/${encodeURIComponent(item.item_code)}/edit`)}
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
                        <p className="text-sm text-muted-foreground">Item Code</p>
                        <p className="font-medium text-lg">{item.item_code}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Item Name</p>
                        <p className="font-medium">{item.item_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge className={getStatusColor(item.disabled)}>
                          {getStatusText(item.disabled)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Item Group</p>
                        <p className="font-medium">{item.item_group}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Stock UOM</p>
                        <p className="font-medium">{item.stock_uom}</p>
                      </div>
                      {item.brand && (
                        <div>
                          <p className="text-sm text-muted-foreground">Brand</p>
                          <p className="font-medium">{item.brand}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">Is Stock Item</p>
                        <p className="font-medium">{item.is_stock_item ? "Yes" : "No"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Movement History */}
            <Card>
              <CardHeader>
                <CardTitle>Movement History</CardTitle>
              </CardHeader>
              <CardContent>
                {history.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Change</TableHead>
                          <TableHead>Reference</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{record.date}</TableCell>
                            <TableCell>{record.type}</TableCell>
                            <TableCell>
                              {record.type === "ISSUE" || record.type === "SELL" 
                                ? `-${record.qty}` 
                                : `+${record.qty}`} {record.uom || ""}
                            </TableCell>
                            <TableCell>{record.reference || ""}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No movement history available for this item.</p>
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
                <CardTitle>Item Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Item Code:</span>
                    <span className="font-medium">{item.item_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Item Name:</span>
                    <span className="font-medium">{item.item_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Item Group:</span>
                    <span>{item.item_group}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stock UOM:</span>
                    <span>{item.stock_uom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge className={getStatusColor(item.disabled)}>
                      {getStatusText(item.disabled)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Is Stock Item:</span>
                    <span>{item.is_stock_item ? "Yes" : "No"}</span>
                  </div>
                  {item.brand && (
                    <div className="flex justify-between">
                      <span>Brand:</span>
                      <span>{item.brand}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t space-y-2">
                  <Button variant="outline" className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    View Stock Balance
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