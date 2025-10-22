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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  CheckCircle2,
} from "lucide-react";
import {
  LibraryImage,
  getR2Files,
  uploadToR2 as uploadFileToR2,
  deleteFromR2,
} from "@/lib/r2-actions";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

// Define the LibraryFile type with required properties
type LibraryFile = LibraryImage & {
  type?: string;
  extension?: string;
};

type FileSelectorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (fileUrl: string | string[]) => void;
  title?: string;
  acceptedFileTypes?: string;
  maxFileSize?: number; // in MB
  multiple?: boolean;
  initialSelection?: string | string[];
};

const FileSelectorDialog = ({
  open,
  onOpenChange,
  onSelect,
  title = "Select File",
  acceptedFileTypes = "*/*",
  maxFileSize = 10, // Default max file size: 10MB
  multiple = false,
  initialSelection = "",
}: FileSelectorDialogProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [fileUrl, setFileUrl] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<LibraryFile | null>(null);

  // Initialize selected files from props when dialog opens
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
      if (multiple) {
        const newSelection = [...selectedUrls, uploadedFile.url];
        setSelectedUrls(newSelection);
        onSelect(newSelection);
        // Reset form but keep selection
        resetForm(false);
      } else {
        onSelect(uploadedFile.url);
        // Reset form and close dialog in single mode
        resetForm();
        onOpenChange(false);
      }

      toast({
        title: "File uploaded",
        description: multiple
          ? "File was successfully uploaded and added to selection"
          : "File was successfully uploaded and selected",
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

        // Remove from selected URLs if it was selected
        const deletedFile = libraryFiles.find((file) => file.Key === key);
        if (deletedFile && selectedUrls.includes(deletedFile.url)) {
          const newSelection = selectedUrls.filter(
            (url) => url !== deletedFile.url,
          );
          setSelectedUrls(newSelection);
          if (multiple) {
            onSelect(newSelection);
          }
        }

        toast({
          title: "File deleted",
          description: "File was successfully deleted",
        });
        setDeleteConfirmOpen(false);
        setFileToDelete(null);
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
      setDeleteConfirmOpen(false);
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const validFiles = acceptedFiles.filter((file) => {
        if (file.size > maxFileSize * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name}: File size must be less than ${maxFileSize}MB`,
            variant: "destructive",
          });
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      if (!multiple) {
        // Single file mode - always select the first file
        const file = validFiles[0];
        setSelectedFiles([file]);

        // Create preview for images
        if (file.type.startsWith("image/")) {
          const url = URL.createObjectURL(file);
          setPreviewUrls([url]);
        } else {
          setPreviewUrls([]);
        }

        // Auto-upload the first file for immediate selection
        if (validFiles.length > 1) {
          toast({
            title: "Single file mode",
            description: `Only the first file (${file.name}) will be selected`,
          });

          // Auto upload and select the first file
          const formData = new FormData();
          formData.append("file", file);
          uploadMutation.mutate(formData);
        }
      } else {
        // Multiple files mode
        setSelectedFiles((prevFiles) => [...prevFiles, ...validFiles]);

        // Create previews for image files
        const urls = validFiles
          .filter((file) => file.type.startsWith("image/"))
          .map((file) => URL.createObjectURL(file));

        if (urls.length > 0) {
          setPreviewUrls((prevUrls) => [...prevUrls, ...urls]);
        }

        // If no files were previously selected, auto-select the first one
        if (selectedUrls.length === 0 && validFiles.length > 0) {
          const formData = new FormData();
          formData.append("file", validFiles[0]);
          uploadMutation.mutate(formData);
        }
      }
    },
    [toast, maxFileSize, multiple, uploadMutation, selectedUrls.length],
  );

  const getAcceptObject = () => {
    if (acceptedFileTypes === "*/*") return undefined;

    const acceptObj: Record<string, string[]> = {};
    const types = acceptedFileTypes.split(",");

    types.forEach((type) => {
      const trimmedType = type.trim();
      if (trimmedType.startsWith(".")) {
        // Extension like .pdf, .jpg
        const category =
          trimmedType === ".pdf"
            ? "application/pdf"
            : trimmedType === ".jpg" || trimmedType === ".jpeg"
              ? "image/jpeg"
              : trimmedType === ".png"
                ? "image/png"
                : trimmedType === ".svg"
                  ? "image/svg+xml"
                  : "application/octet-stream";

        if (!acceptObj[category]) acceptObj[category] = [];
        acceptObj[category].push(trimmedType);
      } else {
        // MIME type like image/*
        if (!acceptObj[trimmedType]) acceptObj[trimmedType] = [];
      }
    });

    return Object.keys(acceptObj).length > 0 ? acceptObj : undefined;
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: getAcceptObject(),
    maxSize: maxFileSize * 1024 * 1024,
    multiple: multiple,
  });

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    if (multiple && selectedFiles.length > 1) {
      // Upload multiple files in sequence
      let isFirstFile = true;
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);

        // For the first file, we might want to wait for it to complete
        // This ensures at least one file is selected immediately
        if (isFirstFile && selectedUrls.length === 0) {
          await uploadMutation.mutateAsync(formData);
          isFirstFile = false;
        } else {
          await uploadMutation.mutateAsync(formData);
        }
      }
      resetForm(false);
    } else {
      // Single file upload
      const formData = new FormData();
      formData.append("file", selectedFiles[0]);
      uploadMutation.mutate(formData);
    }
  };

  const handleUrlSubmit = () => {
    if (fileUrl) {
      if (multiple) {
        const newSelection = [...selectedUrls, fileUrl];
        setSelectedUrls(newSelection);
        onSelect(newSelection);
        resetForm(false); // Clear just the form, not selection
      } else {
        onSelect(fileUrl);
        resetForm();
        onOpenChange(false);
      }
    }
  };

  const handleLibrarySelect = (url: string) => {
    if (multiple) {
      // Toggle selection in multiple mode
      let newSelection: string[];

      if (selectedUrls.includes(url)) {
        newSelection = selectedUrls.filter((item) => item !== url);
      } else {
        newSelection = [...selectedUrls, url];
      }

      setSelectedUrls(newSelection);
      onSelect(newSelection);
    } else {
      // Single selection mode
      onSelect(url);
      resetForm();
      onOpenChange(false);
    }
  };

  const handleDelete = (file: LibraryFile) => {
    setFileToDelete(file);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!fileToDelete?.Key) return;
    deleteMutation.mutate(fileToDelete.Key);
  };

  const removeUploadPreview = (index: number) => {
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = (clearSelection = true) => {
    setFileUrl("");
    setSelectedFiles([]);
    setPreviewUrls([]);
    if (clearSelection) {
      setSelectedUrls([]);
    }
  };

  const isUploading = uploadMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  const handleComplete = () => {
    if (multiple) {
      onSelect(selectedUrls);
    }
    onOpenChange(false);
  };

  const getFileIcon = (fileType: string = "other") => {
    switch (fileType) {
      case "image":
        return <FileImage className="h-8 w-8" />;
      case "audio":
        return <FileAudio className="h-8 w-8" />;
      case "video":
        return <FileVideo className="h-8 w-8" />;
      case "document":
        return <FileText className="h-8 w-8" />;
      default:
        return <File className="h-8 w-8" />;
    }
  };

  const getFileType = (file: LibraryFile): string => {
    const extension = file.extension?.toLowerCase() || "";
    const type = file.type?.toLowerCase() || "";

    if (
      type.includes("image") ||
      ["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(extension)
    ) {
      return "image";
    } else if (
      type.includes("audio") ||
      ["mp3", "wav", "ogg", "aac"].includes(extension)
    ) {
      return "audio";
    } else if (
      type.includes("video") ||
      ["mp4", "webm", "mov", "avi"].includes(extension)
    ) {
      return "video";
    } else if (
      type.includes("pdf") ||
      type.includes("doc") ||
      type.includes("text") ||
      ["pdf", "doc", "docx", "txt", "rtf", "xlsx", "pptx"].includes(extension)
    ) {
      return "document";
    } else {
      return "other";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {multiple
                ? "Select multiple files by clicking on them. You can upload new files, use URLs, or choose from the library."
                : "Upload a new file, paste a URL, or select from the library"}
            </DialogDescription>
          </DialogHeader>

          {multiple && selectedUrls.length > 0 && (
            <div className="bg-muted/30 p-2 rounded-md mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">
                  Selected Files ({selectedUrls.length})
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
                    className="relative group flex items-center gap-2 p-1 rounded bg-muted/50"
                  >
                    <div className="flex-shrink-0">
                      {url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                        <div className="h-8 w-8 rounded-sm border overflow-hidden">
                          <img
                            src={url}
                            alt={`Selected ${index + 1}`}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "/placeholder.svg";
                            }}
                          />
                        </div>
                      ) : (
                        <FileText className="h-8 w-8 text-primary" />
                      )}
                    </div>
                    <span className="text-xs truncate max-w-[150px]">
                      {url.split("/").pop()}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 ml-1 opacity-80 hover:opacity-100"
                      onClick={() => {
                        const newSelection = selectedUrls.filter(
                          (_, i) => i !== index,
                        );
                        setSelectedUrls(newSelection);
                        onSelect(newSelection);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="url">URL</TabsTrigger>
              <TabsTrigger value="library">Library</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">Choose File{multiple ? "s" : ""}</Label>
                <div
                  {...getRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-md p-6 cursor-pointer text-center transition-colors",
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-primary/50",
                    isUploading && "opacity-50 cursor-not-allowed",
                  )}
                >
                  <input {...getInputProps()} disabled={isUploading} />
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    {isDragActive ? (
                      <p>Drop the file{multiple ? "s" : ""} here...</p>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          Drag & drop or click to upload
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {multiple ? "Multiple files allowed. " : ""}Accepted
                          file types: {acceptedFileTypes.replace(/\*/g, "all")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Max file size: {maxFileSize}MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>File Information</Label>
                  <div className="border rounded p-4 flex flex-col gap-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 relative group"
                      >
                        <div className="text-primary">
                          {getFileIcon(
                            file.type.startsWith("image/")
                              ? "image"
                              : file.type.startsWith("audio/")
                                ? "audio"
                                : file.type.startsWith("video/")
                                  ? "video"
                                  : "document",
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium truncate">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(file.size)} - {file.type}
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeUploadPreview(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previewUrls.length > 0 && (
                <div className="space-y-2">
                  <Label>Preview{previewUrls.length > 1 ? "s" : ""}</Label>
                  <div
                    className={`grid ${
                      previewUrls.length > 1 ? "grid-cols-2 gap-2" : ""
                    }`}
                  >
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full max-h-64 object-contain rounded border"
                        />
                      </div>
                    ))}
                  </div>
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
                <div className="flex gap-2">
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
                        Upload {multiple ? "& Add to Selection" : "& Select"}
                      </>
                    )}
                  </Button>
                  {multiple && selectedUrls.length > 0 && (
                    <Button onClick={handleComplete}>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Done ({selectedUrls.length})
                    </Button>
                  )}
                </div>
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
                <div className="flex gap-2">
                  <Button onClick={handleUrlSubmit} disabled={!fileUrl}>
                    <LinkIcon className="w-4 h-4 mr-2" />
                    {multiple ? "Add to Selection" : "Use This URL"}
                  </Button>
                  {multiple && selectedUrls.length > 0 && (
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
                  <span>Loading files...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {libraryFiles.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-1">
                      {libraryFiles
                        .filter((item) => item.size > 0)
                        .map((file) => {
                          const isSelected = selectedUrls.includes(file.url);
                          const fileType = getFileType(file);
                          return (
                            <div
                              key={file.id}
                              className="relative group border rounded-lg p-2 hover:border-primary transition-colors"
                            >
                              <div
                                className="cursor-pointer"
                                onClick={() => handleLibrarySelect(file.url)}
                              >
                                <div
                                  className={cn(
                                    "flex items-center gap-3",
                                    isSelected && "bg-primary/10 rounded-md",
                                  )}
                                >
                                  <div className="text-primary flex-shrink-0">
                                    {fileType === "image" ? (
                                      <div className="h-12 w-12 rounded-md border overflow-hidden">
                                        <img
                                          src={file.url}
                                          alt={file.name}
                                          className="h-full w-full object-cover"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src =
                                              "/placeholder.svg";
                                          }}
                                        />
                                      </div>
                                    ) : (
                                      getFileIcon(fileType)
                                    )}
                                  </div>
                                  <div className="overflow-hidden flex-1">
                                    <p className="font-medium truncate text-sm">
                                      {file.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {formatFileSize(file.size || 0)}
                                    </p>
                                  </div>
                                  {isSelected && (
                                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                                  )}
                                </div>
                              </div>
                              <Button
                                size="icon"
                                variant="destructive"
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
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
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No files found in the library.
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
                        <Button
                          variant="outline"
                          onClick={() => onOpenChange(false)}
                        >
                          Cancel
                        </Button>
                        {multiple && selectedUrls.length > 0 && (
                          <Button onClick={handleComplete}>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Done ({selectedUrls.length})
                          </Button>
                        )}
                      </div>
                    </div>
                  </DialogFooter>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;
              {fileToDelete?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteConfirmOpen(false);
                setFileToDelete(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FileSelectorDialog;
