import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2, Plus, Package } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Product, ProductCategory, ProductItem } from "@/pages/product/types";
import ItemsTable from "./components/ItemsTable";
import { DropResult } from "@hello-pangea/dnd";

const CategoryAccessoriesDetailPage = () => {
  const { id: productId, categoryId } = useParams<{
    id: string;
    categoryId: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ProductItem | null>(null);

  // Fetch product details
  const { data: product } = useQuery({
    queryKey: ["product-accessories", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product")
        .select("*")
        .eq("id", productId)
        .single();

      if (error) throw error;
      return data as Product;
    },
    enabled: !!productId,
  });

  // Fetch category details
  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ["product-category-accessories", categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_category")
        .select("*")
        .eq("id", categoryId)
        .single();

      if (error) throw error;
      return data as ProductCategory;
    },
    enabled: !!categoryId,
  });

  // Fetch items for this category
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["category-accessories-items", categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_item")
        .select("*")
        .eq("product_category_id", categoryId)
        .order("order", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as ProductItem[];
    },
    enabled: !!categoryId,
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; order: number }[]) => {
      const promises = updates.map(({ id, order }) =>
        supabase.from("product_item").update({ order }).eq("id", id),
      );
      const results = await Promise.all(promises);
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) throw errors[0].error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["category-accessories-items", categoryId],
      });
      toast.success("Item order updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update item order");
      console.error(error);
      queryClient.invalidateQueries({
        queryKey: ["category-accessories-items", categoryId],
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("product_item")
        .delete()
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["category-accessories-items", categoryId],
      });
      toast.success("Item deleted successfully");
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error) => {
      toast.error("Failed to delete item");
      console.error(error);
    },
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const itemsList = Array.from(items);
    const [reorderedItem] = itemsList.splice(result.source.index, 1);
    itemsList.splice(result.destination.index, 0, reorderedItem);

    // Update order values
    const updates = itemsList.map((item, index) => ({
      id: item.id,
      order: index,
    }));

    // Optimistically update the UI
    queryClient.setQueryData(
      ["category-accessories-items", categoryId],
      itemsList,
    );

    // Save to database
    reorderMutation.mutate(updates);
  };

  const handleBackClick = () => {
    navigate(`/dashboard/product-accessories/${productId}`);
  };

  const handleAddItem = () => {
    navigate(
      `/dashboard/product-accessories/${productId}/category/${categoryId}/item/new`,
    );
  };

  const handleEditItem = (item: ProductItem) => {
    navigate(
      `/dashboard/product-accessories/${productId}/category/${categoryId}/item/${item.id}`,
    );
  };

  const handleDeleteClick = (item: ProductItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
    }
  };

  if (categoryLoading || itemsLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">
            Loading category details...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (!category) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-xl font-semibold">Category Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            The category you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={handleBackClick} className="mt-4">
            Back to Product
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb Header */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button
            onClick={() => navigate("/dashboard/product-accessories")}
            className="hover:text-foreground"
          >
            Accessories
          </button>
          <span>/</span>
          <button
            onClick={() =>
              navigate(`/dashboard/product-accessories/${productId}`)
            }
            className="hover:text-foreground"
          >
            {product?.name || "Product"}
          </button>
          <span>/</span>
          <span className="text-foreground font-medium">{category.name}</span>
        </div>

        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handleBackClick}
              className="h-9 w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {category.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                {category.subtitle || "Manage category items"}. Drag to reorder.
              </p>
            </div>
          </div>
          <Button onClick={handleAddItem} className="flex items-center gap-2">
            <Plus size={16} />
            Add Item
          </Button>
        </div>

        {/* Category Info Card */}
        {category.subtitle && (
          <Card>
            <CardHeader>
              <CardTitle>Category Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <p className="text-sm text-muted-foreground">Subtitle</p>
                <p className="text-sm">{category.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Items List */}
        {items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No items yet</h3>
              <p className="text-muted-foreground mb-4 text-center">
                Create an item to add accessories to this category
              </p>
              <Button onClick={handleAddItem}>
                <Plus size={16} className="mr-2" />
                Add Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
              <CardDescription>
                {items.length} item{items.length !== 1 ? "s" : ""} in this
                category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ItemsTable
                items={items}
                onDragEnd={handleDragEnd}
                onEdit={handleEditItem}
                onDelete={handleDeleteClick}
                isDraggable={true}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{itemToDelete?.name}". This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default CategoryAccessoriesDetailPage;
