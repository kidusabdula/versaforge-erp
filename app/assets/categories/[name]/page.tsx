// app/assets/categories/[name]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Folder, 
  ArrowLeft, 
  Edit, 
  Calendar,
  Building,
  Download,
  Printer,
  Share,
  Trash2
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

interface AssetCategory {
  name: string;
  asset_category_name: string;
  company: string;
  parent_category: string;
  is_group: number;
  creation: string;
  modified: string;
  owner: string;
  accounts: any[];
}

export default function CategoryDetailPage() {
  const { push: toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<AssetCategory | null>(null);

  useEffect(() => {
    fetchCategory();
  }, [params.name]);

  const fetchCategory = async () => {
    try {
      const response = await fetch(`/api/asset/categories/${params.name}`);
      if (!response.ok) {
        throw new Error('Failed to fetch category');
      }

      const data = await response.json();
      setCategory(data.data.category);
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to load category: ${(error as Error).message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this category?")) {
      return;
    }

    try {
      const response = await fetch(`/api/asset/categories/${params.name}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete category");
      }

      toast({
        title: "Success",
        description: "Category deleted successfully",
      });

      router.push("/assets/categories");
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: "Error",
        description: `Failed to delete category: ${(error as Error).message}`,
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

  if (!category) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <Folder className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Category Not Found</h2>
          <p className="text-muted-foreground mb-4">The category you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/assets/categories')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Categories
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
              onClick={() => router.push('/assets/categories')}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Folder className="w-8 h-8 mr-3 text-primary" />
                Category Details
              </h1>
              <p className="text-muted-foreground">View and manage category information</p>
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
              onClick={() => router.push(`/assets/categories/${category.name}/edit`)}
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
                <CardTitle>Category Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Category Name</p>
                        <p className="font-medium">{category.asset_category_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Category ID</p>
                        <p className="font-medium">{category.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Type</p>
                        <Badge variant={category.is_group === 1 ? "default" : "secondary"}>
                          {category.is_group === 1 ? "Group" : "Item"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Parent Category</p>
                        <p className="font-medium">
                          {category.parent_category ? (
                            <Badge variant="outline">{category.parent_category}</Badge>
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Company</p>
                        <div className="flex items-center">
                          <Building className="w-4 h-4 mr-2 text-muted-foreground" />
                          {category.company}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Accounts */}
            {category.accounts && category.accounts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Accounts</CardTitle>
                  <CardDescription>Accounts associated with this category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {category.accounts.map((account, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between">
                          <span className="font-medium">{account.account_name}</span>
                          <Badge variant="outline">{account.account_type}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Summary */}
          <div>
            {/* Summary Card */}
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Category Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Category Name</span>
                    <span className="font-medium">{category.asset_category_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Category ID</span>
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type</span>
                    <Badge variant={category.is_group === 1 ? "default" : "secondary"}>
                      {category.is_group === 1 ? "Group" : "Item"}
                    </Badge>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between">
                    <span>Parent Category</span>
                    <span>
                      {category.parent_category || 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Company</span>
                    <span>{category.company}</span>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Created On:</span>
                    <span className="font-medium">{formatDate(category.creation)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Last Modified:</span>
                    <span className="font-medium">{formatDate(category.modified)}</span>
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
                    onClick={() => router.push(`/assets/categories/${category.name}/edit`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Category
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Category
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