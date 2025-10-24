import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useProductQuery,
  ProductProfile as ProductContextProfile,
} from "@/contexts/ProductQueryContext";
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
import ImageSelectorDialog from "@/components/ImageSelectorDialog";
import { Form } from "@/components/ui/form";
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
  Award,
  FileText,
  Ruler,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import * as productService from "@/services/product.service";
import {
  ProductProfile,
  ProfileFormData,
  Product,
  ProductPremium,
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
import CertificatesBadgesManager from "./CertificatesBadgesManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GeneralTab from "./profile-tabs/GeneralTab";
import SizeTab from "./profile-tabs/SizeTab";
import CertificatesTab from "./profile-tabs/CertificatesTab";
import BadgesTab from "./profile-tabs/BadgesTab";
import PremiumTab from "./profile-tabs/PremiumTab";

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
  // Premium fields
  is_premium: z.boolean().optional(),
  description_id: z.string().optional(),
  description_en: z.string().optional(),
  premium_materials: z.string().optional(),
  material_name: z.string().optional(),
  premium_image_url: z.string().optional(),
  content_image_url: z.string().optional(),
  reng_distance: z.string().optional(),
});

interface ProfileManagerProps {
  productId: string;
  product: Product;
  onUpdate?: () => void;
}

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
  const [loadingCertsAndBadges, setLoadingCertsAndBadges] = useState(false);
  const [showPremiumImageSelector, setShowPremiumImageSelector] =
    useState(false);
  const [showContentImageSelector, setShowContentImageSelector] =
    useState(false);
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
      certificates: [],
      badges: [],
      is_premium: false,
      description_id: "",
      description_en: "",
      premium_materials: "",
      material_name: "",
      premium_image_url: "",
      content_image_url: "",
      reng_distance: "",
    },
  });

  // Fetch profiles with React Query
  // const {
  //   profiles = [],
  //   isProfilesLoading: isLoading,
  //   profilesError: error,
  // } = useProductQuery();

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
      size: [],
      certificates: [],
      badges: [],
      is_premium: false,
      description_id: "",
      description_en: "",
      premium_materials: "",
      material_name: "",
      premium_image_url: "",
      content_image_url: "",
      reng_distance: "",
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
    let premiumData: ProductPremium | null = null;

    try {
      const [assignedCerts, assignedBadges, premium] = await Promise.all([
        productService.getProfileCertificates(profile.id),
        productService.getProfileBadges(profile.id),
        productService.getProfilePremium(profile.id),
      ]);

      certificateIds = assignedCerts.map((cert) => cert.id);
      badgeIds = assignedBadges.map((badge) => badge.id);
      premiumData = premium;
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoadingCertsAndBadges(false);
    }

    // PERBAIKAN: Isi SEMUA field profile
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
      size: profile.size || [],
      certificates: certificateIds,
      badges: badgeIds,
      is_premium: !!premiumData,
      description_id: premiumData?.description_id || "",
      description_en: premiumData?.description_en || "",
      premium_materials: premiumData?.material_fullname || "",
      material_name: premiumData?.material_name || "",
      premium_image_url: premiumData?.premium_image_url || "",
      content_image_url: premiumData?.content_image_url || "",
      reng_distance: premiumData?.reng_distance || "",
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

  const handleManageCertificatesBadges = (profile: ProductContextProfile) => {
    setSelectedProfile(profile as unknown as ProductProfile);
    setShowCertBadges(true);
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
    // Extract certificates, badges, and premium fields from form data
    const {
      certificates,
      badges,
      is_premium,
      description_id,
      description_en,
      premium_materials,
      material_name,
      premium_image_url,
      content_image_url,
      reng_distance,
      ...profileFields
    } = data;

    // Ensure size is an array (not undefined)
    const formattedData: Partial<ProductProfile> = {
      ...profileFields,
      size: profileFields.size || [],
    };

    // If premium is enabled, include premium fields in the profile data
    // if (is_premium) {
    //   formattedData.is_premium = is_premium;
    //   formattedData.description_id = description_id;
    //   formattedData.description_en = description_en;
    //   formattedData.premium_materials = premium_materials;
    //   formattedData.material_name = material_name;
    //   formattedData.premium_image_url = premium_image_url;
    //   formattedData.content_image_url = content_image_url;
    //   formattedData.reng_distance = reng_distance;
    // }

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

            // Handle premium data synchronization if needed
            if (is_premium && editingProfile?.product_id) {
              try {
                const premiumData: PremiumFormData = {
                  product_id: editingProfile.product_id,
                  product_profile_id: editingProfile.id,
                  material_fullname: premium_materials || undefined,
                  material_name: material_name || undefined,
                  description_en: description_en || undefined,
                  description_id: description_id || undefined,
                  premium_image_url: premium_image_url || undefined,
                  content_image_url: content_image_url || undefined,
                  effective_size: profileFields.effective_size,
                  size_per_panel: profileFields.size_per_panel,
                  reng_distance: reng_distance || undefined,
                };
                await productService.upsertPremium(premiumData);
              } catch (error) {
                console.error("Error updating premium data:", error);
                toast.warning(
                  "Profile saved but premium data may not be fully synced",
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

          // Handle premium data if enabled
          if (is_premium && newProfile) {
            try {
              const premiumData: PremiumFormData = {
                product_id: newProfile.product_id,
                product_profile_id: newProfile.id,
                material_fullname: premium_materials || undefined,
                material_name: material_name || undefined,
                description_en: description_en || undefined,
                description_id: description_id || undefined,
                premium_image_url: premium_image_url || undefined,
                content_image_url: content_image_url || undefined,
                effective_size: profileFields.effective_size,
                size_per_panel: profileFields.size_per_panel,
                reng_distance: reng_distance || undefined,
              };
              await productService.upsertPremium(premiumData);
            } catch (error) {
              console.error("Error saving premium data:", error);
              toast.warning(
                "Profile created but premium data may not be fully synced",
              );
            }
          }
        },
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : profiles && profiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Ruler className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No profiles yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first profile to define technical specifications
              </p>
              <Button onClick={handleAddProfile}>
                <Plus className="mr-2 h-4 w-4" />
                Add Profile
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Specs</TableHead>
                    <TableHead>Badges</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles &&
                    Array.isArray(profiles) &&
                    profiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">
                          {profile.name}
                        </TableCell>
                        <TableCell>
                          {profile.size_per_panel && (
                            <div className="text-sm">
                              <span className="font-medium">
                                Size per panel:
                              </span>{" "}
                              {profile.size_per_panel}
                            </div>
                          )}
                          {profile.effective_size && (
                            <div className="text-sm">
                              <span className="font-medium">
                                Effective size:
                              </span>{" "}
                              {profile.effective_size}
                            </div>
                          )}
                          {profile.size &&
                            Array.isArray(profile.size) &&
                            profile.size.length > 0 && (
                              <div className="text-sm mt-1">
                                <span className="font-medium">
                                  Size specifications:
                                </span>{" "}
                                <div className="pl-2 mt-1 space-y-1">
                                  {profile.size &&
                                    Array.isArray(profile.size) &&
                                    profile.size.map((item, idx: number) => (
                                      <div key={idx} className="text-xs">
                                        <Badge
                                          variant="outline"
                                          className="mr-1"
                                        >
                                          {item.name}
                                        </Badge>
                                        <span className="text-muted-foreground">
                                          {item.thickness} / {item.weight}
                                        </span>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                        </TableCell>
                        <TableCell>
                          {profile.materials && (
                            <Badge variant="outline" className="mr-1">
                              {profile.materials}
                            </Badge>
                          )}
                          {profile.thickness && (
                            <Badge variant="outline" className="mr-1">
                              {profile.thickness}
                            </Badge>
                          )}
                          {profile.weight && (
                            <Badge variant="outline" className="mr-1">
                              {profile.weight}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                handleManageCertificatesBadges(profile as any)
                              }
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                handleManageCertificatesBadges(profile)
                              }
                            >
                              <Award className="h-4 w-4" />
                            </Button>
                          </div>
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
                                  handleEditProfile(profile as any)
                                }
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Profile
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(profile.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Profile
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
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="size">Size</TabsTrigger>
                  <TabsTrigger value="certificates">Certificates</TabsTrigger>
                  <TabsTrigger value="badges">Badges</TabsTrigger>
                  <TabsTrigger value="premium">
                    <Crown className="h-5 w-5 text-amber-600 mr-1" /> Premium
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                  <GeneralTab control={form.control} watch={form.watch} />
                </TabsContent>
                <TabsContent value="size">
                  <SizeTab
                    control={form.control}
                    watch={form.watch}
                    addSizeItem={addSizeItem}
                    removeSizeItem={removeSizeItem}
                  />
                </TabsContent>

                <TabsContent value="premium">
                  <PremiumTab
                    control={form.control}
                    watch={form.watch}
                    setValue={form.setValue}
                    onSelectPremiumImage={() =>
                      setShowPremiumImageSelector(true)
                    }
                    onSelectContentImage={() =>
                      setShowContentImageSelector(true)
                    }
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

              {/*<Separator className="my-4" />*/}

              {/*<div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tkdn_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TKDN Value</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="TKDN value"
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
                  name="thickness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thickness</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 0.45mm"
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
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 4.5kg/m²"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>*/}

              {/*<Separator className="my-4" />*/}

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
        />
      )}

      {/* Premium Image Selector */}
      <ImageSelectorDialog
        open={showPremiumImageSelector}
        onOpenChange={setShowPremiumImageSelector}
        onSelect={(url) => {
          form.setValue("premium_image_url", url);
          setShowPremiumImageSelector(false);
        }}
        title="Select Premium Brand Image"
        multiple={false}
        multipleSelection={false}
      />

      {/* Content Image Selector */}
      <ImageSelectorDialog
        open={showContentImageSelector}
        onOpenChange={setShowContentImageSelector}
        onSelect={(url) => {
          form.setValue("content_image_url", url);
          setShowContentImageSelector(false);
        }}
        title="Select Premium Content Image"
        multiple={false}
        multipleSelection={false}
      />
    </>
  );
};

export default ProfileManager;
