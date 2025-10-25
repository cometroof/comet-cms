import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import ImageSelectorDialog from "@/components/ImageSelectorDialog";
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
  Award,
  FileText,
  Ruler,
  Folder,
  PackageOpen,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import * as productService from "@/services/product.service";
import { ProductProfile, ProfileFormData, Product, ProductItem } from "./types";
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
import CertificatesBadgesManager from "./CertificatesBadgesManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GeneralTab from "./profile-tabs/GeneralTab";
import SizeTab from "./profile-tabs/SizeTab";
import CertificatesTab from "./profile-tabs/CertificatesTab";
import BadgesTab from "./profile-tabs/BadgesTab";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ProductContextProfile = ProductProfile;

// Define form validation schema
const formSchema = z.object({
  product_id: z.string(),
  name: z.string().min(1, "Profile name is required"),
  size_per_panel: z.string().optional(),
  effective_size: z.string().optional(),
  panel_amount: z.coerce.number().optional(),
  materials: z.string().optional(),
  tkdn_value: z.string().optional(),
  thickness: z.string().optional(),
  weight: z.string().optional(),
  profile_image_url: z.string().optional(),
  profile_banner_url: z.string().optional(),
  size: z
    .array(
      z.object({
        name: z.string().min(1, "Size name is required"),
        weight: z.string().min(1, "Weight is required"),
        thickness: z.string().min(1, "Thickness is required"),
      }),
    )
    .max(5, "Maximum 5 size specifications allowed")
    .optional(),
  certificates: z.array(z.string()).optional(),
  badges: z.array(z.string()).optional(),
});

// Item form validation schema
const itemFormSchema = z.object({
  product_id: z.string(),
  product_profile_id: z.string(),
  product_category_id: z.string().optional().nullable(),
  name: z.string().min(1, "Item name is required"),
  weight: z.string().optional(),
  length: z.string().optional(),
  image: z.string().min(1, "Image is required"),
});

interface ProfileManagerProps {
  productId: string;
  product: Product;
  onUpdate?: () => void;
}

// Profile Card Component
interface ProfileCardProps {
  profile: ProductProfile;
  onEdit: (profile: ProductProfile) => void;
  onDelete: (profileId: string) => void;
  onManageCertsBadges: (
    profile: ProductProfile,
    tab: "certificates" | "badges",
  ) => void;
  onAddItemFromCategory: (profile: ProductProfile, categoryId: string) => void;
  onEditCategory: (categoryId: string) => void;
}

const ProfileCard = ({
  profile,
  onEdit,
  onDelete,
  onManageCertsBadges,
  onAddItemFromCategory,
  onEditCategory,
}: ProfileCardProps) => {
  const [certificatesCount, setCertificatesCount] = useState(0);
  const [badgesCount, setBadgesCount] = useState(0);
  const [itemsCount, setItemsCount] = useState(0);
  const { profileCategories, items } = useProductQuery();

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const [certs, badges] = await Promise.all([
          productService.getProfileCertificates(profile.id),
          productService.getProfileBadges(profile.id),
        ]);
        setCertificatesCount(certs.length);
        setBadgesCount(badges.length);
      } catch (error) {
        console.error("Error loading counts:", error);
      }
    };
    loadCounts();

    // Count items for this profile
    const profileItems = items.filter(
      (item) => item.product_profile_id === profile.id,
    );
    setItemsCount(profileItems.length);
  }, [profile.id, items]);

  const profileCats = profileCategories[profile.id] || [];

  function findItemsByCategory(categoryId: string) {
    const itemsByCategory = items.filter(
      (item) => item.product_category_id === categoryId,
    );
    return itemsByCategory;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{profile.name}</CardTitle>
            <CardDescription className="mt-1">
              Technical specifications and details
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(profile)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => onManageCertsBadges(profile, "certificates")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Manage Certificates
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onManageCertsBadges(profile, "badges")}
                >
                  <Award className="mr-2 h-4 w-4" />
                  Manage Badges
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(profile.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Profile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Compact Info Grid */}
        <div className="grid lg:grid-cols-2 gap-2 text-sm">
          {profile.size_per_panel && (
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Size/Panel</span>
              <span className="font-medium">{profile.size_per_panel}</span>
            </div>
          )}
          {profile.effective_size && (
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Effective</span>
              <span className="font-medium">{profile.effective_size}</span>
            </div>
          )}
          {profile.materials && (
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Material</span>
              <span className="font-medium">{profile.materials}</span>
            </div>
          )}
          {profile.thickness && (
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Thickness</span>
              <span className="font-medium">{profile.thickness}</span>
            </div>
          )}
          {profile.weight && (
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Weight</span>
              <span className="font-medium">{profile.weight}</span>
            </div>
          )}
          {profile.tkdn_value && (
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">TKDN</span>
              <span className="font-medium">{profile.tkdn_value}</span>
            </div>
          )}
        </div>

        {/* Compact Stats Grid - Size, Certificates, Badges, Items */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {/* Size Specifications */}
          <div className="border rounded-lg p-2">
            <div className="flex items-center justify-center mb-1">
              <Ruler className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">
                {profile.size && Array.isArray(profile.size)
                  ? profile.size.length
                  : 0}
              </div>
              <div className="text-xs text-muted-foreground">Sizes</div>
            </div>
            {profile.size &&
              Array.isArray(profile.size) &&
              profile.size.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {profile.size.map((item, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {item.name}
                    </Badge>
                  ))}
                </div>
              )}
          </div>

          {/* Certificates */}
          <div className="border rounded-lg p-2 text-center">
            <FileText className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-lg font-bold">{certificatesCount}</div>
            <div className="text-xs text-muted-foreground">Certificates</div>
          </div>

          {/* Badges */}
          <div className="border rounded-lg p-2 text-center">
            <Award className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-lg font-bold">{badgesCount}</div>
            <div className="text-xs text-muted-foreground">Badges</div>
          </div>

          {/* Items */}
          <div className="border rounded-lg p-2 text-center">
            <PackageOpen className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-lg font-bold">{itemsCount}</div>
            <div className="text-xs text-muted-foreground">Items</div>
          </div>
        </div>

        {/* Categories as Cards */}
        {profileCats.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Folder className="h-4 w-4" />
              Categories ({profileCats.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {profileCats.map((category) => {
                const itemsCategorized = findItemsByCategory(category.id);
                const itemsAmount = itemsCategorized?.length || 0;
                return (
                  <Card
                    key={category.id}
                    className={`${itemsAmount > 0 ? "col-span-full" : ""} hover:shadow-lg`}
                  >
                    <CardHeader className="p-3">
                      <div className="flex items-start justify-between gap-5">
                        <div>
                          <CardTitle className="text-sm">
                            {category.name}
                          </CardTitle>
                          {category.subtitle && (
                            <CardDescription className="text-xs">
                              {category.subtitle}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => onEditCategory(category.id)}
                          >
                            <Edit className="mr-1 h-3 w-3" />
                            <span className="hidden lg:inline">
                              Edit Category
                            </span>
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() =>
                              onAddItemFromCategory(profile, category.id)
                            }
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            <span className="hidden lg:inline">Add</span> Item
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="text-muted-foreground text-sm">
                        {itemsAmount} item(s)
                      </div>
                      {itemsAmount > 0 && (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[100px]">Image</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead className="text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          {itemsCategorized.map((item) => (
                            <TableRow
                              key={item.id}
                              className="last:border-b-transparent"
                            >
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
                              <TableCell className="font-medium">
                                {item.name}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className="h-8 w-8 p-0"
                                    >
                                      <span className="sr-only">Open menu</span>
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>
                                      Actions
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem
                                    // onClick={() => handleEditItem(item)}
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit Item
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      // onClick={() => handleDeleteClick(item.id)}
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
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ProfileManager = ({
  productId,
  product,
  onUpdate,
}: ProfileManagerProps) => {
  const queryClient = useQueryClient();
  const {
    profiles,
    isProfilesLoading: isLoading,
    profilesError: error,
    availableCertificates,
    availableBadges,
    profileCategories,
  } = useProductQuery();
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ProductProfile | null>(
    null,
  );
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const [showCertBadges, setShowCertBadges] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ProductProfile | null>(
    null,
  );
  const [certBadgeTab, setCertBadgeTab] = useState<"certificates" | "badges">(
    "certificates",
  );
  const [loadingCertsAndBadges, setLoadingCertsAndBadges] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemFormProfile, setItemFormProfile] = useState<ProductProfile | null>(
    null,
  );
  const [itemFormCategoryId, setItemFormCategoryId] = useState<string | null>(
    null,
  );
  const [showImageSelector, setShowImageSelector] = useState(false);

  // Create form
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      product_id: productId,
      name: product.name,
      size_per_panel: "",
      effective_size: "",
      panel_amount: undefined,
      size: [],
      materials: "",
      tkdn_value: "",
      thickness: "",
      weight: "",
      profile_image_url: "",
      profile_banner_url: "",
      certificates: [],
      badges: [],
    },
  });

  // Item form
  const itemForm = useForm<z.infer<typeof itemFormSchema>>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      product_id: productId,
      product_profile_id: "",
      product_category_id: null,
      name: "",
      weight: "",
      length: "",
      image: "",
    },
  });

  // Handle error separately since onError is not available in the options
  if (error) {
    console.error("Error loading profiles:", error);
    toast.error("Failed to load profiles");
  }

  const handleAddProfile = () => {
    form.reset({
      product_id: productId,
      name: "",
      size_per_panel: "",
      effective_size: "",
      panel_amount: undefined,
      materials: "",
      tkdn_value: "",
      thickness: "",
      weight: "",
      profile_image_url: "",
      profile_banner_url: "",
      size: [],
      certificates: [],
      badges: [],
    });
    setEditingProfile(null);
    setShowProfileForm(true);
  };

  // Initialize size array when form is opened
  useEffect(() => {
    if (showProfileForm) {
      // Set size to empty array if undefined
      const currentSize = form.getValues("size");
      if (!currentSize) {
        form.setValue("size", []);
      }
    }
  }, [showProfileForm, form]);

  // Edit profile handler
  const handleEditProfile = async (profile: ProductContextProfile) => {
    setEditingProfile(profile as unknown as ProductProfile);
    setLoadingCertsAndBadges(true);

    let certificateIds: string[] = [];
    let badgeIds: string[] = [];

    try {
      const [assignedCerts, assignedBadges] = await Promise.all([
        productService.getProfileCertificates(profile.id),
        productService.getProfileBadges(profile.id),
      ]);

      certificateIds = assignedCerts.map((cert) => cert.id);
      badgeIds = assignedBadges.map((badge) => badge.id);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoadingCertsAndBadges(false);
    }

    // Fill all profile fields
    form.reset({
      product_id: profile.product_id,
      name: profile.name,
      size_per_panel: profile.size_per_panel || "",
      effective_size: profile.effective_size || "",
      panel_amount: profile.panel_amount || undefined,
      materials: profile.materials || "",
      tkdn_value: profile.tkdn_value || "",
      thickness: profile.thickness || "",
      weight: profile.weight || "",
      profile_image_url: profile.profile_image_url || "",
      profile_banner_url: profile.profile_banner_url || "",
      size: profile.size || [],
      certificates: certificateIds,
      badges: badgeIds,
    });

    setShowProfileForm(true);
  };

  const handleDelete = (profileId: string) => {
    setProfileToDelete(profileId);
    setShowConfirmDelete(true);
  };

  // Delete profile mutation
  const deleteMutation = useMutation<boolean, Error, string>({
    mutationFn: (profileId: string) => productService.deleteProfile(profileId),
    onSuccess: () => {
      toast.success("Profile deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["productProfiles", productId],
      });
      if (onUpdate) onUpdate();
      setShowConfirmDelete(false);
      setProfileToDelete(null);
    },
    onError: (error: Error) => {
      console.error("Error deleting profile:", error);
      toast.error("An error occurred while deleting the profile");
      setShowConfirmDelete(false);
      setProfileToDelete(null);
    },
  });

  const handleConfirmDelete = () => {
    if (!profileToDelete) return;
    deleteMutation.mutate(profileToDelete);
  };

  const handleManageCertificatesBadges = (
    profile: ProductContextProfile,
    tab: "certificates" | "badges",
  ) => {
    setSelectedProfile(profile as unknown as ProductProfile);
    setCertBadgeTab(tab);
    setShowCertBadges(true);
  };

  const handleAddItemFromCategory = (
    profile: ProductContextProfile,
    categoryId: string,
  ) => {
    const typedProfile = profile as unknown as ProductProfile;
    setItemFormProfile(typedProfile);
    setItemFormCategoryId(categoryId);

    // Auto-fill form with profile and category data
    itemForm.reset({
      product_id: productId,
      product_profile_id: typedProfile.id,
      product_category_id: categoryId,
      name: typedProfile.name,
      weight: typedProfile.weight || "",
      length: "",
      image: typedProfile.profile_image_url || "",
    });

    setShowItemForm(true);
  };

  const handleEditCategory = (categoryId: string) => {
    // TODO: Implement edit category functionality
    toast.info("Edit category functionality to be implemented");
  };

  const handleImageSelect = (image: string) => {
    itemForm.setValue("image", image);
    setShowImageSelector(false);
  };

  const onItemSubmit = async (data: z.infer<typeof itemFormSchema>) => {
    try {
      const itemData: Omit<ProductItem, "id" | "created_at" | "updated_at"> = {
        product_id: data.product_id,
        product_profile_id: data.product_profile_id,
        product_category_id: data.product_category_id || null,
        name: data.name,
        weight: data.weight || null,
        length: data.length || null,
        image: data.image,
      };

      const created = await productService.createItem(itemData);
      if (created) {
        toast.success("Item created successfully");
        queryClient.invalidateQueries({
          queryKey: ["productItems", productId],
        });
        if (onUpdate) onUpdate();
        setShowItemForm(false);
      } else {
        toast.error("Failed to create item");
      }
    } catch (error) {
      console.error("Error creating item:", error);
      toast.error("An error occurred while creating the item");
    }
  };

  // Create profile mutation
  const createMutation = useMutation<
    ProductProfile | null,
    Error,
    Omit<ProductProfile, "id" | "created_at" | "updated_at">
  >({
    mutationFn: (
      profileData: Omit<ProductProfile, "id" | "created_at" | "updated_at">,
    ) => productService.createProfile(profileData),
    onSuccess: () => {
      toast.success("Profile created successfully");
      queryClient.invalidateQueries({
        queryKey: ["productProfiles", productId],
      });
      if (onUpdate) onUpdate();
      setShowProfileForm(false);
    },
    onError: (error: Error) => {
      console.error("Error creating profile:", error);
      toast.error("An error occurred while creating the profile");
    },
  });

  // Update profile mutation
  const updateMutation = useMutation<
    ProductProfile | null,
    Error,
    {
      id: string;
      data: Omit<ProductProfile, "id" | "created_at" | "updated_at">;
    }
  >({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Omit<ProductProfile, "id" | "created_at" | "updated_at">;
    }) => productService.updateProfile(id, data),
    onSuccess: () => {
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["productProfiles", productId],
      });
      if (onUpdate) onUpdate();
      setShowProfileForm(false);
    },
    onError: (error: Error) => {
      console.error("Error updating profile:", error);
      toast.error("An error occurred while updating the profile");
    },
  });

  // Add a new size item
  const addSizeItem = () => {
    const currentSize = form.getValues("size") || [];
    if (currentSize.length < 5) {
      form.setValue("size", [
        ...currentSize,
        { name: "", weight: "", thickness: "" },
      ]);
    }
  };

  // Remove a size item at the given index
  const removeSizeItem = (index: number) => {
    const currentSize = form.getValues("size") || [];
    form.setValue(
      "size",
      currentSize.filter((_, i) => i !== index),
    );
  };

  const onSubmit = async (data: ProfileFormData) => {
    // Extract certificates and badges from form data
    const { certificates, badges, ...profileFields } = data;

    // Ensure size is an array (not undefined)
    const formattedData: Partial<ProductProfile> = {
      ...profileFields,
      size: profileFields.size || [],
    };

    const profileData = formattedData as Omit<
      ProductProfile,
      "id" | "created_at" | "updated_at"
    >;

    if (editingProfile) {
      // Update existing profile
      updateMutation.mutate(
        { id: editingProfile.id, data: profileData },
        {
          onSuccess: async () => {
            // Save certificates and badges after profile is saved
            if (editingProfile.id && (certificates || badges)) {
              try {
                await Promise.all([
                  productService.assignCertificatesToProfile(
                    editingProfile.id,
                    certificates || [],
                  ),
                  productService.assignBadgesToProfile(
                    editingProfile.id,
                    badges || [],
                  ),
                ]);
              } catch (error) {
                console.error("Error saving certificates/badges:", error);
                toast.error(
                  "Profile saved but failed to update certificates/badges",
                );
              }
            }
          },
        },
      );
    } else {
      // Create new profile
      createMutation.mutate(profileData, {
        onSuccess: async (newProfile) => {
          // Save certificates and badges after profile is created
          if (newProfile?.id && (certificates || badges)) {
            try {
              await Promise.all([
                productService.assignCertificatesToProfile(
                  newProfile.id,
                  certificates || [],
                ),
                productService.assignBadgesToProfile(
                  newProfile.id,
                  badges || [],
                ),
              ]);
            } catch (error) {
              console.error("Error saving certificates/badges:", error);
              toast.error(
                "Profile created but failed to save certificates/badges",
              );
            }
          }
        },
      });
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="space-y-1">
              <CardTitle>Profiles</CardTitle>
              <CardDescription>
                Manage technical specifications for {product.name}
              </CardDescription>
            </div>
            <Button onClick={handleAddProfile}>
              <Plus className="mr-2 h-4 w-4" />
              Add Profile
            </Button>
          </CardHeader>
        </Card>

        {/* Profile Cards */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : profiles && profiles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Ruler className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No profiles yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first profile to define technical specifications
              </p>
              <Button onClick={handleAddProfile}>
                <Plus className="mr-2 h-4 w-4" />
                Add Profile
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {profiles &&
              Array.isArray(profiles) &&
              profiles.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  onEdit={handleEditProfile}
                  onDelete={handleDelete}
                  onManageCertsBadges={handleManageCertificatesBadges}
                  onAddItemFromCategory={handleAddItemFromCategory}
                  onEditCategory={handleEditCategory}
                />
              ))}
          </div>
        )}
      </div>

      {/* Profile Form Dialog */}
      <Dialog open={showProfileForm} onOpenChange={setShowProfileForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingProfile ? "Edit Profile" : "Add New Profile"}
            </DialogTitle>
            <DialogDescription>
              {editingProfile
                ? "Update technical specifications for this profile"
                : "Add technical specifications for the product"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Tabs defaultValue="general">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="size">Size</TabsTrigger>
                  <TabsTrigger value="certificates">Certificates</TabsTrigger>
                  <TabsTrigger value="badges">Badges</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                  <GeneralTab
                    control={form.control}
                    watch={form.watch}
                    setValue={form.setValue}
                  />
                </TabsContent>
                <TabsContent value="size">
                  <SizeTab
                    control={form.control}
                    watch={form.watch}
                    addSizeItem={addSizeItem}
                    removeSizeItem={removeSizeItem}
                  />
                </TabsContent>

                <TabsContent value="certificates">
                  <CertificatesTab
                    control={form.control}
                    watch={form.watch}
                    setValue={form.setValue}
                    availableCertificates={availableCertificates || []}
                    loadingCertsAndBadges={loadingCertsAndBadges}
                  />
                </TabsContent>

                <TabsContent value="badges">
                  <BadgesTab
                    control={form.control}
                    watch={form.watch}
                    setValue={form.setValue}
                    availableBadges={availableBadges || []}
                    loadingCertsAndBadges={loadingCertsAndBadges}
                  />
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-6">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">
                  {editingProfile ? "Update Profile" : "Create Profile"}
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
              profile and all related items, categories, and associations.
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

      {/* Certificates and Badges Dialog */}
      {selectedProfile && (
        <CertificatesBadgesManager
          isOpen={showCertBadges}
          onClose={() => setShowCertBadges(false)}
          profileId={selectedProfile.id}
          productId={productId}
          entityType="profile"
          defaultTab={certBadgeTab}
        />
      )}

      {/* Add Item Form Dialog */}
      <Dialog open={showItemForm} onOpenChange={setShowItemForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Item to Profile</DialogTitle>
            <DialogDescription>
              Create a new item for {itemFormProfile?.name}. Form is pre-filled
              with profile data.
            </DialogDescription>
          </DialogHeader>

          <Form {...itemForm}>
            <form
              onSubmit={itemForm.handleSubmit(onItemSubmit)}
              className="space-y-4"
            >
              <FormField
                control={itemForm.control}
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
                control={itemForm.control}
                name="product_profile_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled
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
                    <FormDescription>
                      Auto-selected from the profile
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={itemForm.control}
                name="product_category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Category {itemFormCategoryId ? "*" : "(Optional)"}
                    </FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value === "none" ? null : value);
                      }}
                      value={field.value || "none"}
                      disabled={!!itemFormCategoryId}
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
                        {itemFormProfile &&
                          profileCategories[itemFormProfile.id]?.map(
                            (category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ),
                          )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {itemFormCategoryId
                        ? "Auto-selected from the category"
                        : "Select a category from this profile"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={itemForm.control}
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
                  control={itemForm.control}
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
                control={itemForm.control}
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
                <Button type="submit">Create Item</Button>
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
    </>
  );
};

export default ProfileManager;
