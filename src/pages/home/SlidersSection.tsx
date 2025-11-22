import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  GripVertical,
  Image as ImageIcon,
  X,
  Save,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ImageSelectorDialog from "@/components/ImageSelectorDialog";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Slider } from "./types";
import * as sliderService from "@/services/slider.service";

type SliderFormData = {
  image: string;
  title_en: string;
  title_id: string;
  description_en: string;
  description_id: string;
  link?: string;
  link_text?: string;
  link_text_id?: string;
  order: number;
};

const SlidersSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSliderForm, setShowSliderForm] = useState(false);
  const [editingSlider, setEditingSlider] = useState<Slider | null>(null);
  const [imageSelectorOpen, setImageSelectorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("en");
  const [loading, setLoading] = useState(true);
  const [sliders, setSliders] = useState<Slider[]>([]);

  // Zod schema for slider form
  const sliderSchema = z.object({
    image: z.string().min(1, "Image is required"),
    title_en: z.string().min(1, "Title (EN) is required").max(200),
    title_id: z.string().min(1, "Title (ID) is required").max(200),
    description_en: z.string().min(1, "Description (EN) is required").max(500),
    description_id: z.string().min(1, "Description (ID) is required").max(500),
    link: z
      .string()
      .optional()
      .refine(
        (val) => !val || val.trim() === "" || /^\/[a-zA-Z0-9\-_\/]*$/.test(val),
        {
          message:
            "Please enter a valid path starting with / (e.g., /about-us)",
        }
      ),
    link_text: z.string().optional(),
    link_text_id: z.string().optional(),
    order: z.number().optional(),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SliderFormData>({
    resolver: zodResolver(sliderSchema),
    defaultValues: {
      image: "",
      title_en: "",
      title_id: "",
      description_en: "",
      description_id: "",
      link: "",
      link_text: "",
      link_text_id: "",
      order: 0,
    },
  });

  // Load sliders on mount
  useEffect(() => {
    loadSliders();
  }, []);

  const loadSliders = async () => {
    setLoading(true);
    try {
      const data = await sliderService.getSlidersByType("home-cover");
      setSliders(data);
    } catch (error) {
      console.error("Error loading sliderssliders:", error);
      toast.error("Failed to load sliderssliders");
    } finally {
      setLoading(false);
    }
  };

  const filteredSliders = sliders
    .filter(
      (slider) =>
        slider.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        slider.title_id.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.order - b.order);

  useEffect(() => {
    // Reset react-hook-form values when editing slider changes or form toggles
    if (editingSlider) {
      reset({
        image: editingSlider.image || "",
        title_en: editingSlider.title_en || "",
        title_id: editingSlider.title_id || "",
        description_en: editingSlider.description_en || "",
        description_id: editingSlider.description_id || "",
        link: editingSlider.link || "",
        link_text: editingSlider.link_text || "", //eslint-disable-next-line
        link_text_id: (editingSlider as any).link_text_id || "",
        order: editingSlider.order || 0,
      });
      setActiveTab("en");
    } else {
      reset({
        image: "",
        title_en: "",
        title_id: "",
        description_en: "",
        description_id: "",
        link: "",
        link_text: "",
        link_text_id: "",
        order: 0,
      });
    }
  }, [editingSlider, showSliderForm, reset]);

  const handleAddSlider = () => {
    setEditingSlider(null);
    setShowSliderForm(true);
  };

  const handleEditSlider = (slider: Slider) => {
    setEditingSlider(slider);
    setShowSliderForm(true);
  };

  const handleCancelForm = () => {
    setShowSliderForm(false);
    setEditingSlider(null);
    reset({
      image: "",
      title_en: "",
      title_id: "",
      description_en: "",
      description_id: "",
      link: "",
      link_text: "",
      link_text_id: "",
      order: 0,
    });
  };

  const handleDeleteSlider = async (id: string) => {
    try {
      const success = await sliderService.deleteSlider(id);
      if (success) {
        setSliders(sliders.filter((s) => s.id !== id));
        toast.success("Slider deleted successfully");
      } else {
        toast.error("Failed to delete slider");
      }
    } catch (error) {
      console.error("Error deleting slider:", error);
      toast.error("Failed to delete slider");
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(filteredSliders);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order values
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index + 1,
    }));

    setSliders(updatedItems);

    // Update in database
    try {
      for (const item of updatedItems) {
        await sliderService.updateSlider(item.id, { order: item.order });
      }
      toast.success("Slider order updated");
    } catch (error) {
      console.error("Error updating slider order:", error);
      toast.error("Failed to update slider order");
      // Reload to revert
      loadSliders();
    }
  };

  // Validation now handled by zod + react-hook-form

  const onSubmit = async (data: SliderFormData) => {
    try {
      if (editingSlider) {
        const updated = await sliderService.updateSlider(
          editingSlider.id,
          data
        );
        if (updated) {
          setSliders(
            sliders.map((s) => (s.id === editingSlider.id ? updated : s))
          );
          toast.success("Slider updated successfully");
          handleCancelForm();
        } else {
          toast.error("Failed to update slider");
        }
      } else {
        const sliderData = {
          ...data,
          type: "home-cover",
          order: filteredSliders.length + 1,
        };
        /* eslint-disable-next-line */
        const created = await sliderService.createSlider(sliderData as any);
        if (created) {
          setSliders([...sliders, created]);
          toast.success("Slider created successfully");
          handleCancelForm();
        } else {
          toast.error("Failed to create slider");
        }
      }
    } catch (error) {
      console.error("Error saving slider:", error);
      toast.error("Failed to save slider");
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Homepage Sliders</CardTitle>
              <CardDescription>
                Manage homepage slider images and content
              </CardDescription>
            </div>
            {!showSliderForm && (
              <Button onClick={handleAddSlider} size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Slider
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Slider Form */}
          {showSliderForm && (
            <Card className="border-2 border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {editingSlider ? "Edit Slider" : "Add New Slider"}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={handleCancelForm}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <CardDescription>
                  {editingSlider
                    ? "Update slider information"
                    : "Create a new homepage slider"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Image */}
                <div className="space-y-2">
                  <Label htmlFor="image">Image *</Label>
                  <div className="flex gap-2">
                    {(watch("image") ?? "") !== "" && (
                      <img
                        src={watch("image")}
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
                      {(watch("image") ?? "") !== ""
                        ? "Change Image"
                        : "Select Image"}
                    </Button>
                  </div>
                  {errors.image?.message && (
                    <p className="text-sm text-destructive">
                      {errors.image.message}
                    </p>
                  )}
                </div>

                {/* Tabs for EN/ID content */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="en">English</TabsTrigger>
                    <TabsTrigger value="id">Indonesian</TabsTrigger>
                  </TabsList>

                  <TabsContent value="en" className="space-y-4">
                    {/* Title EN */}
                    <div className="space-y-2">
                      <Label htmlFor="title_en">Title (English) *</Label>
                      <Input
                        id="title_en"
                        placeholder="Enter English title"
                        maxLength={200}
                        {...register("title_en")}
                      />
                      <p className="text-xs text-muted-foreground">
                        {(watch("title_en") ?? "").length}/200
                      </p>
                      {errors.title_en?.message && (
                        <p className="text-sm text-destructive">
                          {errors.title_en.message}
                        </p>
                      )}
                    </div>

                    {/* Description EN */}
                    <div className="space-y-2">
                      <Label htmlFor="description_en">
                        Description (English) *
                      </Label>
                      <Textarea
                        id="description_en"
                        placeholder="Enter English description"
                        rows={3}
                        maxLength={500}
                        {...register("description_en")}
                      />
                      <p className="text-xs text-muted-foreground">
                        {(watch("description_en") ?? "").length}/500
                      </p>
                      {errors.description_en?.message && (
                        <p className="text-sm text-destructive">
                          {errors.description_en.message}
                        </p>
                      )}
                    </div>

                    {/* Link Text EN */}
                    <div className="space-y-2">
                      <Label htmlFor="link_text">Link Text (English)</Label>
                      <Input
                        id="link_text"
                        placeholder="e.g., Learn More"
                        {...register("link_text")}
                      />
                      {errors.link_text?.message && (
                        <p className="text-sm text-destructive">
                          {errors.link_text.message}
                        </p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="id" className="space-y-4">
                    {/* Title ID */}
                    <div className="space-y-2">
                      <Label htmlFor="title_id">Title (Indonesian) *</Label>
                      <Input
                        id="title_id"
                        placeholder="Enter Indonesian title"
                        maxLength={200}
                        {...register("title_id")}
                      />
                      <p className="text-xs text-muted-foreground">
                        {(watch("title_id") ?? "").length}/200
                      </p>
                      {errors.title_id?.message && (
                        <p className="text-sm text-destructive">
                          {errors.title_id.message}
                        </p>
                      )}
                    </div>

                    {/* Description ID */}
                    <div className="space-y-2">
                      <Label htmlFor="description_id">
                        Description (Indonesian) *
                      </Label>
                      <Textarea
                        id="description_id"
                        placeholder="Enter Indonesian description"
                        rows={3}
                        maxLength={500}
                        {...register("description_id")}
                      />
                      <p className="text-xs text-muted-foreground">
                        {(watch("description_id") ?? "").length}/500
                      </p>
                      {errors.description_id?.message && (
                        <p className="text-sm text-destructive">
                          {errors.description_id.message}
                        </p>
                      )}
                    </div>

                    {/* Link Text ID */}
                    <div className="space-y-2">
                      <Label htmlFor="link_text_id">
                        Link Text (Indonesian)
                      </Label>
                      <Input
                        id="link_text_id"
                        placeholder="e.g., Pelajari Lebih Lanjut"
                        {...register("link_text_id")}
                      />
                      {errors.link_text_id?.message && (
                        <p className="text-sm text-destructive">
                          {errors.link_text_id.message}
                        </p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Link */}
                <div className="space-y-2">
                  <Label htmlFor="link">Link (Optional)</Label>
                  <Input
                    id="link"
                    type="url"
                    placeholder="https://example.com"
                    {...register("link")}
                  />
                  {errors.link?.message && (
                    <p className="text-sm text-destructive">
                      {errors.link.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    variant="outline"
                    onClick={handleCancelForm}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit(onSubmit)}
                    className="gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {editingSlider ? "Update" : "Create"} Slider
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search and Table */}
          {!showSliderForm && (
            <>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search sliders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="border rounded-lg">
                <DragDropContext onDragEnd={onDragEnd}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead className="w-24">Thumbnail</TableHead>
                        <TableHead>Title (EN)</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <Droppable droppableId="sliders">
                      {(provided) => (
                        <TableBody
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                        >
                          {loading ? (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center text-muted-foreground py-8"
                              >
                                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                <p className="mt-2">Loading sliders...</p>
                              </TableCell>
                            </TableRow>
                          ) : filteredSliders.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center text-muted-foreground py-8"
                              >
                                No sliders found
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredSliders.map((slider, index) => (
                              <Draggable
                                key={slider.id}
                                draggableId={slider.id}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <TableRow
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={
                                      snapshot.isDragging ? "bg-muted" : ""
                                    }
                                  >
                                    <TableCell {...provided.dragHandleProps}>
                                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
                                    </TableCell>
                                    <TableCell>
                                      <div className="w-16 h-12 bg-muted rounded overflow-hidden flex items-center justify-center">
                                        {slider.image ? (
                                          <img
                                            src={slider.image}
                                            alt={slider.title_en}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      {slider.title_en}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline">
                                        {slider.order}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleEditSlider(slider)
                                          }
                                        >
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleDeleteSlider(slider.id)
                                          }
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </Draggable>
                            ))
                          )}
                          {provided.placeholder}
                        </TableBody>
                      )}
                    </Droppable>
                  </Table>
                </DragDropContext>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Image Selector Dialog */}
      <ImageSelectorDialog
        open={imageSelectorOpen}
        onOpenChange={setImageSelectorOpen}
        onSelect={(url) => {
          setValue("image", url, { shouldValidate: true });
          setImageSelectorOpen(false);
        }}
        title="Select Slider Image"
      />
    </>
  );
};

export default SlidersSection;
