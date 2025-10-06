// app/stock/delivery-notes/add-delivery-note/page.tsx
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
  TruckIcon, 
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

interface DeliveryNoteItemForm {
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
  amount: number;
  warehouse: string;
  batch_no?: string;
  serial_no?: string;
  against_sales_order?: string;
}

interface DropdownOptions {
  customers: string[];
  companies: string[];
  warehouses: string[];
  territories: string[];
  items: Array<{
    item_code: string;
    item_name: string;
    stock_uom: string;
    valuation_rate: number;
  }>;
  uoms: string[];
}

export default function AddDeliveryNotePage() {
  const { push: toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [options, setOptions] = useState<DropdownOptions | null>(null);
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    customer: "",
    posting_date: new Date().toISOString().split('T')[0],
    posting_time: new Date().toTimeString().slice(0, 5),
    company: "",
    set_warehouse: "",
    territory: "",
    tax_id: "",
    sales_order: "",
    customer_address: "",
    contact_person: "",
    items: [] as DeliveryNoteItemForm[]
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
      const response = await fetch('/api/delivery-notes/options');
      if (!response.ok) {
        throw new Error('Failed to load options');
      }
      const data = await response.json();
      setOptions(data.data);
      setFilteredItems(data.data.items);
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
    const newItem = {
      item_code: item.item_code,
      item_name: item.item_name,
      qty: 1,
      uom: item.stock_uom,
      rate: item.valuation_rate,
      amount: item.valuation_rate,
      warehouse: formData.set_warehouse
    };
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    
    setItemSearchQuery("");
    setShowItemDropdown(false);
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { 
        item_code: "", 
        item_name: "",
        qty: 1, 
        uom: "Nos", 
        rate: 0,
        amount: 0,
        warehouse: prev.set_warehouse
      }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: keyof DeliveryNoteItemForm, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          // Recalculate amount if rate or quantity changes
          if (field === 'rate' || field === 'qty') {
            updatedItem.amount = Number(updatedItem.qty) * Number(updatedItem.rate);
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const updateItemQuantity = (index: number, delta: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const newQty = Math.max(1, item.qty + delta);
          return { ...item, qty: newQty, amount: newQty * item.rate };
        }
        return item;
      })
    }));
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * 0.15; // 15% VAT
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.customer || !formData.posting_date || formData.items.length === 0) {
        throw new Error('Missing required fields: customer, posting date, and items');
      }
      if (!formData.set_warehouse) {
        throw new Error('Warehouse is required');
      }
      
      const response = await fetch('/api/delivery-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to create delivery note');
      }
      
      const result = await response.json();
      
      toast({
        title: "Success",
        description: `Delivery note ${result.data.deliveryNote.name} created successfully`
      });
      
      router.push(`/stock/delivery-notes/${result.data.deliveryNote.name}`);
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to create delivery note: ${(error as Error).message}`
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
            onClick={() => router.push('/stock/delivery-notes')}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <TruckIcon className="w-8 h-8 mr-3 text-primary" />
              New Delivery Note
            </h1>
            <p className="text-muted-foreground">Create a new delivery note</p>
          </div>
        </div>
        <Button 
          onClick={handleSubmit} 
          disabled={loading}
          className="flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Creating...' : 'Create Delivery Note'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Enter the basic details for this delivery note</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer">Customer *</Label>
                  <Select
                    value={formData.customer}
                    onValueChange={(value) => handleInputChange('customer', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {options?.customers.map(customer => (
                        <SelectItem key={customer} value={customer}>
                          {customer}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="company">Company *</Label>
                  <Select
                    value={formData.company}
                    onValueChange={(value) => handleInputChange('company', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {options?.companies.map(company => (
                        <SelectItem key={company} value={company}>
                          {company}
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
                  <Label htmlFor="posting_time">Posting Time</Label>
                  <Input
                    id="posting_time"
                    type="time"
                    value={formData.posting_time}
                    onChange={(e) => handleInputChange('posting_time', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="set_warehouse">Warehouse *</Label>
                  <Select
                    value={formData.set_warehouse}
                    onValueChange={(value) => handleInputChange('set_warehouse', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {options?.warehouses.map(warehouse => (
                        <SelectItem key={warehouse} value={warehouse}>
                          {warehouse}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="territory">Territory</Label>
                  <Select
                    value={formData.territory}
                    onValueChange={(value) => handleInputChange('territory', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select territory" />
                    </SelectTrigger>
                    <SelectContent>
                      {options?.territories.map(territory => (
                        <SelectItem key={territory} value={territory}>
                          {territory}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="sales_order">Sales Order (Optional)</Label>
                <Input
                  id="sales_order"
                  value={formData.sales_order}
                  onChange={(e) => handleInputChange('sales_order', e.target.value)}
                  placeholder="Sales order reference"
                />
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
              <CardDescription>Add items to this delivery note</CardDescription>
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
                              <p className="font-medium">{item.valuation_rate.toFixed(2)} ETB</p>
                              <Badge variant="outline" className="text-xs">
                                {item.stock_uom}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <Button onClick={addItem} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Custom Item
                </Button>
              </div>

              {/* Items Table */}
              {formData.items.length > 0 && (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>UOM</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.item_name}</p>
                              <p className="text-sm text-muted-foreground">{item.item_code}</p>
                            </div>
                          </TableCell>
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
                          <TableCell>
                            <Select
                              value={item.uom}
                              onValueChange={(value) => updateItem(index, 'uom', value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {options?.uoms.map(uom => (
                                  <SelectItem key={uom} value={uom}>
                                    {uom}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.rate}
                              onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value))}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell className="font-medium">{item.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Select
                              value={item.warehouse}
                              onValueChange={(value) => updateItem(index, 'warehouse', value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {options?.warehouses.map(warehouse => (
                                  <SelectItem key={warehouse} value={warehouse}>
                                    {warehouse}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                    <span>{formData.items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Quantity:</span>
                    <span>{formData.items.reduce((sum, item) => sum + item.qty, 0)}</span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSubmit} 
                disabled={loading || !formData.customer || !formData.set_warehouse || formData.items.length === 0}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Creating...' : 'Create Delivery Note'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}