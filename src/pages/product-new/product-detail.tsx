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
  Layers,
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
import { Product, ProductProfile } from "@/pages/product/types";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<ProductProfile | null>(
    null,
  );

  // Fetch product details
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["product-new", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product")
        .select("*")
        .eq("id", id)
        .eq("is_under_product", true)
        .single();

      if (error) throw error;
      return data as Product;
    },
    enabled: !!id,
  });

  // Fetch profiles for this product
  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ["product-profiles", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_profile")
        .select(
          `
          *,
          categories:product_category(count)
        `,
        )
        .eq("product_id", id)
        .order("order", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as (ProductProfile & {
        categories: Array<{ count: number }>;
      })[];
    },
    enabled: !!id,
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; order: number }[]) => {
      const promises = updates.map(({ id, order }) =>
        supabase.from("product_profile").update({ order }).eq("id", id),
      );
      const results = await Promise.all(promises);
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) throw errors[0].error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-profiles", id] });
      toast.success("Profile order updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update profile order");
      console.error(error);
      queryClient.invalidateQueries({ queryKey: ["product-profiles", id] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase
        .from("product_profile")
        .delete()
        .eq("id", profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-profiles", id] });
      toast.success("Profile deleted successfully");
      setDeleteDialogOpen(false);
      setProfileToDelete(null);
    },
    onError: (error) => {
      toast.error("Failed to delete profile");
      console.error(error);
    },
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(profiles);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order values
    const updates = items.map((item, index) => ({
      id: item.id,
      order: index,
    }));

    // Optimistically update the UI
    queryClient.setQueryData(["product-profiles", id], items);

    // Save to database
    reorderMutation.mutate(updates);
  };

  const handleBackClick = () => {
    navigate("/dashboard/product-new");
  };

  const handleAddProfile = () => {
    navigate(`/dashboard/product-new/${id}/profile/create`);
  };

  const handleEditProfile = (profile: ProductProfile) => {
    navigate(`/dashboard/product-new/${id}/profile/${profile.id}/edit`);
  };

  const handleViewProfile = (profile: ProductProfile) => {
    navigate(`/dashboard/product-new/${id}/profile/${profile.id}`);
  };

  const handleDeleteClick = (profile: ProductProfile) => {
    setProfileToDelete(profile);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (profileToDelete) {
      deleteMutation.mutate(profileToDelete.id);
    }
  };

  const handleEditProduct = () => {
    navigate(`/dashboard/product-new/edit/${id}`);
  };

  const getCategoriesCount = (
    profile: ProductProfile & { categories?: Array<{ count: number }> },
  ) => {
    return profile.categories?.[0]?.count || 0;
  };

  if (productLoading || profilesLoading) {
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
            Back to Products
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
                {product.title || "Manage product profiles"}. Drag to reorder.
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

        {/* Profiles List */}
        {profiles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Layers className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No profiles yet</h3>
              <p className="text-muted-foreground mb-4 text-center">
                Create a profile to organize categories and items
              </p>
              <Button onClick={handleAddProfile}>
                <Plus size={16} className="mr-2" />
                Add Profile
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex items-start justify-between gap-10">
                  <div>Profiles</div>
                  <Button
                    onClick={handleAddProfile}
                    className="flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add Profile
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                {profiles.length} profile{profiles.length !== 1 ? "s" : ""} in
                this product
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Materials</TableHead>
                      <TableHead className="text-center">Categories</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <Droppable droppableId="profiles">
                    {(provided) => (
                      <TableBody
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {profiles.map((profile, index) => (
                          <Draggable
                            key={profile.id}
                            draggableId={profile.id}
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
                                  {profile.name}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {profile.materials || "-"}
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className="inline-flex items-center justify-center bg-primary/10 text-primary px-2 py-1 rounded-md text-sm font-medium">
                                    {getCategoriesCount(profile)}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEditProfile(profile)}
                                      title="Edit profile"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleViewProfile(profile)}
                                      title="Manage categories"
                                    >
                                      <ArrowRight className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteClick(profile)}
                                      title="Delete profile"
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{profileToDelete?.name}" and all its
              associated categories and items. This action cannot be undone.
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

export default ProductDetailPage;
