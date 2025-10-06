// app/accounting/sales/new/page.tsx
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
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  FileText, 
  Plus, 
  Minus, 
  Save, 
  X,
  ArrowLeft,
  Calculator,
  Search
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface SalesInvoiceItem {
  item_code: string;
  item_name: string;
  description: string;
  qty: number;
  rate: number;
  amount: number;
  uom: string;
  warehouse: string;
}

interface AccountingOptions {
  companies: Array<{ name: string; company_name: string }>;
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
  warehouses: Array<{ name: string; warehouse_name: string }>;
}

export default function NewSalesInvoicePage() {
  const { push: toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [options, setOptions] = useState<AccountingOptions | null>(null);
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    company: "Ma Beignet (Demo)",
    customer: "",
    posting_date: new Date().toISOString().split('T')[0],
    due_date: "",
    currency: "ETB",
    update_stock: 1
  });
  
  const [items, setItems] = useState<SalesInvoiceItem[]>([]);
  const [newItem, setNewItem] = useState({
    item_code: "",
    item_name: "",
    description: "",
    qty: 1,
    rate: 0,
    uom: "",
    warehouse: ""
  });

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    if (options && itemSearchQuery) {
      const query = itemSearchQuery.toLowerCase();
      const filtered = options.items.filter(item => 
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
      const response = await fetch('/api/accounting/options?module=sales');
      if (response.ok) {
        const data = await response.json();
        setOptions(data.data.options);
        setFilteredItems(data.data.options.items);
        
        // Set default warehouse if available
        if (data.data.options.warehouses.length > 0) {
          setNewItem(prev => ({ ...prev, warehouse: data.data.options.warehouses[0].name }));
        }
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

  const handleItemSelect = (item: any) => {
    setNewItem({
      item_code: item.item_code,
      item_name: item.item_name,
      description: item.description,
      qty: 1,
      rate: item.standard_rate,
      uom: item.stock_uom,
      warehouse: newItem.warehouse
    });
    setItemSearchQuery("");
    setShowItemDropdown(false);
  };

  const handleItemChange = (field: keyof SalesInvoiceItem, value: string | number) => {
    setNewItem(prev => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    if (!newItem.item_code || !newItem.item_name || newItem.rate <= 0) {
      toast({
        variant: "error",
        title: "Error",
        description: "Please select an item and enter a valid rate"
      });
      return;
    }

    const amount = newItem.qty * newItem.rate;
    setItems(prev => [...prev, { ...newItem, amount }]);
    setNewItem({
      item_code: "",
      item_name: "",
      description: "",
      qty: 1,
      rate: 0,
      uom: "",
      warehouse: newItem.warehouse
    });
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, delta: number) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty, amount: newQty * item.rate };
      }
      return item;
    }));
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
        description: "Please select a customer and add at least one item"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/accounting/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          items
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to create sales invoice');
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: `Sales invoice ${data.data.salesInvoice.name} created successfully`
      });

      router.push('/accounting/sales');
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to create sales invoice: ${(error as Error).message}`
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
            onClick={() => router.push('/accounting/sales')}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <FileText className="w-8 h-8 mr-3 text-primary" />
              New Sales Invoice
            </h1>
            <p className="text-muted-foreground">Create a new sales invoice</p>
          </div>
        </div>
        <Button 
          onClick={handleSubmit} 
          disabled={loading}
          className="flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Creating...' : 'Create Sales Invoice'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Enter the basic details for this sales invoice</CardDescription>
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
                  <Label htmlFor="customer">Customer *</Label>
                  <Select
                    value={formData.customer}
                    onValueChange={(value) => handleInputChange('customer', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {options?.customers.map(customer => (
                        <SelectItem key={customer.name} value={customer.name}>
                          {customer.customer_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="posting_date">Posting Date *</Label>
                  <Input
                    id="posting_date"
                    type="date"
                    value={formData.posting_date}
                    onChange={(e) => handleInputChange('posting_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => handleInputChange('due_date', e.target.value)}
                  />
                </div>
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
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
              <CardDescription>Add items to this sales invoice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Item Form */}
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="relative mb-4">
                  <Label htmlFor="item_search">Search Item *</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
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
                              <p className="text-sm text-muted-foreground">{item.item_code}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{item.standard_rate.toFixed(2)} ETB</p>
                              <Badge variant={item.is_stock_item ? "default" : "secondary"} className="text-xs">
                                {item.is_stock_item ? "Stock Item" : "Non-Stock"}
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
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          value={newItem.description}
                          onChange={(e) => handleItemChange('description', e.target.value)}
                          placeholder="Item description"
                        />
                      </div>
                      <div>
                        <Label htmlFor="qty">Quantity *</Label>
                        <Input
                          id="qty"
                          type="number"
                          min="1"
                          value={newItem.qty}
                          onChange={(e) => handleItemChange('qty', parseInt(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="rate">Rate (ETB) *</Label>
                        <Input
                          id="rate"
                          type="number"
                          step="0.01"
                          value={newItem.rate}
                          onChange={(e) => handleItemChange('rate', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="warehouse">Warehouse</Label>
                        <Select
                          value={newItem.warehouse}
                          onValueChange={(value) => handleItemChange('warehouse', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {options?.warehouses.map(warehouse => (
                              <SelectItem key={warehouse.name} value={warehouse.name}>
                                {warehouse.warehouse_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                        <TableHead>Qty</TableHead>
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
                              <p className="text-sm text-muted-foreground">{item.item_code}</p>
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
                              <span className="w-12 text-center">{item.qty}</span>
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
                          <TableCell className="font-medium">{item.amount.toFixed(2)}</TableCell>
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
                Invoice Summary
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
                    <span>{items.reduce((sum, item) => sum + item.qty, 0)}</span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSubmit} 
                disabled={loading || !formData.customer || items.length === 0}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Creating...' : 'Create Sales Invoice'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}