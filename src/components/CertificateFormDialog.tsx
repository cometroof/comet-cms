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
import { Switch } from "@/components/ui/switch";
import FileSelectorDialog from "@/components/FileSelectorDialog/FileSelectorDialog";
import ImageSelectorDialog from "@/components/ImageSelectorDialog";
import { FileText, Upload, Loader2, Image } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CertificateFormData } from "@/pages/files/types";

type CertificateFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificate: CertificateFormData | null;
  onSave: (data: CertificateFormData) => Promise<void>;
};

const CertificateFormDialog = ({
  open,
  onOpenChange,
  certificate,
  onSave,
}: CertificateFormDialogProps) => {
  const [fileSelectorOpen, setFileSelectorOpen] = useState(false);
  const [activeDescriptionTab, setActiveDescriptionTab] = useState("en");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CertificateFormData>({
    name: "",
    name_id: "",
    info: "",
    is_important_info: false,
    label_name: "",
    label_name_id: "",
    image: "",
    description_en: "",
    description_id: "",
    file_url: "",
    filename: "",
    order: 0,
    info_id: "",
  });
  //

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (certificate) {
      setFormData({
        name: certificate.name || "",
        name_id: certificate.name_id || "",
        info: certificate.info || "",
        is_important_info: certificate.is_important_info || false,
        label_name: certificate.label_name || "",
        label_name_id: certificate.label_name_id || "",
        image: certificate.image || "",
        description_en: certificate.description_en || "",
        description_id: certificate.description_id || "",
        file_url: certificate.file_url || "",
        filename: certificate.filename || "",
        order: certificate.order || 0,
        info_id: certificate.info_id || "",
      });
    } else {
      setFormData({
        name: "",
        name_id: "",
        info: "",
        is_important_info: false,
        label_name: "",
        label_name_id: "",
        image: "",
        description_en: "",
        description_id: "",
        file_url: "",
        filename: "",
        order: 0,
        info_id: "",
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

  const handleSubmit = async () => {
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        await onSave(formData);
        onOpenChange(false);
      } catch (error) {
        console.error("Error saving certificate:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const [imageSelectorOpen, setImageSelectorOpen] = useState(false);

  const handleFileSelect = (fileUrl: string) => {
    setFormData({
      ...formData,
      file_url: fileUrl,
      filename: fileUrl.split("/").pop() || "certificate.pdf",
    });
    setFileSelectorOpen(false);
  };

  const handleImageSelect = (imageUrl: string) => {
    setFormData({
      ...formData,
      image: imageUrl,
    });
    setImageSelectorOpen(false);
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isSubmitting) onOpenChange(isOpen);
        }}
      >
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

          <div className="space-y-4 py-4" aria-disabled={isSubmitting}>
            {/* Icon Image */}
            <div className="space-y-2">
              <Label htmlFor="image">Icon Image</Label>
              <div className="flex gap-2 items-center">
                {formData.image && (
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <img
                      src={formData.image}
                      alt="Icon"
                      className="h-8 w-8 object-contain"
                    />
                    <span className="text-sm truncate max-w-[200px]">
                      {formData?.image?.split?.("/")?.pop()}
                    </span>
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setImageSelectorOpen(true)}
                  className="gap-2"
                  disabled={isSubmitting}
                >
                  <Image className="w-4 h-4" />
                  {formData.image ? "Change Icon" : "Select Icon"}
                </Button>
              </div>
            </div>

            {/* Name (English) */}
            <div className="space-y-2">
              <Label htmlFor="name">Name (English) *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., ISO 9001:2015"
                maxLength={200}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                {formData.name.length}/200
              </p>
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Name (Indonesian) */}
            <div className="space-y-2">
              <Label htmlFor="name_id">Name (Indonesian)</Label>
              <Input
                id="name_id"
                value={formData.name_id || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name_id: e.target.value })
                }
                placeholder="e.g., ISO 9001:2015"
                maxLength={200}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                {formData.name_id ? formData.name_id.length : 0}/200
              </p>
            </div>

            {/* Label Name (English) */}
            <div className="space-y-2">
              <Label htmlFor="label_name">Label Name (English)</Label>
              <Input
                id="label_name"
                value={formData.label_name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, label_name: e.target.value })
                }
                placeholder="e.g., Certificate"
                maxLength={200}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                {formData.label_name ? formData.label_name.length : 0}/200
              </p>
              <p className="text-xs text-muted-foreground">
                The label will be shown in the product page
              </p>
            </div>

            {/* Label Name (Indonesian) */}
            <div className="space-y-2">
              <Label htmlFor="label_name_id">Label Name (Indonesian)</Label>
              <Input
                id="label_name_id"
                value={formData.label_name_id || ""}
                onChange={(e) =>
                  setFormData({ ...formData, label_name_id: e.target.value })
                }
                placeholder="e.g., Sertifikat"
                maxLength={200}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                {formData.label_name_id ? formData.label_name_id.length : 0}/200
              </p>
              <p className="text-xs text-muted-foreground">
                The label will be shown in the product page
              </p>
            </div>

            {/* Info and Is Important Info (side by side) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-4 md:col-span-3">
                <div className="space-y-2 ">
                  <Label htmlFor="info">Info (English)</Label>
                  <Input
                    id="info"
                    value={formData.info}
                    onChange={(e) =>
                      setFormData({ ...formData, info: e.target.value })
                    }
                    placeholder="e.g., Quality Management System"
                    maxLength={200}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.info.length}/200
                  </p>
                  {errors.info && (
                    <p className="text-sm text-destructive">{errors.info}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="info">Info (Indonesian)</Label>
                  <Input
                    id="info"
                    value={formData.info_id}
                    onChange={(e) =>
                      setFormData({ ...formData, info_id: e.target.value })
                    }
                    placeholder="e.g., Sistem Kualitas Manajemen"
                    maxLength={200}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.info_id.length}/200
                  </p>
                  {errors.info && (
                    <p className="text-sm text-destructive">{errors.info_id}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 md:col-span-1">
                <div className="flex flex-col items-center space-y-2 w-full">
                  <Label htmlFor="is_important_info" className="w-full">
                    Important Info
                  </Label>
                  <div className="flex items-center space-x-2 w-full">
                    <Switch
                      id="is_important_info"
                      checked={formData.is_important_info}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_important_info: checked })
                      }
                      disabled={isSubmitting}
                    />
                    <Label
                      htmlFor="is_important_info"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {formData.is_important_info ? "Yes" : "No"}
                    </Label>
                  </div>
                </div>
              </div>
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
                  <TabsTrigger value="en" disabled={isSubmitting}>
                    English
                  </TabsTrigger>
                  <TabsTrigger value="id" disabled={isSubmitting}>
                    Indonesian
                  </TabsTrigger>
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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

            {/* Certificate File */}
            <div className="space-y-2">
              <Label htmlFor="file">Certificate File (PDF)</Label>
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
                  disabled={isSubmitting}
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
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {certificate ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{certificate ? "Update" : "Create"} Certificate</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FileSelectorDialog
        open={fileSelectorOpen}
        onOpenChange={(isOpen) => {
          if (!isSubmitting) setFileSelectorOpen(isOpen);
        }}
        onSelect={handleFileSelect}
        acceptedFileTypes=".pdf"
        maxFileSize={10}
        title="Select Certificate File"
      />

      <ImageSelectorDialog
        open={imageSelectorOpen}
        onOpenChange={(isOpen) => {
          if (!isSubmitting) setImageSelectorOpen(isOpen);
        }}
        onSelect={handleImageSelect}
        title="Select Certificate Icon"
      />
    </>
  );
};

export default CertificateFormDialog;
