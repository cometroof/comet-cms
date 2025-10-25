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
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Loader2,
  Folder,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { ProductCategory } from "../../types";
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

// Form validation schema - tanpa parent_type karena auto-fill ke product
const formSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  subtitle: z.string().optional(),
  product_id: z.string(),
});

interface CategorySectionProps {
  productId: string;
}

const CategorySection = ({ productId }: CategorySectionProps) => {
  const {
    categories,
    isCategoriesLoading: loading,
    createCategoryMutation,
    updateCategoryMutation,
    deleteCategoryMutation,
  } = useProductQuery();

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<ProductCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // Filter categories - hanya yang terkait dengan product (bukan profile)
  const productCategories = categories.filter((cat) => cat.product_id);

  // Create form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      subtitle: "",
      product_id: productId,
    },
  });

  const handleAddCategory = () => {
    form.reset({
      name: "",
      subtitle: "",
      product_id: productId,
    });
    setEditingCategory(null);
    setShowCategoryForm(true);
  };

  const handleEditCategory = (category: ProductCategory) => {
    form.reset({
      name: category.name,
      subtitle: category.subtitle || "",
      product_id: productId,
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
    deleteCategoryMutation.mutate(categoryToDelete);
    setShowConfirmDelete(false);
    setCategoryToDelete(null);
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const categoryData: Omit<
      ProductCategory,
      "id" | "created_at" | "updated_at"
    > = {
      name: data.name,
      subtitle: data.subtitle,
      product_id: data.product_id,
      product_profile_id: null,
    };

    if (editingCategory) {
      updateCategoryMutation.mutate({
        ...categoryData,
        id: editingCategory.id,
        created_at: editingCategory.created_at,
        updated_at: editingCategory.updated_at,
      });
    } else {
      createCategoryMutation.mutate(categoryData);
    }
    setShowCategoryForm(false);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-base">Categories</CardTitle>
            <CardDescription>
              Organize your product items into categories
            </CardDescription>
          </div>
          {productCategories.length > 0 && (
            <Button onClick={handleAddCategory} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : productCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Folder className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-base font-semibold">No categories yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create categories to organize your product items
              </p>
              <Button onClick={handleAddCategory} size="sm">
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">
                        {category.name}
                      </TableCell>
                      <TableCell>{category.subtitle || "-"}</TableCell>
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
                              onClick={() => handleEditCategory(category)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Category
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(category.id)}
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
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  disabled={
                    createCategoryMutation.isPending ||
                    updateCategoryMutation.isPending
                  }
                >
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

export default CategorySection;
