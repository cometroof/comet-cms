import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, ChevronUp, ChevronDown, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SliderFormDialog from "@/components/SliderFormDialog";
import ImageSelectorDialog from "@/components/ImageSelectorDialog";
import { useToast } from "@/hooks/use-toast";

// Mock data types
type Slider = {
  id: string;
  image: string;
  title_en: string;
  title_id: string;
  description_en: string;
  description_id: string;
  link?: string;
  link_text?: string;
  order: number;
  created_at: string;
  updated_at: string;
};

type HomeCovers = {
  projects_cover_image: string;
  distribution_cover_image: string;
  updated_at: string;
};

const Home = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [sliderDialogOpen, setSliderDialogOpen] = useState(false);
  const [editingSlider, setEditingSlider] = useState<Slider | null>(null);
  const [projectsCoverDialogOpen, setProjectsCoverDialogOpen] = useState(false);
  const [distributionCoverDialogOpen, setDistributionCoverDialogOpen] = useState(false);

  // Mock sliders data
  const [sliders, setSliders] = useState<Slider[]>([
    {
      id: "1",
      image: "/placeholder.svg",
      title_en: "Premium Roofing Solutions",
      title_id: "Solusi Atap Premium",
      description_en: "Experience excellence in roofing with our premium materials",
      description_id: "Rasakan keunggulan atap dengan material premium kami",
      link: "/products",
      link_text: "View Products",
      order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "2",
      image: "/placeholder.svg",
      title_en: "Professional Installation",
      title_id: "Instalasi Profesional",
      description_en: "Expert installation services for your peace of mind",
      description_id: "Layanan instalasi ahli untuk ketenangan pikiran Anda",
      order: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);

  // Mock home covers data
  const [homeCovers, setHomeCovers] = useState<HomeCovers>({
    projects_cover_image: "/placeholder.svg",
    distribution_cover_image: "/placeholder.svg",
    updated_at: new Date().toISOString(),
  });

  const filteredSliders = sliders
    .filter((slider) =>
      slider.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      slider.title_id.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.order - b.order);

  const handleAddSlider = () => {
    setEditingSlider(null);
    setSliderDialogOpen(true);
  };

  const handleEditSlider = (slider: Slider) => {
    setEditingSlider(slider);
    setSliderDialogOpen(true);
  };

  const handleDeleteSlider = (id: string) => {
    setSliders(sliders.filter((s) => s.id !== id));
    toast({
      title: "Success",
      description: "Slider deleted successfully",
    });
  };

  const handleMoveSlider = (id: string, direction: "up" | "down") => {
    const index = sliders.findIndex((s) => s.id === id);
    if ((direction === "up" && index === 0) || (direction === "down" && index === sliders.length - 1)) {
      return;
    }

    const newSliders = [...sliders];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newSliders[index], newSliders[targetIndex]] = [newSliders[targetIndex], newSliders[index]];

    // Update order values
    newSliders.forEach((slider, idx) => {
      slider.order = idx + 1;
    });

    setSliders(newSliders);
  };

  const handleSaveSlider = (sliderData: Partial<Slider>) => {
    if (editingSlider) {
      // Update existing
      setSliders(sliders.map((s) =>
        s.id === editingSlider.id
          ? { ...s, ...sliderData, updated_at: new Date().toISOString() }
          : s
      ));
      toast({
        title: "Success",
        description: "Slider updated successfully",
      });
    } else {
      // Create new
      const newSlider: Slider = {
        id: Date.now().toString(),
        ...sliderData as Omit<Slider, 'id' | 'created_at' | 'updated_at'>,
        order: sliders.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setSliders([...sliders, newSlider]);
      toast({
        title: "Success",
        description: "Slider created successfully",
      });
    }
    setSliderDialogOpen(false);
  };

  const handleUpdateCoverImage = (type: "projects" | "distribution", imageUrl: string) => {
    setHomeCovers({
      ...homeCovers,
      [type === "projects" ? "projects_cover_image" : "distribution_cover_image"]: imageUrl,
      updated_at: new Date().toISOString(),
    });
    toast({
      title: "Success",
      description: `${type === "projects" ? "Projects" : "Distribution"} cover image updated successfully`,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Home Management</h1>
          <p className="text-muted-foreground mt-1">Manage homepage sliders and cover images</p>
        </div>

        {/* Sliders Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sliders</CardTitle>
                <CardDescription>Manage homepage slider content</CardDescription>
              </div>
              <Button onClick={handleAddSlider} size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Slider
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Thumbnail</TableHead>
                    <TableHead>Title (EN)</TableHead>
                    <TableHead className="w-20">Order</TableHead>
                    <TableHead className="w-32 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSliders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No sliders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSliders.map((slider, index) => (
                      <TableRow key={slider.id}>
                        <TableCell>
                          <img
                            src={slider.image}
                            alt={slider.title_en}
                            className="w-16 h-12 object-cover rounded"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{slider.title_en}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline">{slider.order}</Badge>
                            <div className="flex flex-col">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0"
                                onClick={() => handleMoveSlider(slider.id, "up")}
                                disabled={index === 0}
                              >
                                <ChevronUp className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0"
                                onClick={() => handleMoveSlider(slider.id, "down")}
                                disabled={index === filteredSliders.length - 1}
                              >
                                <ChevronDown className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSlider(slider)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSlider(slider.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Cover Images Section */}
        <Card>
          <CardHeader>
            <CardTitle>Cover Images</CardTitle>
            <CardDescription>Manage homepage cover images for different sections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Projects Cover */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground">Projects Cover Image</h3>
                  <p className="text-sm text-muted-foreground">
                    Last updated: {new Date(homeCovers.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={homeCovers.projects_cover_image}
                    alt="Projects Cover"
                    className="w-full h-[300px] object-cover"
                  />
                </div>
                <Button
                  onClick={() => setProjectsCoverDialogOpen(true)}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  Change Image
                </Button>
              </div>

              {/* Distribution Cover */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground">Distribution Cover Image</h3>
                  <p className="text-sm text-muted-foreground">
                    Last updated: {new Date(homeCovers.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={homeCovers.distribution_cover_image}
                    alt="Distribution Cover"
                    className="w-full h-[300px] object-cover"
                  />
                </div>
                <Button
                  onClick={() => setDistributionCoverDialogOpen(true)}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  Change Image
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <SliderFormDialog
        open={sliderDialogOpen}
        onOpenChange={setSliderDialogOpen}
        slider={editingSlider}
        onSave={handleSaveSlider}
      />

      <ImageSelectorDialog
        open={projectsCoverDialogOpen}
        onOpenChange={setProjectsCoverDialogOpen}
        onSelect={(url) => {
          handleUpdateCoverImage("projects", url);
          setProjectsCoverDialogOpen(false);
        }}
        title="Select Projects Cover Image"
      />

      <ImageSelectorDialog
        open={distributionCoverDialogOpen}
        onOpenChange={setDistributionCoverDialogOpen}
        onSelect={(url) => {
          handleUpdateCoverImage("distribution", url);
          setDistributionCoverDialogOpen(false);
        }}
        title="Select Distribution Cover Image"
      />
    </DashboardLayout>
  );
};

export default Home;
