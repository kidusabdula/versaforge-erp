// components/layout.tsx
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  AlertCircle,
  Lock,
  User,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText as FileTextIcon,
  Receipt,
  BookOpen,
  UtensilsCrossed,
  Package,
  Box,
  ShoppingCart,
  Truck,
  Settings,
  LogOut,
  CreditCard,
  TrendingUp,
  Store,
  FileBarChart,
  BarChart3,
  PieChart,
  Home,
  DollarSign,
  ShoppingCart as ShoppingCartIcon,
  PackageOpen,
  ClipboardCheck,
  Factory,
  Archive,
  Wrench,
  HelpCircle,
  Building,
  FileSearch,
  FileText,
  Calculator,
  MapPin,                // “Locations”
  ArrowLeftRight,        // “Movements”
  TrendingUpDown,        // “Value Adjustments” (no lucide icon, picked closest)
  Settings2,             // “Maintenance”
} from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isAccountingOpen, setIsAccountingOpen] = useState(false);
  const [isManufacturingOpen, setIsManufacturingOpen] = useState(false);
  const [isCRMOpen, setIsCRMOpen] = useState(false);
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAssetsOpen, setIsAssetsOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    // Close all dropdowns when collapsing
    if (!isCollapsed) {
      setIsAccountingOpen(false);
      setIsAssetsOpen(false);      // <-- close assets when collapsing
      setIsManufacturingOpen(false);
      setIsCRMOpen(false);
      setIsStockOpen(false);
      setIsSettingsOpen(false);
    }
  };

  // Check if a link is active
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + "/");
  };

  return (
    <div className="flex h-screen bg-[var(--background)] text-[var(--foreground)] dark overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] text-[var(--sidebar-foreground)] transition-all duration-300 h-full",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Fixed header section */}
        <div className="p-4 border-b border-[var(--sidebar-border)] flex items-center justify-between flex-shrink-0">
          {!isCollapsed ? (
            <h2 className="text-lg font-extrabold flex items-center">
              <img src="/logo.png" alt="VersaForge ERP Logo" className="mr-2 h-6 w-6" />
              VersaForge ERP
            </h2>
          ) : (
            <div className="flex justify-center w-full">
              <img src="/logo.png" alt="VersaForge ERP Logo" className="w-6 h-6 scale-150" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-3 w-3 flex-shrink-0"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Scrollable navigation */}
        <div className="flex-1 overflow-y-auto">
          <nav className="p-4 space-y-6">
            {/* Operations Section */}
            <div>
              {!isCollapsed && (
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
                  Operations
                </h3>
              )}
              <div className="space-y-1">
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-2 px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                      isCollapsed ? "justify-center" : "",
                      isActive("/dashboard") ? "bg-[var(--sidebar-accent)]" : ""
                    )}
                    title="Dashboard"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {!isCollapsed && "Dashboard"}
                  </Button>
                </Link>
                <Link href="/pos">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-2 px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                      isCollapsed ? "justify-center" : "",
                      isActive("/pos") ? "bg-[var(--sidebar-accent)]" : ""
                    )}
                    title="Point of Sale"
                  >
                    <Store className="h-4 w-4" />
                    {!isCollapsed && "Point of Sale"}
                  </Button>
                </Link>
                {/* Accounting Dropdown */}
                <div className="space-y-1">
                  {isCollapsed ? (
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-center px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                        isActive("/accounting")
                          ? "bg-[var(--sidebar-accent)]"
                          : ""
                      )}
                      title="Accounting"
                      onClick={() => setIsAccountingOpen(!isAccountingOpen)}
                    >
                      <Calculator className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-between px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                        isActive("/accounting")
                          ? "bg-[var(--sidebar-accent)]"
                          : ""
                      )}
                      onClick={() => setIsAccountingOpen(!isAccountingOpen)}
                    >
                      <div className="flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Accounting
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          isAccountingOpen ? "rotate-180" : ""
                        }`}
                      />
                    </Button>
                  )}
                  {isAccountingOpen && (
                    <div className={`space-y-1 ${isCollapsed ? "" : "pl-8"}`}>
                      <Link href="/accounting/dashboard">
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-2 px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                            isCollapsed ? "justify-center" : "",
                            isActive("/accounting/dashboard")
                              ? "bg-[var(--sidebar-accent)]"
                              : ""
                          )}
                          title="Accounting Dashboard"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          {!isCollapsed && "Dashboard"}
                        </Button>
                      </Link>
                      <Link href="/accounting/payments">
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-2 px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                            isCollapsed ? "justify-center" : "",
                            isActive("/accounting/payments")
                              ? "bg-[var(--sidebar-accent)]"
                              : ""
                          )}
                          title="Payments"
                        >
                          <CreditCard className="h-4 w-4" />
                          {!isCollapsed && "Payments"}
                        </Button>
                      </Link>
                      <Link href="/accounting/purchases">
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-2 px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                            isCollapsed ? "justify-center" : "",
                            isActive("/accounting/purchases")
                              ? "bg-[var(--sidebar-accent)]"
                              : ""
                          )}
                          title="Purchases"
                        >
                          <ShoppingCartIcon className="h-4 w-4" />
                          {!isCollapsed && "Purchases"}
                        </Button>
                      </Link>
                      <Link href="/accounting/expenses">
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-2 px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                            isCollapsed ? "justify-center" : "",
                            isActive("/accounting/expenses")
                              ? "bg-[var(--sidebar-accent)]"
                              : ""
                          )}
                          title="Expenses"
                        >
                          <FileTextIcon className="h-4 w-4" />
                          {!isCollapsed && "Expenses"}
                        </Button>
                      </Link>
                      <Link href="/accounting/sales">
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-2 px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                            isCollapsed ? "justify-center" : "",
                            isActive("/accounting/sales")
                              ? "bg-[var(--sidebar-accent)]"
                              : ""
                          )}
                          title="Sales"
                        >
                          <TrendingUp className="h-4 w-4" />
                          {!isCollapsed && "Sales"}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>


                {/* CRM Section */}
                <div className="space-y-1">
                  {isCollapsed ? (
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-center px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                        isActive("/crm") ? "bg-[var(--sidebar-accent)]" : ""
                      )}
                      title="CRM"
                      onClick={() => setIsCRMOpen(!isCRMOpen)}
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-between px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                        isActive("/crm") ? "bg-[var(--sidebar-accent)]" : ""
                      )}
                      onClick={() => setIsCRMOpen(!isCRMOpen)}
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        CRM
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          isCRMOpen ? "rotate-180" : ""
                        }`}
                      />
                    </Button>
                  )}
                  {isCRMOpen && (
                    <div className={`space-y-1 ${isCollapsed ? "" : "pl-8"}`}>
                      <Link href="/crm/dashboard">
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-2 px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                            isCollapsed ? "justify-center" : "",
                            isActive("/crm/dashboard")
                              ? "bg-[var(--sidebar-accent)]"
                              : ""
                          )}
                          title="Dashboard"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          {!isCollapsed && "Dashboard"}
                        </Button>
                      </Link>
                      <Link href="/crm/leads">
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-2 px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                            isCollapsed ? "justify-center" : "",
                            isActive("/crm/leads")
                              ? "bg-[var(--sidebar-accent)]"
                              : ""
                          )}
                          title="Leads"
                        >
                          <FileSearch className="h-4 w-4" />
                          {!isCollapsed && "Leads"}
                        </Button>
                      </Link>
                      <Link href="/crm/opportunities">
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-2 px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                            isCollapsed ? "justify-center" : "",
                            isActive("/crm/opportunities")
                              ? "bg-[var(--sidebar-accent)]"
                              : ""
                          )}
                          title="Opportunities"
                        >
                          <TrendingUp className="h-4 w-4" />
                          {!isCollapsed && "Opportunities"}
                        </Button>
                      </Link>
                      <Link href="/crm/customers">
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-2 px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                            isCollapsed ? "justify-center" : "",
                            isActive("/crm/customers")
                              ? "bg-[var(--sidebar-accent)]"
                              : ""
                          )}
                          title="Customers"
                        >
                          <User className="h-4 w-4" />
                          {!isCollapsed && "Customers"}
                        </Button>
                      </Link>
                      <Link href="/crm/quotations">
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-2 px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                            isCollapsed ? "justify-center" : "",
                            isActive("/crm/quotations")
                              ? "bg-[var(--sidebar-accent)]"
                              : ""
                          )}
                          title="Quotations"
                        >
                          <FileText className="h-4 w-4" />
                          {!isCollapsed && "Quotations"}
                        </Button>
                      </Link>
                      <Link href="/crm/sales-orders">
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-2 px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                            isCollapsed ? "justify-center" : "",
                            isActive("/crm/sales-orders")
                              ? "bg-[var(--sidebar-accent)]"
                              : ""
                          )}
                          title="Sales Orders"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          {!isCollapsed && "Sales Orders"}
                        </Button>
                      </Link>
                      <Link href="/crm/activities">
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-2 px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                            isCollapsed ? "justify-center" : "",
                            isActive("/crm/activities")
                              ? "bg-[var(--sidebar-accent)]"
                              : ""
                          )}
                          title="Activities"
                        >
                          <ClipboardList className="h-4 w-4" />
                          {!isCollapsed && "Activities"}
                        </Button>
                      </Link>
                      <Link href="/crm/communications">
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-2 px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                            isCollapsed ? "justify-center" : "",
                            isActive("/crm/communications")
                              ? "bg-[var(--sidebar-accent)]"
                              : ""
                          )}
                          title="Communications"
                        >
                          <Receipt className="h-4 w-4" />
                          {!isCollapsed && "Communications"}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Inventory Section */}
            <div>
              {!isCollapsed && (
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
                  Inventory
                </h3>
              )}
              <div className="space-y-1">
                {/* Stock Dropdown */}
                <div className="space-y-1">
                  {isCollapsed ? (
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-center px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                        isActive("/stock") ? "bg-[var(--sidebar-accent)]" : ""
                      )}
                      title="Stock Management"
                      onClick={() => setIsStockOpen(!isStockOpen)}
                    >
                      <Package className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-between px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                        isActive("/stock") ? "bg-[var(--sidebar-accent)]" : ""
                      )}
                      onClick={() => setIsStockOpen(!isStockOpen)}
                    >
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Stock Management
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          isStockOpen ? "rotate-180" : ""
                        }`}
                      />
                    </Button>
                  )}
                  {isStockOpen && (
                    <div className={`space-y-1 ${isCollapsed ? "" : "pl-8"}`}>
                      <Link href="/stock/dashboard">
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-2 px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                            isCollapsed ? "justify-center" : "",
                            isActive("/stock/dashboard")
                              ? "bg-[var(--sidebar-accent)]"
                              : ""
                          )}
                          title="Stock Dashboard"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          {!isCollapsed && "Dashboard"}
                        </Button>
                      </Link>
                      <Link href="/stock/delivery-notes">
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-2 px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                            isCollapsed ? "justify-center" : "",
                            isActive("/stock/delivery-notes")
                              ? "bg-[var(--sidebar-accent)]"
                              : ""
                          )}
                          title="Delivery Notes"
                        >
                          <Truck className="h-4 w-4" />
                          {!isCollapsed && "Delivery Notes"}
                        </Button>
                      </Link>
                      <Link href="/stock/item">
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-2 px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                            isCollapsed ? "justify-center" : "",
                            isActive("/stock/item")
                              ? "bg-[var(--sidebar-accent)]"
                              : ""
                          )}
                          title="Items"
                        >
                          <Box className="h-4 w-4" />
                          {!isCollapsed && "Items"}
                        </Button>
                      </Link>
                      <Link href="/stock/stock-entries">
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-2 px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                            isCollapsed ? "justify-center" : "",
                            isActive("/stock/stock-entries")
                              ? "bg-[var(--sidebar-accent)]"
                              : ""
                          )}
                          title="Stock Entries"
                        >
                          <PackageOpen className="h-4 w-4" />
                          {!isCollapsed && "Stock Entries"}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>

 {/* ======  NEW ASSET MANAGEMENT DROPDOWN  ====== */}
 <div className="space-y-1">
                  {isCollapsed ? (
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-center px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                        isActive("/assets") ? "bg-[var(--sidebar-accent)]" : ""
                      )}
                      title="Asset Management"
                      onClick={() => setIsAssetsOpen(!isAssetsOpen)}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-between px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                        isActive("/assets") ? "bg-[var(--sidebar-accent)]" : ""
                      )}
                      onClick={() => setIsAssetsOpen(!isAssetsOpen)}
                    >
                      <div className="flex items-center gap-2">
                        <Archive className="h-4 w-4" />
                        Asset Management
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          isAssetsOpen ? "rotate-180" : ""
                        }`}
                      />
                    </Button>
                  )}

                  {isAssetsOpen && (
                    <div className={`space-y-1 ${isCollapsed ? "" : "pl-8"}`}>
                      <Link href="/assets/dashboard">
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-2 px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                            isCollapsed ? "justify-center" : "",
                            isActive("/assets/dashboard")
                              ? "bg-[var(--sidebar-accent)]"
                              : ""
                          )}
                          title="Dashboard"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          {!isCollapsed && "Dashboard"}
                        </Button>
                      </Link>

                      <Link href="/assets/assets">
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-2 px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                            isCollapsed ? "justify-center" : "",
                            isActive("/assets/assets")
                              ? "bg-[var(--sidebar-accent)]"
                              : ""
                          )}
                          title="Assets"
                        >
                          <PackageOpen className="h-4 w-4" />
                          {!isCollapsed && "Assets"}
                        </Button>
                      </Link>

                      <Link href="/assets/categories">
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-2 px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                            isCollapsed ? "justify-center" : "",
                            isActive("/assets/categories")
                              ? "bg-[var(--sidebar-accent)]"
                              : ""
                          )}
                          title="Categories"
                        >
                          <Package className="h-4 w-4" />
                          {!isCollapsed && "Categories"}
                        </Button>
                      </Link>

                      <Link href="/assets/locations">
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-2 px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                            isCollapsed ? "justify-center" : "",
                            isActive("/assets/locations")
                              ? "bg-[var(--sidebar-accent)]"
                              : ""
                          )}
                          title="Locations"
                        >
                          <MapPin className="h-4 w-4" />
                          {!isCollapsed && "Locations"}
                        </Button>
                      </Link>

                      <Link href="/assets/movements">
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-2 px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                            isCollapsed ? "justify-center" : "",
                            isActive("/assets/movements")
                              ? "bg-[var(--sidebar-accent)]"
                              : ""
                          )}
                          title="Movements"
                        >
                          <ArrowLeftRight className="h-4 w-4" />
                          {!isCollapsed && "Movements"}
                        </Button>
                      </Link>

                      <Link href="/assets/maintenance">
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-2 px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                            isCollapsed ? "justify-center" : "",
                            isActive("/assets/maintenance")
                              ? "bg-[var(--sidebar-accent)]"
                              : ""
                          )}
                          title="Maintenance"
                        >
                          <Settings2 className="h-4 w-4" />
                          {!isCollapsed && "Maintenance"}
                        </Button>
                      </Link>

                      <Link href="/assets/repairs">
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-2 px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                            isCollapsed ? "justify-center" : "",
                            isActive("/assets/repairs")
                              ? "bg-[var(--sidebar-accent)]"
                              : ""
                          )}
                          title="Repairs"
                        >
                          <Wrench className="h-4 w-4" />
                          {!isCollapsed && "Repairs"}
                        </Button>
                      </Link>

                      <Link href="/assets/value-adjustments">
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-2 px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                            isCollapsed ? "justify-center" : "",
                            isActive("/assets/value-adjustments")
                              ? "bg-[var(--sidebar-accent)]"
                              : ""
                          )}
                          title="Value Adjustments"
                        >
                          <TrendingUpDown className="h-4 w-4" />
                          {!isCollapsed && "Value Adjustments"}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Reports Section */}
            <div>
              {!isCollapsed && (
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
                  Reports & Analytics
                </h3>
              )}
              <div className="space-y-1">
                <Link href="/reports">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-2 px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                      isCollapsed ? "justify-center" : "",
                      isActive("/reports") ? "bg-[var(--sidebar-accent)]" : ""
                    )}
                    title="Reports"
                  >
                    <PieChart className="h-4 w-4" />
                    {!isCollapsed && "Reports"}
                  </Button>
                </Link>
                <Link href="/analytics">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-2 px-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]",
                      isCollapsed ? "justify-center" : "",
                      isActive("/analytics") ? "bg-[var(--sidebar-accent)]" : ""
                    )}
                    title="Analytics"
                  >
                    <BarChart3 className="h-4 w-4" />
                    {!isCollapsed && "Analytics"}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Settings and Help section are currently commented out */}
          </nav>
        </div>

        {/* Fixed footer section */}
        <div className="p-4 border-t border-[var(--sidebar-border)] flex-shrink-0">
          {isCollapsed ? (
            <div className="flex justify-center">
              <div className="rounded-full bg-[var(--sidebar-primary)] p-1">
                <User className="h-4 w-4 text-[var(--sidebar-primary-foreground)]" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 py-2 rounded-lg hover:bg-[var(--sidebar-accent)] transition-colors cursor-pointer">
              <div className="rounded-full bg-[var(--sidebar-primary)] p-1">
                <User className="h-5 w-5 text-[var(--sidebar-primary-foreground)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Kidus Abdula</p>
                <p className="text-xs text-muted-foreground truncate">
                  kidus489@gmail.com
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
