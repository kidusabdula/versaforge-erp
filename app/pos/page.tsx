// app/pos/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Trash2,
  Minus,
  Plus,
  Package,
  Store,
  ShoppingCart,
  Clock,
  CreditCard,
  Banknote,
  Smartphone,
  ArrowLeft,
  Home,
  Settings,
  BarChart3,
  Receipt,
  AlertCircle,
  Cookie,
  Croissant,
  CakeSlice,
  Coffee,
  Sandwich,
  IceCream,
  Pizza,
  UtensilsCrossed,
  CupSoda,
  Milk,
  Apple,
  Carrot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { usePosData } from "@/hooks/usePosData";
import { useStockCheck } from "@/hooks/useStockCheck";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type MenuItem = {
  item_code: string;
  item_name: string;
  description?: string;
  stock_uom: string;
  image?: string;
  standard_rate: number;
  actual_qty: number;
  is_stock_item: number;
};

type OrderItem = MenuItem & {
  quantity: number;
};

type PaymentMethod = {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
};

type Category = {
  name: string;
  color: string;
  icon: React.ElementType;
  items: MenuItem[];
};

export default function PosPage() {
  const { push: toast } = useToast();
  const router = useRouter();
  const { loading, profile, categories, customers, error, refetch } = usePosData();
  const { checking, checkStock } = useStockCheck();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isProcessing, setIsProcessing] = useState(false);
  const [stockIssues, setStockIssues] = useState<string[]>([]);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("pos");
  const [receiptData, setReceiptData] = useState<{
    items: OrderItem[];
    subtotal: number;
    tax: number;
    total: number;
  } | null>(null);
  
  // Set default customer when profile loads
  useEffect(() => {
    if (profile && profile.customer && !selectedCustomer) {
      setSelectedCustomer(profile.customer);
    }
  }, [profile, selectedCustomer]);

  // Payment methods
  const paymentMethods: PaymentMethod[] = [
    { id: "cash", name: "Cash", icon: Banknote, color: "bg-green-100 text-green-700" },
    { id: "card", name: "Card", icon: CreditCard, color: "bg-blue-100 text-blue-700" },
    { id: "ewallet", name: "E-Wallet", icon: Smartphone, color: "bg-purple-100 text-purple-700" },
  ];

  // Navigation items
  const navItems = [
    { id: "pos", name: "POS", icon: ShoppingCart },
    { id: "sales", name: "Sales", icon: BarChart3 },
    { id: "receipts", name: "Receipts", icon: Receipt },
    { id: "settings", name: "Settings", icon: Settings },
  ];

  // Enhanced categories with colors and icons for bakery
  const enhancedCategories: Category[] = useMemo(() => {
    const categoryIcons: Record<string, React.ElementType> = {
      "Breads": UtensilsCrossed,
      "Pastries": Croissant,
      "Cakes": CakeSlice,
      "Cookies": Cookie,
      "Beverages": Coffee,
      "Sandwiches": Sandwich,
      "Desserts": IceCream,
      "Pizza": Pizza,
      "Dairy": Milk,
      "Fruits": Apple,
      "Vegetables": Carrot,
      "Other": Package
    };
    
    const categoryColors: Record<string, string> = {
      "Breads": "bg-amber-100 text-amber-800 border-amber-200",
      "Pastries": "bg-orange-100 text-orange-800 border-orange-200",
      "Cakes": "bg-pink-100 text-pink-800 border-pink-200",
      "Cookies": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "Beverages": "bg-blue-100 text-blue-800 border-blue-200",
      "Sandwiches": "bg-green-100 text-green-800 border-green-200",
      "Desserts": "bg-purple-100 text-purple-800 border-purple-200",
      "Pizza": "bg-red-100 text-red-800 border-red-200",
      "Dairy": "bg-cyan-100 text-cyan-800 border-cyan-200",
      "Fruits": "bg-lime-100 text-lime-800 border-lime-200",
      "Vegetables": "bg-emerald-100 text-emerald-800 border-emerald-200",
      "Other": "bg-gray-100 text-gray-800 border-gray-200"
    };
    
    return categories.map(category => ({
      ...category,
      color: categoryColors[category.name] || "bg-gray-100 text-gray-800 border-gray-200",
      icon: categoryIcons[category.name] || Package
    }));
  }, [categories]);

  // Filter categories and items based on search
  const filteredData = useMemo(() => {
    if (!searchQuery) return { categories: enhancedCategories, allItems: [] };
    
    const query = searchQuery.toLowerCase();
    const filteredCategories = enhancedCategories.map(category => ({
      ...category,
      items: category.items.filter(item => 
        item.item_name.toLowerCase().includes(query) ||
        item.item_code.toLowerCase().includes(query)
      )
    })).filter(category => category.items.length > 0);
    
    const allItems = filteredCategories.flatMap(category => category.items);
    
    return { categories: filteredCategories, allItems };
  }, [enhancedCategories, searchQuery]);

  // Get all items for search results
  const allItems = useMemo(() => {
    return enhancedCategories.flatMap(category => category.items);
  }, [enhancedCategories]);

  const handleAddItem = (itemToAdd: MenuItem) => {
    if (itemToAdd.is_stock_item && itemToAdd.actual_qty <= 0) {
      toast({
        variant: "error",
        title: "Out of Stock",
        description: `${itemToAdd.item_name} is out of stock`,
      });
      return;
    }
    setOrderItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.item_code === itemToAdd.item_code);
      if (existingItem) {
        return prevItems.map((item) =>
          item.item_code === itemToAdd.item_code
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { ...itemToAdd, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (itemCode: string, delta: number) => {
    setOrderItems((prevItems) => {
      const itemToUpdate = prevItems.find((item) => item.item_code === itemCode);
      if (itemToUpdate && itemToUpdate.quantity + delta === 0) {
        return prevItems.filter((item) => item.item_code !== itemCode);
      }
      return prevItems.map((item) =>
        item.item_code === itemCode
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      );
    });
  };

  const handleRemoveItem = (itemCode: string) => {
    setOrderItems((prevItems) => prevItems.filter((item) => item.item_code !== itemCode));
  };

  const checkStockAvailability = async () => {
    if (!profile || orderItems.length === 0) return [];
    
    const itemCodes = orderItems.map(item => item.item_code);
    const stock = await checkStock(itemCodes, profile.warehouse);
    
    const issues: string[] = [];
    orderItems.forEach(orderItem => {
      const stockItem = stock.find(s => s.item_code === orderItem.item_code);
      if (stockItem && stockItem.is_stock_item && stockItem.actual_qty < orderItem.quantity) {
        issues.push(`${orderItem.item_name}: Only ${stockItem.actual_qty} ${stockItem.stock_uom} available (requested: ${orderItem.quantity})`);
      }
    });
    
    return issues;
  };

  const handlePlaceOrder = async () => {
    if (!profile || !selectedCustomer || orderItems.length === 0) {
      toast({
        variant: "error",
        title: "Error",
        description: selectedCustomer ? "Please add items to your order" : "Please select a customer",
      });
      return;
    }
    setIsProcessing(true);
    
    try {
      // Check stock availability
      const issues = await checkStockAvailability();
      
      if (issues.length > 0) {
        setStockIssues(issues);
        setShowStockDialog(true);
        setIsProcessing(false);
        return;
      }
      
      // Save the current order data for the receipt
      const currentOrderData = {
        items: [...orderItems],
        subtotal,
        tax,
        total
      };
      
      // Prepare order data
      const now = new Date();
      const orderData = {
        customer: selectedCustomer,
        posting_date: now.toISOString().split('T')[0],
        posting_time: now.toTimeString().slice(0, 8),
        company: profile.company,
        warehouse: profile.warehouse,
        items: orderItems.map(item => ({
          item_code: item.item_code,
          item_name: item.item_name,
          qty: item.quantity,
          rate: item.standard_rate,
          amount: item.standard_rate * item.quantity,
          uom: item.stock_uom,
        })),
        payments: [{
          mode_of_payment: paymentMethod.toLowerCase(),
          amount: total,
        }],
        total: subtotal,
        grand_total: total,
        rounded_total: Math.round(total * 100) / 100,
        outstanding_amount: 0,
      };
      
      const response = await fetch('/api/pos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to place order');
      }
      
      const result = await response.json();
      
      toast({
        title: "Success",
        description: `Order placed successfully! Invoice: ${result.data.salesInvoice.name}`,
      });
      
      // Add to recent sales
      setRecentSales(prev => [
        {
          ...result.data.salesInvoice,
          items: orderItems,
          timestamp: new Date().toISOString(),
        },
        ...prev.slice(0, 4)
      ]);
      
      // Save receipt data before resetting order
      setReceiptData(currentOrderData);
      
      // Reset order and show receipt
      setOrderItems([]);
      setShowReceipt(true);
    } catch (error) {
      toast({
        variant: "error",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to place order",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const { subtotal, tax, total } = useMemo(() => {
    const sub = orderItems.reduce((acc, item) => acc + item.standard_rate * item.quantity, 0);
    const taxRate = 0.10;
    const taxAmount = sub * taxRate;
    const totalAmount = sub + taxAmount;
    return { subtotal: sub, tax: taxAmount, total: totalAmount };
  }, [orderItems]);

  // Fetch recent sales on component mount
  useEffect(() => {
    // This would typically fetch from an API
    // For now, we'll initialize with empty array
    setRecentSales([]);
  }, []);

  const CategoryCard = ({ category }: { category: Category }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className={`${category.color} rounded-2xl shadow-lg border p-6 cursor-pointer hover:shadow-xl transition-all duration-300 h-full flex flex-col`}
      onClick={() => setSelectedCategory(category.name)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-white/30 rounded-full">
            <category.icon className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold">{category.name}</h3>
        </div>
        <Badge variant="secondary" className="bg-white/20 text-white">
          {category.items.length} items
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mt-auto">
        {category.items.slice(0, 4).map((item) => (
          <div key={item.item_code} className="flex items-center space-x-2 bg-white/20 rounded-lg p-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span className="text-sm font-medium truncate">{item.item_name}</span>
          </div>
        ))}
        {category.items.length > 4 && (
          <div className="text-sm font-medium bg-white/20 rounded-lg p-2 text-center">
            +{category.items.length - 4} more
          </div>
        )}
      </div>
    </motion.div>
  );

  const ItemCard = ({ item }: { item: MenuItem }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, y: -5 }}
      className={`bg-card text-card-foreground rounded-xl shadow-md border border-border p-5 cursor-pointer transition-all duration-300 hover:shadow-lg ${
        item.is_stock_item && item.actual_qty <= 0 ? 'opacity-60' : ''
      }`}
      onClick={() => handleAddItem(item)}
    >
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center mb-4">
          <Package className="w-10 h-10 text-primary" />
        </div>
        <h4 className="font-semibold text-center text-base mb-1">{item.item_name}</h4>
        <p className="text-xl font-bold text-primary mb-2">ETB {item.standard_rate.toFixed(2)}</p>
        {item.is_stock_item && (
          <Badge 
            variant={item.actual_qty > 0 ? "default" : "destructive"} 
            className="mt-2 text-xs"
          >
            Stock: {item.actual_qty} {item.stock_uom}
          </Badge>
        )}
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading POS data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button onClick={refetch} className="mt-4">Retry</Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Header */}
      <div className="bg-card shadow-sm px-6 py-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Point of Sale</h1>
          {profile && (
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-sm">
                {profile.warehouse}
              </Badge>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Customer:</span>
                <select
                  value={selectedCustomer || ''}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="bg-background border border-border rounded px-2 py-1 text-sm"
                >
                  {customers.map(customer => (
                    <option key={customer} value={customer}>
                      {customer}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button variant="outline" onClick={refetch}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4 mx-6 mt-6">
            <TabsTrigger value="pos" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              <span>POS</span>
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span>Sales</span>
            </TabsTrigger>
            <TabsTrigger value="receipts" className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              <span>Receipts</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 flex overflow-hidden p-6 pt-0">
            {/* Left Panel - Menu/Content */}
            <div className="flex-1 overflow-y-auto pr-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  {activeTab === "pos" && (
                    <div className="h-full">
                      {searchQuery ? (
                        <div>
                          <h2 className="text-2xl font-bold mb-6">Search Results</h2>
                          {filteredData.allItems.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                              {filteredData.allItems.map((item) => (
                                <ItemCard key={item.item_code} item={item} />
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12 text-muted-foreground">
                              No items found matching your search
                            </div>
                          )}
                        </div>
                      ) : selectedCategory ? (
                        <div>
                          <div className="flex items-center mb-6">
                            <Button
                              variant="ghost"
                              onClick={() => setSelectedCategory(null)}
                              className="mr-4"
                            >
                              <ArrowLeft className="w-4 h-4 mr-2" />
                              Back
                            </Button>
                            <div className="flex items-center space-x-3">
                              {(() => {
                                const category = enhancedCategories.find(c => c.name === selectedCategory);
                                return category ? (
                                  <div className={`p-2 ${category.color} rounded-lg`}>
                                    <category.icon className="w-6 h-6" />
                                  </div>
                                ) : null;
                              })()}
                              <h2 className="text-2xl font-bold">{selectedCategory}</h2>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {enhancedCategories
                              .find(c => c.name === selectedCategory)
                              ?.items.map((item) => (
                                <ItemCard key={item.item_code} item={item} />
                              ))}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h2 className="text-2xl font-bold mb-6">Categories</h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredData.categories.map((category) => (
                              <CategoryCard key={category.name} category={category} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "sales" && (
                    <div className="h-full">
                      <h2 className="text-2xl font-bold mb-6">Sales Analytics</h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Today's Sales</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">ETB 0.00</div>
                            <p className="text-xs text-muted-foreground">0 transactions</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">This Week</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">ETB 0.00</div>
                            <p className="text-xs text-muted-foreground">0 transactions</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">This Month</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">ETB 0.00</div>
                            <p className="text-xs text-muted-foreground">0 transactions</p>
                          </CardContent>
                        </Card>
                      </div>
                      <Card className="mt-6">
                        <CardHeader>
                          <CardTitle>Recent Sales</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {recentSales.length > 0 ? (
                            <div className="space-y-4">
                              {recentSales.map((sale, index) => (
                                <div key={index} className="flex justify-between items-center border-b pb-4">
                                  <div>
                                    <p className="font-medium">{sale.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(sale.timestamp).toLocaleString()}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">ETB {sale.total.toFixed(2)}</p>
                                    <Badge variant={sale.docstatus === 1 ? "default" : "secondary"}>
                                      {sale.docstatus === 1 ? "Submitted" : "Draft"}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-center py-4">No recent sales</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {activeTab === "receipts" && (
                    <div className="h-full">
                      <h2 className="text-2xl font-bold mb-6">Receipts</h2>
                      <Card>
                        <CardHeader>
                          <CardTitle>Recent Receipts</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {recentSales.length > 0 ? (
                            <div className="space-y-4">
                              {recentSales.map((sale, index) => (
                                <div key={index} className="flex justify-between items-center border-b pb-4">
                                  <div>
                                    <p className="font-medium">{sale.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(sale.timestamp).toLocaleString()}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">ETB {sale.total.toFixed(2)}</p>
                                    <Button variant="outline" size="sm">
                                      View
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-center py-4">No receipts found</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {activeTab === "settings" && (
                    <div className="h-full">
                      <h2 className="text-2xl font-bold mb-6">POS Settings</h2>
                      <Card>
                        <CardHeader>
                          <CardTitle>General Settings</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Default Warehouse</label>
                              <div className="mt-1">
                                <Input value={profile?.warehouse || ""} readOnly />
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Default Customer</label>
                              <div className="mt-1">
                                <Input value={profile?.customer || ""} readOnly />
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Company</label>
                              <div className="mt-1">
                                <Input value={profile?.company || ""} readOnly />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right Panel - Order Summary */}
            {activeTab === "pos" && (
              <div className="w-96 bg-card border-l border-border flex flex-col">
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Current Order</h2>
                    <Badge variant="outline">
                      {orderItems.length} items
                    </Badge>
                  </div>
                  
                  {orderItems.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                      <ShoppingCart className="w-16 h-16 mb-4" />
                      <p className="text-lg mb-2">No items in order</p>
                      <p className="text-sm text-center">Select items from the menu to add them to your order</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                        {orderItems.map((item) => (
                          <div key={item.item_code} className="bg-muted rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-medium">{item.item_name}</p>
                                <p className="text-sm text-muted-foreground">ETB {item.standard_rate.toFixed(2)} each</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(item.item_code)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdateQuantity(item.item_code, -1)}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-12 text-center font-medium">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdateQuantity(item.item_code, 1)}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                              <span className="font-bold">
                                ETB {(item.standard_rate * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="border-t pt-4 mt-auto">
                        <div className="space-y-2 text-muted-foreground mb-4">
                          <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>ETB {subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tax (10%)</span>
                            <span>ETB {tax.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex justify-between font-bold text-lg mb-4">
                          <span>Total</span>
                          <span>ETB {total.toFixed(2)}</span>
                        </div>
                        
                        <div className="mb-4">
                          <h4 className="font-semibold mb-2">Payment Method</h4>
                          <div className="grid grid-cols-3 gap-2">
                            {paymentMethods.map((method) => (
                              <Button
                                key={method.id}
                                onClick={() => setPaymentMethod(method.id)}
                                variant={paymentMethod === method.id ? "default" : "outline"}
                                className={`h-12 text-sm ${method.color} ${
                                  paymentMethod === method.id ? 'text-white' : 'text-foreground'
                                }`}
                              >
                                <method.icon className="w-4 h-4 mr-2" />
                                {method.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                        
                        <Button
                          onClick={handlePlaceOrder}
                          disabled={isProcessing || orderItems.length === 0}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 h-14 text-lg rounded-lg"
                        >
                          {isProcessing ? "Processing..." : "Place Order"}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </Tabs>
      </div>

      {/* Stock Issues Dialog */}
      <Dialog open={showStockDialog} onOpenChange={setShowStockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stock Availability Issues</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {stockIssues.map((issue, index) => (
              <Alert key={index} variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Insufficient Stock</AlertTitle>
                <AlertDescription>{issue}</AlertDescription>
              </Alert>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowStockDialog(false)}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Receipt</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-center">
              <p className="font-bold">Thank you for your purchase!</p>
              <p className="text-sm text-muted-foreground">Order completed successfully</p>
            </div>
            <div className="border-t pt-4">
              {receiptData?.items.map((item) => (
                <div key={item.item_code} className="flex justify-between">
                  <span>{item.quantity}x {item.item_name}</span>
                  <span>ETB {(item.standard_rate * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>ETB {receiptData?.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (10%)</span>
                <span>ETB {receiptData?.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>ETB {receiptData?.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowReceipt(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}