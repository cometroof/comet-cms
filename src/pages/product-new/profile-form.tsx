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
import { Checkbox } from "@/components/ui/checkbox";
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
import { ChevronLeft, X, ImageUp, Loader2, Plus, Trash2 } from "lucide-react";

interface SizeData {
  headers: string[];
  rows: string[][];
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

  // Size table state
  const [sizeData, setSizeData] = useState<SizeData>({
    headers: ["anchor"],
    rows: [],
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
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
  const premiumImage = watch("premium_image_url");
  const contentImage = watch("content_image_url");
  const isPremium = watch("is_premium");

  // Size table management functions
  const addColumn = () => {
    if (sizeData.headers.length >= 8) {
      // 1 anchor + 7 dynamic
      toast.error("Maximum 7 size columns allowed");
      return;
    }

    setSizeData((prev) => ({
      headers: [...prev.headers, `Size ${prev.headers.length}`],
      rows: prev.rows.map((row) => [...row, ""]),
    }));
  };

  const removeColumn = (index: number) => {
    if (index === 0) return; // Don't remove anchor column

    setSizeData((prev) => ({
      headers: prev.headers.filter((_, i) => i !== index),
      rows: prev.rows.map((row) => row.filter((_, i) => i !== index)),
    }));
  };

  const addRow = () => {
    setSizeData((prev) => ({
      ...prev,
      rows: [...prev.rows, Array(prev.headers.length).fill("")],
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

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    setSizeData((prev) => ({
      ...prev,
      rows: prev.rows.map((row, i) =>
        i === rowIndex
          ? row.map((cell, j) => (j === colIndex ? value : cell))
          : row,
      ),
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
    enabled: isEditMode,
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
        const sizeObj = profile.size as SizeData;
        if (sizeObj.headers && sizeObj.rows) {
          setSizeData(sizeObj);
        } else {
          setSizeData({ headers: ["anchor"], rows: [] });
        }
      } else {
        setSizeData({ headers: ["anchor"], rows: [] });
      }
    }
  }, [profile, reset]);

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
        profile_banner_url: data.profile_banner_url || null,
        size: sizeData,
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
      }
    },
    onSuccess: () => {
      toast.success(
        isEditMode
          ? "Profile updated successfully"
          : "Profile created successfully",
      );
      navigate(`/dashboard/product-new/${productId}`);
    },
    onError: (error) => {
      toast.error(
        isEditMode ? "Failed to update profile" : "Failed to create profile",
      );
      console.error(error);
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    saveMutation.mutate(data);
  };

  const handleBackClick = () => {
    navigate(`/dashboard/product-new/${productId}`);
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
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isEditMode ? "Edit Profile" : "Create New Profile"}
            </h1>
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
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Core profile details</CardDescription>
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
              <div className="flex items-center space-x-2">
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
              </div>
            </CardContent>
          </Card>

          {/* Media & Images */}
          <Card>
            <CardHeader>
              <CardTitle>Media & Images</CardTitle>
              <CardDescription>Profile images and visuals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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

                {/* Profile Banner */}
                <div className="space-y-2">
                  <Label>Profile Banner</Label>
                  <div
                    className="relative w-full aspect-square border rounded overflow-hidden group cursor-pointer"
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

          {/* Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
              <CardDescription>Technical specifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Materials */}
              <div className="space-y-2">
                <Label htmlFor="materials">Materials</Label>
                <Input
                  id="materials"
                  {...register("materials")}
                  placeholder="e.g., Steel, Aluminum"
                />
              </div>

              {/* Two columns layout */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="thickness">Thickness</Label>
                  <Input
                    id="thickness"
                    {...register("thickness")}
                    placeholder="e.g., 0.4mm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight</Label>
                  <Input
                    id="weight"
                    {...register("weight")}
                    placeholder="e.g., 5.5 kg/m²"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="size_per_panel">Size Per Panel</Label>
                  <Input
                    id="size_per_panel"
                    {...register("size_per_panel")}
                    placeholder="e.g., 1000mm x 6000mm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="effective_size">Effective Size</Label>
                  <Input
                    id="effective_size"
                    {...register("effective_size")}
                    placeholder="e.g., 960mm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="panel_amount">Panel Amount</Label>
                  <Input
                    id="panel_amount"
                    type="number"
                    {...register("panel_amount", { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tkdn_value">TKDN Value</Label>
                  <Input
                    id="tkdn_value"
                    {...register("tkdn_value")}
                    placeholder="e.g., 40%"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dynamic Size Information */}
          <Card>
            <CardHeader>
              <CardTitle>Size Information</CardTitle>
              <CardDescription>
                Dynamic size table with custom dimensions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sizeData.headers.length > 1 || sizeData.rows.length > 0 ? (
                <div className="border rounded-lg overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        {sizeData.headers.map((header, index) => (
                          <th key={index} className="p-2 text-left border-b">
                            <div className="flex items-center gap-2">
                              {index === 0 ? (
                                <span className="font-medium">Anchor</span>
                              ) : (
                                <>
                                  <Input
                                    value={header}
                                    onChange={(e) =>
                                      updateHeader(index, e.target.value)
                                    }
                                    placeholder={`Size ${index}`}
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
                                </>
                              )}
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
                            disabled={sizeData.headers.length >= 8}
                            title="Add Column"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sizeData.rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-b last:border-b-0">
                          {row.map((cell, colIndex) => (
                            <td key={colIndex} className="p-2">
                              <Input
                                value={cell}
                                onChange={(e) =>
                                  updateCell(rowIndex, colIndex, e.target.value)
                                }
                                placeholder={
                                  colIndex === 0 ? "Row key" : "Value"
                                }
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
                      ))}
                      <tr>
                        <td colSpan={sizeData.headers.length} className="p-2">
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
                      disabled={sizeData.headers.length >= 8}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Column
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addRow}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Row
                    </Button>
                  </div>
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
        initialSelection={profileImage}
      />

      <ImageSelectorDialog
        open={showBannerSelector}
        onOpenChange={setShowBannerSelector}
        onSelect={(url) => setValue("profile_banner_url", url)}
        title="Select Profile Banner"
        multipleSelection={false}
        initialSelection={bannerImage}
      />

      <ImageSelectorDialog
        open={showPremiumImageSelector}
        onOpenChange={setShowPremiumImageSelector}
        onSelect={(url) => setValue("premium_image_url", url)}
        title="Select Premium Brand Image"
        multipleSelection={false}
        initialSelection={premiumImage}
      />

      <ImageSelectorDialog
        open={showContentImageSelector}
        onOpenChange={setShowContentImageSelector}
        onSelect={(url) => setValue("content_image_url", url)}
        title="Select Content Image"
        multipleSelection={false}
        initialSelection={contentImage}
      />
    </DashboardLayout>
  );
};

export default ProfileFormPage;
