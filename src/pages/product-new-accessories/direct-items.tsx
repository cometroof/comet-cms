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
import { Product, ProductItem } from "@/pages/product/types";
import ItemsTable from "./components/ItemsTable";
import { DropResult } from "@hello-pangea/dnd";

const DirectItemsPage = () => {
  const { id: productId } = useParams<{ id: string }>();
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

  // Fetch product items directly (without category)
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["product-accessories-direct-items", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_item")
        .select("*")
        .eq("product_id", productId)
        .is("product_category_id", null)
        .is("product_profile_id", null)
        .order("order", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as ProductItem[];
    },
    enabled: !!productId,
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
        queryKey: ["product-accessories-direct-items", productId],
      });
      toast.success("Item order updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update item order");
      console.error(error);
      queryClient.invalidateQueries({
        queryKey: ["product-accessories-direct-items", productId],
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
        queryKey: ["product-accessories-direct-items", productId],
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
      ["product-accessories-direct-items", productId],
      itemsList,
    );

    // Save to database
    reorderMutation.mutate(updates);
  };

  const handleBackClick = () => {
    navigate(`/dashboard/product-accessories/${productId}`);
  };

  const handleAddItem = () => {
    navigate(`/dashboard/product-accessories/${productId}/item/new`);
  };

  const handleEditItem = (item: ProductItem) => {
    navigate(`/dashboard/product-accessories/${productId}/item/${item.id}`);
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

  if (itemsLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading items...</p>
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
          <span className="text-foreground font-medium">Direct Items</span>
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
                Direct Items
              </h1>
              <p className="text-muted-foreground mt-1">
                Items directly associated with {product?.name || "this product"}
                . Drag to reorder.
              </p>
            </div>
          </div>
          <Button onClick={handleAddItem} className="flex items-center gap-2">
            <Plus size={16} />
            Add Item
          </Button>
        </div>

        {/* Items List */}
        {items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No items yet</h3>
              <p className="text-muted-foreground mb-4 text-center">
                Create an item to add accessories directly to this product
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
                product
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

export default DirectItemsPage;
