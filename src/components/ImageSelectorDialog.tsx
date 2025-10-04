import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link as LinkIcon } from "lucide-react";

type ImageSelectorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (imageUrl: string) => void;
  title?: string;
};

const ImageSelectorDialog = ({ open, onOpenChange, onSelect, title = "Select Image" }: ImageSelectorDialogProps) => {
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      // In real implementation, upload to storage and get URL
      // For now, use the preview URL
      onSelect(previewUrl);
      resetForm();
    }
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
  };

  const resetForm = () => {
    setImageUrl("");
    setSelectedFile(null);
    setPreviewUrl("");
  };

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
              />
              <p className="text-xs text-muted-foreground">Max file size: 5MB</p>
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
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={!selectedFile}>
                <Upload className="w-4 h-4 mr-2" />
                Upload & Select
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
            <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {mockImages.map((url, index) => (
                <button
                  key={index}
                  onClick={() => handleLibrarySelect(url)}
                  className="relative group overflow-hidden rounded-lg border-2 border-transparent hover:border-primary transition-all"
                >
                  <img
                    src={url}
                    alt={`Library image ${index + 1}`}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-medium">Select</span>
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ImageSelectorDialog;
