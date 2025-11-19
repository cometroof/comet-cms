import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
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
import {
  Upload,
  Link as LinkIcon,
  Trash2,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  LibraryImage,
  getR2Images,
  uploadToR2,
  deleteFromR2,
} from "@/lib/r2-actions";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

type ImageSelectorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (imageUrl: string) => void; // Changed from string | string[]
  // Called when user finishes selection (Done). Provides the final array of selected URLs.
  onDone?: (imageUrls: string[]) => void;
  title?: string;
  multiple?: boolean;
  multipleSelection?: boolean;
  initialSelection?: string | string[];
};

const ImageSelectorDialog = ({
  open,
  onOpenChange,
  onSelect,
  onDone,
  title = "Select Image",
  multiple = true,
  multipleSelection = true,
  initialSelection = "",
}: ImageSelectorDialogProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("upload");

  // Set initial selection when dialog opens
  useEffect(() => {
    if (open) {
      if (initialSelection) {
        if (typeof initialSelection === "string") {
          setSelectedUrls([initialSelection]);
        } else {
          setSelectedUrls([...initialSelection]);
        }
      } else {
        setSelectedUrls([]);
      }
    }
  }, [open, initialSelection]);

  // Query for fetching R2 images
  const {
    data: libraryImages = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["r2Images"],
    queryFn: getR2Images,
    enabled: open,
    staleTime: 1000 * 60 * 5,
  });

  // Mutation for uploading an image
  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => uploadToR2(formData),
    onSuccess: (uploadedImage, formData) => {
      // Update the cache with the new image
      queryClient.setQueryData(["r2Images"], (oldData: LibraryImage[] = []) => [
        uploadedImage,
        ...oldData,
      ]);

      // Get filename from FormData to remove from uploading list
      const file = formData.get("file") as File;
      if (file) {
        setUploadingFiles((prev) => prev.filter((name) => name !== file.name));
      }

      toast({
        title: "Image uploaded",
        description: "Image was successfully uploaded to library",
      });
    },
    onError: (error, formData) => {
      // Remove from uploading files list on error
      const file = formData.get("file") as File;
      if (file) {
        setUploadingFiles((prev) => prev.filter((name) => name !== file.name));
      }

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
        queryClient.setQueryData(["r2Images"], (oldData: LibraryImage[] = []) =>
          oldData.filter((image) => image.Key !== key)
        );

        const deletedImage = libraryImages.find((img) => img.Key === key);
        if (deletedImage && selectedUrls.includes(deletedImage.url)) {
          const newSelection = selectedUrls.filter(
            (url) => url !== deletedImage.url
          );
          setSelectedUrls(newSelection);
        }

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

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const validFiles = acceptedFiles.filter((file) => {
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name}: File size must be less than 5MB`,
            variant: "destructive",
          });
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      if (!multiple) {
        // Single file mode - replace existing file
        const file = validFiles[0];
        setSelectedFiles([file]);
        const url = URL.createObjectURL(file);
        setPreviewUrls([url]);

        if (validFiles.length > 1) {
          toast({
            title: "Single file mode",
            description: `Only the first image (${file.name}) will be uploaded`,
          });
        }
      } else {
        // Multiple files mode - add to existing files
        setSelectedFiles((prevFiles) => [...prevFiles, ...validFiles]);
        const urls = validFiles.map((file) => URL.createObjectURL(file));
        setPreviewUrls((prevUrls) => [...prevUrls, ...urls]);
      }
    },
    [toast, multiple]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp", ".svg"],
    },
    maxSize: 5 * 1024 * 1024,
    multiple: multiple,
  });

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    // Add all files to uploading list
    const fileNames = selectedFiles.map((f) => f.name);
    setUploadingFiles((prev) => [...prev, ...fileNames]);

    // Switch to Library tab to show upload progress
    setActiveTab("library");

    // Upload files sequentially
    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        await uploadMutation.mutateAsync(formData);
      } catch (error) {
        // Error already handled in onError callback
        console.error("Upload error:", error);
      }
    }

    // Reset form after all uploads complete
    resetForm(false);
  };

  const handleUrlSubmit = () => {
    if (imageUrl) {
      if (multipleSelection) {
        const newSelection = [...selectedUrls, imageUrl];
        setSelectedUrls(newSelection);
        onSelect(imageUrl); // Call onSelect with single URL
        setImageUrl("");
      } else {
        onSelect(imageUrl);
        onOpenChange(false);
      }
    }
  };

  const handleLibrarySelect = (url: string) => {
    if (multiple) {
      let newSelection: string[];

      if (selectedUrls.includes(url)) {
        newSelection = selectedUrls.filter((item) => item !== url);
      } else {
        newSelection = [...selectedUrls, url];
      }

      setSelectedUrls(newSelection);
      onSelect(url); // Call onSelect with single URL
    } else {
      onSelect(url);
      onOpenChange(false);
    }
  };

  const handleDelete = (image: LibraryImage) => {
    if (!image.Key) return;
    deleteMutation.mutate(image.Key);
  };

  const removeUploadPreview = (index: number) => {
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = (clearSelection = true) => {
    setImageUrl("");
    setSelectedFiles([]);
    setPreviewUrls([]);
    if (clearSelection) {
      setSelectedUrls([]);
    }
  };

  const isUploading = uploadMutation.isPending || uploadingFiles.length > 0;
  const isDeleting = deleteMutation.isPending;

  const handleComplete = () => {
    // Call onSelect for each selected URL when completing
    if (multipleSelection && selectedUrls.length > 0) {
      selectedUrls.forEach((url) => onSelect(url));
    }
    // notify parent with final selection array if provided
    if (onDone && typeof onDone === "function") {
      try {
        onDone(selectedUrls);
      } catch (e) {
        console.error("onDone callback error:", e);
      }
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {multipleSelection
              ? "Select multiple images by clicking on them. You can upload new images, use URLs, or choose from the library."
              : "Upload a new image, paste a URL, or select from the library"}
          </DialogDescription>
        </DialogHeader>

        {multipleSelection && selectedUrls.length > 0 && (
          <div className="bg-muted/30 p-2 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">
                Selected Images ({selectedUrls.length})
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUrls([])}
              >
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-1">
              {selectedUrls.map((url, index) => (
                <div
                  key={`selected-${index}`}
                  className="relative group h-16 w-16"
                >
                  <img
                    src={url}
                    alt={`Selected ${index + 1}`}
                    className="h-full w-full object-cover rounded-sm border border-border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-0 right-0 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      const newSelection = selectedUrls.filter(
                        (_, i) => i !== index
                      );
                      setSelectedUrls(newSelection);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
            <TabsTrigger value="library">
              Library
              {uploadingFiles.length > 0 && (
                <span className="ml-2 flex items-center">
                  <Loader2 className="w-3 h-3 animate-spin" />
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-2">
              <Label>Choose Image{multiple ? "s" : ""}</Label>
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-md p-6 cursor-pointer text-center transition-colors",
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50",
                  isUploading && "opacity-50 cursor-not-allowed"
                )}
              >
                <input {...getInputProps()} disabled={isUploading} />
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  {isDragActive ? (
                    <p>Drop the image{multiple ? "s" : ""} here...</p>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        Drag & drop or click to upload
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {multiple ? "Multiple images allowed. " : ""}Max file
                        size: 5MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {previewUrls.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>
                    Preview
                    {previewUrls.length > 1 ? `s (${previewUrls.length})` : ""}
                  </Label>
                  {previewUrls.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPreviewUrls([]);
                        setSelectedFiles([]);
                      }}
                    >
                      Clear All
                    </Button>
                  )}
                </div>
                <div
                  className={`grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto`}
                >
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-40 object-cover rounded border"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeUploadPreview(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <div className="flex gap-2 w-full justify-end">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={selectedFiles.length === 0 || isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload to Library
                    </>
                  )}
                </Button>
              </div>
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
                  className="w-full h-40 object-cover rounded border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
              </div>
            )}

            <DialogFooter>
              <div className="flex gap-2 w-full justify-end">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUrlSubmit} disabled={!imageUrl}>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  {multipleSelection ? "Add to Selection" : "Use This URL"}
                </Button>
                {multipleSelection && selectedUrls.length > 0 && (
                  <Button onClick={handleComplete}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Done ({selectedUrls.length})
                  </Button>
                )}
              </div>
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
                {libraryImages.length > 0 || uploadingFiles.length > 0 ? (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Cloud Images</h3>
                    <div className="grid grid-cols-4 gap-4 overflow-y-auto max-h-[400px] p-1">
                      {/* Show uploading files as loading placeholders */}
                      {uploadingFiles.map((fileName, index) => (
                        <div key={`uploading-${index}`} className="relative">
                          <div className="w-full h-32 bg-muted rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                Uploading...
                              </span>
                            </div>
                          </div>
                          <p className="text-xs mt-1 truncate text-muted-foreground">
                            {fileName}
                          </p>
                        </div>
                      ))}

                      {/* Show existing library images */}
                      {libraryImages
                        .filter((item) => item.size > 0)
                        .map((image) => {
                          const isSelected = selectedUrls.includes(image.url);
                          return (
                            <div key={image.id} className="group relative">
                              <button
                                type="button"
                                onClick={() => handleLibrarySelect(image.url)}
                                className={cn(
                                  "w-full relative group overflow-hidden rounded-lg border-2 transition-all",
                                  isSelected
                                    ? "border-primary"
                                    : "border-transparent hover:border-primary/50"
                                )}
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
                                <div
                                  className={cn(
                                    "absolute inset-0 bg-black/50 flex items-center justify-center",
                                    isSelected
                                      ? "opacity-100"
                                      : "opacity-0 group-hover:opacity-100",
                                    "transition-opacity"
                                  )}
                                >
                                  <span className="text-white text-sm font-medium flex items-center">
                                    {isSelected && (
                                      <CheckCircle2 className="w-4 h-4 mr-1 text-primary" />
                                    )}
                                    {isSelected ? "Selected" : "Select"}
                                  </span>
                                </div>
                              </button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="destructive"
                                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    disabled={isDeleting}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {deleteMutation.isPending &&
                                    deleteMutation.variables === image.Key ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <p className="text-sm">
                                    Are you sure you want to delete this image?
                                  </p>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction asChild>
                                      <Button
                                        variant="destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDelete(image);
                                        }}
                                        disabled={isDeleting}
                                      >
                                        {deleteMutation.isPending &&
                                        deleteMutation.variables ===
                                          image.Key ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          "Delete"
                                        )}
                                      </Button>
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              <p className="text-xs mt-1 truncate">
                                {image.name}
                              </p>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No images found in the library.
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <div className="flex gap-2 w-full justify-between">
                <Button
                  variant="outline"
                  className="flex-1"
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
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  {multipleSelection && selectedUrls.length > 0 && (
                    <Button onClick={handleComplete}>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Done ({selectedUrls.length})
                    </Button>
                  )}
                </div>
              </div>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ImageSelectorDialog;
