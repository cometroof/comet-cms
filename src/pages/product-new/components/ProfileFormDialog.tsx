import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ProductProfile } from "@/pages/product/types";
import ImageSelectorDialog from "@/components/ImageSelectorDialog";
import { ImageIcon, X } from "lucide-react";

interface ProfileFormDialogProps {
  productId: string;
  profile: ProductProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
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
}

const ProfileFormDialog = ({
  productId,
  profile,
  isOpen,
  onClose,
  onSuccess,
}: ProfileFormDialogProps) => {
  const [showProfileImageSelector, setShowProfileImageSelector] =
    useState(false);
  const [showBannerSelector, setShowBannerSelector] = useState(false);

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
    },
  });

  const profileImage = watch("profile_image_url");
  const bannerImage = watch("profile_banner_url");

  // Reset form when profile changes
  useEffect(() => {
    if (profile) {
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
      });
    } else {
      reset({
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
      });
    }
  }, [profile, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      if (profile) {
        // Update existing profile
        const { error } = await supabase
          .from("product_profile")
          .update({
            name: data.name,
            materials: data.materials,
            thickness: data.thickness,
            weight: data.weight,
            size_per_panel: data.size_per_panel,
            effective_size: data.effective_size,
            panel_amount: data.panel_amount,
            tkdn_value: data.tkdn_value,
            profile_image_url: data.profile_image_url || null,
            profile_banner_url: data.profile_banner_url || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", profile.id);

        if (error) throw error;
      } else {
        // Create new profile
        const { error } = await supabase.from("product_profile").insert({
          product_id: productId,
          name: data.name,
          materials: data.materials,
          thickness: data.thickness,
          weight: data.weight,
          size_per_panel: data.size_per_panel,
          effective_size: data.effective_size,
          panel_amount: data.panel_amount,
          tkdn_value: data.tkdn_value,
          profile_image_url: data.profile_image_url || null,
          profile_banner_url: data.profile_banner_url || null,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(
        profile
          ? "Profile updated successfully"
          : "Profile created successfully",
      );
      onSuccess();
    },
    onError: (error) => {
      toast.error(
        profile ? "Failed to update profile" : "Failed to create profile",
      );
      console.error(error);
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {profile ? "Edit Profile" : "Create New Profile"}
            </DialogTitle>
            <DialogDescription>
              {profile
                ? "Update the profile information below"
                : "Fill in the details to create a new profile"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            {/* Profile Image */}
            <div className="space-y-2">
              <Label>Profile Image</Label>
              <div className="flex gap-2">
                <Input
                  value={profileImage}
                  onChange={(e) =>
                    setValue("profile_image_url", e.target.value)
                  }
                  placeholder="Profile image URL"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowProfileImageSelector(true)}
                >
                  <ImageIcon className="w-4 h-4" />
                </Button>
              </div>
              {profileImage && (
                <div className="relative w-32 h-32 border rounded overflow-hidden group">
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full object-contain"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => setValue("profile_image_url", "")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Profile Banner */}
            <div className="space-y-2">
              <Label>Profile Banner</Label>
              <div className="flex gap-2">
                <Input
                  value={bannerImage}
                  onChange={(e) =>
                    setValue("profile_banner_url", e.target.value)
                  }
                  placeholder="Profile banner URL"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBannerSelector(true)}
                >
                  <ImageIcon className="w-4 h-4" />
                </Button>
              </div>
              {bannerImage && (
                <div className="relative w-full h-32 border rounded overflow-hidden group">
                  <img
                    src={bannerImage}
                    alt="Banner"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => setValue("profile_banner_url", "")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Materials */}
            <div className="space-y-2">
              <Label htmlFor="materials">Materials</Label>
              <Input
                id="materials"
                {...register("materials")}
                placeholder="e.g., Steel, Aluminum"
              />
            </div>

            {/* Thickness and Weight */}
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

            {/* Size Per Panel and Effective Size */}
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

            {/* Panel Amount and TKDN Value */}
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

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending
                  ? "Saving..."
                  : profile
                    ? "Update Profile"
                    : "Create Profile"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
    </>
  );
};

export default ProfileFormDialog;
