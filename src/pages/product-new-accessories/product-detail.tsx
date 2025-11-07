import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Loader2,
  Plus,
  ArrowRight,
  Edit,
  Trash2,
  FolderKanban,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import CategoryFormDialog from "./components/CategoryFormDialog";
import ItemsTable from "./components/ItemsTable";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

const ProductAccessoriesDetailPage = () => {
  const { id: productId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<ProductCategory | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] =
    useState<ProductCategory | null>(null);
  const [deleteItemDialogOpen, setDeleteItemDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ProductItem | null>(null);

  // Fetch product details
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["product-accessories", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product")
        .select("*")
        .eq("id", productId)
        .eq("type", "accessories")
        .single();

      if (error) throw error;
      return data as Product;
    },
    enabled: !!productId,
  });

  // Fetch categories for this product (no profile, direct association)
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["product-accessories-categories", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_category")
        .select(
          `
          *,
          items:product_item(count)
        `,
        )
        .eq("product_id", productId)
        .is("product_profile_id", null)
        .order("order", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as (ProductCategory & { items: Array<{ count: number }> })[];
    },
    enabled: !!productId,
  });

  // Fetch product items directly (without category)
  const { data: directItems = [], isLoading: directItemsLoading } = useQuery({
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
        supabase.from("product_category").update({ order }).eq("id", id),
      );
      const results = await Promise.all(promises);
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) throw errors[0].error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["product-accessories-categories", productId],
      });
      toast.success("Category order updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update category order");
      console.error(error);
      queryClient.invalidateQueries({
        queryKey: ["product-accessories-categories", productId],
      });
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase
        .from("product_category")
        .delete()
        .eq("id", categoryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["product-accessories-categories", productId],
      });
      toast.success("Category deleted successfully");
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    },
    onError: (error) => {
      toast.error("Failed to delete category");
      console.error(error);
    },
  });

  // Reorder direct items mutation
  const reorderDirectItemsMutation = useMutation({
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

  // Delete item mutation
  const deleteItemMutation = useMutation({
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
      setDeleteItemDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error) => {
      toast.error("Failed to delete item");
      console.error(error);
    },
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order values
    const updates = items.map((item, index) => ({
      id: item.id,
      order: index,
    }));

    // Optimistically update the UI
    queryClient.setQueryData(
      ["product-accessories-categories", productId],
      items,
    );

    // Save to database
    reorderMutation.mutate(updates);
  };

  const handleBackClick = () => {
    navigate("/dashboard/product-accessories");
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setShowCategoryForm(true);
  };

  const handleEditCategory = (category: ProductCategory) => {
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  const handleViewCategory = (category: ProductCategory) => {
    navigate(
      `/dashboard/product-accessories/${productId}/category/${category.id}`,
    );
  };

  const handleDeleteClick = (category: ProductCategory) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (categoryToDelete) {
      deleteMutation.mutate(categoryToDelete.id);
    }
  };

  const handleDirectItemDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const itemsList = Array.from(directItems);
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
    reorderDirectItemsMutation.mutate(updates);
  };

  const handleEditDirectItem = (item: ProductItem) => {
    // Navigate to item detail page
    navigate(`/dashboard/product-accessories/${productId}/item/${item.id}`);
  };

  const handleDeleteDirectItem = (item: ProductItem) => {
    setItemToDelete(item);
    setDeleteItemDialogOpen(true);
  };

  const handleDeleteItemConfirm = () => {
    if (itemToDelete) {
      deleteItemMutation.mutate(itemToDelete.id);
    }
  };

  const handleEditProduct = () => {
    navigate(`/dashboard/product-accessories/edit/${productId}`);
  };

  const handleViewDirectItems = () => {
    navigate(`/dashboard/product-accessories/${productId}/items`);
  };

  const getItemsCount = (
    category: ProductCategory & { items?: Array<{ count: number }> },
  ) => {
    return category.items?.[0]?.count || 0;
  };

  if (productLoading || categoriesLoading || directItemsLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">
            Loading product details...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (!product) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-xl font-semibold">Product Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={handleBackClick} className="mt-4">
            Back to Accessories
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
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
                {product.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                {product.title || "Manage accessories categories"}. Drag to
                reorder.
              </p>
            </div>
          </div>
        </div>

        {/* Product Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-start gap-10 justify-between">
                <div>Brand Information</div>
                <Button
                  onClick={handleEditProduct}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <Edit size={16} />
                  Edit Brand
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{product.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Title</p>
                  <p className="font-medium">{product.title || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Slug</p>
                  <p className="font-medium">{product.slug || "-"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                {product.description_en && (
                  <div className="pt-2">
                    <p className="text-sm">{product.description_en}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories List */}
        {categories.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderKanban className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
              <p className="text-muted-foreground mb-4 text-center">
                Create a category to organize accessories items
              </p>
              <Button onClick={handleAddCategory}>
                <Plus size={16} className="mr-2" />
                Add Category
              </Button>
            </CardContent>
          </Card>
        ) : categories.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex items-start justify-between gap-10">
                  <div>Categories</div>
                  <Button
                    onClick={handleAddCategory}
                    className="flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add Category
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                {categories.length} categor
                {categories.length !== 1 ? "ies" : "y"} in this product
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Subtitle</TableHead>
                      <TableHead className="text-center">Items</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <Droppable droppableId="categories">
                    {(provided) => (
                      <TableBody
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {categories.map((category, index) => (
                          <Draggable
                            key={category.id}
                            draggableId={category.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <TableRow
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={
                                  snapshot.isDragging ? "bg-muted/50" : ""
                                }
                              >
                                <TableCell {...provided.dragHandleProps}>
                                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                                </TableCell>
                                <TableCell className="font-medium">
                                  {category.name}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {category.subtitle || "-"}
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className="inline-flex items-center justify-center bg-primary/10 text-primary px-2 py-1 rounded-md text-sm font-medium">
                                    {getItemsCount(category)}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        handleEditCategory(category)
                                      }
                                      title="Edit category"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        handleViewCategory(category)
                                      }
                                      title="Manage items"
                                    >
                                      <ArrowRight className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        handleDeleteClick(category)
                                      }
                                      title="Delete category"
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </TableBody>
                    )}
                  </Droppable>
                </Table>
              </DragDropContext>
            </CardContent>
          </Card>
        ) : null}

        {/* Direct Items (no category) */}
        {directItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex items-start justify-between gap-10">
                  <div>Direct Items</div>
                  <Button
                    onClick={handleViewDirectItems}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <ArrowRight size={16} />
                    Manage Items
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                {directItems.length} item{directItems.length !== 1 ? "s" : ""}{" "}
                directly associated with this product. Drag to reorder.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ItemsTable
                items={directItems}
                onDragEnd={handleDirectItemDragEnd}
                onEdit={handleEditDirectItem}
                onDelete={handleDeleteDirectItem}
                isDraggable={true}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Category Form Dialog */}
      {showCategoryForm && (
        <CategoryFormDialog
          productId={productId!}
          profileId={null}
          category={editingCategory}
          isOpen={showCategoryForm}
          onClose={() => {
            setShowCategoryForm(false);
            setEditingCategory(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["product-accessories-categories", productId],
            });
            setShowCategoryForm(false);
            setEditingCategory(null);
          }}
        />
      )}

      {/* Delete Category Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{categoryToDelete?.name}" and all
              its associated items. This action cannot be undone.
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

      {/* Delete Item Confirmation Dialog */}
      <AlertDialog
        open={deleteItemDialogOpen}
        onOpenChange={setDeleteItemDialogOpen}
      >
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
              onClick={handleDeleteItemConfirm}
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

export default ProductAccessoriesDetailPage;
