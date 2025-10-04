import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ImageSelectorDialog from "./ImageSelectorDialog";
import { ImageIcon } from "lucide-react";

type SliderFormData = {
  image: string;
  title_en: string;
  title_id: string;
  description_en: string;
  description_id: string;
  link?: string;
  link_text?: string;
  order: number;
};

type SliderFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slider: any | null;
  onSave: (data: SliderFormData) => void;
};

const SliderFormDialog = ({ open, onOpenChange, slider, onSave }: SliderFormDialogProps) => {
  const [imageSelectorOpen, setImageSelectorOpen] = useState(false);
  const [formData, setFormData] = useState<SliderFormData>({
    image: "",
    title_en: "",
    title_id: "",
    description_en: "",
    description_id: "",
    link: "",
    link_text: "",
    order: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (slider) {
      setFormData({
        image: slider.image || "",
        title_en: slider.title_en || "",
        title_id: slider.title_id || "",
        description_en: slider.description_en || "",
        description_id: slider.description_id || "",
        link: slider.link || "",
        link_text: slider.link_text || "",
        order: slider.order || 0,
      });
    } else {
      setFormData({
        image: "",
        title_en: "",
        title_id: "",
        description_en: "",
        description_id: "",
        link: "",
        link_text: "",
        order: 0,
      });
    }
    setErrors({});
  }, [slider, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.image) newErrors.image = "Image is required";
    if (!formData.title_en) newErrors.title_en = "Title (EN) is required";
    if (formData.title_en.length > 200) newErrors.title_en = "Title must be less than 200 characters";
    if (!formData.title_id) newErrors.title_id = "Title (ID) is required";
    if (formData.title_id.length > 200) newErrors.title_id = "Title must be less than 200 characters";
    if (!formData.description_en) newErrors.description_en = "Description (EN) is required";
    if (formData.description_en.length > 500) newErrors.description_en = "Description must be less than 500 characters";
    if (!formData.description_id) newErrors.description_id = "Description (ID) is required";
    if (formData.description_id.length > 500) newErrors.description_id = "Description must be less than 500 characters";
    
    if (formData.link) {
      try {
        new URL(formData.link);
      } catch {
        newErrors.link = "Please enter a valid URL";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave(formData);
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{slider ? "Edit Slider" : "Add New Slider"}</DialogTitle>
            <DialogDescription>
              {slider ? "Update slider information" : "Create a new homepage slider"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Image */}
            <div className="space-y-2">
              <Label htmlFor="image">Image *</Label>
              <div className="flex gap-2">
                {formData.image && (
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-32 h-24 object-cover rounded border"
                  />
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setImageSelectorOpen(true)}
                  className="gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  {formData.image ? "Change Image" : "Select Image"}
                </Button>
              </div>
              {errors.image && <p className="text-sm text-destructive">{errors.image}</p>}
            </div>

            {/* Title EN */}
            <div className="space-y-2">
              <Label htmlFor="title_en">Title (English) *</Label>
              <Input
                id="title_en"
                value={formData.title_en}
                onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                placeholder="Enter English title"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">{formData.title_en.length}/200</p>
              {errors.title_en && <p className="text-sm text-destructive">{errors.title_en}</p>}
            </div>

            {/* Title ID */}
            <div className="space-y-2">
              <Label htmlFor="title_id">Title (Indonesian) *</Label>
              <Input
                id="title_id"
                value={formData.title_id}
                onChange={(e) => setFormData({ ...formData, title_id: e.target.value })}
                placeholder="Enter Indonesian title"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">{formData.title_id.length}/200</p>
              {errors.title_id && <p className="text-sm text-destructive">{errors.title_id}</p>}
            </div>

            {/* Description EN */}
            <div className="space-y-2">
              <Label htmlFor="description_en">Description (English) *</Label>
              <Textarea
                id="description_en"
                value={formData.description_en}
                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                placeholder="Enter English description"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">{formData.description_en.length}/500</p>
              {errors.description_en && <p className="text-sm text-destructive">{errors.description_en}</p>}
            </div>

            {/* Description ID */}
            <div className="space-y-2">
              <Label htmlFor="description_id">Description (Indonesian) *</Label>
              <Textarea
                id="description_id"
                value={formData.description_id}
                onChange={(e) => setFormData({ ...formData, description_id: e.target.value })}
                placeholder="Enter Indonesian description"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">{formData.description_id.length}/500</p>
              {errors.description_id && <p className="text-sm text-destructive">{errors.description_id}</p>}
            </div>

            {/* Link */}
            <div className="space-y-2">
              <Label htmlFor="link">Link (Optional)</Label>
              <Input
                id="link"
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="https://example.com"
              />
              {errors.link && <p className="text-sm text-destructive">{errors.link}</p>}
            </div>

            {/* Link Text */}
            <div className="space-y-2">
              <Label htmlFor="link_text">Link Text (Optional)</Label>
              <Input
                id="link_text"
                value={formData.link_text}
                onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
                placeholder="e.g., Learn More, View Products"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {slider ? "Update" : "Create"} Slider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImageSelectorDialog
        open={imageSelectorOpen}
        onOpenChange={setImageSelectorOpen}
        onSelect={(url) => {
          setFormData({ ...formData, image: url });
          setImageSelectorOpen(false);
        }}
        title="Select Slider Image"
      />
    </>
  );
};

export default SliderFormDialog;
