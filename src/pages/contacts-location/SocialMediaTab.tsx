import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Loader2, ImagePlus, Plus, Trash } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SocialMedia, SocialMediaEntry } from "@/types/contacts-location";
import * as contactsLocationService from "@/services/contacts-location.service";
import ImageSelectorDialog from "@/components/ImageSelectorDialog";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { GripVertical } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SocialMediaTabProps {
  initialSocialMedia?: SocialMedia;
}

// Helper untuk parse value dari database
const parseValueFromDB = (value: string): { value: string; image: string } => {
  try {
    const parsed = JSON.parse(value);
    // parsed.value adalah link, parsed.image adalah icon
    return {
      value: parsed.value || "",
      image: parsed.image || "",
    };
  } catch {
    // Fallback jika bukan JSON atau parsing gagal
    return { value: value || "", image: "" };
  }
};

// Tidak perlu helper serialize lagi karena service yang handle

export const SocialMediaTab = ({ initialSocialMedia }: SocialMediaTabProps) => {
  const [socialList, setSocialList] = useState<SocialMediaEntry[]>([]);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedSocialMediaIndex, setSelectedSocialMediaIndex] = useState<
    number | null
  >(null);
  const [loading, setLoading] = useState("");

  const queryClient = useQueryClient();

  const {
    data: socialMediaListData,
    isLoading: isSocialListLoading,
    isError: isSocialListError,
  } = useQuery({
    queryKey: ["socialMediaList"],
    queryFn: () => contactsLocationService.getSocialMediaList(),
  });

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

  const updateSocialMediaListMutation = useMutation({
    mutationFn: (list: SocialMediaEntry[]) =>
      contactsLocationService.updateSocialMediaList(list),
    onSuccess: () => {
      toast.success("Social media list saved successfully");
      queryClient.invalidateQueries({ queryKey: ["socialMediaList"] });
    },
    onError: (error) => {
      console.error("Error saving social media list:", error);
      toast.error("Failed to save social media list");
    },
  });

  const handleSaveSocialMedia = () => {
    // Kirim data mentah, biarkan service yang serialize
    const dataToSave = socialList.map((s, idx) => ({
      id: s.id,
      type: s.type,
      value: s.value || "", // Link mentah (service akan serialize)
      image: s.image || "", // Image mentah (service akan serialize)
      data_type: s.type,
      order: idx, // Number, bukan string
      is_social_media: true,
    }));

    // console.log("Data to save:", dataToSave); // Debug
    updateSocialMediaListMutation.mutate(dataToSave as any);
  };

  useEffect(() => {
    if (socialMediaListData && socialMediaListData.length > 0) {
      // Parse value dari JSON string
      // console.log({ socialMediaListData });
      const parsedList = socialMediaListData
        .sort((a, b) => {
          // Handle order sebagai string atau number
          const orderA =
            typeof a.order === "string" ? parseInt(a.order) : a.order || 0;
          const orderB =
            typeof b.order === "string" ? parseInt(b.order) : b.order || 0;
          return orderA - orderB;
        })
        .map((item) => {
          const parsed = parseValueFromDB(item.value);
          return {
            id: item.id,
            type: item.type,
            value: parsed.value, // Link yang sudah di-parse
            image: parsed.image || item.image, // Icon yang sudah di-parse
            order:
              typeof item.order === "string"
                ? parseInt(item.order)
                : item.order || 0,
            is_social_media: true,
          };
        });
      setSocialList(parsedList);
      return;
    }

    // Fallback ke legacy prop jika ada
    if (initialSocialMedia) {
      const keys = [
        "twitter",
        "instagram",
        "facebook",
        "youtube",
        "telegram",
      ] as const;
      const src = initialSocialMedia as unknown as Record<
        string,
        { value?: string; image?: string }
      >;
      const derived: SocialMediaEntry[] = keys.map((k, idx) => ({
        type: k,
        value: src[k]?.value || "",
        image: src[k]?.image || "",
        order: idx,
        is_social_media: true,
      }));
      setSocialList(derived);
    }
  }, [initialSocialMedia, socialMediaListData]);

  const handleImageSelect = (imageUrl: string) => {
    if (selectedSocialMediaIndex === null) return;
    setSocialList((prev) => {
      const next = [...prev];
      next[selectedSocialMediaIndex] = {
        ...next[selectedSocialMediaIndex],
        image: imageUrl,
      };
      return next;
    });
    setImageDialogOpen(false);
    setSelectedSocialMediaIndex(null);
  };

  const openImageDialogForIndex = (index: number) => {
    setSelectedSocialMediaIndex(index);
    setImageDialogOpen(true);
  };

  const addItem = () => {
    setSocialList((prev) => [
      ...prev,
      {
        id: undefined,
        type: "",
        value: "",
        image: "",
        order: prev.length,
        is_social_media: true,
      },
    ]);
  };

  const removeItem = async (index: number) => {
    setLoading(`delete-${index}`);
    const res = await contactsLocationService.deleteSocialMedia(
      socialList.find((_i, n) => n === index).id
    );
    if (res) {
      setSocialList((prev) => prev.filter((_, i) => i !== index));
      toast.success("Success delete Social Media item");
    } else {
      toast.error("Failed to delete");
    }
    setLoading("");
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    if (sourceIndex === destinationIndex) return;
    const updated = [...socialList];
    const [removed] = updated.splice(sourceIndex, 1);
    updated.splice(destinationIndex, 0, removed);
    const reordered = updated.map((s, idx) => ({ ...s, order: idx }));
    setSocialList(reordered);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle>Social Media</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="social-media-list">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-3"
                >
                  {socialList.length === 0 && (
                    <div className="text-center text-muted-foreground py-6">
                      No social media entries
                    </div>
                  )}
                  {socialList.map((item, index) => {
                    const stableKey = item.id || `temp-${index}`;
                    const draggableId = item.id
                      ? String(item.id)
                      : `temp-${index}`;

                    return (
                      <Draggable
                        key={stableKey}
                        draggableId={draggableId}
                        index={index}
                      >
                        {(prov, snapshot) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            className={`p-4 border rounded-lg bg-muted/30 flex items-center gap-4 ${
                              snapshot.isDragging ? "opacity-50" : ""
                            }`}
                          >
                            <div
                              {...prov.dragHandleProps}
                              className="w-8 cursor-grab"
                            >
                              <GripVertical className="h-5 w-5 text-muted-foreground" />
                            </div>

                            <div className="w-24 h-24 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => openImageDialogForIndex(index)}
                                className="w-24 h-24 border-2 border-dashed rounded-lg hover:border-primary transition-colors flex items-center justify-center overflow-hidden bg-background group"
                              >
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.type}
                                    className="w-full h-full object-cover"
                                    onError={(e) =>
                                      ((e.target as HTMLImageElement).src =
                                        "/placeholder.svg")
                                    }
                                  />
                                ) : (
                                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                    <ImagePlus className="w-6 h-6" />
                                    <span className="text-xs">Add</span>
                                  </div>
                                )}
                              </button>
                            </div>

                            <div className="flex-1 grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm">Type</Label>
                                <Input
                                  value={item.type}
                                  onChange={(e) =>
                                    setSocialList((prev) => {
                                      const next = [...prev];
                                      next[index] = {
                                        ...next[index],
                                        type: e.target.value,
                                      };
                                      return next;
                                    })
                                  }
                                  placeholder="e.g., Instagram, Twitter"
                                />
                              </div>
                              <div>
                                <Label className="text-sm">URL</Label>
                                <Input
                                  value={item.value}
                                  onChange={(e) =>
                                    setSocialList((prev) => {
                                      const next = [...prev];
                                      next[index] = {
                                        ...next[index],
                                        value: e.target.value,
                                      };
                                      return next;
                                    })
                                  }
                                  placeholder="https://..."
                                />
                              </div>
                            </div>

                            <div className="flex gap-2 ml-2">
                              <AlertDialog>
                                <AlertDialogTrigger>
                                  <Button variant="ghost" size="icon">
                                    <Trash className="size-4 text-primary" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Konfirmasi Hapus
                                    </AlertDialogTitle>
                                  </AlertDialogHeader>
                                  <div>
                                    Ingin menghapus item Sosial Media &quot;
                                    {item.type}&quot; ?
                                  </div>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel asChild>
                                      <Button variant="ghost">Cancel</Button>
                                    </AlertDialogCancel>
                                    <AlertDialogAction asChild>
                                      <Button
                                        variant="destructive"
                                        onClick={() => removeItem(index)}
                                      >
                                        Delete
                                      </Button>
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}

                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <div className="flex justify-end pt-16 gap-4">
            <Button variant="secondary" onClick={addItem} className="gap-2">
              <Plus className="size-4 mr-2" />
              Add Social
            </Button>
            <Button
              onClick={handleSaveSocialMedia}
              disabled={
                updateSocialMediaListMutation.isPending ||
                updateSocialMediaMutation.isPending
              }
            >
              {updateSocialMediaListMutation.isPending ||
              updateSocialMediaMutation.isPending ? (
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

      <ImageSelectorDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        onSelect={handleImageSelect}
        title={`Select Image`}
        multiple={true}
        multipleSelection={false}
        initialSelection={
          selectedSocialMediaIndex !== null
            ? socialList[selectedSocialMediaIndex]?.image || ""
            : ""
        }
      />
    </>
  );
};
