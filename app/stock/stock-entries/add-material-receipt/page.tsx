// app/stock/stock-entries/add-material-receipt/page.tsx
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
  Package, 
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

interface StockEntryItemForm {
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
  warehouse: string;
}

interface DropdownOptions {
  companies: string[];
  warehouses: string[];
  stockEntryTypes: string[];
  purposes: string[];
  uoms: string[];
  items: Array<{
    item_code: string;
    item_name: string;
    stock_uom: string;
    valuation_rate: number;
  }>;
}

export default function AddMaterialReceiptPage() {
  const { push: toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [options, setOptions] = useState<DropdownOptions | null>(null);
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    stock_entry_type: "Material Receipt",
    purpose: "Material Receipt" as const,
    posting_date: new Date().toISOString().split('T')[0],
    posting_time: new Date().toTimeString().slice(0, 5),
    company: "",
    to_warehouse: "",
    items: [] as StockEntryItemForm[],
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
      const response = await fetch('/api/stock-entries/options');
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemSelect = (index: number, selectedItemInfo: { item_code: string; item_name: string; stock_uom: string; valuation_rate: number; }) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index
          ? {
              ...item,
              item_code: selectedItemInfo.item_code,
              item_name: selectedItemInfo.item_name,
              uom: selectedItemInfo.stock_uom,
              rate: selectedItemInfo.valuation_rate,
            }
          : item
      ),
    }));
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
        warehouse: prev.to_warehouse,
      }],
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index: number, field: keyof StockEntryItemForm, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          return updatedItem;
        }
        return item;
      }),
    }));
  };

  const updateItemQuantity = (index: number, delta: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const newQty = Math.max(0.01, item.qty + delta);
          return { ...item, qty: newQty };
        }
        return item;
      }),
    }));
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
    const tax = subtotal * 0.15; // 15% VAT
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.company || !formData.to_warehouse || formData.items.length === 0) {
        throw new Error('Missing required fields');
      }
      
      const itemsWithAmounts = formData.items.map(item => ({
        ...item,
        amount: item.qty * item.rate
      }));
      
      const payload = {
        ...formData,
        items: itemsWithAmounts,
      };
      
      const response = await fetch('/api/stock-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to create material receipt');
      }
      
      const result = await response.json();
      
      toast({
        title: "Success",
        description: `Material receipt ${result.data.stockEntry.name} created successfully`
      });
      
      router.push(`/stock/stock-entries/${result.data.stockEntry.name}`);
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to create material receipt: ${(error as Error).message}`
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
            onClick={() => router.push('/stock/stock-entries')}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Package className="w-8 h-8 mr-3 text-primary" />
              New Material Receipt
            </h1>
            <p className="text-muted-foreground">Create a new material receipt</p>
          </div>
        </div>
        <Button 
          onClick={handleSubmit} 
          disabled={loading}
          className="flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Creating...' : 'Create Material Receipt'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Enter the basic details for this material receipt</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="posting_date">Posting Date *</Label>
                  <Input
                    id="posting_date"
                    type="date"
                    value={formData.posting_date}
                    onChange={(e) => handleInputChange('posting_date', e.target.value)}
                    required
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
                <div>
                  <Label htmlFor="to_warehouse">To Warehouse *</Label>
                  <Select
                    value={formData.to_warehouse}
                    onValueChange={(value) => handleInputChange('to_warehouse', value)}
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
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
              <CardDescription>Add items to this material receipt</CardDescription>
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
                          onClick={() => {
                            const newItem = {
                              item_code: item.item_code,
                              item_name: item.item_name,
                              qty: 1,
                              uom: item.stock_uom,
                              rate: item.valuation_rate,
                              warehouse: formData.to_warehouse,
                              amount: item.valuation_rate
                            };
                            
                            setFormData(prev => ({
                              ...prev,
                              items: [...prev.items, newItem]
                            }));
                            
                            setItemSearchQuery("");
                            setShowItemDropdown(false);
                          }}
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
                          <TableCell className="font-medium">{(item.qty * item.rate).toFixed(2)}</TableCell>
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
                disabled={loading || !formData.company || !formData.to_warehouse || formData.items.length === 0}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Creating...' : 'Create Material Receipt'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}