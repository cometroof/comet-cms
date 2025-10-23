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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
    isItemsLoading: loading,
    refetchAll,
  } = useProductQuery();
  const [profileCategories, setProfileCategories] = useState<
    Record<string, ProductCategory[]>
  >({});
  const [showItemForm, setShowItemForm] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [selectedFlowType, setSelectedFlowType] =
    useState<ProductFlowType>("direct");
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null,
  );
  const [formStep, setFormStep] = useState(1); // 1 = flow selection, 2 = item details

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

  // Load profile categories when profiles change
  useEffect(() => {
    loadProfileCategories();
  }, [profiles]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProfileCategories = async () => {
    try {
      // Load profile categories for each profile
      const profileCatsMap: Record<string, ProductCategory[]> = {};
      for (const profile of profiles) {
        const profileCats = await productService.getProfileCategories(
          profile.id,
        );
        profileCatsMap[profile.id] = profileCats;
      }
      setProfileCategories(profileCatsMap);
    } catch (error) {
      console.error("Error loading profile categories:", error);
      toast.error("Failed to load profile categories");
    }
  };

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
    setSelectedFlowType("direct");
    setSelectedProfileId(null);
    setFormStep(1);
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
    setSelectedFlowType(flowType);
    setSelectedProfileId(item.product_profile_id || null);
    setFormStep(2); // Skip flow selection when editing
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

  const handleFlowTypeChange = (value: ProductFlowType) => {
    setSelectedFlowType(value);
    form.setValue("flow_type", value);

    // Reset related fields when flow type changes
    form.setValue("product_profile_id", null);
    form.setValue("product_category_id", null);
    setSelectedProfileId(null);
  };

  const handleProfileChange = (profileId: string) => {
    setSelectedProfileId(profileId);
    form.setValue("product_profile_id", profileId);

    // Reset category when profile changes
    form.setValue("product_category_id", null);
  };

  const handleContinueToItemDetails = () => {
    setFormStep(2);
  };

  const handleImageSelect = (image: string) => {
    form.setValue("image", image);
    setShowImageSelector(false);
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      // Clean up data based on flow type
      const itemData: Omit<ProductItem, "id" | "created_at" | "updated_at"> = {
        product_id: data.product_id,
        name: data.name,
        weight: data.weight || null,
        length: data.length || null,
        image: data.image,
        product_profile_id: null,
        product_category_id: null,
      };

      // Set relevant parent IDs based on flow type
      switch (data.flow_type) {
        case "profile":
          itemData.product_profile_id = data.product_profile_id || null;
          break;
        case "category":
          itemData.product_category_id = data.product_category_id || null;
          break;
        case "profile-category":
          itemData.product_profile_id = data.product_profile_id || null;
          itemData.product_category_id = data.product_category_id || null;
          break;
      }

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
  const groupedItems = groupItemsByFlow(items as any);

  const getCategoriesForCurrentFlow = () => {
    if (selectedFlowType === "category") {
      // For 'category' flow, show product categories
      return categories;
    } else if (selectedFlowType === "profile-category" && selectedProfileId) {
      // For 'profile-category' flow, show categories of the selected profile
      return profileCategories[selectedProfileId] || [];
    }
    return [];
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
              {editingItem
                ? "Update item information"
                : formStep === 1
                  ? "Select how this item is organized in your product hierarchy"
                  : "Enter item details"}
            </DialogDescription>
          </DialogHeader>

          {formStep === 1 ? (
            /* Step 1: Flow Selection */
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Select Flow Type</h3>
                <p className="text-sm text-muted-foreground">
                  Choose how this item relates to other parts of your product
                </p>
              </div>

              <RadioGroup
                defaultValue={selectedFlowType}
                onValueChange={(v) =>
                  handleFlowTypeChange(v as ProductFlowType)
                }
                className="space-y-3"
              >
                <div className="flex items-start space-x-2 border rounded-md p-3">
                  <RadioGroupItem
                    value="direct"
                    id="flow-direct"
                    className="mt-1"
                  />
                  <Label
                    htmlFor="flow-direct"
                    className="flex flex-col gap-1 cursor-pointer"
                  >
                    <span className="font-medium">Product → Item</span>
                    <span className="text-sm text-muted-foreground">
                      Item belongs directly to the product with no intermediary
                    </span>
                  </Label>
                </div>
                <div className="flex items-start space-x-2 border rounded-md p-3">
                  <RadioGroupItem
                    value="category"
                    id="flow-category"
                    className="mt-1"
                  />
                  <Label
                    htmlFor="flow-category"
                    className="flex flex-col gap-1 cursor-pointer"
                  >
                    <span className="font-medium">
                      Product → Category → Item
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Item belongs to a category directly under the product
                    </span>
                  </Label>
                </div>
                <div className="flex items-start space-x-2 border rounded-md p-3">
                  <RadioGroupItem
                    value="profile"
                    id="flow-profile"
                    className="mt-1"
                  />
                  <Label
                    htmlFor="flow-profile"
                    className="flex flex-col gap-1 cursor-pointer"
                  >
                    <span className="font-medium">
                      Product → Profile → Item
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Item belongs to a specific profile of the product
                    </span>
                  </Label>
                </div>
                <div className="flex items-start space-x-2 border rounded-md p-3">
                  <RadioGroupItem
                    value="profile-category"
                    id="flow-profile-category"
                    className="mt-1"
                  />
                  <Label
                    htmlFor="flow-profile-category"
                    className="flex flex-col gap-1 cursor-pointer"
                  >
                    <span className="font-medium">
                      Product → Profile → Category → Item
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Item belongs to a category under a specific profile
                    </span>
                  </Label>
                </div>
              </RadioGroup>

              {/* Additional fields based on selected flow type */}
              {(selectedFlowType === "profile" ||
                selectedFlowType === "profile-category") && (
                <div className="pt-4">
                  <FormLabel>Select Profile</FormLabel>
                  <Select
                    onValueChange={handleProfileChange}
                    defaultValue={
                      form.getValues().product_profile_id || undefined
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a profile" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select the profile this item belongs to
                  </p>
                </div>
              )}

              {(selectedFlowType === "category" ||
                (selectedFlowType === "profile-category" &&
                  selectedProfileId)) && (
                <div className="pt-4">
                  <FormLabel>Select Category</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      form.setValue("product_category_id", value)
                    }
                    defaultValue={
                      form.getValues().product_category_id || undefined
                    }
                    disabled={
                      selectedFlowType === "profile-category" &&
                      !selectedProfileId
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {getCategoriesForCurrentFlow().map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select the category this item belongs to
                  </p>
                </div>
              )}

              <DialogFooter className="mt-6">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  type="button"
                  onClick={handleContinueToItemDetails}
                  disabled={
                    ((selectedFlowType === "profile" ||
                      selectedFlowType === "profile-category") &&
                      !form.getValues().product_profile_id) ||
                    ((selectedFlowType === "category" ||
                      selectedFlowType === "profile-category") &&
                      !form.getValues().product_category_id)
                  }
                >
                  Continue
                </Button>
              </DialogFooter>
            </div>
          ) : (
            /* Step 2: Item Details */
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="text-sm text-muted-foreground mb-4">
                  Flow:{" "}
                  <span className="font-medium">
                    {getFlowDisplayName(selectedFlowType)}
                  </span>
                </div>

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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormStep(1)}
                    disabled={!!editingItem}
                  >
                    Back
                  </Button>
                  <Button type="submit">
                    {editingItem ? "Update Item" : "Create Item"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
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
