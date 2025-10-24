import { useState, useEffect } from "react";
import { Control, UseFormWatch, UseFormSetValue } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Crown, Trash, Loader2 } from "lucide-react";
import { ProfileFormData, PremiumFormData } from "../types";

interface PremiumTabProps {
  control: Control<ProfileFormData>;
  watch: UseFormWatch<ProfileFormData>;
  setValue: UseFormSetValue<ProfileFormData>;
  onSelectPremiumImage: () => void;
  onSelectContentImage: () => void;
}

export default function PremiumTab({
  control,
  watch,
  setValue,
  onSelectPremiumImage,
  onSelectContentImage,
}: PremiumTabProps) {
  const isPremium = watch("is_premium");
  const descriptionId = watch("description_id");
  const descriptionEn = watch("description_en");
  const [isDescriptionIdLoaded, setIsDescriptionIdLoaded] = useState(false);
  const [isDescriptionEnLoaded, setIsDescriptionEnLoaded] = useState(false);
  const materialName = watch("material_name");
  const sizePerPanel = watch("size_per_panel");
  const effectiveSize = watch("effective_size");
  const rengDistance = watch("reng_distance");
  const contentImageUrl = watch("content_image_url");

  // Wait for content to load before rendering editors
  useEffect(() => {
    if (descriptionId !== undefined) {
      setIsDescriptionIdLoaded(true);
    }
  }, [descriptionId]);

  useEffect(() => {
    if (descriptionEn !== undefined) {
      setIsDescriptionEnLoaded(true);
    }
  }, [descriptionEn]);

  return (
    <div className="max-h-[520px] overflow-y-auto px-2">
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-amber-100 py-2 px-3 border border-amber-500 rounded-md">
          <div className="">
            <Label className="text-base font-medium flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Premium Specifications
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Add premium technical details for this profile
            </p>
          </div>
          <FormField
            control={control}
            name="is_premium"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_premium"
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor="is_premium" className="cursor-pointer">
                      Enable Premium
                    </Label>
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {isPremium ? (
          <div className="space-y-4 pt-4">
            {/* Premium Material Information */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={control}
                name="premium_materials"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Materials (Full Name)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Zinc Aluminum Alloy, Steel"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Full material description for premium profile
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="material_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material (Short Name)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., ZA, Steel"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Short material name for premium profile
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Premium Size Information */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={control}
                name="size_per_panel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size Per Panel</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 1000x2000mm"
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
                        placeholder="e.g., 980x1980mm"
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
                name="reng_distance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reng Distance</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 60cm"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Premium Image */}
            <FormField
              control={control}
              name="premium_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Premium Brand Image</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Premium image URL"
                          {...field}
                          value={field.value || ""}
                          readOnly
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={onSelectPremiumImage}
                        >
                          Select
                        </Button>
                      </div>
                      {field.value && (
                        <div className="relative w-full h-32 border rounded-md overflow-hidden">
                          <img
                            src={field.value}
                            alt="Premium brand"
                            className="w-full h-full object-contain bg-muted"
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => field.onChange("")}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Brand image for premium profile
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content Image */}
            <FormField
              control={control}
              name="content_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content Image</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Content image URL"
                          {...field}
                          value={field.value || ""}
                          readOnly
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={onSelectContentImage}
                        >
                          Select
                        </Button>
                      </div>
                      {field.value && (
                        <div className="relative w-full h-32 border rounded-md overflow-hidden">
                          <img
                            src={field.value}
                            alt="Premium content"
                            className="w-full h-full object-contain bg-muted"
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => field.onChange("")}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Content image for premium profile
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Premium Descriptions */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Description</Label>
              <p className="text-sm text-muted-foreground">
                Detailed description of this premium profile in multiple
                languages
              </p>
              <Tabs defaultValue="en" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="id">Bahasa Indonesia</TabsTrigger>
                </TabsList>
                <TabsContent value="id" className="mt-4">
                  <FormField
                    control={control}
                    name="description_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          {isDescriptionIdLoaded ? (
                            <RichTextEditor
                              value={field.value || ""}
                              onChange={field.onChange}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-[300px] border rounded-lg">
                              <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                <TabsContent value="en" className="mt-4">
                  <FormField
                    control={control}
                    name="description_en"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          {isDescriptionEnLoaded ? (
                            <RichTextEditor
                              value={field.value || ""}
                              onChange={field.onChange}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-[300px] border rounded-lg">
                              <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-8 text-center">
            <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Premium mode is disabled for this profile
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Enable premium mode to add special technical specifications
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
