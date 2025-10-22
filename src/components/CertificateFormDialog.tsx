import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import FileSelectorDialog from "@/components/FileSelectorDialog/FileSelectorDialog";
import { FileText, Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type CertificateFormData = {
  name: string;
  info: string;
  is_important: boolean;
  description_en: string;
  description_id: string;
  file_url: string;
  filename: string;
};

type CertificateFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificate: CertificateFormData | null;
  onSave: (data: CertificateFormData) => void;
};

const CertificateFormDialog = ({
  open,
  onOpenChange,
  certificate,
  onSave,
}: CertificateFormDialogProps) => {
  const [fileSelectorOpen, setFileSelectorOpen] = useState(false);
  const [activeDescriptionTab, setActiveDescriptionTab] = useState("en");
  const [formData, setFormData] = useState<CertificateFormData>({
    name: "",
    info: "",
    is_important: false,
    description_en: "",
    description_id: "",
    file_url: "",
    filename: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (certificate) {
      setFormData({
        name: certificate.name || "",
        info: certificate.info || "",
        is_important: certificate.is_important || false,
        description_en: certificate.description_en || "",
        description_id: certificate.description_id || "",
        file_url: certificate.file_url || "",
        filename: certificate.filename || "",
      });
    } else {
      setFormData({
        name: "",
        info: "",
        is_important: false,
        description_en: "",
        description_id: "",
        file_url: "",
        filename: "",
      });
    }
    setErrors({});
    setActiveDescriptionTab("en");
  }, [certificate, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Only name is mandatory
    if (!formData.name) newErrors.name = "Name is required";
    if (formData.name.length > 200)
      newErrors.name = "Name must be less than 200 characters";

    // Other validations are only for length, not for required fields
    if (formData.info.length > 200)
      newErrors.info = "Info must be less than 200 characters";
    if (formData.description_en.length > 1000)
      newErrors.description_en =
        "Description must be less than 1000 characters";
    if (formData.description_id.length > 1000)
      newErrors.description_id =
        "Description must be less than 1000 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave(formData);
      onOpenChange(false);
    }
  };

  const handleFileSelect = (fileUrl: string) => {
    setFormData({
      ...formData,
      file_url: fileUrl,
      filename: fileUrl.split("/").pop() || "certificate.pdf",
    });
    setFileSelectorOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {certificate ? "Edit Certificate" : "Add New Certificate"}
            </DialogTitle>
            <DialogDescription>
              {certificate
                ? "Update certificate information"
                : "Create a new certificate entry"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., ISO 9001:2015"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {formData.name.length}/200
              </p>
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Info */}
            <div className="space-y-2">
              <Label htmlFor="info">Info</Label>
              <Input
                id="info"
                value={formData.info}
                onChange={(e) =>
                  setFormData({ ...formData, info: e.target.value })
                }
                placeholder="e.g., Quality Management System"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {formData.info.length}/200
              </p>
              {errors.info && (
                <p className="text-sm text-destructive">{errors.info}</p>
              )}
            </div>

            {/* Is Important */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_important"
                checked={formData.is_important}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_important: checked as boolean })
                }
              />
              <Label
                htmlFor="is_important"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Mark as Important
              </Label>
            </div>

            {/* Description Tabs */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Tabs
                value={activeDescriptionTab}
                onValueChange={setActiveDescriptionTab}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="id">Indonesian</TabsTrigger>
                </TabsList>

                <TabsContent value="en" className="space-y-2 pt-2">
                  <Textarea
                    id="description_en"
                    value={formData.description_en}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description_en: e.target.value,
                      })
                    }
                    placeholder="Enter English description"
                    rows={3}
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.description_en.length}/1000
                  </p>
                  {errors.description_en && (
                    <p className="text-sm text-destructive">
                      {errors.description_en}
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="id" className="space-y-2 pt-2">
                  <Textarea
                    id="description_id"
                    value={formData.description_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description_id: e.target.value,
                      })
                    }
                    placeholder="Enter Indonesian description"
                    rows={3}
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.description_id.length}/1000
                  </p>
                  {errors.description_id && (
                    <p className="text-sm text-destructive">
                      {errors.description_id}
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* File */}
            <div className="space-y-2">
              <Label htmlFor="file">File (PDF or Image)</Label>
              <div className="flex gap-2 items-center">
                {formData.file_url && (
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="text-sm truncate max-w-[200px]">
                      {formData.filename}
                    </span>
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFileSelectorOpen(true)}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {formData.file_url ? "Change File" : "Select File"}
                </Button>
              </div>
              {errors.file_url && (
                <p className="text-sm text-destructive">{errors.file_url}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {certificate ? "Update" : "Create"} Certificate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FileSelectorDialog
        open={fileSelectorOpen}
        onOpenChange={setFileSelectorOpen}
        onSelect={handleFileSelect}
        acceptedFileTypes=".pdf,.jpg,.jpeg,.png"
        maxFileSize={10}
        title="Select Certificate File"
      />
    </>
  );
};

export default CertificateFormDialog;
