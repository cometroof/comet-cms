import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Save,
  Loader2,
  Twitter,
  Instagram,
  Facebook,
  Youtube,
  ImagePlus,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import type { SocialMedia } from "@/types/contacts-location";
import * as contactsLocationService from "@/services/contacts-location.service";
import { TelegramIcon } from "@/components/icons/TelegramIcon";
import ImageSelectorDialog from "@/components/ImageSelectorDialog";

interface SocialMediaTabProps {
  initialSocialMedia: SocialMedia;
}

export const SocialMediaTab = ({ initialSocialMedia }: SocialMediaTabProps) => {
  const [socialMedia, setSocialMedia] =
    useState<SocialMedia>(initialSocialMedia);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedSocialMediaType, setSelectedSocialMediaType] = useState<
    "twitter" | "instagram" | "facebook" | "youtube" | "telegram" | null
  >(null);

  const updateSocialMediaMutation = useMutation({
    mutationFn: (data: SocialMedia) =>
      contactsLocationService.updateSocialMedia(data),
    onSuccess: () => {
      toast.success("Social media information saved successfully");
    },
    onError: (error) => {
      console.error("Error saving social media:", error);
      toast.error("Failed to save social media information");
    },
  });

  const handleSaveSocialMedia = () => {
    updateSocialMediaMutation.mutate(socialMedia);
  };

  const handleImageSelect = (imageUrl: string) => {
    if (selectedSocialMediaType) {
      setSocialMedia({
        ...socialMedia,
        [selectedSocialMediaType]: {
          ...socialMedia[selectedSocialMediaType],
          image: imageUrl,
        },
      });
      setImageDialogOpen(false);
      setSelectedSocialMediaType(null);
    }
  };

  const openImageDialog = (
    type: "twitter" | "instagram" | "facebook" | "youtube" | "telegram",
  ) => {
    setSelectedSocialMediaType(type);
    setImageDialogOpen(true);
  };

  const socialMediaItems = [
    {
      type: "twitter" as const,
      label: "Twitter",
      icon: Twitter,
      placeholder: "https://twitter.com/yourprofile",
      color: "text-[#1DA1F2]",
    },
    {
      type: "instagram" as const,
      label: "Instagram",
      icon: Instagram,
      placeholder: "https://instagram.com/yourprofile",
      color: "text-[#E4405F]",
    },
    {
      type: "facebook" as const,
      label: "Facebook",
      icon: Facebook,
      placeholder: "https://facebook.com/yourpage",
      color: "text-[#1877F2]",
    },
    {
      type: "youtube" as const,
      label: "YouTube",
      icon: Youtube,
      placeholder: "https://youtube.com/@yourchannel",
      color: "text-[#FF0000]",
    },
    {
      type: "telegram" as const,
      label: "Telegram",
      icon: TelegramIcon,
      placeholder: "https://t.me/yourgroup",
      color: "text-[#0088cc]",
    },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Social Media</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {socialMediaItems.map((item) => {
              const Icon = item.icon;
              const imageUrl = socialMedia[item.type]?.image || "";

              return (
                <div
                  key={item.type}
                  className="p-4 border rounded-lg bg-muted/30 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-6 h-6 ${item.color}`} />
                    <Label className="text-base font-semibold">
                      {item.label}
                    </Label>
                  </div>

                  {/* Image and URL in one row */}
                  <div className="flex gap-4">
                    {/* Image section */}
                    <div className="flex-shrink-0">
                      <Label className="text-sm mb-2 block">Image</Label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => openImageDialog(item.type)}
                          className="w-24 h-24 border-2 border-dashed rounded-lg hover:border-primary transition-colors flex items-center justify-center overflow-hidden bg-background group"
                        >
                          {imageUrl ? (
                            <>
                              <img
                                src={imageUrl}
                                alt={`${item.label} icon`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "/placeholder.svg";
                                }}
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ImagePlus className="w-6 h-6 text-white" />
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-muted-foreground">
                              <ImagePlus className="w-6 h-6" />
                              <span className="text-xs">Add</span>
                            </div>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* URL section */}
                    <div className="flex-1 space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor={`${item.type}_value`}>URL</Label>
                        <Input
                          id={`${item.type}_value`}
                          type="url"
                          placeholder={item.placeholder}
                          value={socialMedia[item.type]?.value || ""}
                          onChange={(e) =>
                            setSocialMedia({
                              ...socialMedia,
                              [item.type]: {
                                ...socialMedia[item.type],
                                value: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      {/*{imageUrl && (
                        <div className="space-y-2">
                          <Label
                            htmlFor={`${item.type}_image_url`}
                            className="text-xs text-muted-foreground"
                          >
                            Image URL
                          </Label>
                          <Input
                            id={`${item.type}_image_url`}
                            type="url"
                            placeholder="Image URL"
                            value={imageUrl}
                            readOnly
                            onChange={(e) =>
                              setSocialMedia({
                                ...socialMedia,
                                [item.type]: {
                                  ...socialMedia[item.type],
                                  image: e.target.value,
                                },
                              })
                            }
                            className="text-xs"
                          />
                        </div>
                      )}*/}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSaveSocialMedia}
              disabled={updateSocialMediaMutation.isPending}
            >
              {updateSocialMediaMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Image Selector Dialog */}
      <ImageSelectorDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        onSelect={handleImageSelect}
        title={`Select ${selectedSocialMediaType ? socialMediaItems.find((i) => i.type === selectedSocialMediaType)?.label : ""} Image`}
        multiple={true}
        multipleSelection={false}
        initialSelection={
          selectedSocialMediaType
            ? socialMedia[selectedSocialMediaType]?.image || ""
            : ""
        }
      />
    </>
  );
};
