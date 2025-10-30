import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Edit,
  Trash2,
  MoreVertical,
  Eye,
  Star,
  StarOff,
  Image as ImageIcon,
  FileText,
  GripVertical,
  Loader2,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as productService from "@/services/product.service";
import type { ProductWithRelations, ProductItem } from "./types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProductsTableProps {
  products: ProductWithRelations[];
  onEdit: (product: ProductWithRelations) => void;
  onDelete: (id: string) => void;
  onManage: (product: ProductWithRelations) => void;
}

const ProductsTable = ({
  products,
  onEdit,
  onDelete,
  onManage,
}: ProductsTableProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [updatingHighlightId, setUpdatingHighlightId] = useState<string | null>(
    null,
  );
  const [filters, setFilters] = useState({
    isHighlight: false,
    hasProfile: false,
    hasPremium: false,
  });
  const queryClient = useQueryClient();

  // Filter products based on search query and filters
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesHighlight = filters.isHighlight
      ? product.is_highlight === true
      : true;

    const matchesHasProfile = filters.hasProfile
      ? product.profilesCount && product.profilesCount > 0
      : true;

    const matchesHasPremium = filters.hasPremium
      ? product.premium !== undefined && product.premium !== null
      : true;

    return (
      matchesSearch &&
      matchesHighlight &&
      matchesHasProfile &&
      matchesHasPremium
    );
  });

  const handleDeleteClick = (id: string) => {
    setProductToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      onDelete(productToDelete);
      setShowDeleteConfirm(false);
      setProductToDelete(null);
    }
  };

  const toggleFilter = (filter: keyof typeof filters) => {
    setFilters((prev) => ({
      ...prev,
      [filter]: !prev[filter],
    }));
  };

  // Highlight mutation
  const highlightMutation = useMutation({
    mutationFn: async ({
      productId,
      isHighlight,
    }: {
      productId: string;
      isHighlight: boolean;
    }) => {
      setUpdatingHighlightId(productId);
      const success = await productService.updateProductHighlight(
        productId,
        isHighlight,
      );
      if (!success) {
        throw new Error("Failed to update product highlight");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product highlight updated");
      setUpdatingHighlightId(null);
    },
    onError: () => {
      toast.error("Failed to update product highlight");
      setUpdatingHighlightId(null);
    },
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (orderedProducts: ProductWithRelations[]) => {
      // Prepare batch update data
      const productsToUpdate = orderedProducts.map((product, index) => ({
        id: product.id,
        order: index,
      }));

      // Use batch update to avoid unique constraint conflicts
      const success =
        await productService.batchUpdateProductOrders(productsToUpdate);

      if (!success) {
        throw new Error("Failed to update product orders");
      }

      return orderedProducts;
    },
    onMutate: async (orderedProducts) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["products"] });

      // Save current state
      const previousProducts = queryClient.getQueryData<ProductWithRelations[]>(
        ["products"],
      );

      // Optimistically update to new order
      queryClient.setQueryData<ProductWithRelations[]>(["products"], () => [
        ...orderedProducts,
      ]);

      return { previousProducts };
    },
    onError: (_, __, context) => {
      // Revert on error
      if (context?.previousProducts) {
        queryClient.setQueryData(["products"], context.previousProducts);
      }
      toast.error("Failed to update product order");
    },
    onSuccess: () => {
      toast.success("Product order updated");
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  // Handle drag end
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    console.log("Drag ended:", result);

    // Work with the complete products list, not just filtered
    const allProducts = Array.from(products);

    // Find the dragged item from filtered products
    const draggedItem = filteredProducts[result.source.index];

    // Find its current position in the full products array
    const currentIndex = allProducts.findIndex((p) => p.id === draggedItem.id);

    // Remove it from the full array
    allProducts.splice(currentIndex, 1);

    // Find where to insert it based on the destination in filtered products
    let newIndex: number;
    if (result.destination.index === 0) {
      // Moving to the top of filtered list
      newIndex = 0;
    } else if (result.destination.index >= filteredProducts.length - 1) {
      // Moving to the bottom of filtered list or beyond
      const lastFilteredItem = filteredProducts[filteredProducts.length - 1];
      const lastFilteredIndex = allProducts.findIndex(
        (p) => p.id === lastFilteredItem.id,
      );
      newIndex = lastFilteredIndex + 1;
    } else {
      // Moving somewhere in the middle
      const destinationItem = filteredProducts[result.destination.index];
      newIndex = allProducts.findIndex((p) => p.id === destinationItem.id);

      // Adjust if we're moving down in the list
      if (result.destination.index > result.source.index) {
        newIndex += 1;
      }
    }

    // Insert at the new position
    allProducts.splice(newIndex, 0, draggedItem);

    // Call the mutation to update the order with the complete reordered list
    reorderMutation.mutate(allProducts);
  };

  const getProductImage = (product: ProductWithRelations) => {
    // First check if product has a brand image
    if (product.brand_image) {
      return product.brand_image;
    }

    // Then check items if there's no brand image
    if (product.items && product.items.length > 0) {
      // Check if items is an array of ProductItem objects (not count objects)
      if ("image" in product.items[0]) {
        const items = product.items as ProductItem[];
        const itemWithImage = items.find((item) => item.image);
        return itemWithImage?.image;
      }
    }
    return null;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            Manage your metal roofing products and variants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="relative grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="pl-8 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="filter-highlight"
                    checked={filters.isHighlight}
                    onCheckedChange={() => toggleFilter("isHighlight")}
                  />
                  <Label
                    htmlFor="filter-highlight"
                    className="text-sm font-medium cursor-pointer flex items-center gap-1"
                  >
                    <Star className="h-4 w-4 text-amber-500" />
                    Highlighted
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="filter-profile"
                    checked={filters.hasProfile}
                    onCheckedChange={() => toggleFilter("hasProfile")}
                  />
                  <Label
                    htmlFor="filter-profile"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Has Profiles
                  </Label>
                </div>
                {/*<div className="flex items-center space-x-2">
                  <Checkbox
                    id="filter-premium"
                    checked={filters.hasPremium}
                    onCheckedChange={() => toggleFilter("hasPremium")}
                  />
                  <Label
                    htmlFor="filter-premium"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Has Premium
                  </Label>
                </div>*/}
              </div>
            </div>

            <div className="rounded-md border">
              {filteredProducts.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  No products found.
                </div>
              ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead className="w-[100px]">Image</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Profiles</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead className="flex items-center gap-1">
                          Highlight{" "}
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="size-4" />
                            </TooltipTrigger>
                            <TooltipContent>
                              Highlight item will be forced to suggest after
                              <span className="font-mono text-primary">
                                /product
                              </span>{" "}
                              data.
                            </TooltipContent>
                          </Tooltip>{" "}
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <Droppable droppableId="products">
                      {(provided) => (
                        <TableBody
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                        >
                          {filteredProducts.map((product, index) => (
                            <Draggable
                              key={product.id}
                              draggableId={product.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <TableRow
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`cursor-pointer hover:bg-muted/50 ${
                                    snapshot.isDragging ? "bg-muted" : ""
                                  }`}
                                  onClick={() => onManage(product)}
                                >
                                  <TableCell {...provided.dragHandleProps}>
                                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {getProductImage(product) ? (
                                      <img
                                        src={getProductImage(product) || ""}
                                        alt={product.name}
                                        className={`w-16 h-16 rounded-md ${product.brand_image ? "object-contain p-1" : "object-cover"}`}
                                      />
                                    ) : (
                                      <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-medium">
                                      {product.name}
                                    </div>
                                    {(product.description_en ||
                                      product.description_id) && (
                                      <div className="text-sm text-muted-foreground truncate max-w-[250px]">
                                        {product.description_en ||
                                          product.description_id ||
                                          ""}
                                      </div>
                                    )}
                                    {product.catalogue && (
                                      <a
                                        href={product.catalogue}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary hover:underline inline-flex items-center mt-1"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <FileText className="h-3 w-3 mr-1" />
                                        View Catalogue
                                      </a>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className="font-mono"
                                    >
                                      {product.profilesCount || 0}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className="font-mono"
                                    >
                                      {product.itemsCount || 0}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex items-center justify-start gap-2"
                                    >
                                      <Switch
                                        checked={product.is_highlight || false}
                                        onCheckedChange={(checked) => {
                                          highlightMutation.mutate({
                                            productId: product.id,
                                            isHighlight: checked,
                                          });
                                        }}
                                        disabled={
                                          updatingHighlightId === product.id
                                        }
                                      />
                                      {updatingHighlightId === product.id && (
                                        <Loader2 className="size-3 animate-spin" />
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div onClick={(e) => e.stopPropagation()}>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon">
                                            <MoreVertical className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuLabel>
                                            Actions
                                          </DropdownMenuLabel>
                                          <DropdownMenuItem
                                            onClick={() => onManage(product)}
                                            className="cursor-pointer"
                                          >
                                            <Eye className="h-4 w-4 mr-2" />
                                            Manage
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => onEdit(product)}
                                            className="cursor-pointer"
                                          >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            onClick={() =>
                                              handleDeleteClick(product.id)
                                            }
                                            className="text-destructive cursor-pointer focus:text-destructive"
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
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
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              product and all related data (profiles, items, etc).
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

export default ProductsTable;
