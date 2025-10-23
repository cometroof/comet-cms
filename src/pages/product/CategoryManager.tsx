import { useState } from "react";
import { useProductQuery } from "@/contexts/ProductQueryContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  Folder,
} from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import * as productService from "@/services/product.service";
import {
  ProductCategory,
  CategoryFormData,
  Product,
  ProductProfile,
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
import { Badge } from "@/components/ui/badge";

// Define form validation schema
const formSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  subtitle: z.string().optional(),
  parent_type: z.enum(["product", "profile"]),
  parent_id: z.string(),
});

interface CategoryManagerProps {
  productId: string;
  product: Product;
  onUpdate?: () => void;
}

const CategoryManager = ({
  productId,
  product,
  onUpdate,
}: CategoryManagerProps) => {
  const {
    categories,
    profiles,
    isCategoriesLoading: loading,
    refetchAll,
  } = useProductQuery();
  const queryClient = useQueryClient();
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<ProductCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // Create form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      subtitle: "",
      parent_type: "product",
      parent_id: productId,
    },
  });

  // loadData function is no longer needed as we're using ProductQueryContext

  const getParentName = (category: ProductCategory) => {
    if (category.product_id) {
      return product.name;
    } else if (category.product_profile_id) {
      const profile = profiles.find(
        (p) => p.id === category.product_profile_id,
      );
      return profile ? `Profile: ${profile.name}` : "Unknown Profile";
    }
    return "Unknown";
  };

  const getCategorySource = (category: ProductCategory) => {
    return category.product_id ? "product" : "profile";
  };

  const handleAddCategory = () => {
    form.reset({
      name: "",
      subtitle: "",
      parent_type: "product",
      parent_id: productId,
    });
    setEditingCategory(null);
    setShowCategoryForm(true);
  };

  const handleEditCategory = (category: ProductCategory) => {
    const parent_type = category.product_id ? "product" : "profile";
    const parent_id = category.product_id || category.product_profile_id || "";

    form.reset({
      name: category.name,
      subtitle: category.subtitle || "",
      parent_type,
      parent_id,
    });
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  const handleDeleteClick = (categoryId: string) => {
    setCategoryToDelete(categoryId);
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      const success = await productService.deleteCategory(categoryToDelete);
      if (success) {
        toast.success("Category deleted successfully");
        refetchAll();
        if (onUpdate) onUpdate();
      } else {
        toast.error("Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("An error occurred while deleting the category");
    } finally {
      setShowConfirmDelete(false);
      setCategoryToDelete(null);
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      // Transform form data to match CategoryFormData
      const categoryData: CategoryFormData = {
        name: data.name,
        subtitle: data.subtitle,
      };

      // Set either product_id or product_profile_id based on parent_type
      if (data.parent_type === "product") {
        categoryData.product_id = data.parent_id;
      } else {
        categoryData.product_profile_id = data.parent_id;
      }

      if (editingCategory) {
        // Update existing category
        // Cast to required type to satisfy TypeScript
        const categoryUpdateData = categoryData as Omit<
          ProductCategory,
          "id" | "created_at" | "updated_at"
        >;
        const updated = await productService.updateCategory(
          editingCategory.id,
          categoryUpdateData,
        );
        if (updated) {
          toast.success("Category updated successfully");
          refetchAll();
          if (onUpdate) onUpdate();
        } else {
          toast.error("Failed to update category");
        }
      } else {
        // Create new category
        // Cast to required type to satisfy TypeScript
        const categoryCreateData = categoryData as Omit<
          ProductCategory,
          "id" | "created_at" | "updated_at"
        >;
        const created = await productService.createCategory(categoryCreateData);
        if (created) {
          toast.success("Category created successfully");
          refetchAll();
          if (onUpdate) onUpdate();
        } else {
          toast.error("Failed to create category");
        }
      }
      setShowCategoryForm(false);
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("An error occurred while saving the category");
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle>Categories</CardTitle>
            <CardDescription>
              Manage categories for {product.name} and its profiles
            </CardDescription>
          </div>
          <Button onClick={handleAddCategory}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Folder className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No categories yet</h3>
              <p className="text-muted-foreground mb-4">
                Create categories to organize your product items
              </p>
              <Button onClick={handleAddCategory}>
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Subtitle</TableHead>
                    <TableHead>Parent Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">
                        {category.name}
                      </TableCell>
                      <TableCell>{category.subtitle || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            getCategorySource(category) === "product"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {getParentName(category)}
                        </Badge>
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
                            <DropdownMenuItem
                              onClick={() =>
                                handleEditCategory(category as any)
                              }
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Category
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleDeleteClick((category as any).id)
                              }
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Category
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Form Dialog */}
      <Dialog open={showCategoryForm} onOpenChange={setShowCategoryForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add New Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update category information"
                : "Create a new category for items"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="parent_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Type *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="product">
                          Product (Direct)
                        </SelectItem>
                        <SelectItem value="profile">Profile</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose whether this category belongs to the product
                      directly or to a profile
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("parent_type") === "profile" && (
                <FormField
                  control={form.control}
                  name="parent_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a profile" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {profiles.map((profile) => (
                            <SelectItem key={profile.id} value={profile.id}>
                              {profile.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter category name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subtitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subtitle</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter category subtitle (optional)"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      A short description or subtitle for this category
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="mt-6">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">
                  {editingCategory ? "Update Category" : "Create Category"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              category and all related items.
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

export default CategoryManager;
