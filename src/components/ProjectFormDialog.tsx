import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Star } from "lucide-react";
import ImageSelectorDialog from "./ImageSelectorDialog";

interface Category {
  id: string;
  name: string;
  slug: string;
  deleted_at: string | null;
}

interface ProjectImage {
  id: string;
  image_url: string;
  is_highlight: boolean;
  order: number;
}

interface Project {
  id: string;
  name: string;
  location_text: string;
  location_link: string;
  roof_type: string;
  category_id: string;
  order: number;
  images: ProjectImage[];
  created_at: string;
  updated_at: string;
}

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
  categories: Category[];
  onSave: (project: Project) => void;
}

const ProjectFormDialog = ({
  open,
  onOpenChange,
  project,
  categories,
  onSave,
}: ProjectFormDialogProps) => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [locationText, setLocationText] = useState("");
  const [locationLink, setLocationLink] = useState("");
  const [roofType, setRoofType] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setLocationText(project.location_text);
      setLocationLink(project.location_link);
      setRoofType(project.roof_type);
      setCategoryId(project.category_id);
      setImages(project.images);
    } else {
      setName("");
      setLocationText("");
      setLocationLink("");
      setRoofType("");
      setCategoryId("");
      setImages([]);
    }
  }, [project, open]);

  const handleAddImage = () => {
    setEditingImageIndex(null);
    setImageDialogOpen(true);
  };

  const handleImageSelect = (imageUrl: string) => {
    const newImage: ProjectImage = {
      id: Date.now().toString(),
      image_url: imageUrl,
      is_highlight: false,
      order: images.length,
    };
    setImages([...images, newImage]);
    setImageDialogOpen(false);
  };

  const handleToggleHighlight = (index: number) => {
    setImages(
      images.map((img, i) =>
        i === index ? { ...img, is_highlight: !img.is_highlight } : img
      )
    );
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const validateUrl = (url: string) => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Project name is required",
        variant: "destructive",
      });
      return;
    }

    if (name.length > 200) {
      toast({
        title: "Validation Error",
        description: "Project name must be less than 200 characters",
        variant: "destructive",
      });
      return;
    }

    if (!locationText.trim()) {
      toast({
        title: "Validation Error",
        description: "Location is required",
        variant: "destructive",
      });
      return;
    }

    if (!validateUrl(locationLink)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid location URL",
        variant: "destructive",
      });
      return;
    }

    if (!roofType.trim()) {
      toast({
        title: "Validation Error",
        description: "Roof type is required",
        variant: "destructive",
      });
      return;
    }

    if (!categoryId) {
      toast({
        title: "Validation Error",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }

    if (images.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one image",
        variant: "destructive",
      });
      return;
    }

    const now = new Date().toISOString();
    const projectData: Project = {
      id: project?.id || "",
      name: name.trim(),
      location_text: locationText.trim(),
      location_link: locationLink.trim(),
      roof_type: roofType.trim(),
      category_id: categoryId,
      order: project?.order || 0,
      images: images.map((img, index) => ({ ...img, order: index })),
      created_at: project?.created_at || now,
      updated_at: now,
    };

    onSave(projectData);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {project ? "Edit Project" : "Add Project"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Project Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter project name"
                  maxLength={200}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location_text">
                    Location <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="location_text"
                    value={locationText}
                    onChange={(e) => setLocationText(e.target.value)}
                    placeholder="e.g. Jakarta, Indonesia"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location_link">Location Link</Label>
                  <Input
                    id="location_link"
                    value={locationLink}
                    onChange={(e) => setLocationLink(e.target.value)}
                    placeholder="https://maps.google.com/..."
                    type="url"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="roof_type">
                    Roof Type <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="roof_type"
                    value={roofType}
                    onChange={(e) => setRoofType(e.target.value)}
                    placeholder="e.g. Metal Roof"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>
                    Images <span className="text-destructive">*</span>
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddImage}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Image
                  </Button>
                </div>

                {images.length === 0 ? (
                  <Card className="p-6 text-center text-muted-foreground">
                    No images added yet
                  </Card>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((image, index) => (
                      <Card key={image.id} className="p-3 space-y-2">
                        <div className="relative aspect-video rounded overflow-hidden bg-muted">
                          <img
                            src={image.image_url}
                            alt={`Project image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {image.is_highlight && (
                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                              <Star className="h-3 w-3 fill-current" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`highlight-${index}`}
                              checked={image.is_highlight}
                              onCheckedChange={() => handleToggleHighlight(index)}
                            />
                            <Label
                              htmlFor={`highlight-${index}`}
                              className="text-xs cursor-pointer"
                            >
                              Highlight
                            </Label>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveImage(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {project ? "Update" : "Create"} Project
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ImageSelectorDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        onSelect={handleImageSelect}
      />
    </>
  );
};

export default ProjectFormDialog;
