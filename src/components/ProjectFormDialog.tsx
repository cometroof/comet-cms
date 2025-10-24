import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Star, X, Loader2 } from "lucide-react";
import ImageSelectorDialog from "./ImageSelectorDialog";
import { generateSlug } from "@/pages/projects/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  slug: string;
  location_text: string;
  location_link: string;
  roof_type: string;
  category_id: string;
  category_ids: string[];
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
  isLoading?: boolean;
}

const ProjectFormDialog = ({
  open,
  onOpenChange,
  project,
  categories,
  onSave,
  isLoading = false,
}: ProjectFormDialogProps) => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [locationText, setLocationText] = useState("");
  const [locationLink, setLocationLink] = useState("");
  const [roofType, setRoofType] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (project) {
      setName(project.name);
      setSlug(project.slug);
      setLocationText(project.location_text);
      setLocationLink(project.location_link);
      setRoofType(project.roof_type);
      setCategoryId(project.category_id);
      setSelectedCategoryIds(project.category_ids || []);
      setImages(project.images);
    } else {
      setName("");
      setSlug("");
      setLocationText("");
      setLocationLink("");
      setRoofType("");
      setCategoryId("");
      setSelectedCategoryIds([]);
      setImages([]);
    }
  }, [project, open]);

  // Auto-generate slug when name changes
  useEffect(() => {
    if (name && !project) {
      // Only auto-generate for new projects
      setSlug(generateSlug(name));
    }
  }, [name, project]);

  const handleAddImage = () => {
    setEditingImageIndex(null);
    setImageDialogOpen(true);
  };

  const handleImageSelect = (imageUrl: string) => {
    const newImage: ProjectImage = {
      id: `temp-${Date.now()}`, // Temporary ID for UI, will be removed before saving
      image_url: imageUrl,
      is_highlight: false,
      order: images.length,
    };
    setImages([...images, newImage]);
    setImageDialogOpen(false);
  };

  const handleToggleHighlight = (index: number) => {
    setImages(
      images.map((img, i) => ({
        ...img,
        is_highlight: i === index ? !img.is_highlight : false,
      })),
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

    if (!selectedCategoryIds || selectedCategoryIds.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one category",
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
    const finalSlug = slug.trim() || generateSlug(name);

    const projectData: any = {
      ...(project?.id && { id: project.id }), // Only include id if editing
      name: name.trim(),
      slug: finalSlug,
      location_text: locationText.trim(),
      location_link: locationLink.trim(),
      roof_type: roofType.trim(),
      category_id: selectedCategoryIds[0] || "", // Keep for backward compatibility
      category_ids: selectedCategoryIds,
      order: project?.order || 0,
      images: images.map((img, index) => ({ ...img, order: index })),
      ...(project?.created_at && { created_at: project.created_at }),
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
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">
                  Slug <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="auto-generated-slug"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  URL-friendly identifier (auto-generated from name)
                </p>
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Categories <span className="text-destructive">*</span>
                  </Label>
                  <Popover
                    open={categoryPopoverOpen}
                    onOpenChange={setCategoryPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-start text-left font-normal"
                        disabled={isLoading}
                      >
                        {selectedCategoryIds.length > 0
                          ? `${selectedCategoryIds.length} selected`
                          : "Select categories..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search categories..." />
                        <CommandEmpty>No category found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {categories.map((category) => (
                            <CommandItem
                              key={category.id}
                              onSelect={() => {
                                setSelectedCategoryIds((prev) =>
                                  prev.includes(category.id)
                                    ? prev.filter((id) => id !== category.id)
                                    : [...prev, category.id],
                                );
                              }}
                            >
                              <Checkbox
                                checked={selectedCategoryIds.includes(
                                  category.id,
                                )}
                                className="mr-2"
                              />
                              {category.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedCategoryIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedCategoryIds.map((catId) => {
                        const category = categories.find((c) => c.id === catId);
                        return category ? (
                          <Badge
                            key={catId}
                            variant="secondary"
                            className="gap-1"
                          >
                            {category.name}
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedCategoryIds((prev) =>
                                  prev.filter((id) => id !== catId),
                                )
                              }
                              className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
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
                    disabled={isLoading}
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
                              onCheckedChange={() =>
                                handleToggleHighlight(index)
                              }
                              disabled={isLoading}
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
                            disabled={isLoading}
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
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {project ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>{project ? "Update" : "Create"} Project</>
                )}
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
