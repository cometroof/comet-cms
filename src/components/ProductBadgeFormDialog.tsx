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
import { Loader2, Image } from "lucide-react";
import ImageSelectorDialog from "@/components/ImageSelectorDialog";
import { ProductBadgeFormData } from "@/pages/files/types";

type ProductBadgeFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  badge: ProductBadgeFormData | null;
  onSave: (data: ProductBadgeFormData) => Promise<void>;
};

const ProductBadgeFormDialog = ({
  open,
  onOpenChange,
  badge,
  onSave,
}: ProductBadgeFormDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProductBadgeFormData>({
    name: "",
    image: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageSelectorOpen, setImageSelectorOpen] = useState(false);

  useEffect(() => {
    if (badge) {
      setFormData({
        name: badge.name || "",
        image: badge.image || "",
      });
    } else {
      setFormData({
        name: "",
        image: "",
      });
    }
    setErrors({});
  }, [badge, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) newErrors.name = "Name is required";
    if (formData.name.length > 200)
      newErrors.name = "Name must be less than 200 characters";

    if (!formData.image) newErrors.image = "Image is required";

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
        console.error("Error saving product badge:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {badge ? "Edit Product Badge" : "Add New Product Badge"}
            </DialogTitle>
            <DialogDescription>
              {badge
                ? "Update product badge information"
                : "Create a new product badge"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4" aria-disabled={isSubmitting}>
            {/* Badge Image */}
            <div className="space-y-2">
              <Label htmlFor="image">Badge Image *</Label>
              <div className="flex gap-2 items-center">
                {formData.image && (
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <img
                      src={formData.image}
                      alt="Badge"
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
                  {formData.image ? "Change Image" : "Select Image"}
                </Button>
              </div>
              {errors.image && (
                <p className="text-sm text-destructive">{errors.image}</p>
              )}
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Premium Quality"
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
                  {badge ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{badge ? "Update" : "Create"} Product Badge</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImageSelectorDialog
        open={imageSelectorOpen}
        onOpenChange={(isOpen) => {
          if (!isSubmitting) setImageSelectorOpen(isOpen);
        }}
        onSelect={handleImageSelect}
        title="Select Badge Image"
      />
    </>
  );
};

export default ProductBadgeFormDialog;
