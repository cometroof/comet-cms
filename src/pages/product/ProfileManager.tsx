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
  CardFooter,
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
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Trash } from "lucide-react";
import { Label } from "@/components/ui/label";
import { type Json } from "@/lib/supabase-types";
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
  Award,
  FileText,
  Ruler,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import * as productService from "@/services/product.service";
import { ProductProfile, ProfileFormData, Product } from "./types";
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

  // Create form
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      product_id: productId,
      name: "",
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

    // Load certificates and badges for this profile
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
      console.error("Error loading certificates and badges:", error);
      toast.error("Failed to load certificates and badges");
    } finally {
      setLoadingCertsAndBadges(false);
    }

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
    // Extract certificates and badges from form data
    const { certificates, badges, ...profileFields } = data;

    // Ensure size is an array (not undefined)
    const formattedData = {
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
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="size">Size</TabsTrigger>
                  <TabsTrigger value="certificates">Certificates</TabsTrigger>
                  <TabsTrigger value="badges">Badges</TabsTrigger>
                </TabsList>

                <TabsContent
                  value="general"
                  className="max-h-[520px] overflow-y-auto"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter profile name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="size_per_panel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Size per Panel</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 1060mm × 2500mm"
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
                      name="effective_size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Effective Size</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 1000mm × 2400mm"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="panel_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Panel Amount</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Number of panels"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => {
                                const value = e.target.value
                                  ? parseInt(e.target.value, 10)
                                  : undefined;
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="materials"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Materials</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Zinc, Aluminum, Steel"
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
                  </div>
                </TabsContent>
                <TabsContent
                  value="size"
                  className="max-h-[520px] overflow-y-auto"
                >
                  {/* Size Fields */}
                  <div className="space-y-4 grid-flow-col">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">
                        Size Specifications
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={addSizeItem}
                        disabled={(form.watch("size") || [])?.length >= 5}
                      >
                        <PlusCircle className="h-4 w-4" />
                        Add Size
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Add up to 5 size specifications with name, weight and
                      thickness
                    </p>

                    {(form.watch("size") || []).map((_, index) => (
                      <div
                        key={index}
                        className="space-y-4 rounded-md border p-4"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">
                            Size {index + 1}
                          </h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSizeItem(index)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <FormField
                            control={form.control}
                            name={`size.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name*</FormLabel>
                                <FormControl>
                                  <Input placeholder="Size name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`size.${index}.weight`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Weight*</FormLabel>
                                <FormControl>
                                  <Input placeholder="Weight" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`size.${index}.thickness`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Thickness*</FormLabel>
                                <FormControl>
                                  <Input placeholder="Thickness" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}

                    {((form.watch("size") || [])?.length || 0) === 0 && (
                      <div className="rounded-md border border-dashed p-6 text-center">
                        <p className="text-sm text-muted-foreground">
                          No size specifications added yet.
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Add specifications including name, weight, and
                          thickness
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-4 gap-1"
                          onClick={addSizeItem}
                        >
                          <PlusCircle className="h-4 w-4" />
                          Add Size
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent
                  value="certificates"
                  className="max-h-[520px] overflow-y-auto"
                >
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">
                        Certificates
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Select certificates to associate with this profile
                      </p>
                    </div>

                    {loadingCertsAndBadges ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : !availableCertificates ||
                      availableCertificates.length === 0 ? (
                      <div className="rounded-md border border-dashed p-6 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No certificates available
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {availableCertificates.map((certificate: any) => {
                          const isSelected = (
                            form.watch("certificates") || []
                          ).includes(certificate.id);
                          return (
                            <div
                              key={certificate.id}
                              className={`border rounded-md p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                                isSelected
                                  ? "border-primary bg-primary/5"
                                  : "hover:bg-muted"
                              }`}
                              onClick={() => {
                                const currentCerts =
                                  form.watch("certificates") || [];
                                if (isSelected) {
                                  form.setValue(
                                    "certificates",
                                    currentCerts.filter(
                                      (id) => id !== certificate.id,
                                    ),
                                  );
                                } else {
                                  form.setValue("certificates", [
                                    ...currentCerts,
                                    certificate.id,
                                  ]);
                                }
                              }}
                            >
                              <div className="flex-shrink-0 w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                                {certificate.image ? (
                                  <img
                                    src={certificate.image}
                                    alt={certificate.name}
                                    className="w-8 h-8 object-contain"
                                  />
                                ) : (
                                  <FileText className="w-5 h-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-grow">
                                <h4 className="font-medium text-sm">
                                  {certificate.name}
                                </h4>
                              </div>
                              <div className="flex-shrink-0">
                                {isSelected ? (
                                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent
                  value="badges"
                  className="max-h-[520px] overflow-y-auto"
                >
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">Badges</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Select badges to associate with this profile
                      </p>
                    </div>

                    {loadingCertsAndBadges ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : !availableBadges || availableBadges.length === 0 ? (
                      <div className="rounded-md border border-dashed p-6 text-center">
                        <Award className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No badges available
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {availableBadges.map((badge: any) => {
                          const isSelected = (
                            form.watch("badges") || []
                          ).includes(badge.id);
                          return (
                            <div
                              key={badge.id}
                              className={`border rounded-md p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                                isSelected
                                  ? "border-primary bg-primary/5"
                                  : "hover:bg-muted"
                              }`}
                              onClick={() => {
                                const currentBadges =
                                  form.watch("badges") || [];
                                if (isSelected) {
                                  form.setValue(
                                    "badges",
                                    currentBadges.filter(
                                      (id) => id !== badge.id,
                                    ),
                                  );
                                } else {
                                  form.setValue("badges", [
                                    ...currentBadges,
                                    badge.id,
                                  ]);
                                }
                              }}
                            >
                              <div className="flex-shrink-0 w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                                {badge.image ? (
                                  <img
                                    src={badge.image}
                                    alt={badge.name}
                                    className="w-8 h-8 object-contain"
                                  />
                                ) : (
                                  <Award className="w-5 h-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-grow">
                                <h4 className="font-medium text-sm">
                                  {badge.name}
                                </h4>
                              </div>
                              <div className="flex-shrink-0">
                                {isSelected ? (
                                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
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
    </>
  );
};

export default ProfileManager;
