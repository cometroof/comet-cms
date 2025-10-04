import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText } from "lucide-react";

type FileUploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File) => void;
  acceptedTypes?: string;
  maxSize?: number; // in MB
  title?: string;
};

const FileUploadDialog = ({
  open,
  onOpenChange,
  onUpload,
  acceptedTypes = ".pdf",
  maxSize = 10,
  title = "Upload File",
}: FileUploadDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > maxSize * 1024 * 1024) {
        setError(`File size must be less than ${maxSize}MB`);
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError("");
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
      setSelectedFile(null);
      setError("");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          setSelectedFile(null);
          setError("");
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Select a file to upload (Max {maxSize}MB)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="file">Choose File</Label>
            <Input
              id="file"
              type="file"
              accept={acceptedTypes}
              onChange={handleFileSelect}
            />
            <p className="text-xs text-muted-foreground">
              Accepted formats: {acceptedTypes.split(",").join(", ")}
            </p>
          </div>

          {selectedFile && (
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
              <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSelectedFile(null);
              setError("");
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!selectedFile}>
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploadDialog;
