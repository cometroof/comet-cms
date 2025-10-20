import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link as LinkIcon, Trash2, Loader2 } from "lucide-react";
import {
  LibraryImage,
  getR2Images,
  uploadToR2,
  deleteFromR2,
  uploadMultipleParallelToR2,
} from "@/lib/r2-actions";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type ImageSelectorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (imageUrl: string) => void;
  title?: string;
};

const ImageSelectorDialog = ({
  open,
  onOpenChange,
  onSelect,
  title = "Select Image",
}: ImageSelectorDialogProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // Mock image library
  const mockImages = [
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
  ];

  // Query for fetching R2 images
  const {
    data: libraryImages = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["r2Images"],
    queryFn: getR2Images,
    enabled: open, // Only fetch when dialog is open
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutation for uploading an image
  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => uploadToR2(formData),
    onSuccess: (uploadedImage) => {
      // Update the cache with the new image
      queryClient.setQueryData(["r2Images"], (oldData: LibraryImage[] = []) => [
        uploadedImage,
        ...oldData,
      ]);

      // Select the uploaded image
      onSelect(uploadedImage.url);

      // Reset form
      resetForm();

      toast({
        title: "Image uploaded",
        description: "Image was successfully uploaded and selected",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting an image
  const deleteMutation = useMutation({
    mutationFn: (key: string) => deleteFromR2(key),
    onSuccess: (result, key) => {
      if (result.success) {
        // Update the cache by removing the deleted image
        queryClient.setQueryData(["r2Images"], (oldData: LibraryImage[] = []) =>
          oldData.filter((image) => image.Key !== key),
        );

        toast({
          title: "Image deleted",
          description: "Image was successfully deleted",
        });
      } else {
        throw new Error(result.message);
      }
    },
    onError: (error) => {
      toast({
        title: "Deletion failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "File size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    uploadMutation.mutate(formData);
  };

  const handleUrlSubmit = () => {
    if (imageUrl) {
      onSelect(imageUrl);
      resetForm();
    }
  };

  const handleLibrarySelect = (url: string) => {
    onSelect(url);
    resetForm();
    onOpenChange(false);
  };

  const handleDelete = (image: LibraryImage) => {
    if (!image.Key) return;
    deleteMutation.mutate(image.Key);
  };

  const resetForm = () => {
    setImageUrl("");
    setSelectedFile(null);
    setPreviewUrl("");
  };

  const isUploading = uploadMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Upload a new image, paste a URL, or select from the library
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
            <TabsTrigger value="library">Library</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Choose Image</Label>
              <Input
                id="file"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
              <p className="text-xs text-muted-foreground">
                Max file size: 5MB
              </p>
            </div>

            {previewUrl && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded border"
                />
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload & Select
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Image URL</Label>
              <Input
                id="url"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {imageUrl && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleUrlSubmit} disabled={!imageUrl}>
                <LinkIcon className="w-4 h-4 mr-2" />
                Use This URL
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="library" className="space-y-4">
            {isLoading ? (
              <div className="py-4 flex justify-center items-center">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Loading images...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* R2 Images Section */}
                {libraryImages.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Cloud Images</h3>
                    <div className="grid grid-cols-3 gap-4 max-h-48 overflow-y-auto">
                      {libraryImages
                        .filter((item) => item.size > 0)
                        .map((image) => {
                          return (
                            <div key={image.id} className="group relative">
                              <button
                                onClick={() => handleLibrarySelect(image.url)}
                                className="w-full relative group overflow-hidden rounded-lg border-2 border-transparent hover:border-primary transition-all"
                              >
                                <img
                                  src={image.url}
                                  alt={image.name}
                                  className="w-full h-32 object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      "/placeholder.svg";
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <span className="text-white text-sm font-medium">
                                    Select
                                  </span>
                                </div>
                              </button>
                              <Button
                                size="icon"
                                variant="destructive"
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(image);
                                }}
                                disabled={isDeleting}
                              >
                                {deleteMutation.isPending &&
                                deleteMutation.variables === image.Key ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                              <p className="text-xs mt-1 truncate">
                                {image.name}
                              </p>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Mock Images Section */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Placeholder Images</h3>
                  <div className="grid grid-cols-3 gap-4 max-h-48 overflow-y-auto">
                    {mockImages.map((url, index) => (
                      <button
                        key={`mock-${index}`}
                        onClick={() => handleLibrarySelect(url)}
                        className="relative group overflow-hidden rounded-lg border-2 border-transparent hover:border-primary transition-all"
                      >
                        <img
                          src={url}
                          alt={`Placeholder ${index + 1}`}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            Select
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                "Refresh Library"
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ImageSelectorDialog;
