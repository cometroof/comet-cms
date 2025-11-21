import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Loader2,
  Package,
  Edit,
  Trash2,
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
import { Product } from "@/pages/product/types";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

const AddonListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addonToDelete, setAddonToDelete] = useState<Product | null>(null);

  // Fetch add-ons with type = 'add-on'
  const { data: addons = [], isLoading } = useQuery({
    queryKey: ["addons-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product")
        .select("*")
        .eq("type", "add-on")
        .order("order", { ascending: true });

      if (error) throw error;
      return data as Product[];
    },
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; order: number }[]) => {
      const promises = updates.map(({ id, order }) =>
        supabase.from("product").update({ order }).eq("id", id)
      );
      const results = await Promise.all(promises);
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) throw errors[0].error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addons-list"] });
      toast.success("Add-on order updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update add-on order");
      console.error(error);
      queryClient.invalidateQueries({ queryKey: ["addons-list"] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (addonId: string) => {
      const { error } = await supabase
        .from("product")
        .delete()
        .eq("id", addonId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addons-list"] });
      queryClient.invalidateQueries({ queryKey: ["addons-menu"] });
      toast.success("Add-on deleted successfully");
      setDeleteDialogOpen(false);
      setAddonToDelete(null);
    },
    onError: (error) => {
      toast.error("Failed to delete add-on");
      console.error(error);
    },
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(addons);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order values
    const updates = items.map((item, index) => ({
      id: item.id,
      order: index,
    }));

    // Optimistically update the UI
    queryClient.setQueryData(["addons-list"], items);

    // Save to database
    reorderMutation.mutate(updates);
  };

  const handleAddAddon = () => {
    navigate("/dashboard/product-add-ons/create");
  };

  const handleEditAddon = (addon: Product) => {
    navigate(`/dashboard/product-add-ons/${addon.id}/edit`);
  };

  const handleDeleteClick = (addon: Product) => {
    setAddonToDelete(addon);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (addonToDelete) {
      deleteMutation.mutate(addonToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading add-ons...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Product Add-ons
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your product add-ons. Drag to reorder.
            </p>
          </div>
          {/* <Button onClick={handleAddAddon} className="flex items-center gap-2">
            <Plus size={16} />
            Add Product Add-on
          </Button> */}
        </div>

        {/* Add-ons List */}
        {addons.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No add-ons yet</h3>
              <p className="text-muted-foreground mb-4 text-center">
                Get started by creating your first product add-on
              </p>
              <Button onClick={handleAddAddon}>
                <Plus size={16} className="mr-2" />
                Add Product Add-on
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>All Product Add-ons</CardTitle>
              <CardDescription>
                {addons.length} add-on{addons.length !== 1 ? "s" : ""} in total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description (EN)</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <Droppable droppableId="addons">
                    {(provided) => (
                      <TableBody
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {addons.map((addon, index) => (
                          <Draggable
                            key={addon.id}
                            draggableId={addon.id}
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
                                  {addon.name}
                                </TableCell>
                                <TableCell className="text-muted-foreground max-w-md truncate">
                                  {addon.description_en || "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEditAddon(addon)}
                                      title="Edit add-on"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteClick(addon)}
                                      title="Delete add-on"
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
              This will permanently delete "{addonToDelete?.name}". This action
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

export default AddonListPage;
