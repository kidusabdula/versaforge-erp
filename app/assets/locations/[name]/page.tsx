// app/assets/locations/[name]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  ArrowLeft, 
  Edit, 
  Calendar,
  Download,
  Printer,
  Share,
  Trash2
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

interface AssetLocation {
  name: string;
  location_name: string;
  parent_location: string;
  is_group: number;
  address: string;
  creation: string;
  modified: string;
  owner: string;
}

export default function LocationDetailPage() {
  const { push: toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<AssetLocation | null>(null);

  useEffect(() => {
    fetchLocation();
  }, [params.name]);

  const fetchLocation = async () => {
    try {
      const response = await fetch(`/api/asset/locations/${params.name}`);
      if (!response.ok) {
        throw new Error('Failed to fetch location');
      }

      const data = await response.json();
      setLocation(data.data.location);
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to load location: ${(error as Error).message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this location?")) {
      return;
    }

    try {
      const response = await fetch(`/api/asset/locations/${params.name}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete location");
      }

      toast({
        title: "Success",
        description: "Location deleted successfully",
      });

      router.push("/assets/locations");
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to delete location: ${(error as Error).message}`,
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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

  if (!location) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Location Not Found</h2>
          <p className="text-muted-foreground mb-4">The location you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/assets/locations')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Locations
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
              onClick={() => router.push('/assets/locations')}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <MapPin className="w-8 h-8 mr-3 text-primary" />
                Location Details
              </h1>
              <p className="text-muted-foreground">View and manage location information</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" size="sm">
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button 
              size="sm"
              onClick={() => router.push(`/assets/locations/${location.name}/edit`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button 
              size="sm"
              variant="destructive"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Location Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Location Name</p>
                        <p className="font-medium">{location.location_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location ID</p>
                        <p className="font-medium">{location.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Type</p>
                        <Badge variant={location.is_group === 1 ? "default" : "secondary"}>
                          {location.is_group === 1 ? "Group" : "Item"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Parent Location</p>
                        <p className="font-medium">
                          {location.parent_location ? (
                            <Badge variant="outline">{location.parent_location}</Badge>
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle>Address</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{location.address || 'No address provided'}</p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div>
            {/* Summary Card */}
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Location Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Location Name</span>
                    <span className="font-medium">{location.location_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Location ID</span>
                    <span className="font-medium">{location.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type</span>
                    <Badge variant={location.is_group === 1 ? "default" : "secondary"}>
                      {location.is_group === 1 ? "Group" : "Item"}
                    </Badge>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between">
                    <span>Parent Location</span>
                    <span>
                      {location.parent_location || 'None'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Created On:</span>
                    <span className="font-medium">{formatDate(location.creation)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Last Modified:</span>
                    <span className="font-medium">{formatDate(location.modified)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push(`/assets/locations/${location.name}/edit`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Location
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Location
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