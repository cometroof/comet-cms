import { useState, useEffect } from "react";
import { useProductQuery } from "@/contexts/ProductQueryContext";
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
} from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import ImageSelectorDialog from "@/components/ImageSelectorDialog";
import * as productService from "@/services/product.service";
import {
  ProductItem,
  ProductProfile,
  ProductCategory,
  Product,
  ProductFlowType,
  ItemFormData,
} from "./types";
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

// Define form validation schema
const formSchema = z.object({
  product_id: z.string(),
  product_profile_id: z.string().optional().nullable(),
  product_category_id: z.string().optional().nullable(),
  name: z.string().min(1, "Item name is required"),
  weight: z.string().optional(),
  length: z.string().optional(),
  image: z.string().min(1, "Image is required"),
  flow_type: z.enum(["direct", "category", "profile", "profile-category"]),
});

interface ItemManagerProps {
  productId: string;
  product: Product;
  onUpdate?: () => void;
}

const ItemManager = ({ productId, product, onUpdate }: ItemManagerProps) => {
  const {
    items,
    profiles,
    categories,
    profileCategories,
    isItemsLoading: loading,
    isProfileCategoriesLoading,
    refetchAll,
  } = useProductQuery();
  const [showItemForm, setShowItemForm] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null,
  );

  // Create form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      product_id: productId,
      product_profile_id: null,
      product_category_id: null,
      name: "",
      weight: "",
      length: "",
      image: "",
      flow_type: "direct" as ProductFlowType,
    },
  });

  // Profile categories are now loaded via React Query in the ProductQueryContext

  const groupItemsByFlow = (items: ProductItem[]) => {
    const directItems: ProductItem[] = [];
    const categoryItems: ProductItem[] = [];
    const profileItems: ProductItem[] = [];
    const profileCategoryItems: ProductItem[] = [];

    items.forEach((item) => {
      if (item.product_profile_id && item.product_category_id) {
        profileCategoryItems.push(item);
      } else if (item.product_profile_id) {
        profileItems.push(item);
      } else if (item.product_category_id) {
        categoryItems.push(item);
      } else {
        directItems.push(item);
      }
    });

    return {
      direct: directItems,
      category: categoryItems,
      profile: profileItems,
      profileCategory: profileCategoryItems,
    };
  };

  const getFlowDisplayName = (flowType: ProductFlowType) => {
    switch (flowType) {
      case "direct":
        return "Product → Item";
      case "category":
        return "Product → Category → Item";
      case "profile":
        return "Product → Profile → Item";
      case "profile-category":
        return "Product → Profile → Category → Item";
      default:
        return "Unknown Flow";
    }
  };

  const getItemParentName = (item: ProductItem) => {
    if (item.product_profile_id && item.product_category_id) {
      const profile = profiles.find((p) => p.id === item.product_profile_id);
      const category = Object.values(profileCategories)
        .flat()
        .find((c) => c.id === item.product_category_id);
      return `${profile?.name || "Unknown Profile"} / ${category?.name || "Unknown Category"}`;
    } else if (item.product_profile_id) {
      const profile = profiles.find((p) => p.id === item.product_profile_id);
      return profile?.name || "Unknown Profile";
    } else if (item.product_category_id) {
      const category = categories.find(
        (c) => c.id === item.product_category_id,
      );
      return category?.name || "Unknown Category";
    } else {
      return "Direct (Product)";
    }
  };

  const getItemFlowType = (item: ProductItem): ProductFlowType => {
    if (item.product_profile_id && item.product_category_id) {
      return "profile-category";
    } else if (item.product_profile_id) {
      return "profile";
    } else if (item.product_category_id) {
      return "category";
    } else {
      return "direct";
    }
  };

  const handleAddItem = () => {
    form.reset({
      product_id: productId,
      product_profile_id: null,
      product_category_id: null,
      name: "",
      weight: "",
      length: "",
      image: "",
      flow_type: "direct",
    });
    setEditingItem(null);
    setSelectedProfileId(null);
    setShowItemForm(true);
  };

  const handleEditItem = (item: ProductItem) => {
    const flowType = getItemFlowType(item);

    form.reset({
      product_id: productId,
      product_profile_id: item.product_profile_id,
      product_category_id: item.product_category_id,
      name: item.name,
      weight: item.weight || "",
      length: item.length || "",
      image: item.image || "",
      flow_type: flowType,
    });

    setEditingItem(item);
    setSelectedProfileId(item.product_profile_id || null);
    setShowItemForm(true);
  };

  const handleDeleteClick = (itemId: string) => {
    setItemToDelete(itemId);
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      const success = await productService.deleteItem(itemToDelete);
      if (success) {
        toast.success("Item deleted successfully");
        refetchAll();
        if (onUpdate) onUpdate();
      } else {
        toast.error("Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("An error occurred while deleting the item");
    } finally {
      setShowConfirmDelete(false);
      setItemToDelete(null);
    }
  };

  const handleProfileChange = (profileId: string | null) => {
    setSelectedProfileId(profileId);
    form.setValue("product_profile_id", profileId);

    // Reset category when profile changes
    form.setValue("product_category_id", null);
  };

  const handleImageSelect = (image: string) => {
    form.setValue("image", image);
    setShowImageSelector(false);
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      // Auto-detect flow type based on filled fields
      let detectedFlowType: ProductFlowType = "direct";
      if (data.product_profile_id && data.product_category_id) {
        detectedFlowType = "profile-category";
      } else if (data.product_profile_id) {
        detectedFlowType = "profile";
      } else if (data.product_category_id) {
        detectedFlowType = "category";
      }

      // Build item data
      const itemData: Omit<ProductItem, "id" | "created_at" | "updated_at"> = {
        product_id: data.product_id,
        name: data.name,
        weight: data.weight || null,
        length: data.length || null,
        image: data.image,
        product_profile_id: data.product_profile_id || null,
        product_category_id: data.product_category_id || null,
      };

      if (editingItem) {
        // Update existing item
        const updated = await productService.updateItem(
          editingItem.id,
          itemData,
        );
        if (updated) {
          toast.success("Item updated successfully");
          refetchAll();
          if (onUpdate) onUpdate();
        } else {
          toast.error("Failed to update item");
        }
      } else {
        // Create new item
        const created = await productService.createItem(itemData);
        if (created) {
          toast.success("Item created successfully");
          refetchAll();
          if (onUpdate) onUpdate();
        } else {
          toast.error("Failed to create item");
        }
      }
      setShowItemForm(false);
    } catch (error) {
      console.error("Error saving item:", error);
      toast.error("An error occurred while saving the item");
    }
  };

  // Group items by their flow type
  const groupedItems = groupItemsByFlow(items as ProductItem[]);

  const getAvailableCategories = () => {
    // If profile is selected, show categories from that profile
    // Otherwise, show product categories
    if (selectedProfileId) {
      return profileCategories[selectedProfileId] || [];
    }
    return categories;
  };

  const renderItemsSection = (
    title: string,
    flowType: ProductFlowType,
    itemsList: ProductItem[],
  ) => {
    if (itemsList.length === 0) return null;

    return (
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Dimensions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemsList.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
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
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{getItemParentName(item)}</TableCell>
                  <TableCell>
                    {item.weight && <div>Weight: {item.weight}</div>}
                    {item.length && <div>Length: {item.length}</div>}
                  </TableCell>
                  <TableCell className="text-right">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle>Items</CardTitle>
            <CardDescription>
              Manage product items for {product.name}
            </CardDescription>
          </div>
          <Button onClick={handleAddItem}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <PackageOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No items yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first item to showcase your product
              </p>
              <Button onClick={handleAddItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          ) : (
            <div>
              {renderItemsSection(
                "Direct Items",
                "direct",
                groupedItems.direct,
              )}
              {renderItemsSection(
                "Category Items",
                "category",
                groupedItems.category,
              )}
              {renderItemsSection(
                "Profile Items",
                "profile",
                groupedItems.profile,
              )}
              {renderItemsSection(
                "Profile → Category Items",
                "profile-category",
                groupedItems.profileCategory,
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
              Fill in the item details. Profile and category are optional - the
              system will automatically determine the relationship based on what
              you select.
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
                name="product_profile_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const profileId = value === "none" ? null : value;
                        field.onChange(profileId);
                        handleProfileChange(profileId);
                      }}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a profile" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">
                            No profile (Direct item)
                          </span>
                        </SelectItem>
                        {profiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Leave empty for a direct item, or select a profile
                    </FormDescription>
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
                      disabled={getAvailableCategories().length === 0}
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
                        {getAvailableCategories().map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {selectedProfileId
                        ? "Showing categories from selected profile"
                        : "Showing product categories"}
                      {getAvailableCategories().length === 0 &&
                        " (No categories available)"}
                    </FormDescription>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 5.2kg"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="length"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Length</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 2.4m"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                <Button type="submit">
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

export default ItemManager;
