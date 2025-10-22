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
import {
  Upload,
  Link as LinkIcon,
  Trash2,
  Loader2,
  FileText,
  FileImage,
  FileAudio,
  FileVideo,
  File,
} from "lucide-react";
import {
  LibraryImage,
  getR2Files,
  uploadToR2 as uploadFileToR2,
  deleteFromR2,
} from "@/lib/r2-actions";

// Define the LibraryFile type with required properties
type LibraryFile = LibraryImage & {
  type?: string;
  extension?: string;
};
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type FileSelectorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (fileUrl: string) => void;
  title?: string;
  acceptedFileTypes?: string;
  maxFileSize?: number; // in MB
};

const FileSelectorDialog = ({
  open,
  onOpenChange,
  onSelect,
  title = "Select File",
  acceptedFileTypes = "*/*",
  maxFileSize = 10, // Default max file size: 10MB
}: FileSelectorDialogProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [fileUrl, setFileUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // Query for fetching R2 files
  const {
    data: libraryFiles = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["r2Files"],
    queryFn: getR2Files,
    enabled: open, // Only fetch when dialog is open
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutation for uploading a file
  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => uploadFileToR2(formData),
    onSuccess: (uploadedFile) => {
      // Update the cache with the new file
      queryClient.setQueryData(["r2Files"], (oldData: LibraryFile[] = []) => [
        uploadedFile,
        ...oldData,
      ]);

      // Select the uploaded file
      onSelect(uploadedFile.url);

      // Reset form
      resetForm();

      toast({
        title: "File uploaded",
        description: "File was successfully uploaded and selected",
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

  // Mutation for deleting a file
  const deleteMutation = useMutation({
    mutationFn: (key: string) => deleteFromR2(key),
    onSuccess: (result, key) => {
      if (result.success) {
        // Update the cache by removing the deleted file
        queryClient.setQueryData(["r2Files"], (oldData: LibraryFile[] = []) =>
          oldData.filter((file) => file.Key !== key),
        );

        toast({
          title: "File deleted",
          description: "File was successfully deleted",
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
      if (file.size > maxFileSize * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `File size must be less than ${maxFileSize}MB`,
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl("");
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    uploadMutation.mutate(formData);
  };

  const handleUrlSubmit = () => {
    if (fileUrl) {
      onSelect(fileUrl);
      resetForm();
    }
  };

  const handleLibrarySelect = (url: string) => {
    onSelect(url);
    resetForm();
    onOpenChange(false);
  };

  const handleDelete = (file: LibraryFile) => {
    if (!file.Key) return;
    deleteMutation.mutate(file.Key);
  };

  const resetForm = () => {
    setFileUrl("");
    setSelectedFile(null);
    setPreviewUrl("");
  };

  const isUploading = uploadMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  const getFileIcon = (fileType: string = "other") => {
    switch (fileType) {
      case "image":
        return <FileImage className="h-10 w-10" />;
      case "document":
        return <FileText className="h-10 w-10" />;
      case "audio":
        return <FileAudio className="h-10 w-10" />;
      case "video":
        return <FileVideo className="h-10 w-10" />;
      default:
        return <File className="h-10 w-10" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Upload a new file, paste a URL, or select from the library
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
              <Label htmlFor="file">Choose File</Label>
              <Input
                id="file"
                type="file"
                accept={acceptedFileTypes}
                onChange={handleFileSelect}
                disabled={isUploading}
              />
              <p className="text-xs text-muted-foreground">
                Max file size: {maxFileSize}MB
              </p>
            </div>

            {selectedFile && (
              <div className="space-y-2">
                <Label>File Information</Label>
                <div className="border rounded p-4 flex items-center gap-4">
                  <div className="text-primary">
                    {getFileIcon(
                      selectedFile.type.startsWith("image/")
                        ? "image"
                        : selectedFile.type.startsWith("audio/")
                          ? "audio"
                          : selectedFile.type.startsWith("video/")
                            ? "video"
                            : "document",
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium truncate">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(selectedFile.size)} - {selectedFile.type}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {previewUrl && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full max-h-64 object-contain rounded border"
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
              <Label htmlFor="url">File URL</Label>
              <Input
                id="url"
                type="url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://example.com/file.pdf"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleUrlSubmit} disabled={!fileUrl}>
                <LinkIcon className="w-4 h-4 mr-2" />
                Use This URL
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="library" className="space-y-4">
            {isLoading ? (
              <div className="py-4 flex justify-center items-center">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Loading files...</span>
              </div>
            ) : libraryFiles?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No files found in the library</p>
                <p className="text-sm">Upload files to see them here</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto">
                  {(libraryFiles || [])
                    .filter((item) => item.size > 0)
                    .map((file) => {
                      // Add type property if it doesn't exist
                      const fileWithType = file as LibraryFile;
                      const isImage = fileWithType.type === "image";

                      return (
                        <div
                          key={file.id}
                          className="group relative border rounded p-3 hover:border-primary transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => handleLibrarySelect(file.url)}
                              className="flex items-center flex-1"
                            >
                              {isImage ? (
                                <img
                                  src={file.url}
                                  alt={file.name}
                                  className="h-12 w-12 object-cover rounded mr-3"
                                  onError={(e) => {
                                    // Fallback if image can't be loaded
                                    e.currentTarget.style.display = "none";
                                    const parentNode =
                                      e.currentTarget.parentNode;
                                    if (parentNode instanceof HTMLElement) {
                                      const icon =
                                        document.createElement("div");
                                      icon.className =
                                        "h-12 w-12 flex items-center justify-center text-primary mr-3";
                                      icon.innerHTML =
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-10 w-10"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>';
                                      parentNode.insertBefore(
                                        icon,
                                        e.currentTarget,
                                      );
                                    }
                                  }}
                                />
                              ) : (
                                <div className="h-12 w-12 flex items-center justify-center text-primary mr-3">
                                  {getFileIcon((file as LibraryFile).type)}
                                </div>
                              )}
                              <div className="flex-1 text-left">
                                <p className="font-medium truncate">
                                  {file.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {formatFileSize(file.size)} -{" "}
                                  {(
                                    file as LibraryFile
                                  ).extension?.toUpperCase() || "FILE"}
                                </p>
                              </div>
                            </button>
                            <Button
                              size="icon"
                              variant="destructive"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(file);
                              }}
                              disabled={isDeleting}
                            >
                              {deleteMutation.isPending &&
                              deleteMutation.variables === file.Key ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
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

export default FileSelectorDialog;
