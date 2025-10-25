import { useState } from "react";
import { Control, UseFormWatch, UseFormSetValue } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, X } from "lucide-react";
import { ProfileFormData } from "../types";
import ImageSelectorDialog from "@/components/ImageSelectorDialog";

interface GeneralTabProps {
  control: Control<ProfileFormData>;
  watch: UseFormWatch<ProfileFormData>;
  setValue: UseFormSetValue<ProfileFormData>;
}

export default function GeneralTab({
  control,
  watch,
  setValue,
}: GeneralTabProps) {
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [showBannerSelector, setShowBannerSelector] = useState(false);
  const [imageType, setImageType] = useState<"image" | "banner">("image");

  const profileImageUrl = watch("profile_image_url");
  const profileBannerUrl = watch("profile_banner_url");

  const handleImageSelect = (url: string) => {
    if (imageType === "image") {
      setValue("profile_image_url", url);
    } else {
      setValue("profile_banner_url", url);
    }
  };

  const handleRemoveImage = (type: "image" | "banner") => {
    if (type === "image") {
      setValue("profile_image_url", "");
    } else {
      setValue("profile_banner_url", "");
    }
  };
  return (
    <div className="max-h-[520px] overflow-y-auto space-y-4">
      <FormField
        control={control}
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
          control={control}
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
          control={control}
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
          control={control}
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
          control={control}
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
          control={control}
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

      {/* Profile Image */}
      <FormField
        control={control}
        name="profile_image_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Profile Image</FormLabel>
            <FormControl>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Image URL"
                    {...field}
                    value={field.value || ""}
                    readOnly
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setImageType("image");
                      setShowImageSelector(true);
                    }}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Select
                  </Button>
                </div>
                {profileImageUrl && (
                  <div className="relative w-full h-40 border rounded-md overflow-hidden">
                    <img
                      src={profileImageUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => handleRemoveImage("image")}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Profile Banner */}
      <FormField
        control={control}
        name="profile_banner_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Profile Banner</FormLabel>
            <FormControl>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Banner URL"
                    {...field}
                    value={field.value || ""}
                    readOnly
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setImageType("banner");
                      setShowBannerSelector(true);
                    }}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Select
                  </Button>
                </div>
                {profileBannerUrl && (
                  <div className="relative w-full h-40 border rounded-md overflow-hidden">
                    <img
                      src={profileBannerUrl}
                      alt="Banner"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => handleRemoveImage("banner")}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Image Selector Dialog */}
      <ImageSelectorDialog
        open={showImageSelector}
        onOpenChange={setShowImageSelector}
        onSelect={handleImageSelect}
        title="Select Profile Image"
        multipleSelection={false}
      />

      {/* Banner Selector Dialog */}
      <ImageSelectorDialog
        open={showBannerSelector}
        onOpenChange={setShowBannerSelector}
        onSelect={handleImageSelect}
        title="Select Profile Banner"
        multipleSelection={false}
      />
    </div>
  );
}
