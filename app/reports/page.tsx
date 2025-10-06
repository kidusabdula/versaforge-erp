// app/reports/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { 
  FileText, 
  AlertTriangle, 
  Clock, 
  Mail, 
  Bell,
  Settings,
  RefreshCw,
  Home
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ReportsMaintenancePage() {
  const router = useRouter();
  const [estimatedTime, setEstimatedTime] = useState("2-3 weeks");
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
                <FileText className="w-8 h-8 mr-3 text-primary" />
                Reports
              </h1>
              <p className="text-muted-foreground">
                Generate and view various reports
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
        <Card className="mb-8 border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-full bg-orange-100 text-orange-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-orange-800">
                  Reports Module Under Maintenance
                </h2>
                <p className="text-orange-700 mt-2">
                  We're currently working on improving our reports functionality. This feature will be available soon with enhanced reporting capabilities.
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
                  New features we're working on for the reports module
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
                  <div>
                    <h3 className="font-medium">Comprehensive Asset Reports</h3>
                    <p className="text-sm text-muted-foreground">Detailed reports on asset utilization, depreciation, and lifecycle management</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
                  <div>
                    <h3 className="font-medium">Financial Analysis</h3>
                    <p className="text-sm text-muted-foreground">Cost analysis, ROI calculations, and budget tracking for your assets</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</div>
                  <div>
                    <h3 className="font-medium">Maintenance & Repair Analytics</h3>
                    <p className="text-sm text-muted-foreground">Insights into maintenance patterns, repair costs, and predictive analytics</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">4</div>
                  <div>
                    <h3 className="font-medium">Custom Report Builder</h3>
                    <p className="text-sm text-muted-foreground">Create custom reports with filters and visualizations tailored to your needs</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Development Timeline</CardTitle>
                <CardDescription>
                  Our progress on the reports module
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    <span className="text-xs font-bold">✓</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">Backend API Development</h3>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    <span className="text-xs font-bold">✓</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">Database Schema Design</h3>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">Frontend Implementation</h3>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">Testing & QA</h3>
                    <p className="text-sm text-muted-foreground">Scheduled</p>
                  </div>
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
                  Be the first to know when reports are available
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
                  <FileText className="w-4 h-4 mr-2" />
                  View Asset Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push("/assets/maintenance")}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Track Maintenance
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
                  <FileText className="w-4 h-4 mr-2" />
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