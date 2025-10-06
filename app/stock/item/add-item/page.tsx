// app/stock/item/add-item/page.tsx
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
  Package, 
  Save, 
  X,
  ArrowLeft,
  Calculator,
  Search
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface FormData {
  item_code: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  is_stock_item: number;
  is_fixed_asset: number;
  description?: string;
  brand?: string;
}

interface DropdownOptions {
  item_groups: string[];
  uoms: string[];
}

export default function AddItemPage() {
  const { push: toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [options, setOptions] = useState<DropdownOptions | null>(null);
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [uomSearchQuery, setUomSearchQuery] = useState("");
  const [filteredGroups, setFilteredGroups] = useState<string[]>([]);
  const [filteredUoms, setFilteredUoms] = useState<string[]>([]);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [showUomDropdown, setShowUomDropdown] = useState(false);
  
  const [form, setForm] = useState<FormData>({
    item_code: '',
    item_name: '',
    item_group: '',
    stock_uom: 'Nos',
    is_stock_item: 1,
    is_fixed_asset: 0,
    description: '',
    brand: '',
  });

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    if (options && groupSearchQuery) {
      const filtered = options.item_groups.filter(group => 
        group.toLowerCase().includes(groupSearchQuery.toLowerCase())
      );
      setFilteredGroups(filtered);
      setShowGroupDropdown(true);
    } else {
      setFilteredGroups(options?.item_groups || []);
      setShowGroupDropdown(false);
    }
  }, [groupSearchQuery, options]);

  useEffect(() => {
    if (options && uomSearchQuery) {
      const filtered = options.uoms.filter(uom => 
        uom.toLowerCase().includes(uomSearchQuery.toLowerCase())
      );
      setFilteredUoms(filtered);
      setShowUomDropdown(true);
    } else {
      setFilteredUoms(options?.uoms || []);
      setShowUomDropdown(false);
    }
  }, [uomSearchQuery, options]);

  const fetchOptions = async () => {
    setOptionsLoading(true);
    try {
      const [groupsResponse, uomsResponse] = await Promise.all([
        fetch('/api/items?action=get-item-groups'),
        fetch('/api/items?action=get-uoms')
      ]);
      
      if (groupsResponse.ok && uomsResponse.ok) {
        const groupsData = await groupsResponse.json();
        const uomsData = await uomsResponse.json();
        
        setOptions({
          item_groups: groupsData.data?.item_groups || [],
          uoms: uomsData.data?.uoms || []
        });
        
        setFilteredGroups(groupsData.data?.item_groups || []);
        setFilteredUoms(uomsData.data?.uoms || []);
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

  const handleInputChange = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectChange = (field: keyof FormData, value: string) => {
    if (field === 'is_stock_item' || field === 'is_fixed_asset') {
      setForm(prev => ({ ...prev, [field]: parseInt(value) }));
    } else {
      setForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleGroupSelect = (group: string) => {
    setForm(prev => ({ ...prev, item_group: group }));
    setGroupSearchQuery("");
    setShowGroupDropdown(false);
  };

  const handleUomSelect = (uom: string) => {
    setForm(prev => ({ ...prev, stock_uom: uom }));
    setUomSearchQuery("");
    setShowUomDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!form.item_code || !form.item_name || !form.item_group || !form.stock_uom) {
        throw new Error('Please fill in all required fields');
      }
      
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to create item');
      }
      
      const result = await response.json();
      
      toast({
        title: "Success",
        description: `Item "${result.data.item.item_name}" created successfully`
      });
      
      router.push('/stock/item');
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to create item: ${(error as Error).message}`
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
            onClick={() => router.push('/stock/item')}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Package className="w-8 h-8 mr-3 text-primary" />
              New Item
            </h1>
            <p className="text-muted-foreground">Create a new inventory item</p>
          </div>
        </div>
        <Button 
          onClick={handleSubmit} 
          disabled={loading}
          className="flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Creating...' : 'Create Item'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Enter the basic details for this item</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="item_code">Item Code *</Label>
                  <Input
                    id="item_code"
                    placeholder="Enter item code (e.g., ITM-001)"
                    value={form.item_code}
                    onChange={(e) => handleInputChange('item_code', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="item_name">Item Name *</Label>
                  <Input
                    id="item_name"
                    placeholder="Enter item name"
                    value={form.item_name}
                    onChange={(e) => handleInputChange('item_name', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="item_group">Item Group *</Label>
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                      <Input
                        id="item_group"
                        placeholder="Search for item group..."
                        value={groupSearchQuery || form.item_group}
                        onChange={(e) => setGroupSearchQuery(e.target.value)}
                        onFocus={() => setShowGroupDropdown(true)}
                        className="pl-10"
                      />
                    </div>
                    
                    {showGroupDropdown && filteredGroups.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-md max-h-60 overflow-y-auto">
                        {filteredGroups.map((group) => (
                          <div
                            key={group}
                            className="p-3 hover:bg-muted cursor-pointer border-b"
                            onClick={() => handleGroupSelect(group)}
                          >
                            <p className="font-medium">{group}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="stock_uom">Stock Unit of Measure *</Label>
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                      <Input
                        id="stock_uom"
                        placeholder="Search for UOM..."
                        value={uomSearchQuery || form.stock_uom}
                        onChange={(e) => setUomSearchQuery(e.target.value)}
                        onFocus={() => setShowUomDropdown(true)}
                        className="pl-10"
                      />
                    </div>
                    
                    {showUomDropdown && filteredUoms.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-md max-h-60 overflow-y-auto">
                        {filteredUoms.map((uom) => (
                          <div
                            key={uom}
                            className="p-3 hover:bg-muted cursor-pointer border-b"
                            onClick={() => handleUomSelect(uom)}
                          >
                            <p className="font-medium">{uom}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="is_stock_item">Maintain Stock</Label>
                  <Select
                    value={form.is_stock_item.toString()}
                    onValueChange={(value) => handleSelectChange('is_stock_item', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Yes</SelectItem>
                      <SelectItem value="0">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="is_fixed_asset">Is Fixed Asset</Label>
                  <Select
                    value={form.is_fixed_asset.toString()}
                    onValueChange={(value) => handleSelectChange('is_fixed_asset', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Yes</SelectItem>
                      <SelectItem value="0">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  placeholder="Enter brand name"
                  value={form.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  placeholder="Enter item description"
                  value={form.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full min-h-[80px] p-2 border rounded-md"
                  rows={3}
                />
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
                Item Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Item Code:</span>
                  <span>{form.item_code || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Item Name:</span>
                  <span>{form.item_name || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Item Group:</span>
                  <span>{form.item_group || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span>UOM:</span>
                  <span>{form.stock_uom || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Maintain Stock:</span>
                  <span>{form.is_stock_item ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fixed Asset:</span>
                  <span>{form.is_fixed_asset ? "Yes" : "No"}</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  <p>Fill in all required fields marked with (*) to create the item.</p>
                </div>
              </div>

              <Button 
                onClick={handleSubmit} 
                disabled={loading || !form.item_code || !form.item_name || !form.item_group || !form.stock_uom}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Creating...' : 'Create Item'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}