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
import {
  Product,
  ProductProfile,
  ProductCategory,
} from "@/pages/product/types";
import CategoryFormDialog from "./components/CategoryFormDialog";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

const ProfileDetailPage = () => {
  const { id: productId, profileId } = useParams<{
    id: string;
    profileId: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<ProductCategory | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] =
    useState<ProductCategory | null>(null);

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
  const { data: profile, isLoading: profileLoading } = useQuery({
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

  // Fetch categories for this profile
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["profile-categories", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_category")
        .select(
          `
          *,
          items:product_item(count)
        `,
        )
        .eq("product_profile_id", profileId)
        .order("order", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as (ProductCategory & { items: Array<{ count: number }> })[];
    },
    enabled: !!profileId,
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
        queryKey: ["profile-categories", profileId],
      });
      toast.success("Category order updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update category order");
      console.error(error);
      queryClient.invalidateQueries({
        queryKey: ["profile-categories", profileId],
      });
    },
  });

  // Delete mutation
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
        queryKey: ["profile-categories", profileId],
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
    queryClient.setQueryData(["profile-categories", profileId], items);

    // Save to database
    reorderMutation.mutate(updates);
  };

  const handleBackClick = () => {
    navigate(`/dashboard/product-new/${productId}`);
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
      `/dashboard/product-new/${productId}/profile/${profileId}/category/${category.id}`,
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

  const handleEditProfile = () => {
    navigate(`/dashboard/product-new/${productId}/profile/${profileId}/edit`);
  };

  const getItemsCount = (
    category: ProductCategory & { items?: Array<{ count: number }> },
  ) => {
    return category.items?.[0]?.count || 0;
  };

  if (profileLoading || categoriesLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">
            Loading profile details...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-xl font-semibold">Profile Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            The profile you're looking for doesn't exist or has been removed.
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
            onClick={() => navigate("/dashboard/product-new")}
            className="hover:text-foreground"
          >
            Products
          </button>
          <span>/</span>
          <button onClick={handleBackClick} className="hover:text-foreground">
            {product?.name || "Product"}
          </button>
          <span>/</span>
          <span className="text-foreground font-medium">{profile.name}</span>
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
                {profile.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage profile categories. Drag to reorder.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleEditProfile}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Edit size={16} />
              Edit Profile
            </Button>
            <Button
              onClick={handleAddCategory}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Add Category
            </Button>
          </div>
        </div>

        {/* Profile Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Materials</p>
                <p className="font-medium">{profile.materials || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Thickness</p>
                <p className="font-medium">{profile.thickness || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Weight</p>
                <p className="font-medium">{profile.weight || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Size Per Panel</p>
                <p className="font-medium">{profile.size_per_panel || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Effective Size</p>
                <p className="font-medium">{profile.effective_size || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Panel Amount</p>
                <p className="font-medium">{profile.panel_amount || "-"}</p>
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
                Create a category to organize product items
              </p>
              <Button onClick={handleAddCategory}>
                <Plus size={16} className="mr-2" />
                Add Category
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>
                {categories.length} categor
                {categories.length !== 1 ? "ies" : "y"} in this profile
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
        )}
      </div>

      {/* Category Form Dialog */}
      {showCategoryForm && (
        <CategoryFormDialog
          productId={productId!}
          profileId={profileId!}
          category={editingCategory}
          isOpen={showCategoryForm}
          onClose={() => {
            setShowCategoryForm(false);
            setEditingCategory(null);
          }}
          onSuccess={() => {
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
    </DashboardLayout>
  );
};

export default ProfileDetailPage;
