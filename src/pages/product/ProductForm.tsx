import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Image as ImageIcon,
  FileText,
  Plus,
  X,
  RefreshCw,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as productService from "@/services/product.service";
import { Product, ProductFormData } from "./types";
import ImageSelectorDialog from "@/components/ImageSelectorDialog";
import FileSelectorDialog from "@/components/FileSelectorDialog/FileSelectorDialog";

// Define form validation schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  title: z.string().optional(),
  slug: z.string().optional(),
  description_en: z.string().optional(),
  description_id: z.string().optional(),
  catalogue: z.string().optional(),
  suitables: z.array(z.string()).or(z.string()).default([]),
  is_highlight: z.boolean().optional(),
  brand_image: z.string().optional(),
});

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  product?: Product | null;
}

const ProductForm = ({
  isOpen,
  onClose,
  onSave,
  product,
}: ProductFormProps) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [fileDialogOpen, setFileDialogOpen] = useState(false);

  const isEditing = !!product;

  // Parse suitables from JSON if it exists
  const parseSuitables = () => {
    if (!product?.suitables) return [];

    try {
      // Handle different possible formats
      if (typeof product.suitables === "string") {
        try {
          // If it's a JSON string
          const parsed = JSON.parse(product.suitables);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          // If it's just a regular string
          return [product.suitables];
        }
      } else if (Array.isArray(product.suitables)) {
        // If it's already an array
        return product.suitables;
      } else {
        // If it's a JSON object or other type
        return [];
      }
    } catch (e) {
      console.error("Error parsing suitables:", e);
      return [];
    }
  };

  // Initialize form with default values or existing product
  const form = useForm<ProductFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product?.name || "",
      title: product?.title || "",
      slug: product?.slug || "",
      description_en: product?.description_en || "",
      description_id: product?.description_id || "",
      catalogue: product?.catalogue || "",
      suitables: parseSuitables(),
      is_highlight: product?.is_highlight || false,
      brand_image: product?.brand_image || "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: ProductFormData) => {
    setLoading(true);
    try {
      let savedProduct: Product | null;

      if (isEditing && product) {
        // Update existing product - type casting to satisfy TypeScript
        savedProduct = await productService.updateProduct(product.id, {
          name: data.name,
          title: data.title || null,
          slug: data.slug || null,
          description_en: data.description_en || null,
          description_id: data.description_id || null,
          catalogue: data.catalogue || null,
          suitables:
            data.suitables && data.suitables.length > 0 ? data.suitables : null,
          is_highlight: data.is_highlight || false,
          brand_image: data.brand_image || null,
        });
        if (savedProduct) {
          toast.success("Product updated successfully");
          onSave(savedProduct);
        } else {
          toast.error("Failed to update product");
        }
      } else {
        // Create new product - type casting to satisfy TypeScript
        savedProduct = await productService.createProduct({
          name: data.name,
          title: data.title || null,
          slug: data.slug || null,
          description_en: data.description_en || null,
          description_id: data.description_id || null,
          catalogue: data.catalogue || null,
          suitables:
            data.suitables && data.suitables.length > 0 ? data.suitables : null,
          is_highlight: data.is_highlight || false,
          brand_image: data.brand_image || null,
        });
        if (savedProduct) {
          toast.success("Product created successfully");
          onSave(savedProduct);
        } else {
          toast.error("Failed to create product");
        }
      }
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("An error occurred while saving the product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Product" : "Create New Product"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the product information"
              : "Add a new metal roofing product to your catalog"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="extra">Extra Info</TabsTrigger>
              </TabsList>

              <TabsContent
                value="basic"
                className="space-y-4 pt-4 max-h-[500px] overflow-y-auto"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter product name"
                          {...field}
                          autoFocus
                          onChange={(e) => {
                            field.onChange(e);
                            // Auto-generate slug if no slug exists or slug hasn't been manually edited
                            const currentSlug = form.getValues("slug");
                            if (!currentSlug || currentSlug === "") {
                              // Generate slug from name
                              const slug = e.target.value
                                .toLowerCase()
                                .replace(/[^\w\s-]/g, "")
                                .replace(/\s+/g, "-")
                                .replace(/-+/g, "-")
                                .trim();
                              form.setValue("slug", slug);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (Alternative Name)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter alternative product title"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional secondary name or title for marketing purposes
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder="Enter URL slug (e.g., metal-roofing)"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            // Get current name value
                            const nameValue = form.getValues("name");
                            if (nameValue) {
                              // Generate slug from name
                              const slug = nameValue
                                .toLowerCase()
                                .replace(/[^\w\s-]/g, "") // Remove special chars except whitespace and dash
                                .replace(/\s+/g, "-") // Replace whitespace with dash
                                .replace(/-+/g, "-") // Replace multiple dashes with single dash
                                .trim();

                              // Set the slug value
                              field.onChange(slug);
                            }
                          }}
                          title="Generate slug from product name"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormDescription>
                        URL-friendly version of the product name (used in
                        website URLs)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <Tabs defaultValue="en" className="mt-2">
                    <TabsList className="grid w-full grid-cols-2 mb-2">
                      <TabsTrigger value="en">English</TabsTrigger>
                      <TabsTrigger value="id">Indonesian</TabsTrigger>
                    </TabsList>
                    <TabsContent value="en" className="pt-2">
                      <FormField
                        control={form.control}
                        name="description_en"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="Enter product description in English"
                                className="min-h-[100px]"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    <TabsContent value="id" className="pt-2">
                      <FormField
                        control={form.control}
                        name="description_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="Enter product description in Indonesian"
                                className="min-h-[100px]"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>
                  <FormDescription>
                    Provide a detailed description of the product in both
                    languages
                  </FormDescription>
                </FormItem>
              </TabsContent>

              <TabsContent
                value="extra"
                className="space-y-4 pt-4 max-h-[500px] overflow-y-auto"
              >
                <FormField
                  control={form.control}
                  name="catalogue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catalogue File</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder="Select catalogue PDF file (optional)"
                            {...field}
                            value={field.value || ""}
                            readOnly
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setFileDialogOpen(true)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Browse
                        </Button>
                      </div>
                      {field.value && (
                        <div className="mt-2">
                          <a
                            href={field.value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            <FileText className="h-3 w-3" />
                            View Catalogue
                          </a>
                        </div>
                      )}
                      <FormDescription>
                        PDF catalogue for this product
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="suitables"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Suitable For</FormLabel>
                      <div className="space-y-2">
                        {Array.isArray(field.value) &&
                          field.value.map((suitable: string, index: number) => (
                            <div
                              key={index}
                              className="flex gap-2 items-center"
                            >
                              <FormControl>
                                <Input
                                  placeholder={`Application ${index + 1}`}
                                  value={suitable}
                                  onChange={(e) => {
                                    const newValues = Array.isArray(field.value)
                                      ? [...field.value]
                                      : [];
                                    newValues[index] = e.target.value;
                                    field.onChange(newValues);
                                  }}
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  const newValues = Array.isArray(field.value)
                                    ? [...field.value]
                                    : [];
                                  newValues.splice(index, 1);
                                  field.onChange(newValues);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}

                        <Button
                          type="button"
                          variant="outline"
                          className="mt-2"
                          onClick={() => {
                            const currentValues = Array.isArray(field.value)
                              ? field.value
                              : [];
                            field.onChange([...currentValues, ""]);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Application
                        </Button>
                      </div>
                      <FormDescription>
                        Add applications this product is suitable for
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_highlight"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Highlight Product</FormLabel>
                        <FormDescription>
                          Featured products will be highlighted on the website
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brand_image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand Image</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder="Select brand image"
                            {...field}
                            value={field.value || ""}
                            readOnly
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setImageDialogOpen(true)}
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Browse
                        </Button>
                      </div>
                      <FormDescription>
                        Brand image or logo for this product
                      </FormDescription>
                      {field.value && (
                        <div className="mt-2 border rounded-md p-2 w-32 h-32">
                          <img
                            src={field.value}
                            alt="Brand Image"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button" disabled={loading}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Update Product" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>

      {/* Image Selector Dialog */}
      {imageDialogOpen && (
        <ImageSelectorDialog
          open={imageDialogOpen}
          onOpenChange={setImageDialogOpen}
          onSelect={(imageUrl) => {
            form.setValue("brand_image", imageUrl);
          }}
        />
      )}

      {/* File Selector Dialog */}
      {fileDialogOpen && (
        <FileSelectorDialog
          open={fileDialogOpen}
          onOpenChange={setFileDialogOpen}
          onSelect={(fileUrl) => {
            if (typeof fileUrl === "string") {
              form.setValue("catalogue", fileUrl);
            }
          }}
          acceptedFileTypes="application/pdf"
          title="Select Catalogue PDF"
          multiple={false}
          multipleSelection={false}
        />
      )}
    </Dialog>
  );
};

export default ProductForm;
