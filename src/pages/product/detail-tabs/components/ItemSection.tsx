import { useState } from "react";
import { useProductQuery } from "@/contexts/ProductQueryContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Loader2,
  PackageOpen,
  Image as ImageIcon,
  Folder,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import ImageSelectorDialog from "@/components/ImageSelectorDialog";
import { ProductItem } from "../../types";
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

// Form validation schema - tanpa product_profile_id karena ini khusus direct product items
const formSchema = z.object({
  product_id: z.string(),
  product_category_id: z.string().optional().nullable(),
  name: z.string().min(1, "Item name is required"),
  spec_info: z
    .array(
      z.object({
        field: z.string().min(1, "Field name is required"),
        value: z.string().min(1, "Value is required"),
      }),
    )
    .optional(),
  image: z.string().min(1, "Image is required"),
});

interface ItemSectionProps {
  productId: string;
}

const ItemSection = ({ productId }: ItemSectionProps) => {
  const {
    items,
    categories,
    isItemsLoading: loading,
    createItemMutation,
    updateItemMutation,
    deleteItemMutation,
  } = useProductQuery();

  const [showItemForm, setShowItemForm] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Filter items - hanya yang direct product items (tidak memiliki product_profile_id)
  const productItems = items.filter((item) => !item.product_profile_id);

  // Filter categories - hanya yang terkait dengan product (bukan profile)
  const productCategories = categories.filter((cat) => cat.product_id);

  // Group items by category
  const groupedItems = productItems.reduce(
    (acc, item) => {
      const categoryId = item.product_category_id || "uncategorized";
      if (!acc[categoryId]) {
        acc[categoryId] = [];
      }
      acc[categoryId].push(item);
      return acc;
    },
    {} as Record<string, ProductItem[]>,
  );

  // Create form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      product_id: productId,
      product_category_id: null,
      name: "",
      spec_info: [],
      image: "",
    },
  });

  const handleAddItem = () => {
    form.reset({
      product_id: productId,
      product_category_id: null,
      name: "",
      spec_info: [],
      image: "",
    });
    setEditingItem(null);
    setShowItemForm(true);
  };

  const handleEditItem = (item: ProductItem) => {
    // Parse spec_info from JSONB
    let specInfo: Array<{ field: string; value: string }> = [];
    if (item.spec_info && typeof item.spec_info === "object") {
      specInfo = Object.entries(item.spec_info).map(([field, value]) => ({
        field,
        value: String(value),
      }));
    }

    form.reset({
      product_id: productId,
      product_category_id: item.product_category_id,
      name: item.name,
      spec_info: specInfo,
      image: item.image || "",
    });
    setEditingItem(item);
    setShowItemForm(true);
  };

  const handleDeleteClick = (itemId: string) => {
    setItemToDelete(itemId);
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    deleteItemMutation.mutate(itemToDelete);
    setShowConfirmDelete(false);
    setItemToDelete(null);
  };

  const handleImageSelect = (image: string) => {
    form.setValue("image", image);
    setShowImageSelector(false);
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    // Convert spec_info array to JSONB object
    const specInfoObject: Record<string, string> = {};
    if (data.spec_info && data.spec_info.length > 0) {
      data.spec_info.forEach((item) => {
        if (item.field && item.value) {
          specInfoObject[item.field] = item.value;
        }
      });
    }

    const itemData: Omit<ProductItem, "id" | "created_at" | "updated_at"> = {
      product_id: data.product_id,
      name: data.name,
      spec_info: Object.keys(specInfoObject).length > 0 ? specInfoObject : null,
      image: data.image,
      product_profile_id: null, // Always null for direct product items
      product_category_id: data.product_category_id || null,
    };

    if (editingItem) {
      updateItemMutation.mutate({
        ...itemData,
        id: editingItem.id,
        created_at: editingItem.created_at,
        updated_at: editingItem.updated_at,
      });
    } else {
      createItemMutation.mutate(itemData);
    }
    setShowItemForm(false);
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    const category = productCategories.find((cat) => cat.id === categoryId);
    return category?.name || "Unknown Category";
  };

  const renderItemCard = (item: ProductItem) => (
    <div
      key={item.id}
      className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
    >
      {item.image ? (
        <img
          src={item.image}
          alt={item.name}
          className="w-16 h-16 object-cover rounded-md"
        />
      ) : (
        <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
          <ImageIcon className="w-6 h-6 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{item.name}</h4>
        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
          {item.spec_info &&
            typeof item.spec_info === "object" &&
            Object.entries(item.spec_info).map(([field, value]) => (
              <span key={field}>
                {field}: {String(value)}
              </span>
            ))}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleEditItem(item)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Item
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleDeleteClick(item.id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Item
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-base">Items</CardTitle>
            <CardDescription>Manage items for this product</CardDescription>
          </div>
          {productItems.length > 0 && (
            <Button onClick={handleAddItem} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : productItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <PackageOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-base font-semibold">No items yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first item to showcase your product
              </p>
              <Button onClick={handleAddItem} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Categorized items */}
              {productCategories.map((category) => {
                const categoryItems = groupedItems[category.id] || [];
                if (categoryItems.length === 0) return null;

                return (
                  <div key={category.id}>
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Folder className="h-4 w-4 text-muted-foreground" />
                      {category.name}
                      {category.subtitle && (
                        <span className="text-muted-foreground font-normal">
                          - {category.subtitle}
                        </span>
                      )}
                    </h3>
                    <div className="space-y-2">
                      {categoryItems.map((item) => renderItemCard(item))}
                    </div>
                  </div>
                );
              })}

              {/* Uncategorized items */}
              {groupedItems.uncategorized &&
                groupedItems.uncategorized.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm mb-3 text-muted-foreground">
                      Uncategorized
                    </h3>
                    <div className="space-y-2">
                      {groupedItems.uncategorized.map((item) =>
                        renderItemCard(item),
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Item Form Dialog */}
      <Dialog open={showItemForm} onOpenChange={setShowItemForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Item" : "Add New Item"}
            </DialogTitle>
            <DialogDescription>
              Fill in the item details. Category is optional.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter item name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="product_category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value === "none" ? null : value);
                      }}
                      value={field.value || "none"}
                      disabled={productCategories.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">
                            No category
                          </span>
                        </SelectItem>
                        {productCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {productCategories.length === 0
                        ? "No categories available. Create a category first."
                        : "Choose a category to organize this item"}
                    </FormDescription>
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <FormLabel>Specifications</FormLabel>
                <div className="space-y-2">
                  {form.watch("spec_info")?.map((_, index) => (
                    <div key={index} className="flex gap-2">
                      <FormField
                        control={form.control}
                        name={`spec_info.${index}.field`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                placeholder="Field (e.g., Weight)"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`spec_info.${index}.value`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                placeholder="Value (e.g., 5.2kg)"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const currentSpecs =
                            form.getValues("spec_info") || [];
                          form.setValue(
                            "spec_info",
                            currentSpecs.filter((_, i) => i !== index),
                          );
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentSpecs = form.getValues("spec_info") || [];
                    form.setValue("spec_info", [
                      ...currentSpecs,
                      { field: "", value: "" },
                    ]);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Specification
                </Button>
              </div>

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image *</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          placeholder="Image URL"
                          {...field}
                          value={field.value || ""}
                          readOnly
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowImageSelector(true)}
                      >
                        Browse
                      </Button>
                    </div>
                    {field.value && (
                      <div className="mt-2 border rounded-md p-2 w-32 h-32">
                        <img
                          src={field.value}
                          alt="Selected item image"
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="mt-6">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  disabled={
                    createItemMutation.isPending || updateItemMutation.isPending
                  }
                >
                  {editingItem ? "Update Item" : "Create Item"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Image Selector Dialog */}
      {showImageSelector && (
        <ImageSelectorDialog
          open={showImageSelector}
          onOpenChange={setShowImageSelector}
          onSelect={handleImageSelect}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ItemSection;
