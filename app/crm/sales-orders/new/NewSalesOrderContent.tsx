// app/crm/sales-orders/new/NewSalesOrderContent.tsx
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShoppingCart,
  Save,
  X,
  ArrowLeft,
  Plus,
  Minus,
  Calculator,
  Search,
  Calendar,
  DollarSign,
  Users,
  Package,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";

interface SalesOrderItem {
  item_code: string;
  item_name: string;
  description: string;
  qty: number;
  rate: number;
  amount: number;
}

interface CRMOptions {
  customers: Array<{ name: string; customer_name: string }>;
  items: Array<{
    name: string;
    item_code: string;
    item_name: string;
    description: string;
    stock_uom: string;
    standard_rate: number;
    is_stock_item: number;
  }>;
}

export default function NewSalesOrderContent() {
  const { push: toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [options, setOptions] = useState<CRMOptions | null>(null);
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [showItemDropdown, setShowItemDropdown] = useState(false);

  // Get customer or quotation from URL params if available
  const customerParam = searchParams.get("customer") || "";
  const quotationParam = searchParams.get("quotation") || "";

  const [formData, setFormData] = useState({
    customer: customerParam,
    transaction_date: new Date().toISOString().split("T")[0],
    delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0], // 7 days from now
    currency: "ETB",
  });

  const [items, setItems] = useState<SalesOrderItem[]>([]);
  const [newItem, setNewItem] = useState({
    item_code: "",
    item_name: "",
    description: "",
    qty: 1,
    rate: 0,
  });

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    if (options && itemSearchQuery) {
      const query = itemSearchQuery.toLowerCase();
      const filtered = options.items.filter(
        (item) =>
          item.item_name.toLowerCase().includes(query) ||
          item.item_code.toLowerCase().includes(query)
      );
      setFilteredItems(filtered);
      setShowItemDropdown(true);
    } else {
      setFilteredItems(options?.items || []);
      setShowItemDropdown(false);
    }
  }, [itemSearchQuery, options]);

  const fetchOptions = async () => {
    setOptionsLoading(true);
    try {
      const response = await fetch("/api/crm/options");
      if (response.ok) {
        const data = await response.json();
        setOptions(data.data.options);
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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemSelect = (item: any) => {
    setNewItem({
      item_code: item.item_code,
      item_name: item.item_name,
      description: item.description,
      qty: 1,
      rate: item.standard_rate,
    });
    setItemSearchQuery("");
    setShowItemDropdown(false);
  };

  const handleItemChange = (
    field: keyof SalesOrderItem,
    value: string | number
  ) => {
    setNewItem((prev) => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    if (!newItem.item_code || !newItem.item_name || newItem.rate <= 0) {
      toast({
        variant: "error",
        title: "Error",
        description: "Please select an item and enter a valid rate",
      });
      return;
    }

    const amount = newItem.qty * newItem.rate;
    setItems((prev) => [...prev, { ...newItem, amount }]);
    setNewItem({
      item_code: "",
      item_name: "",
      description: "",
      qty: 1,
      rate: 0,
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, delta: number) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const newQty = Math.max(1, item.qty + delta);
          return { ...item, qty: newQty, amount: newQty * item.rate };
        }
        return item;
      })
    );
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * 0.15; // 15% VAT
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleSubmit = async () => {
    if (!formData.customer || items.length === 0) {
      toast({
        variant: "error",
        title: "Error",
        description: "Please select a customer and add at least one item",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/crm/sales-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          items,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Failed to create sales order");
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: `Sales Order ${data.data.salesOrder.name} created successfully`,
      });

      router.push("/crm/sales-orders");
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to create sales order: ${
          (error as Error).message
        }`,
      });
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, tax, total } = calculateTotals();

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
            onClick={() => router.push("/crm/sales-orders")}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <ShoppingCart className="w-8 h-8 mr-3 text-primary" />
              New Sales Order
            </h1>
            <p className="text-muted-foreground">Create a new sales order</p>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Creating..." : "Create Sales Order"}
        </Button>
      </div>

      {(customerParam || quotationParam) && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              <div>
                <p className="font-medium">Creating sales order for:</p>
                <p className="text-sm text-muted-foreground">
                  {customerParam
                    ? `Customer: ${customerParam}`
                    : `Quotation: ${quotationParam}`}
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
                Enter the basic details for this sales order
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer">Customer *</Label>
                  <Select
                    value={formData.customer}
                    onValueChange={(value) =>
                      handleInputChange("customer", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {options?.customers.map((customer) => (
                        <SelectItem key={customer.name} value={customer.name}>
                          {customer.customer_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) =>
                      handleInputChange("currency", value)
                    }
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
                  <Label htmlFor="transaction_date">Order Date *</Label>
                  <Input
                    id="transaction_date"
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) =>
                      handleInputChange("transaction_date", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="delivery_date">Delivery Date *</Label>
                  <div className="relative">
                    <Truck
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={20}
                    />
                    <Input
                      id="delivery_date"
                      type="date"
                      value={formData.delivery_date}
                      onChange={(e) =>
                        handleInputChange("delivery_date", e.target.value)
                      }
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
              <CardDescription>Add items to this sales order</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Item Form */}
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="relative mb-4">
                  <Label htmlFor="item_search">Search Item *</Label>
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={20}
                    />
                    <Input
                      id="item_search"
                      placeholder="Search for an item..."
                      value={itemSearchQuery}
                      onChange={(e) => setItemSearchQuery(e.target.value)}
                      className="pl-10"
                      onFocus={() => setShowItemDropdown(true)}
                    />
                  </div>

                  {showItemDropdown && filteredItems.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-md max-h-60 overflow-y-auto">
                      {filteredItems.map((item) => (
                        <div
                          key={item.item_code}
                          className="p-3 hover:bg-muted cursor-pointer border-b"
                          onClick={() => handleItemSelect(item)}
                        >
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium">{item.item_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.item_code}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {item.standard_rate.toFixed(2)} ETB
                              </p>
                              <Badge
                                variant={
                                  item.is_stock_item ? "default" : "secondary"
                                }
                                className="text-xs"
                              >
                                {item.is_stock_item
                                  ? "Stock Item"
                                  : "Non-Stock"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {newItem.item_code && (
                  <>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newItem.description}
                          onChange={(e) =>
                            handleItemChange("description", e.target.value)
                          }
                          placeholder="Item description"
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label htmlFor="qty">Quantity *</Label>
                        <Input
                          id="qty"
                          type="number"
                          min="1"
                          value={newItem.qty}
                          onChange={(e) =>
                            handleItemChange("qty", parseInt(e.target.value))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="rate">Rate (ETB) *</Label>
                        <Input
                          id="rate"
                          type="number"
                          step="0.01"
                          value={newItem.rate}
                          onChange={(e) =>
                            handleItemChange("rate", parseFloat(e.target.value))
                          }
                        />
                      </div>
                    </div>

                    <Button onClick={addItem} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </>
                )}
              </div>

              {/* Items Table */}
              {items.length > 0 && (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.item_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.item_code}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateItemQuantity(index, -1)}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-12 text-center">
                                {item.qty}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateItemQuantity(index, 1)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>{item.rate.toFixed(2)}</TableCell>
                          <TableCell className="font-medium">
                            {item.amount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
              <CardTitle className="flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{subtotal.toFixed(2)} ETB</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (15%)</span>
                  <span>{tax.toFixed(2)} ETB</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{total.toFixed(2)} ETB</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Total Items:</span>
                    <span>{items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Quantity:</span>
                    <span>
                      {items.reduce((sum, item) => sum + item.qty, 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Delivery Date:</span>
                  <span className="font-medium">
                    {formData.delivery_date
                      ? new Date(formData.delivery_date).toLocaleDateString()
                      : "Not set"}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading || !formData.customer || items.length === 0}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Creating..." : "Create Sales Order"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
