// app/analytics/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  BarChart3, 
  AlertTriangle, 
  Clock, 
  Mail, 
  Bell,
  Settings,
  RefreshCw,
  Home
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function AnalyticsMaintenancePage() {
  const router = useRouter();
  const [estimatedTime, setEstimatedTime] = useState("3-4 weeks");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = () => {
    if (!notificationEmail) {
      alert("Please enter a valid email address");
      return;
    }
    
    // In a real implementation, this would save the email to a database
    setSubscribed(true);
  };

  const handleGoHome = () => {
    router.push("/");
  };

  const handleGoToAssets = () => {
    router.push("/assets/dashboard");
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={handleGoHome}
              className="mr-4"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <BarChart3 className="w-8 h-8 mr-3 text-primary" />
                Analytics
              </h1>
              <p className="text-muted-foreground">
                Gain insights from your asset data
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleGoToAssets}
            className="flex items-center"
          >
            <Settings className="w-4 h-4 mr-2" />
            Manage Assets
          </Button>
        </div>

        {/* Maintenance Alert */}
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-blue-800">
                  Analytics Module Under Development
                </h2>
                <p className="text-blue-700 mt-2">
                  We're currently building powerful analytics tools to help you make data-driven decisions about your assets. This feature will be available soon with advanced visualization and insights.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* What's Coming */}
            <Card>
              <CardHeader>
                <CardTitle>What's Coming</CardTitle>
                <CardDescription>
                  Advanced analytics features we're building for you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
                  <div>
                    <h3 className="font-medium">Asset Performance Metrics</h3>
                    <p className="text-sm text-muted-foreground">Track utilization rates, downtime, and efficiency metrics across your asset portfolio</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
                  <div>
                    <h3 className="font-medium">Predictive Maintenance Analytics</h3>
                    <p className="text-sm text-muted-foreground">AI-powered predictions for maintenance needs and potential failures before they occur</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</div>
                  <div>
                    <h3 className="font-medium">Cost Optimization Insights</h3>
                    <p className="text-sm text-muted-foreground">Identify cost-saving opportunities through data analysis of asset lifecycle and usage patterns</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">4</div>
                  <div>
                    <h3 className="font-medium">Interactive Dashboards</h3>
                    <p className="text-sm text-muted-foreground">Customizable dashboards with real-time data visualization and drill-down capabilities</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Use Cases */}
            <Card>
              <CardHeader>
                <CardTitle>Use Cases</CardTitle>
                <CardDescription>
                  How analytics will help you manage your assets better
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Asset Managers</h3>
                  <p className="text-sm text-muted-foreground">Monitor asset performance, schedule maintenance proactively, and optimize asset allocation based on usage patterns.</p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Finance Teams</h3>
                  <p className="text-sm text-muted-foreground">Track asset depreciation, calculate ROI, and make informed decisions about asset purchases and disposals.</p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Operations Teams</h3>
                  <p className="text-sm text-muted-foreground">Identify bottlenecks, optimize workflows, and ensure assets are available when needed.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Notification */}
            <Card>
              <CardHeader>
                <CardTitle>Get Notified</CardTitle>
                <CardDescription>
                  Be the first to know when analytics are available
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {subscribed ? (
                  <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <Bell className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">You're subscribed!</p>
                      <p className="text-sm text-green-700">We'll notify you at {notificationEmail}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={notificationEmail}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotificationEmail(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <Button onClick={handleSubscribe} className="w-full">
                      <Mail className="w-4 h-4 mr-2" />
                      Notify Me
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Alternative Actions */}
            <Card>
              <CardHeader>
                <CardTitle>While You Wait</CardTitle>
                <CardDescription>
                  Explore other features of the asset management system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleGoToAssets}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Assets
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push("/assets/dashboard")}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Asset Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push("/assets/value-adjustments")}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Track Value Adjustments
                </Button>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.open("mailto:support@example.com")}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.open("/docs")}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Documentation
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}