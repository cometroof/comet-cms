import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { ProductProfile } from "@/pages/product/types";
import ImageSelectorDialog from "@/components/ImageSelectorDialog";
import {
  ChevronLeft,
  X,
  ImageUp,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  BookMarked,
} from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import CertificatesBadgesProfileDialog from "@/components/CertificatesBadgesProfileDialog";
import * as productService from "@/services/product.service";

interface SizeData {
  headers: string[];
  rows: Array<{
    label: {
      en: string;
      id: string;
    };
    values: string[];
  }>;
}

interface SpecificationItem {
  label: {
    en: string;
    id: string;
  };
  value: string;
}

interface ProfileFormData {
  name: string;
  materials: string;
  thickness: string;
  weight: string;
  size_per_panel: string;
  effective_size: string;
  panel_amount: number;
  tkdn_value: string;
  profile_image_url: string;
  profile_banner_url: string;
  profile_main_image_url: string;
  is_premium: boolean;
  description_en: string;
  description_id: string;
  premium_materials_en: string;
  premium_materials_id: string;
  premium_image_url: string;
  content_image_url: string;
}

const ProfileFormPage = () => {
  const { productId, profileId } = useParams<{
    productId: string;
    profileId?: string;
  }>();
  const navigate = useNavigate();
  const isEditMode = !!profileId;

  const [showProfileImageSelector, setShowProfileImageSelector] =
    useState(false);
  const [showBannerSelector, setShowBannerSelector] = useState(false);
  const [showPremiumImageSelector, setShowPremiumImageSelector] =
    useState(false);
  const [showContentImageSelector, setShowContentImageSelector] =
    useState(false);
  const [showMainImageSelector, setShowMainImageSelector] = useState(false);

  // Size table state
  const [sizeData, setSizeData] = useState<SizeData>({
    headers: [],
    rows: [],
  });

  // Language state for size information
  const [sizeLanguage, setSizeLanguage] = useState<"en" | "id">("en");

  // Language state for specifications
  const [specLanguage, setSpecLanguage] = useState<"en" | "id">("en");

  // Specification state
  const [specifications, setSpecifications] = useState<SpecificationItem[]>([]);

  // Form dirty state
  const [isFormDirty, setIsFormDirty] = useState(false);

  // Certificates & Badges state
  const [openCertificates, setOpenCertificates] = useState<boolean>(false);
  const [selectedCertificateIds, setSelectedCertificateIds] = useState<
    string[]
  >([]);
  const [selectedBadgeIds, setSelectedBadgeIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: "",
      materials: "",
      thickness: "",
      weight: "",
      size_per_panel: "",
      effective_size: "",
      panel_amount: 0,
      tkdn_value: "",
      profile_image_url: "",
      profile_banner_url: "",
      profile_main_image_url: "",
      is_premium: false,
      description_en: "",
      description_id: "",
      premium_materials_en: "",
      premium_materials_id: "",
      premium_image_url: "",
      content_image_url: "",
    },
  });

  const profileImage = watch("profile_image_url");
  const bannerImage = watch("profile_banner_url");
  const profileMainImage = watch("profile_main_image_url");
  const premiumImage = watch("premium_image_url");
  const contentImage = watch("content_image_url");
  const isPremium = watch("is_premium");

  // Track form dirty state - combine form dirty with specifications and size data changes
  useEffect(() => {
    setIsFormDirty(isDirty);
  }, [isDirty]);

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isFormDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isFormDirty]);

  // Size table management functions
  const addColumn = () => {
    if (sizeData.headers.length >= 7) {
      toast.error("Maximum 7 size columns allowed");
      return;
    }

    setSizeData((prev) => ({
      headers: [...prev.headers, `Size ${prev.headers.length + 1}`],
      rows: prev.rows.map((row) => ({
        ...row,
        values: [...row.values, ""],
      })),
    }));
  };

  const removeColumn = (index: number) => {
    setSizeData((prev) => ({
      headers: prev.headers.filter((_, i) => i !== index),
      rows: prev.rows.map((row) => ({
        ...row,
        values: row.values.filter((_, i) => i !== index),
      })),
    }));
  };

  const addRow = () => {
    setSizeData((prev) => ({
      ...prev,
      rows: [
        ...prev.rows,
        {
          label: { en: "", id: "" },
          values: Array(prev.headers.length).fill(""),
        },
      ],
    }));
  };

  const removeRow = (index: number) => {
    setSizeData((prev) => ({
      ...prev,
      rows: prev.rows.filter((_, i) => i !== index),
    }));
  };

  const updateHeader = (index: number, value: string) => {
    setSizeData((prev) => ({
      ...prev,
      headers: prev.headers.map((h, i) => (i === index ? value : h)),
    }));
  };

  const updateRowLabel = (index: number, lang: "en" | "id", value: string) => {
    setSizeData((prev) => ({
      ...prev,
      rows: prev.rows.map((row, i) =>
        i === index ? { ...row, label: { ...row.label, [lang]: value } } : row
      ),
    }));
  };

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    setSizeData((prev) => ({
      ...prev,
      rows: prev.rows.map((row, i) =>
        i === rowIndex
          ? {
              ...row,
              values: row.values.map((v, j) => (j === colIndex ? value : v)),
            }
          : row
      ),
    }));
  };

  // Specification management functions
  const addSpecification = () => {
    setSpecifications((prev) => [
      ...prev,
      { label: { en: "", id: "" }, value: "" },
    ]);
  };

  const removeSpecification = (index: number) => {
    setSpecifications((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSpecificationLabel = (
    index: number,
    lang: "en" | "id",
    value: string
  ) => {
    setSpecifications((prev) =>
      prev.map((spec, i) =>
        i === index
          ? { ...spec, label: { ...spec.label, [lang]: value } }
          : spec
      )
    );
  };

  const updateSpecificationValue = (index: number, value: string) => {
    setSpecifications((prev) =>
      prev.map((spec, i) => (i === index ? { ...spec, value } : spec))
    );
  };

  // Drag and drop handler for specifications
  const handleSpecificationDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(specifications);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSpecifications(items);
  };

  // Drag and drop handler for size information rows
  const handleSizeRowDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const rows = Array.from(sizeData.rows);
    const [reorderedRow] = rows.splice(result.source.index, 1);
    rows.splice(result.destination.index, 0, reorderedRow);

    setSizeData((prev) => ({
      ...prev,
      rows,
    }));
  };

  // Fetch profile data if editing
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["product-profile", profileId],
    queryFn: async () => {
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from("product_profile")
        .select("*")
        .eq("id", profileId)
        .single();

      if (profileError) throw profileError;

      // Fetch premium data if exists
      const { data: premiumData } = await supabase
        .from("product_premium")
        .select("*")
        .eq("product_profile_id", profileId)
        .single();

      // Combine profile and premium data
      return {
        ...profileData,
        is_premium: !!premiumData,
        description_en: premiumData?.description_en || "",
        description_id: premiumData?.description_id || "",
        premium_materials_en: premiumData?.material_fullname || "",
        premium_materials_id: premiumData?.material_name || "",
        premium_image_url: premiumData?.premium_image_url || "",
        content_image_url: premiumData?.content_image_url || "",
      } as ProductProfile & {
        is_premium?: boolean;
        description_en?: string;
        description_id?: string;
        premium_materials_en?: string;
        premium_materials_id?: string;
        premium_image_url?: string;
        content_image_url?: string;
      };
    },
    // enabled: isEditMode,
  });

  // Reset form when profile data is loaded
  useEffect(() => {
    if (profile) {
      // Parse description if it's stored as a single field
      const descriptionEn = profile.description_en || "";
      const descriptionId = profile.description_id || "";

      // Parse premium_materials if stored as a single field
      const premiumMaterialsEn = profile.premium_materials_en || "";
      const premiumMaterialsId = profile.premium_materials_id || "";

      reset({
        name: profile.name,
        materials: profile.materials || "",
        thickness: profile.thickness || "",
        weight: profile.weight || "",
        size_per_panel: profile.size_per_panel || "",
        effective_size: profile.effective_size || "",
        panel_amount: profile.panel_amount || 0,
        tkdn_value: profile.tkdn_value || "",
        profile_image_url: profile.profile_image_url || "",
        profile_main_image_url: profile.profile_main_image_url || "",
        profile_banner_url: profile.profile_banner_url || "",
        is_premium: profile.is_premium || false,
        description_en: descriptionEn,
        description_id: descriptionId,
        premium_materials_en: premiumMaterialsEn,
        premium_materials_id: premiumMaterialsId,
        premium_image_url: profile.premium_image_url || "",
        content_image_url: profile.content_image_url || "",
      });

      // Load size data from profile
      if (profile.size && typeof profile.size === "object") {
        // eslint-disable-next-line
        const sizeObj = profile.size as any;
        if (sizeObj.headers && sizeObj.rows && sizeObj.rows.length > 0) {
          // Check if rows are in old format (string[][]) or new format (bilingual)
          const isOldFormat = Array.isArray(sizeObj.rows[0]);

          if (isOldFormat) {
            // Convert old format to new format
            // Old: headers: ["anchor", "Size 1"], rows: [["Label", "Value"]]
            // New: headers: ["Size 1"], rows: [{label: {en: "Label", id: "Label"}, values: ["Value"]}]
            const newHeaders = sizeObj.headers.slice(1); // Remove anchor from headers
            const newRows = sizeObj.rows.map((row: string[]) => ({
              label: { en: row[0] || "", id: row[0] || "" },
              values: row.slice(1),
            }));
            setSizeData({ headers: newHeaders, rows: newRows });
          } else {
            setSizeData(sizeObj as SizeData);
          }
        } else {
          setSizeData({ headers: [], rows: [] });
        }
      } else {
        setSizeData({ headers: [], rows: [] });
      }

      // Load specification data from profile
      if (profile.specification && Array.isArray(profile.specification)) {
        setSpecifications(
          profile.specification as unknown as SpecificationItem[]
        );
      } else {
        setSpecifications([]);
      }
    }
  }, [profile, reset]);

  // Mark form as dirty when specifications or size data changes
  useEffect(() => {
    if (profile && specifications.length > 0) {
      const originalSpecs = profile.specification || [];
      const hasSpecChanges =
        JSON.stringify(specifications) !== JSON.stringify(originalSpecs);
      if (hasSpecChanges) setIsFormDirty(true);
    }
  }, [specifications, profile]);

  useEffect(() => {
    if (profile && (sizeData.headers.length > 1 || sizeData.rows.length > 0)) {
      const originalSize = profile.size || { headers: ["anchor"], rows: [] };
      const hasSizeChanges =
        JSON.stringify(sizeData) !== JSON.stringify(originalSize);
      if (hasSizeChanges) setIsFormDirty(true);
    }
  }, [sizeData, profile]);

  const saveMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      // Payload for product_profile table (non-premium fields only)
      const profilePayload = {
        name: data.name,
        materials: data.materials || null,
        thickness: data.thickness || null,
        weight: data.weight || null,
        size_per_panel: data.size_per_panel || null,
        effective_size: data.effective_size || null,
        panel_amount: data.panel_amount,
        tkdn_value: data.tkdn_value || null,
        profile_image_url: data.profile_image_url || null,
        profile_main_image_url: data.profile_main_image_url || null,
        profile_banner_url: data.profile_banner_url || null, // eslint-disable-next-line
        size: sizeData as any,
        specification:
          // eslint-disable-next-line
          specifications.length > 0 ? specifications : (null as any),
        updated_at: new Date().toISOString(),
      };

      if (isEditMode) {
        // Update existing profile
        const { error: profileError } = await supabase
          .from("product_profile")
          .update(profilePayload)
          .eq("id", profileId);

        if (profileError) throw profileError;

        // Handle premium data separately
        if (data.is_premium) {
          const premiumPayload = {
            description_en: data.description_en || null,
            description_id: data.description_id || null,
            material_fullname: data.premium_materials_en || null,
            material_name: data.premium_materials_id || null,
            premium_image_url: data.premium_image_url || null,
            content_image_url: data.content_image_url || null,
            product_profile_id: profileId,
            product_id: productId,
            updated_at: new Date().toISOString(),
          };

          // Check if premium record exists
          const { data: existingPremium } = await supabase
            .from("product_premium")
            .select("id")
            .eq("product_profile_id", profileId)
            .single();

          if (existingPremium) {
            // Update existing premium data
            const { error: premiumError } = await supabase
              .from("product_premium")
              .update(premiumPayload)
              .eq("product_profile_id", profileId);

            if (premiumError) throw premiumError;
          } else {
            // Insert new premium data
            const { error: premiumError } = await supabase
              .from("product_premium")
              .insert(premiumPayload);

            if (premiumError) throw premiumError;
          }
        } else {
          // If not premium, delete any existing premium data
          const { error: deleteError } = await supabase
            .from("product_premium")
            .delete()
            .eq("product_profile_id", profileId);

          if (deleteError) throw deleteError;
        }
      } else {
        // Create new profile
        const { data: newProfile, error: profileError } = await supabase
          .from("product_profile")
          .insert({
            ...profilePayload,
            product_id: productId,
          })
          .select("id")
          .single();

        if (profileError) throw profileError;

        // Create premium data if is_premium is checked
        if (data.is_premium && newProfile) {
          const premiumPayload = {
            description_en: data.description_en || null,
            description_id: data.description_id || null,
            material_fullname: data.premium_materials_en || null,
            material_name: data.premium_materials_id || null,
            premium_image_url: data.premium_image_url || null,
            content_image_url: data.content_image_url || null,
            product_profile_id: newProfile.id,
            product_id: productId,
          };

          const { error: premiumError } = await supabase
            .from("product_premium")
            .insert(premiumPayload);

          if (premiumError) throw premiumError;
        }

        // Save certificates & badges if any were selected
        if (
          newProfile &&
          (selectedCertificateIds.length > 0 || selectedBadgeIds.length > 0)
        ) {
          await Promise.all([
            selectedCertificateIds.length > 0
              ? productService.assignCertificatesToProfile(
                  newProfile.id,
                  selectedCertificateIds
                )
              : Promise.resolve(true),
            selectedBadgeIds.length > 0
              ? productService.assignBadgesToProfile(
                  newProfile.id,
                  selectedBadgeIds
                )
              : Promise.resolve(true),
          ]);
        }

        // Return the new profile ID for navigation
        return newProfile?.id;
      }
    },
    onSuccess: (newProfileId) => {
      toast.success(
        isEditMode
          ? "Profile updated successfully"
          : "Profile created successfully"
      );
      navigate(
        `/dashboard/product-speciality/${productId}/profile/${
          newProfileId || profileId || ""
        }`
      );
    },
    onError: (error) => {
      toast.error(
        isEditMode ? "Failed to update profile" : "Failed to create profile"
      );
      console.error(error);
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    saveMutation.mutate(data);
    setIsFormDirty(false);
  };

  const handleBackClick = () => {
    if (isFormDirty) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );
      if (!confirmed) return;
    }
    navigate(-1);
  };

  if (isEditMode && profileLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handleBackClick}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-foreground">
                {isEditMode ? "Edit Profile" : "Create New Profile"}
              </h1>
              {isFormDirty && (
                <span className="text-sm text-amber-600 dark:text-amber-500 font-medium">
                  (Unsaved changes)
                </span>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              {isEditMode
                ? "Update the profile information below"
                : "Fill in the details to create a new profile"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-10">
                <div>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Core profile details</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOpenCertificates(true)}
                    className="border-primary text-primary hover:bg-primary/10"
                  >
                    <BookMarked className="!size-4 mr-1" />
                    Certificates & Badges
                  </Button>
                </div>
                <CertificatesBadgesProfileDialog
                  isOpen={openCertificates}
                  onClose={() => setOpenCertificates(false)}
                  profileId={profileId}
                  onSave={async (certIds, badgeIds) => {
                    if (profileId) {
                      // Edit mode - handled by dialog
                      return;
                    }
                    // Create mode - store for later
                    setSelectedCertificateIds(certIds);
                    setSelectedBadgeIds(badgeIds);
                  }}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name", { required: "Name is required" })}
                  placeholder="Enter profile name"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Premium Checkbox */}
              {/*<div className="flex items-center space-x-2">
                <Checkbox
                  id="is_premium"
                  checked={isPremium}
                  onCheckedChange={(checked) =>
                    setValue("is_premium", checked as boolean)
                  }
                />
                <Label
                  htmlFor="is_premium"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Premium Profile
                </Label>
              </div>*/}
            </CardContent>
          </Card>

          {/* Media & Images */}
          <Card>
            <CardHeader>
              <CardTitle>Media & Images</CardTitle>
              <CardDescription>Profile images and visuals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                {/* Profile Image */}
                <div className="space-y-2">
                  <Label>Profile Image</Label>
                  <div
                    className="relative w-full aspect-square border rounded overflow-hidden group cursor-pointer"
                    onClick={() => setShowProfileImageSelector(true)}
                  >
                    {profileImage ? (
                      <>
                        <img
                          src={profileImage}
                          alt="Profile"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute left-0 top-0 size-full bg-black/40 opacity-0 flex items-center justify-center group-hover:opacity-100 pointer-events-none text-sm text-white">
                          <ImageUp className="size-6" />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setValue("profile_image_url", "");
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <div className="size-full flex items-center justify-center bg-muted">
                        <ImageUp className="size-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Main Image */}
                <div className="space-y-2">
                  <Label>Profile Main Image</Label>
                  <div
                    className="relative w-full aspect-square border rounded overflow-hidden group cursor-pointer"
                    onClick={() => setShowMainImageSelector(true)}
                  >
                    {profileMainImage ? (
                      <>
                        <img
                          src={profileMainImage}
                          alt="Profile Main"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute left-0 top-0 size-full bg-black/40 opacity-0 flex items-center justify-center group-hover:opacity-100 pointer-events-none text-sm text-white">
                          <ImageUp className="size-6" />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setValue("profile_main_image_url", "");
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <div className="size-full flex items-center justify-center bg-muted">
                        <ImageUp className="size-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Banner */}
                <div className="space-y-2 col-span-2">
                  <Label>Profile Banner</Label>
                  <div
                    className="relative w-full aspect-[2.5/1] border rounded overflow-hidden group cursor-pointer"
                    onClick={() => setShowBannerSelector(true)}
                  >
                    {bannerImage ? (
                      <>
                        <img
                          src={bannerImage}
                          alt="Banner"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute left-0 top-0 size-full bg-black/40 opacity-0 flex items-center justify-center group-hover:opacity-100 pointer-events-none text-sm text-white">
                          <ImageUp className="size-6" />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setValue("profile_banner_url", "");
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <div className="size-full flex items-center justify-center bg-muted">
                        <ImageUp className="size-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Premium Images (only show if is_premium is checked) */}
              {isPremium && (
                <div className="grid grid-cols-2 gap-4 pt-4">
                  {/* Premium Image */}
                  <div className="space-y-2">
                    <Label>Premium Brand Image</Label>
                    <div
                      className="relative w-full aspect-square border rounded overflow-hidden group cursor-pointer"
                      onClick={() => setShowPremiumImageSelector(true)}
                    >
                      {premiumImage ? (
                        <>
                          <img
                            src={premiumImage}
                            alt="Premium"
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute left-0 top-0 size-full bg-black/40 opacity-0 flex items-center justify-center group-hover:opacity-100 pointer-events-none text-sm text-white">
                            <ImageUp className="size-6" />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              setValue("premium_image_url", "");
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <div className="size-full flex items-center justify-center bg-muted">
                          <ImageUp className="size-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content Image */}
                  <div className="space-y-2">
                    <Label>Content Image</Label>
                    <div
                      className="relative w-full aspect-square border rounded overflow-hidden group cursor-pointer"
                      onClick={() => setShowContentImageSelector(true)}
                    >
                      {contentImage ? (
                        <>
                          <img
                            src={contentImage}
                            alt="Content"
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute left-0 top-0 size-full bg-black/40 opacity-0 flex items-center justify-center group-hover:opacity-100 pointer-events-none text-sm text-white">
                            <ImageUp className="size-6" />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              setValue("content_image_url", "");
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <div className="size-full flex items-center justify-center bg-muted">
                          <ImageUp className="size-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dynamic Size Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Size Information</CardTitle>
                  <CardDescription>
                    Dynamic size table with custom dimensions. Drag rows to
                    reorder.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={sizeLanguage === "en" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSizeLanguage("en")}
                    className="h-8 px-3"
                  >
                    EN
                  </Button>
                  <Button
                    type="button"
                    variant={sizeLanguage === "id" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSizeLanguage("id")}
                    className="h-8 px-3"
                  >
                    ID
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {sizeData.headers.length > 0 || sizeData.rows.length > 0 ? (
                <div className="border rounded-lg overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 w-10 border-b"></th>
                        <th className="p-2 text-left border-b">
                          <span className="font-medium">
                            {sizeLanguage === "en" ? "Label" : "Label"}
                          </span>
                        </th>
                        {sizeData.headers.map((header, index) => (
                          <th key={index} className="p-2 text-left border-b">
                            <div className="flex items-center gap-2">
                              <Input
                                value={header}
                                onChange={(e) =>
                                  updateHeader(index, e.target.value)
                                }
                                placeholder={`Size ${index + 1}`}
                                className="h-8 text-xs"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:text-destructive"
                                onClick={() => removeColumn(index)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </th>
                        ))}
                        <th className="p-2 w-10 border-b">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={addColumn}
                            disabled={sizeData.headers.length >= 7}
                            title="Add Column"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </th>
                      </tr>
                    </thead>
                    <DragDropContext onDragEnd={handleSizeRowDragEnd}>
                      <Droppable droppableId="size-rows">
                        {(provided) => (
                          <tbody
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                          >
                            {sizeData.rows.map((row, rowIndex) => (
                              <Draggable
                                key={`row-${rowIndex}`}
                                draggableId={`row-${rowIndex}`}
                                index={rowIndex}
                              >
                                {(provided, snapshot) => (
                                  <tr
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`border-b last:border-b-0 ${
                                      snapshot.isDragging ? "bg-muted" : ""
                                    }`}
                                  >
                                    <td
                                      {...provided.dragHandleProps}
                                      className="p-2 cursor-grab active:cursor-grabbing"
                                    >
                                      <GripVertical className="w-4 h-4 text-muted-foreground mx-auto" />
                                    </td>
                                    <td className="p-2">
                                      <Input
                                        value={row.label[sizeLanguage]}
                                        onChange={(e) =>
                                          updateRowLabel(
                                            rowIndex,
                                            sizeLanguage,
                                            e.target.value
                                          )
                                        }
                                        placeholder={
                                          sizeLanguage === "en"
                                            ? "Row label"
                                            : "Label baris"
                                        }
                                        className="h-8 text-xs"
                                      />
                                    </td>
                                    {row.values.map((cell, colIndex) => (
                                      <td key={colIndex} className="p-2">
                                        <Input
                                          value={cell}
                                          onChange={(e) =>
                                            updateCell(
                                              rowIndex,
                                              colIndex,
                                              e.target.value
                                            )
                                          }
                                          placeholder="Value"
                                          className="h-8 text-xs"
                                        />
                                      </td>
                                    ))}
                                    <td className="p-2">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-destructive hover:text-destructive"
                                        onClick={() => removeRow(rowIndex)}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </td>
                                  </tr>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                            <tr>
                              <td className="p-2"></td>
                              <td
                                colSpan={sizeData.headers.length + 1}
                                className="p-2"
                              >
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-full text-xs text-muted-foreground hover:text-foreground"
                                  onClick={addRow}
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add Row
                                </Button>
                              </td>
                              <td className="p-2"></td>
                            </tr>
                          </tbody>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </table>
                </div>
              ) : (
                <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
                  <p className="text-sm">No size information added yet</p>
                  <p className="text-xs mt-1">
                    Click the plus icon to start building your size table
                  </p>
                  <div className="flex gap-2 justify-center mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addColumn}
                      disabled={sizeData.headers.length >= 7}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Size
                    </Button>
                    {/*<Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addRow}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Row
                    </Button>*/}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Additional Specifications</CardTitle>
                  <CardDescription>
                    Add custom specifications with bilingual labels and values.
                    Drag to reorder.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={specLanguage === "en" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSpecLanguage("en")}
                    className="h-8 px-3"
                  >
                    EN
                  </Button>
                  <Button
                    type="button"
                    variant={specLanguage === "id" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSpecLanguage("id")}
                    className="h-8 px-3"
                  >
                    ID
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {specifications.length > 0 ? (
                <div className="space-y-3">
                  {/* Header Row */}
                  <div className="grid grid-cols-[40px_1fr_1fr_40px] gap-3 pb-2 border-b">
                    <div></div>
                    <Label className="text-xs font-medium text-muted-foreground">
                      Label
                    </Label>
                    <Label className="text-xs font-medium text-muted-foreground">
                      Value
                    </Label>
                    <div></div>
                  </div>

                  {/* Specification Rows with Drag and Drop */}
                  <DragDropContext onDragEnd={handleSpecificationDragEnd}>
                    <Droppable droppableId="specifications">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-2"
                        >
                          {specifications.map((spec, index) => (
                            <Draggable
                              key={`spec-${index}`}
                              draggableId={`spec-${index}`}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`grid grid-cols-[40px_1fr_1fr_40px] gap-3 items-center ${
                                    snapshot.isDragging
                                      ? "bg-muted rounded-md"
                                      : ""
                                  }`}
                                >
                                  <div
                                    {...provided.dragHandleProps}
                                    className="flex items-center justify-center cursor-grab active:cursor-grabbing"
                                  >
                                    <GripVertical className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                  <Input
                                    value={spec.label[specLanguage]}
                                    onChange={(e) =>
                                      updateSpecificationLabel(
                                        index,
                                        specLanguage,
                                        e.target.value
                                      )
                                    }
                                    placeholder={
                                      specLanguage === "en"
                                        ? "e.g., Coating Type"
                                        : "e.g., Jenis Lapisan"
                                    }
                                    className="h-9 text-sm"
                                  />
                                  <Input
                                    value={spec.value}
                                    onChange={(e) =>
                                      updateSpecificationValue(
                                        index,
                                        e.target.value
                                      )
                                    }
                                    placeholder="e.g., Galvalume AZ150"
                                    className="h-9 text-sm"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-destructive hover:text-destructive"
                                    onClick={() => removeSpecification(index)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={addSpecification}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Specification
                  </Button>
                </div>
              ) : (
                <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
                  <p className="text-sm">No specifications added yet</p>
                  <p className="text-xs mt-1">
                    Click the button below to add custom specifications
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={addSpecification}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Specification
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Premium Descriptions - Side by Side (only show if is_premium) */}
          {isPremium && (
            <Card>
              <CardHeader>
                <CardTitle>Premium Descriptions</CardTitle>
                <CardDescription>
                  Detailed descriptions in multiple languages (side-by-side)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  {/* English Description */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="description_en"
                      className="text-base font-semibold"
                    >
                      English
                    </Label>
                    <Textarea
                      id="description_en"
                      {...register("description_en")}
                      placeholder="Enter English description"
                      rows={8}
                      className="resize-none"
                    />
                  </div>

                  {/* Indonesian Description */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="description_id"
                      className="text-base font-semibold"
                    >
                      Indonesian
                    </Label>
                    <Textarea
                      id="description_id"
                      {...register("description_id")}
                      placeholder="Masukkan deskripsi bahasa Indonesia"
                      rows={8}
                      className="resize-none"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Premium Materials - Side by Side (only show if is_premium) */}
          {isPremium && (
            <Card>
              <CardHeader>
                <CardTitle>Premium Materials</CardTitle>
                <CardDescription>
                  Material information in multiple languages (side-by-side)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  {/* English Materials */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="premium_materials_en"
                      className="text-base font-semibold"
                    >
                      English
                    </Label>
                    <Textarea
                      id="premium_materials_en"
                      {...register("premium_materials_en")}
                      placeholder="Enter English materials information"
                      rows={6}
                      className="resize-none"
                    />
                  </div>

                  {/* Indonesian Materials */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="premium_materials_id"
                      className="text-base font-semibold"
                    >
                      Indonesian
                    </Label>
                    <Textarea
                      id="premium_materials_id"
                      {...register("premium_materials_id")}
                      placeholder="Masukkan informasi material bahasa Indonesia"
                      rows={6}
                      className="resize-none"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pb-8 sticky bottom-0 bg-background py-4 border-t">
            <Button type="button" variant="outline" onClick={handleBackClick}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? "Saving..."
                : isEditMode
                ? "Update Profile"
                : "Create Profile"}
            </Button>
          </div>
        </form>
      </div>

      {/* Image Selectors */}
      <ImageSelectorDialog
        open={showProfileImageSelector}
        onOpenChange={setShowProfileImageSelector}
        onSelect={(url) => setValue("profile_image_url", url)}
        title="Select Profile Image"
        multipleSelection={false}
        multiple={false}
        initialSelection={profileImage}
      />

      <ImageSelectorDialog
        open={showBannerSelector}
        onOpenChange={setShowBannerSelector}
        onSelect={(url) => setValue("profile_banner_url", url)}
        title="Select Profile Banner"
        multipleSelection={false}
        multiple={false}
        initialSelection={bannerImage}
      />

      <ImageSelectorDialog
        open={showPremiumImageSelector}
        onOpenChange={setShowPremiumImageSelector}
        onSelect={(url) => setValue("premium_image_url", url)}
        title="Select Premium Brand Image"
        multipleSelection={false}
        multiple={false}
        initialSelection={premiumImage}
      />

      <ImageSelectorDialog
        open={showContentImageSelector}
        onOpenChange={setShowContentImageSelector}
        onSelect={(url) => setValue("content_image_url", url)}
        title="Select Content Image"
        multipleSelection={false}
        multiple={false}
        initialSelection={contentImage}
      />

      <ImageSelectorDialog
        open={showMainImageSelector}
        onOpenChange={setShowMainImageSelector}
        onSelect={(url) => setValue("profile_main_image_url", url)}
        title="Select Profile Main Image"
        multipleSelection={false}
        multiple={false}
        initialSelection={profileMainImage}
      />
    </DashboardLayout>
  );
};

export default ProfileFormPage;
