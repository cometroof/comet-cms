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
  Edit,
  Trash2,
  Package,
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
import {
  Product,
  ProductProfile,
  ProductCategory,
  ProductItem,
} from "@/pages/product/types";
import ItemFormDialog from "./components/ItemFormDialog";
import CategoryFormDialog from "./components/CategoryFormDialog";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

const CategoryDetailPage = () => {
  const {
    id: productId,
    profileId,
    categoryId,
  } = useParams<{
    id: string;
    profileId: string;
    categoryId: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductItem | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<ProductCategory | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ProductItem | null>(null);

  // Fetch product details
  const { data: product } = useQuery({
    queryKey: ["product-new", productId],
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

  // Fetch profile details
  const { data: profile } = useQuery({
    queryKey: ["product-profile", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_profile")
        .select("*")
        .eq("id", profileId)
        .single();

      if (error) throw error;
      return data as ProductProfile;
    },
    enabled: !!profileId,
  });

  // Fetch category details
  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ["product-category", categoryId],
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
    queryKey: ["category-items", categoryId],
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
        supabase.from("product_item").update({ order }).eq("id", id)
      );
      const results = await Promise.all(promises);
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) throw errors[0].error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["category-items", categoryId],
      });
      toast.success("Item order updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update item order");
      console.error(error);
      queryClient.invalidateQueries({
        queryKey: ["category-items", categoryId],
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
        queryKey: ["category-items", categoryId],
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
    queryClient.setQueryData(["category-items", categoryId], itemsList);

    // Save to database
    reorderMutation.mutate(updates);
  };

  const handleBackClick = () => {
    navigate(`/dashboard/product-new/${productId}/profile/${profileId}`);
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setShowItemForm(true);
  };

  const handleEditCategory = () => {
    setEditingCategory(category || null);
    setShowCategoryForm(true);
  };

  const handleEditItem = (item: ProductItem) => {
    setEditingItem(item);
    setShowItemForm(true);
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
            Back to Profile
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
            onClick={() => navigate("/dashboard/product-new")}
            className="hover:text-foreground"
          >
            Products
          </button>
          <span>/</span>
          <button
            onClick={() => navigate(`/dashboard/product-new/${productId}`)}
            className="hover:text-foreground"
          >
            {product?.name || "Product"}
          </button>
          <span>/</span>
          <button onClick={handleBackClick} className="hover:text-foreground">
            {profile?.name || "Profile"}
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
        </div>

        {/* Category Info Card */}
        {/* {category.subtitle && ( */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row justify-between gap-10">
              <CardTitle>Category Information</CardTitle>
              <Button
                onClick={handleEditCategory}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Edit size={16} />
                Edit Category
              </Button>
            </div>
          </CardHeader>
          {category.subtitle && (
            <CardContent>
              <div>
                <p className="text-sm text-muted-foreground">Subtitle</p>
                <p className="text-sm">{category.subtitle}</p>
              </div>
            </CardContent>
          )}
        </Card>
        {/* )} */}

        {/* Items List */}
        {items.length === 0 ? (
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row justify-between gap-10">
                <CardTitle>Items</CardTitle>
                <Button
                  onClick={handleAddItem}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No items yet</h3>
              <p className="text-muted-foreground mb-4 text-center">
                Create an item to add products to this category
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row justify-between gap-10">
                <div>
                  <CardTitle>Items</CardTitle>
                  <CardDescription>
                    {items.length} item{items.length !== 1 ? "s" : ""} in this
                    category
                  </CardDescription>
                </div>
                <Button
                  onClick={handleAddItem}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Image</TableHead>
                      <TableHead>Length</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <Droppable droppableId="items">
                    {(provided) => (
                      <TableBody
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {items.map((item, index) => (
                          <Draggable
                            key={item.id}
                            draggableId={item.id}
                            index={index}
                          >
                            {(provided, snapshot) => {
                              const images =
                                (item.image &&
                                  item.image.split(",,,").filter(Boolean)) ||
                                [];
                              return (
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
                                    {item.name}
                                  </TableCell>
                                  <TableCell>
                                    {images.length > 0 ? (
                                      <img
                                        src={images[0]}
                                        alt={item.name}
                                        className="w-12 h-12 object-cover rounded"
                                      />
                                    ) : (
                                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                        <Package className="w-6 h-6 text-muted-foreground" />
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {item.length || "-"}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {item.weight || "-"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEditItem(item)}
                                        title="Edit item"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteClick(item)}
                                        title="Delete item"
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            }}
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
        )}
      </div>

      {/* Item Form Dialog */}
      {showItemForm && (
        <ItemFormDialog
          productId={productId!}
          profileId={profileId!}
          categoryId={categoryId!}
          item={editingItem}
          isOpen={showItemForm}
          onClose={() => {
            setShowItemForm(false);
            setEditingItem(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["category-items", categoryId],
            });
            setShowItemForm(false);
            setEditingItem(null);
          }}
        />
      )}

      {/* Category Form Dialog (edit current category) */}
      {showCategoryForm && (
        <CategoryFormDialog
          profileId={profileId!}
          category={editingCategory}
          isOpen={showCategoryForm}
          onClose={() => {
            setShowCategoryForm(false);
            setEditingCategory(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["product-category", categoryId],
            });
            queryClient.invalidateQueries({
              queryKey: ["profile-categories", profileId],
            });
            setShowCategoryForm(false);
            setEditingCategory(null);
          }}
        />
      )}

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

export default CategoryDetailPage;
